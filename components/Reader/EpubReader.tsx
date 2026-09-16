"use client";

import { useEffect, useRef } from "react";

import ePub, { Location, Rendition } from "@likecoin/epub-ts";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { saveBookProgress } from "@/app/read/actions";

export type Chapter = {
  title: string;
  href: string;
};

type PageInfo = {
  currentPage: number;
  totalPages: number;
  progress: number;
  isTwoPages: boolean;
  chapterTitle: string;
};

type EpubReaderProps = {
  bookId: number;
  bookUrl: string;
  initialCfi?: string | null;
  chapterHref: string | null;
  onPageChange: (info: PageInfo) => void;
  onContentsChange: (chapters: Chapter[]) => void;
};

function normalizeHref(href: string) {
  return decodeURIComponent(href)
    .split("#")[0]
    .replace(/^(\.\.\/)+/, "");
}

function findChapterTitle(book: ReturnType<typeof ePub>, href?: string) {
  if (!href) {
    return "Leitura";
  }

  const normalizedHref = normalizeHref(href);

  const item = book.navigation.toc.find(
    (item) => normalizeHref(item.href) === normalizedHref,
  );

  return item?.label ?? "Leitura";
}

export default function EpubReader({
  bookId,
  bookUrl,
  initialCfi,
  chapterHref,
  onPageChange,
  onContentsChange,
}: EpubReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const renditionRef = useRef<Rendition | null>(null);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Indica que o EPUB ainda está sendo inicializado.
   *
   * O primeiro "relocated" não deve salvar posição,
   * pois estamos restaurando a posição salva.
   */
  const isInitialDisplayRef = useRef(true);

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
         *
         * Essas locations permitem converter:
         *
         * CFI <-> posição numérica
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
          const cfi = location.start.cfi;

          if (!cfi || !book) {
            return;
          }

          /*
           * Converte o CFI para uma posição numérica.
           */

          const currentPosition = Number(book.locations.locationFromCfi(cfi));

          const totalPositions = book.locations.length();

          const percentage =
            totalPositions > 0
              ? Math.round((currentPosition / totalPositions) * 100)
              : 0;

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
           * -----------------------------------------------------
           * Atualiza a interface
           * -----------------------------------------------------
           *
           * currentPage / totalPages continuam existindo
           * apenas como representação visual do EPUB.
           */

          onPageChange({
            currentPage: currentPosition + 1,
            totalPages: totalPositions,
            progress: percentage,
            isTwoPages,
            chapterTitle,
          });

          /*
           * -----------------------------------------------------
           * Não salva o primeiro relocated
           * -----------------------------------------------------
           */

          if (isInitialDisplayRef.current) {
            console.log("INITIAL RELOCATED CFI:", cfi);

            return;
          }

          /*
           * -----------------------------------------------------
           * Debounce do salvamento
           * -----------------------------------------------------
           */

          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
          }

          saveTimeoutRef.current = setTimeout(() => {
            console.log("SAVING EPUB PROGRESS:", {
              currentPosition,
              totalPositions,
              percentage,
              cfi,
            });

            void saveBookProgress(bookId, {
              currentPosition,
              totalPositions,
              percentage,
              locator: cfi,
            });
          }, 1000);
        });

        /*
         * ---------------------------------------------------------
         * 7. Restaura a posição salva
         * ---------------------------------------------------------
         */

        console.log("INITIAL CFI:", initialCfi);

        if (initialCfi) {
          console.log("RESTORING SAVED POSITION...");

          await rendition.display(initialCfi);

          const currentLocation = await rendition.currentLocation();

          console.log("CURRENT LOCATION AFTER DISPLAY:", currentLocation);

          console.log(
            "CURRENT CFI AFTER DISPLAY:",
            currentLocation?.start?.cfi,
          );
        } else {
          /*
           * Primeiro acesso ao livro.
           */

          console.log("NO INITIAL CFI - OPENING BOOK FROM START");

          await rendition.display();
        }

        if (cancelled) {
          rendition.destroy();
          return;
        }

        /*
         * Agora o livro terminou de ser inicializado.
         *
         * Os próximos relocated podem salvar progresso.
         */

        isInitialDisplayRef.current = false;

        console.log("EPUB RENDERIZADO");
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

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      renditionRef.current?.destroy();
      renditionRef.current = null;

      book?.destroy();
      book = null;
    };
  }, [bookId, bookUrl, initialCfi, onPageChange, onContentsChange]);

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
    renditionRef.current?.prev();
  }

  function nextPage() {
    renditionRef.current?.next();
  }

  /*
   * ---------------------------------------------------------------
   * UI
   * ---------------------------------------------------------------
   */

  return (
    <div className="relative h-full w-full">
      <div ref={viewerRef} className="h-full w-full" />

      <button
        type="button"
        onClick={previousPage}
        className="absolute top-1/2 left-0 -translate-y-1/2 cursor-pointer"
        aria-label="Página anterior"
      >
        <ChevronLeft size={64} />
      </button>

      <button
        type="button"
        onClick={nextPage}
        className="absolute top-1/2 right-0 -translate-y-1/2 cursor-pointer"
        aria-label="Próxima página"
      >
        <ChevronRight size={64} />
      </button>
    </div>
  );
}
