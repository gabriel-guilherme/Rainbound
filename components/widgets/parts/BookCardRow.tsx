import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { DEFAULT_COVER } from "@/lib/books/labels";
import type { SpineBook } from "@/lib/books/spine";

export type BookCardRowItem = {
  book: SpineBook;
  href: string;
  /* Linha embaixo do título. */
  detail: ReactNode;
  /* 0 a 100; sem valor, o cartão fica sem barra (ex.: fila). */
  progress?: number;
};

type BookCardRowProps = {
  items: BookCardRowItem[];
  /* Capa esmaecida e barra cinza (ex: livros parados). */
  muted?: boolean;
};

/*
 * Fileira de cartões com capa pequena, título e barra de progresso
 * (versão capa larga dos widgets de livros).
 */
export default function BookCardRow({ items, muted = false }: BookCardRowProps) {
  return (
    <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {items.map(({ book, href, detail, progress }) => (
        <li key={book.id} className="w-60 shrink-0">
          <Link
            href={href}
            className="group group/progress grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 bg-darkest/40 p-2 transition-colors hover:bg-secondary"
          >
            <span className="relative aspect-[7/10] w-full">
              <Image
                src={book.coverUrl ?? DEFAULT_COVER}
                alt=""
                fill
                sizes="44px"
                className={`object-cover ${muted ? "opacity-60 transition-opacity group-hover:opacity-100" : ""}`}
              />
            </span>

            <span className="min-w-0">
              <span className="block truncate font-medium text-contrast group-hover:text-danger">
                {book.title}
              </span>
              <span className="block text-xs text-contrast/50">{detail}</span>
              {progress !== undefined && (
                <span aria-hidden="true" className="mt-2 block h-0.5 bg-contrast/15">
                  <span
                    className={`block h-full ${muted ? "bg-status-want" : "bg-danger"}`}
                    style={{ width: `${progress}%` }}
                  />
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
