"use client";

import { useEffect, useRef, useState } from "react";
import ePub, { EpubCFI, type Contents } from "@likecoin/epub-ts";

import { fetchBookFile } from "@/lib/bookCache";

import {
  buildTocEntries,
  calculateProgress,
  findCurrentChapter,
  getEpubPosition,
  isValidEpubLocator,
} from "./readerUtils";
import type {
  Chapter,
  ReaderEngineProps,
  ReaderProgress,
  ReaderTheme,
  TurnDirection,
} from "./readerTypes";
import { sanitizeEpubDocument } from "./epubSanitize";
import FileError from "./FileError";
import { attachSwipe } from "@/lib/swipe";

/*
 * O tipo `Location` do @likecoin/epub-ts aponta para um `types.d.ts`
 * que não é publicado no pacote; por isso definimos só o que usamos.
 */
type EpubLocationPoint = {
  cfi: string;
  index: number;
  displayed: { page: number; total: number };
};

type EpubLocation = {
  start: EpubLocationPoint;
  end: EpubLocationPoint;
  atStart?: boolean;
  atEnd?: boolean;
};

/*
 * O teclado dentro do iframe do livro não chega ao window do Reader;
 * repassamos a tecla para ele tratar setas, zoom e Esc como nos outros
 * formatos. Campos de texto do próprio livro ficam com a tecla.
 */
function forwardKeyToReader(event: KeyboardEvent) {
  const target = event.target as HTMLElement | null;

  if (
    target &&
    (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
      target.isContentEditable)
  ) {
    return;
  }

  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
    }),
  );
}

type Rendition = ReturnType<ReturnType<typeof ePub>["renderTo"]>;

/* Tamanho do texto em 100% de zoom. */
const BASE_FONT_SIZE = 18;

/*
 * Estilos do livro. As cores vêm das variáveis do tema do leitor
 * (data-reader-theme no Reader), lidas do elemento que contém o iframe.
 *
 * O site usa `color-scheme: dark`; se o documento do livro ficar com o
 * esquema claro padrão, o navegador pinta o iframe de branco opaco. Por
 * isso o livro recebe o esquema do tema e o fundo do leitor explícito.
 */
function buildBookTheme(element: HTMLElement, theme: ReaderTheme) {
  const styles = getComputedStyle(element);
  const background =
    styles.getPropertyValue("--color-darkest").trim() || "#080c0d";
  const text = styles.getPropertyValue("--color-contrast").trim() || "#e0e4ce";
  const link = styles.getPropertyValue("--color-danger").trim() || "#d4a09a";

  return {
    html: {
      "color-scheme": theme === "night" ? "dark" : "light",
      background: `${background} !important`,
    },
    /*
     * Muitos EPUBs fixam texto preto e fundos brancos no próprio CSS;
     * sem isso o texto some no tema noite.
     */
    "body *": {
      color: "inherit !important",
      "background-color": "transparent !important",
    },
    body: {
      "font-family": "Georgia, serif",
      "font-size": `${BASE_FONT_SIZE}px`,
      "line-height": "1.7",
      color: `${text} !important`,
      background: "none !important",
      margin: "0",
      padding: "40px",
    },
    p: {
      "text-align": "justify",
      "margin-bottom": "1em",
    },
    h1: {
      "font-family": "Georgia, serif",
      "margin-bottom": "1em",
    },
    /*
     * Mesma cor de destaque do site (--color-danger). Seletores mais
     * específicos que `body *` para não herdarem a cor do texto.
     */
    "html body a, html body a *": {
      color: `${link} !important`,
    },
  };
}

/* Tamanho (em caracteres) de cada "posição" usada no progresso. */
const LOCATION_CHARS = 1024;

/*
 * Gerar as locations percorre o livro inteiro e pode levar alguns
 * segundos; o resultado fica em cache no navegador por arquivo.
 */
function locationsCacheKey(bookId: number, bookUrl: string) {
  let path = bookUrl;

  try {
    path = new URL(bookUrl).pathname;
  } catch {
    /* URL relativa: usa como está. */
  }

  return `rainbound:epub-locations:${bookId}:${path}:${LOCATION_CHARS}`;
}

function readCachedLocations(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeCachedLocations(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Sem espaço ou storage bloqueado: só não guarda o cache. */
  }
}

