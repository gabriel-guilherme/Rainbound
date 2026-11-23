"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import {
  DEFAULT_COVER,
  statusColor,
  statusLabel,
  typeLabel,
} from "@/app/(main)/library/types";
import BookSpine from "@/components/common/BookSpine";
import { getSpineLookForBook, type SpineBook } from "@/lib/spine";

type BookcaseProps = {
  books: SpineBook[];
};

/*
 * Estante com lombadas. Clicar numa lombada a puxa para fora e mostra o
 * resumo do livro embaixo, com os atalhos para ler e editar.
 */
export default function Bookcase({ books }: BookcaseProps) {
  const [selectedId, setSelectedId] = useState<number | null>(
    () => books.find((book) => book.status === "READING")?.id ?? null,
  );

  /* Livro recém-desmarcado, que deve descer mesmo com o mouse em cima. */
  const [releasedId, setReleasedId] = useState<number | null>(null);

  const selected = books.find((book) => book.id === selectedId) ?? null;

  function toggle(bookId: number) {
    if (selectedId === bookId) {
      setSelectedId(null);
      setReleasedId(bookId);
    } else {
      setSelectedId(bookId);
      setReleasedId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <ul className="bookcase" aria-label="Estante">
        {books.map((book) => (
          <li key={book.id} className="bookcase-slot">
            <BookSpine
              book={book}
              look={getSpineLookForBook(book)}
              selected={book.id === selectedId}
              released={book.id === releasedId}
              onSelect={() => toggle(book.id)}
              onPointerLeave={() =>
                setReleasedId((current) =>
                  current === book.id ? null : current,
                )
              }
            />
          </li>
        ))}
      </ul>

      {selected ? (
        <SelectedBook book={selected} />
      ) : (
        <p className="text-sm text-contrast/50">
          Clique numa lombada para ver o livro.
        </p>
      )}
    </div>
  );
}

function SelectedBook({ book }: { book: SpineBook }) {
  const look = getSpineLookForBook(book);
  const progress = Math.round(book.percentage);

  return (
    <section
      aria-live="polite"
      aria-label={`Livro selecionado: ${book.title}`}
      className="grid grid-cols-[88px_minmax(0,1fr)] gap-5 bg-primary p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-5"
    >
      <div className="relative aspect-[7/10] w-full">
        <Image
          src={book.coverUrl ?? DEFAULT_COVER}
          alt={`Capa do livro ${book.title}`}
          fill
          sizes="120px"
          className="object-cover shadow-[0_14px_22px_-12px_rgb(0_0_0/0.8)]"
        />
      </div>

      <div className="min-w-0">
        <h2 className="title-shelf truncate text-3xl sm:text-4xl" title={book.title}>
          {book.title}
        </h2>

        <p className="mt-1 truncate text-contrast/60">
          {book.creator ?? "Autor desconhecido"}
        </p>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase tracking-widest text-contrast/40">
              Status
            </dt>
            <dd className="flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${statusColor[book.status]}`}
              />
              {statusLabel[book.status]}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] uppercase tracking-widest text-contrast/40">
              Tipo
            </dt>
            <dd>{typeLabel[book.type]}</dd>
          </div>

          {look.pages && (
            <div>
              <dt className="text-[11px] uppercase tracking-widest text-contrast/40">
                Páginas
              </dt>
              <dd className="tabular-nums">≈ {look.pages}</dd>
            </div>
          )}

          <div>
            <dt className="text-[11px] uppercase tracking-widest text-contrast/40">
              Progresso
            </dt>
            <dd className="tabular-nums">{progress}%</dd>
          </div>
        </dl>
      </div>

      <div className="col-span-2 flex flex-wrap gap-2 sm:col-span-1 sm:flex-col">
        {book.hasFile && (
          <Link
            href={`/read/${book.id}`}
            className="btn-shelf bg-danger text-primary hover:bg-contrast"
          >
            {book.status === "READING" ? "Continuar lendo" : "Ler agora"}
          </Link>
        )}

        <Link
          href={`/library/${book.id}`}
          className="btn-shelf text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
        >
          Ver detalhes
        </Link>
      </div>
    </section>
  );
}
