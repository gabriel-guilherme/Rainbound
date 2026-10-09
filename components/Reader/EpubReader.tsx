"use client";

import { useEffect, useRef, useState } from "react";
import ePub, { Location, Rendition } from "@likecoin/epub-ts";

import { useReaderProgress } from "./useReaderProgress";

import type { Chapter, PageInfo, ReaderProgress } from "./readerTypes";

import {
  calculateProgress,
  findChapterTitle,
  getEpubPosition,
  isValidEpubLocator,
} from "./readerUtils";

type EpubReaderProps = {
  bookId: number;
  bookUrl: string;
  locator?: string | null;
  chapterHref: string | null;
  onPageChange: (info: PageInfo) => void;
  onContentsChange: (chapters: Chapter[]) => void;
};

export default function EpubReader({
  bookId,
  bookUrl,
  locator,
  chapterHref,
  onPageChange,
  onContentsChange,
}: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const [readerProgress, setReaderProgress] = useState<ReaderProgress | null>(
    null,
  );

  const [progressEnabled, setProgressEnabled] = useState(false);

  /**
   * Salva o progresso automaticamente após as mudanças
   * de posição.
   */
  useReaderProgress({
    bookId,
    progress: readerProgress,
    enabled: progressEnabled,
    delay: 1000,
  });

  useEffect(() => {
    if (!viewerRef.current) {
      return;
    }

    let cancelled = false;
    let book: ReturnType<typeof ePub> | null = null;

    async function loadBook() {
      try {
        /*
         * ---------------------------------------------------------
         * 1. Carrega o EPUB
         * ---------------------------------------------------------
         */

        const response = await fetch(bookUrl);

        if (!response.ok) {
          throw new Error(`Erro ao carregar EPUB: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        book = ePub(arrayBuffer);

        await book.ready;

        if (cancelled) {
          book.destroy();
          return;
        }

        /*
         * ---------------------------------------------------------
         * 2. Gera as locations
         * ---------------------------------------------------------
         */

        await book.locations.generate(1024);

        if (cancelled || !viewerRef.current) {
          book.destroy();
          return;
        }

        /*
         * ---------------------------------------------------------
         * 3. Carrega o sumário
         * ---------------------------------------------------------
         */

        const chapters: Chapter[] = book.navigation.toc.map((item) => ({
          title: item.label,
          href: item.href,
        }));

        onContentsChange(chapters);

        /*
         * ---------------------------------------------------------
         * 4. Cria o Rendition
         * ---------------------------------------------------------
         */

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          spread: "always",
          flow: "paginated",
        });

        renditionRef.current = rendition;

        /*
         * ---------------------------------------------------------
         * 5. Tema
         * ---------------------------------------------------------
         */

        rendition.themes.default({
          body: {
            "font-family": "Georgia, serif",
            "font-size": "18px",
            "line-height": "1.7",
            color: "#e0e4ce",
            background: "none",
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

          a: {
            color: "#6e9987",
          },
        });

        /*
         * ---------------------------------------------------------
         * 6. Evento relocated
         * ---------------------------------------------------------
         */

        rendition.on("relocated", (location: Location) => {
          if (!book) {
            return;
          }

          const cfi = location.start.cfi;

          if (!cfi) {
            return;
          }

          /*
           * Converte CFI para posição numérica.
           */

          const currentPosition = getEpubPosition(book, cfi);

          if (currentPosition === null) {
            return;
          }

          const totalPositions = book.locations.length();

          const percentage = calculateProgress(currentPosition, totalPositions);

          /*
           * Verifica se estamos mostrando uma ou duas páginas.
           */

          const isTwoPages =
            location.start.displayed.page !== location.end.displayed.page;

          /*
           * Descobre o capítulo atual.
           */

          const section = book.spine.get(location.start.index);

          const chapterTitle = findChapterTitle(book, section?.href);

          /*
           * -------------------------------------------------------
           * Atualiza a interface
           * -------------------------------------------------------
           */

          onPageChange({
            currentPage: currentPosition + 1,
            totalPages: totalPositions,
            progress: percentage,
            isTwoPages,
            chapterTitle,
          });

          /*
           * -------------------------------------------------------
           * Atualiza o progresso persistido.
           *
           * O hook useReaderProgress fica responsável pelo
           * debounce e pelo saveBookProgress.
           * -------------------------------------------------------
           */

          setReaderProgress({
            currentPosition,
            totalPositions,
            percentage,
            locator: cfi,
          });
        });

        /*
         * ---------------------------------------------------------
         * 7. Restaura a posição salva
         * ---------------------------------------------------------
         */

        if (locator && isValidEpubLocator(locator)) {
          const position = getEpubPosition(book, locator);

          if (position === null) {
            console.warn("EPUB locator inválido para este arquivo:", locator);

            await rendition.display();
          } else {
            try {
              await rendition.display(locator);
            } catch (error) {
              console.warn(
                "Não foi possível restaurar o locator do EPUB:",
                error,
              );

              await rendition.display();
            }
          }
        } else {
          if (locator) {
            console.warn("Locator incompatível com EPUB:", locator);
          }

          await rendition.display();
        }

        if (cancelled) {
          rendition.destroy();
          return;
        }

        /*
         * ---------------------------------------------------------
         * 8. Inicialização concluída
         * ---------------------------------------------------------
         *
         * O primeiro relocated foi utilizado apenas para
         * reconstruir o estado da interface.
         *
         * A partir daqui, mudanças reais de página podem ser
         * persistidas.
         * ---------------------------------------------------------
         */

        setProgressEnabled(true);
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar EPUB:", error);
        }
      }
    }

    loadBook();

    /*
     * -------------------------------------------------------------
     * Cleanup
     * -------------------------------------------------------------
     */

    return () => {
      cancelled = true;

      setProgressEnabled(false);
      setReaderProgress(null);

      renditionRef.current?.destroy();
      renditionRef.current = null;

      book?.destroy();
      book = null;
    };
  }, [bookId, bookUrl, locator, onPageChange, onContentsChange]);

  /*
   * ---------------------------------------------------------------
   * Navegação pelo sumário
   * ---------------------------------------------------------------
   */

  useEffect(() => {
    if (!chapterHref) {
      return;
    }

    renditionRef.current?.display(chapterHref);
  }, [chapterHref]);

  /*
   * ---------------------------------------------------------------
   * Navegação
   * ---------------------------------------------------------------
   */

  function previousPage() {
    void renditionRef.current?.prev();
  }

  function nextPage() {
    void renditionRef.current?.next();
  }

  /*
   * ---------------------------------------------------------------
   * UI
   * ---------------------------------------------------------------
   */

  return (
    <div className="relative flex h-full w-full min-w-0 items-center">
      <ReaderNavigation onPrevious={previousPage} onNext={nextPage}>
        <div
          ref={viewerRef}
          className="h-full min-w-0 flex-1 overflow-hidden"
        />
      </ReaderNavigation>
    </div>
  );
}