export default function EpubReader({
  bookId,
  bookUrl,
  locator,
  onReady,
  onPageChange,
  onProgressChange,
  onContentsChange,
  onTurnPage,
  zoom,
  theme,
}: ReaderEngineProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);
  const appliedZoomRef = useRef(zoom);

  /* Valores atuais para aplicar ao criar a rendition. */
  const displayRef = useRef({ zoom, theme });

  useEffect(() => {
    displayRef.current = { zoom, theme };
  });

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  /* Falha ao baixar (rede) ou ao abrir (arquivo inválido). */
  const [errorKind, setErrorKind] = useState<"download" | "file">("file");
  const [retryKey, setRetryKey] = useState(0);

  /*
   * Callbacks em ref: o Reader pode recriá-los a cada render sem
   * recarregar o livro.
   */
  const callbacksRef = useRef({
    onReady,
    onPageChange,
    onProgressChange,
    onContentsChange,
    onTurnPage,
  });

  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onPageChange,
      onProgressChange,
      onContentsChange,
      onTurnPage,
    };
  });

  /*
   * O locator só é usado para abrir o livro na posição salva; mudanças
   * posteriores não devem recarregar o livro.
   */
  const initialLocatorRef = useRef(locator);

  useEffect(() => {
    if (!viewerRef.current) {
      return;
    }

    let cancelled = false;
    let progressEnabled = false;
    /* Posição da restauração, entregue ao Reader quando ela termina. */
    let restoredProgress: ReaderProgress | null = null;
    const book = ePub();

    async function loadBook() {
      let data: ArrayBuffer;

      try {
        data = await fetchBookFile(bookId, bookUrl);
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao baixar EPUB:", error);
          setErrorKind("download");
          setStatus("error");
        }
        return;
      }

      try {
        /*
         * 1. Carrega o EPUB
         */
        await book.open(data);
        await book.ready;

        if (cancelled) return;

        /*
         * Limpa cada seção antes de ela virar HTML do iframe (o iframe
         * roda com scripts liberados; ver epubSanitize.ts).
         */
        book.spine.hooks.content.register((document: Document) => {
          sanitizeEpubDocument(document);
        });

        /*
         * 2. Locations (com cache no navegador)
         */
        const cacheKey = locationsCacheKey(bookId, bookUrl);
        const cached = readCachedLocations(cacheKey);

        if (cached) {
          book.locations.load(cached);
        } else {
          await book.locations.generate(LOCATION_CHARS);
          writeCachedLocations(cacheKey, book.locations.save());
        }

        if (cancelled || !viewerRef.current) return;

        /*
         * 3. Sumário
         */
        const tocEntries = buildTocEntries(book);

        const chapters: Chapter[] = tocEntries.map((entry) => ({
          title: entry.title,
          href: entry.href,
          level: entry.level,
        }));

        callbacksRef.current.onContentsChange?.(chapters);

        const epubCfi = new EpubCFI();

        /*
         * 4. Rendition
         */
        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "auto",
          flow: "paginated",
          /*
           * Necessário no WebKit (iPhone): sem allow-scripts no sandbox,
           * os listeners de toque e teclado no livro não disparam. O
           * conteúdo que executa código é removido antes (epubSanitize).
           */
          allowScriptedContent: true,
        });

        rendition.themes.default(
          buildBookTheme(viewerRef.current, displayRef.current.theme),
        );
        rendition.themes.fontSize(
          `${BASE_FONT_SIZE * displayRef.current.zoom}px`,
        );
        renditionRef.current = rendition;
        appliedZoomRef.current = displayRef.current.zoom;

        /*
         * Teclado e arraste para o lado dentro do iframe do livro (os
         * listeners do Reader não recebem eventos de dentro dele). Os
         * listeners somem junto com o iframe de cada seção.
         */
        /* Pelo Reader quando possível, para animar a virada. */
        const turn = (direction: TurnDirection) => {
          const onTurnPage = callbacksRef.current.onTurnPage;

          if (onTurnPage) onTurnPage(direction);
          else if (direction === "next") void rendition.next();
          else void rendition.prev();
        };

        rendition.hooks.content.register((contents: { document: Document }) => {
          contents.document.addEventListener("keydown", forwardKeyToReader);

          attachSwipe(contents.document, () => ({
            onPrevious: () => turn("previous"),
            onNext: () => turn("next"),
          }));
        });

        /*
         * 5. Mudança de posição
         */
        rendition.on("relocated", (location: EpubLocation) => {
          const cfi = location.start.cfi;

          if (!cfi) return;

          const startPosition = getEpubPosition(book, cfi);

          if (startPosition === null) return;

          const totalPositions = book.locations.length();
          /*
           * A última tela começa algumas posições antes do fim; nela o
           * livro conta como terminado (última página, 100%).
           */
          const currentPosition = location.atEnd
            ? Math.max(totalPositions - 1, startPosition)
            : startPosition;
          const percentage = calculateProgress(
            currentPosition + 1,
            totalPositions,
          );

          /*
           * Capítulo pela última posição visível: se o título de um
           * capítulo aparece na tela, o cabeçalho já mostra ele.
           */
          const sectionIndex = location.end.index;
          const endCfi = location.end.cfi;

          const chapter = findCurrentChapter(
            tocEntries,
            sectionIndex,
            (fragment) => {
              const contents = (rendition.getContents() as Contents[]).find(
                (item) => item.sectionIndex === sectionIndex,
              );
              const anchor = contents?.document.getElementById(fragment);

              /* Sem como conferir: considera que o capítulo começou. */
              if (!contents || !anchor || !endCfi) return true;

              try {
                return epubCfi.compare(contents.cfiFromNode(anchor), endCfi) <= 0;
              } catch {
                return true;
              }
            },
          );

          callbacksRef.current.onPageChange({
            currentPage: currentPosition + 1,
            totalPages: totalPositions,
            progress: percentage,
            atStart: Boolean(location.atStart),
            atEnd: Boolean(location.atEnd),
            chapterTitle: chapter?.title ?? "",
            chapterHref: chapter?.href,
          });

          const progress = {
            currentPosition,
            totalPositions,
            percentage,
            locator: cfi,
          };

          /*
           * Durante a restauração da posição salva, o epub-ts pode passar
           * pelo início do livro; só a posição final vale (entregue depois
           * de restaurar, logo abaixo).
           */
          if (progressEnabled) {
            callbacksRef.current.onProgressChange(progress);
          } else {
            restoredProgress = progress;
          }
        });

        callbacksRef.current.onReady({
          previous: () => void rendition.prev(),
          next: () => void rendition.next(),
          goToChapter: (href) => void rendition.display(href),
          goToLocator: (locator) => {
            if (isValidEpubLocator(locator)) void rendition.display(locator);
          },
        });

        /*
         * 6. Restaura a posição salva
         */
        const savedLocator = initialLocatorRef.current;

        if (
          savedLocator &&
          isValidEpubLocator(savedLocator) &&
          getEpubPosition(book, savedLocator) !== null
        ) {
          try {
            await rendition.display(savedLocator);
          } catch (error) {
            console.warn("Não foi possível restaurar a posição do EPUB:", error);
            await rendition.display();
          }
        } else {
          await rendition.display();
        }

        if (cancelled) return;

        progressEnabled = true;

        /*
         * O Reader precisa da posição atual (marcadores) desde o início.
         * É a própria posição salva: o salvamento automático, que só
         * avança, não grava nada por causa dela.
         */
        if (restoredProgress) {
          callbacksRef.current.onProgressChange(restoredProgress);
        }
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao abrir EPUB:", error);
          setErrorKind("file");
          setStatus("error");
        }
      }
    }

    const loading = loadBook();

    return () => {
      cancelled = true;
      renditionRef.current = null;

      /*
       * Não destruir no meio do open(): o epub-ts continua resolvendo
       * promessas internas e quebra se `book.loading` já tiver sido
       * apagado pelo destroy() (acontece no Strict Mode, que monta e
       * desmonta o efeito em seguida). Espera o carregamento terminar.
       */
      void loading.finally(() => book.destroy());
    };
  }, [bookId, bookUrl, retryKey]);

  /*
   * Tamanho da área do livro. O epub-ts só repagina no `resize` da
   * janela; aqui a área também muda sem a janela mudar (modo tela cheia
   * do celular esconde cabeçalho, rodapé e setas). Ele volta sozinho
   * para o mesmo trecho depois de repaginar.
   */
  useEffect(() => {
    const viewer = viewerRef.current;

    if (status !== "ready" || !viewer) return;

    let lastSize = `${viewer.clientWidth}x${viewer.clientHeight}`;
    let timeoutId: number | undefined;

    const observer = new ResizeObserver(() => {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(() => {
        const size = `${viewer.clientWidth}x${viewer.clientHeight}`;

        if (size === lastSize || !viewer.clientWidth || !viewer.clientHeight) {
          return;
        }

        lastSize = size;
        renditionRef.current?.resize();
      }, 100);
    });

    observer.observe(viewer);

    return () => {
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [status]);

  /*
   * Tema: reaplica as cores ao trocar (o data-reader-theme já está no
   * DOM quando o efeito roda).
   */
  useEffect(() => {
    const rendition = renditionRef.current;

    if (status !== "ready" || !rendition || !viewerRef.current) return;

    rendition.themes.default(buildBookTheme(viewerRef.current, theme));
  }, [theme, status]);

  /*
   * Tamanho do texto: muda a fonte e volta para o mesmo trecho (a
   * repaginação mudaria a página atual).
   */
  useEffect(() => {
    const rendition = renditionRef.current;

    if (status !== "ready" || !rendition || appliedZoomRef.current === zoom) {
      return;
    }

    appliedZoomRef.current = zoom;

    const location = rendition.currentLocation() as unknown as
      | EpubLocation
      | undefined;

    rendition.themes.fontSize(`${BASE_FONT_SIZE * zoom}px`);

    if (location?.start?.cfi) {
      void rendition.display(location.start.cfi);
    }
  }, [zoom, status]);

  return (
    <div className="relative h-full w-full min-w-0">
      <div ref={viewerRef} className="h-full w-full overflow-hidden" />

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-contrast/50">
          Abrindo livro...
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 bg-darkest">
          <FileError
            title="Não foi possível abrir o EPUB."
            message={
              errorKind === "download"
                ? "Não foi possível baixar o arquivo. Verifique a conexão."
                : "O arquivo pode estar corrompido ou fora do padrão EPUB."
            }
            onRetry={() => {
              setStatus("loading");
              setRetryKey((previous) => previous + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
