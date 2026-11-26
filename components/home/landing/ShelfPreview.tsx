"use client";

import { useState } from "react";

import BookSpine from "@/components/books/BookSpine";
import SpineRibbon from "@/components/books/SpineRibbon";
import { statusColor, statusLabel, statusOptions } from "@/lib/books/labels";
import type { ReadingStatus } from "@/generated/prisma/enums";

import { SAMPLE_SPINES } from "./landingSamples";

type View = "spine" | "cover";

/* "3 livros lendo", "1 livro lido"... */
const statusPhrase: Record<ReadingStatus, [string, string]> = {
  WANT_TO_READ: ["para ler", "para ler"],
  READING: ["sendo lido", "sendo lidos"],
  READ: ["lido", "lidos"],
  ABANDONED: ["abandonado", "abandonados"],
};

function describe(count: number, filter: ReadingStatus | null, view: View) {
  const books = `${count} ${count === 1 ? "livro" : "livros"}`;
  const status = filter ? ` ${statusPhrase[filter][count === 1 ? 0 : 1]}` : " na estante";
  const look = view === "spine" ? "em lombadas" : "em capas";

  return `${books}${status}, ${look}`;
}

/*
 * Celular: os cinco filtros numa grade de 6 colunas, três em cima e dois
 * centralizados embaixo (no fluxo normal, "Abandonado" sobrava sozinho).
 */
const filterCellClass = "max-sm:col-span-2 max-sm:justify-center max-sm:px-2 max-sm:text-xs";

const chipClass = (active: boolean) =>
  `flex h-8 cursor-pointer items-center gap-1.5 px-3 text-[13px] transition-colors ${
    active ? "bg-contrast text-primary" : "bg-primary text-contrast/70 hover:text-contrast"
  }`;

export default function ShelfPreview() {
  const [filter, setFilter] = useState<ReadingStatus | null>(null);
  const [view, setView] = useState<View>("spine");

  const books = SAMPLE_SPINES.filter(({ book }) => !filter || book.status === filter);
  const countOf = (status: ReadingStatus) =>
    SAMPLE_SPINES.filter(({ book }) => book.status === status).length;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex justify-center lg:justify-start">
        <div
          role="group"
          aria-label="Filtrar por status"
          className="grid w-full grid-cols-6 gap-1.5 sm:flex sm:w-auto sm:flex-wrap sm:justify-center lg:justify-start"
        >
          <button
            type="button"
            aria-pressed={filter === null}
            onClick={() => setFilter(null)}
            className={`${chipClass(filter === null)} ${filterCellClass}`}
          >
            Todos <span className="tabular-nums opacity-60">{SAMPLE_SPINES.length}</span>
          </button>

          {statusOptions.map((status, index) => (
            <button
              key={status}
              type="button"
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
              className={`${chipClass(filter === status)} ${filterCellClass} ${
                index === 2 ? "max-sm:col-start-2" : ""
              }`}
            >
              {view === "spine" ? (
                <SpineRibbon status={status} className="spine-mark-chip" />
              ) : (
                <span aria-hidden="true" className={`size-1.5 rounded-full ${statusColor[status]}`} />
              )}
              {statusLabel[status]}
              <span className="tabular-nums opacity-60">{countOf(status)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[286px] flex-col justify-end">
        {view === "spine" ? (
          <div className="scrollbar-none overflow-x-auto pt-6">
            <ul className="shelf-plank flex min-w-max items-end gap-[3px] px-4">
              {books.map(({ book, look }) => (
                <li key={book.title}>
                  <BookSpine book={book} look={look} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {books.map(({ book, look }) => (
              <li key={book.title} className="flex min-w-0 flex-col gap-1.5">
                <div
                  className="relative flex aspect-[7/10] items-end p-2 font-display text-base font-extrabold uppercase leading-none shadow-[inset_4px_0_0_rgb(0_0_0/0.25),0_14px_22px_-12px_rgb(0_0_0/0.8)]"
                  style={{ background: look.background, color: look.foreground }}
                >
                  {book.title}

                  <span className="absolute right-1.5 top-1.5 flex items-center gap-1 bg-darkest/85 px-1.5 py-0.5 font-sans text-[10px] font-medium normal-case text-contrast">
                    <span aria-hidden="true" className={`size-1.5 rounded-full ${statusColor[book.status]}`} />
                    {statusLabel[book.status]}
                  </span>
                </div>

                <p className="title-shelf truncate text-sm text-contrast">{book.title}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="-mt-2 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p aria-live="polite" className="text-center text-[13px] text-contrast/55 sm:text-left">
          {describe(books.length, filter, view)}
        </p>

        <div role="group" aria-label="Visualização" className="flex gap-1.5">
          <button
            type="button"
            aria-pressed={view === "spine"}
            onClick={() => setView("spine")}
            className={chipClass(view === "spine")}
          >
            Lombada
          </button>
          <button
            type="button"
            aria-pressed={view === "cover"}
            onClick={() => setView("cover")}
            className={chipClass(view === "cover")}
          >
            Capa
          </button>
        </div>
      </div>
    </div>
  );
}
