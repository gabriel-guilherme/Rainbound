"use client";

import { useEffect, useRef, useState } from "react";
import ePub, { EpubCFI } from "@likecoin/epub-ts";

import { fetchBookFile } from "@/lib/bookCache";
import { attachSwipe } from "@/lib/swipe";

import {
  BASE_FONT_SIZE,
  buildBookTheme,
  forwardKeyToReader,
  loadLocations,
  readLocation,
  type EpubLocation,
  type Rendition,
} from "./epubUtils";
import { buildTocEntries, getEpubPosition, isValidEpubLocator } from "../readerUtils";
import type {
  Chapter,
  ReaderEngineProps,
  ReaderProgress,
  TurnDirection,
} from "../readerTypes";
import { sanitizeEpubDocument } from "./epubSanitize";
import FileError from "../FileError";

/*
 * Leitor de EPUB (@likecoin/epub-ts): carrega o livro, liga a rendition
 * ao Reader e reage a tema, zoom e tamanho da área. Tema, cache das
 * locations, teclado e leitura da posição ficam em epubUtils.ts.
 */
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
        await loadLocations(book, bookId, bookUrl);

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
          const current = readLocation(book, rendition, tocEntries, epubCfi, location);

          if (!current) return;

          const { pageInfo, progress } = current;

          callbacksRef.current.onPageChange(pageInfo);

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
