"use client";

import { useState } from "react";

import type { Chapter, PageInfo } from "../readerTypes";

type NavigatorPanelProps = {
  /* PDF/CBZ: seletor de página; EPUB: sumário. */
  isPaged: boolean;
  chapters: Chapter[];
  pageInfo: PageInfo;
  onGoToPage: (page: number) => void;
  onGoToChapter: (href: string) => void;
};

/*
 * Painel do botão de navegação no cabeçalho do leitor:
 * - PDF/CBZ: campo "Ir para" + lista de páginas;
 * - EPUB: o sumário inteiro, com subitens indentados (partes → capítulos).
 */
export default function NavigatorPanel({
  isPaged,
  chapters,
  pageInfo,
  onGoToPage,
  onGoToChapter,
}: NavigatorPanelProps) {
  const [pageInput, setPageInput] = useState("");
  const { currentPage, totalPages } = pageInfo;

  if (!isPaged) {
    return (
      <div className="max-h-80 overflow-y-auto pr-1">
        <p className="px-2 pb-2 text-[11px] uppercase tracking-widest text-contrast/50">Sumário</p>

        <div className="flex flex-col gap-0.5">
          {chapters.map((chapter, index) => {
            const isCurrent = pageInfo.chapterHref
              ? chapter.href === pageInfo.chapterHref
              : chapter.title === pageInfo.chapterTitle;

            return (
              <button
                key={`${chapter.href}-${index}`}
                type="button"
                onClick={() => onGoToChapter(chapter.href)}
                aria-current={isCurrent ? "true" : undefined}
                /* Subitens (capítulos dentro de partes) indentados. */
                style={{ paddingLeft: `${0.75 + Math.min(chapter.level, 3) * 1}rem` }}
                className={[
                  "w-full cursor-pointer px-3 py-2 text-left text-sm transition-colors",
                  isCurrent
                    ? "bg-contrast text-primary"
                    : "text-contrast/75 hover:bg-contrast/10 hover:text-contrast",
                ].join(" ")}
              >
                {chapter.title}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <form
        onSubmit={(event) => {
          event.preventDefault();

          const page = Number(pageInput);

          if (Number.isInteger(page) && page >= 1 && page <= totalPages) {
            onGoToPage(page);
            setPageInput("");
          }
        }}
        className="flex items-center gap-2 px-1 pt-1"
      >
        <label htmlFor="reader-go-to-page" className="text-[11px] uppercase tracking-widest text-contrast/50">
          Ir para
        </label>

        <input
          id="reader-go-to-page"
          type="number"
          inputMode="numeric"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(event) => setPageInput(event.target.value)}
          placeholder={String(currentPage)}
          className="w-20 border border-contrast/15 bg-darkest px-2 py-1 text-sm text-contrast outline-none focus:border-interaction"
        />

        <span className="text-xs text-contrast/40">de {totalPages}</span>
      </form>

      <div className="max-h-72 overflow-y-auto pr-1">
        <div className="flex flex-col gap-0.5">
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (page) => (
              <button
                key={page}
                type="button"
                onClick={() => onGoToPage(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={[
                  "flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm transition-colors",
                  page === currentPage
                    ? "bg-contrast text-primary"
                    : "text-contrast/75 hover:bg-contrast/10 hover:text-contrast",
                ].join(" ")}
              >
                <span>Página {page}</span>
                {page === currentPage && (
                  <span className="text-[11px] uppercase tracking-widest text-primary/60">atual</span>
                )}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
