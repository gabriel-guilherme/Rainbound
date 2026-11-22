"use client";

import { useEffect, useRef, useState } from "react";
import ePub from "@likecoin/epub-ts";

import { fetchBookFile } from "@/lib/bookCache";

import {
  calculateProgress,
  findChapterTitle,
  getEpubPosition,
  isValidEpubLocator,
} from "./readerUtils";
import type { Chapter, ReaderEngineProps } from "./readerTypes";

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
};

type Rendition = ReturnType<ReturnType<typeof ePub>["renderTo"]>;

/* Tamanho do texto em 100% de zoom. */
const BASE_FONT_SIZE = 18;

/*
 * Estilos do livro. As cores vêm das variáveis do tema do leitor
 * (data-reader-theme no Reader), lidas do elemento que contém o iframe.
 */
function buildBookTheme(element: HTMLElement) {
  const styles = getComputedStyle(element);
  const text = styles.getPropertyValue("--color-contrast").trim() || "#e0e4ce";
  const link = styles.getPropertyValue("--color-danger").trim() || "#d4a09a";

  return {
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
    /* Mesma cor de destaque do site (--color-danger). */
    a: {
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

  /*
   * Callbacks em ref: o Reader pode recriá-los a cada render sem
   * recarregar o livro.
   */
  const callbacksRef = useRef({
    onReady,
    onPageChange,
    onProgressChange,
    onContentsChange,
  });

  useEffect(() => {
    callbacksRef.current = {
      onReady,
      onPageChange,
      onProgressChange,
      onContentsChange,
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
    const book = ePub();

    async function loadBook() {
      try {
        /*
         * 1. Carrega o EPUB
         */
        await book.open(await fetchBookFile(bookId, bookUrl));
        await book.ready;

        if (cancelled) return;

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
        const chapters: Chapter[] = book.navigation.toc.map((item) => ({
          title: item.label.trim(),
          href: item.href,
        }));

        callbacksRef.current.onContentsChange?.(chapters);

        /*
         * 4. Rendition
         */
        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "auto",
          flow: "paginated",
        });

        rendition.themes.default(buildBookTheme(viewerRef.current));
        rendition.themes.fontSize(
          `${BASE_FONT_SIZE * displayRef.current.zoom}px`,
        );
        renditionRef.current = rendition;
        appliedZoomRef.current = displayRef.current.zoom;

        /*
         * Setas do teclado dentro do iframe do livro (o listener do
         * Reader não recebe eventos de dentro dele).
         */
        rendition.hooks.content.register((contents: { document: Document }) => {
          contents.document.addEventListener("keydown", (event) => {
            if (event.key === "ArrowLeft") void rendition.prev();
            if (event.key === "ArrowRight") void rendition.next();
          });
        });

        /*
         * 5. Mudança de posição
         */
        rendition.on("relocated", (location: EpubLocation) => {
          const cfi = location.start.cfi;

          if (!cfi) return;

          const currentPosition = getEpubPosition(book, cfi);

          if (currentPosition === null) return;

          const totalPositions = book.locations.length();
          const percentage = calculateProgress(currentPosition, totalPositions);

          const section = book.spine.get(location.start.index);

          callbacksRef.current.onPageChange({
            currentPage: currentPosition + 1,
            totalPages: totalPositions,
            progress: percentage,
            isTwoPages:
              location.start.displayed.page !== location.end.displayed.page,
            chapterTitle: findChapterTitle(book, section?.href),
          });

          /*
           * O primeiro relocated só reconstrói a interface; depois dele,
           * a posição muda de verdade e é salva.
           */
          if (progressEnabled) {
            callbacksRef.current.onProgressChange({
              currentPosition,
              totalPositions,
              percentage,
              locator: cfi,
            });
          }
        });

        callbacksRef.current.onReady({
          previous: () => void rendition.prev(),
          next: () => void rendition.next(),
          goToChapter: (href) => void rendition.display(href),
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
        setStatus("ready");
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar EPUB:", error);
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
  }, [bookId, bookUrl]);

  /*
   * Tema: reaplica as cores ao trocar (o data-reader-theme já está no
   * DOM quando o efeito roda).
   */
  useEffect(() => {
    const rendition = renditionRef.current;

    if (status !== "ready" || !rendition || !viewerRef.current) return;

    rendition.themes.default(buildBookTheme(viewerRef.current));
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
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
        >
          <p className="title-shelf text-3xl">Não foi possível abrir o EPUB.</p>

          <p className="max-w-md text-sm text-contrast/50">
            O arquivo pode estar corrompido ou fora do padrão EPUB.
          </p>
        </div>
      )}
    </div>
  );
}
