import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { DEFAULT_COVER, typeLabel } from "@/lib/books/labels";
import type { WidgetLook, WidgetVariant } from "@/lib/dashboardLayout";
import { prisma } from "@/lib/services/prisma";
import { requireApprovedUser } from "@/lib/auth/session";
import { toSpineBook, type SpineBook } from "@/lib/books/spine";

import BookStack from "./parts/BookStack";
import SpineShelf from "./parts/SpineShelf";
import WidgetCard from "./WidgetCard";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
});

/* Curto, para caber em cima da lombada ("12/11"). */
const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});

type RecentBook = SpineBook & { createdAt: Date };

type RecentlyAddedProps = { variant: WidgetVariant; look: WidgetLook };

/*
 * "Chegaram": últimos livros adicionados. Duas versões (`look`, escolhida
 * no editor; sem escolha, capas):
 * - cover: fileira de capas com título e data (larga) ou lista com capa
 *   pequena, autor, tipo e data (lado a lado);
 * - spine: prateleira de lombadas com a data em cima (larga) ou pilha
 *   deitada dos recém-chegados com a data ao lado (lado a lado).
 */
export default async function RecentlyAdded({ variant, look }: RecentlyAddedProps) {
  const { id: userId } = await requireApprovedUser();

  const books = await prisma.book.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: variant === "wide" ? 10 : 5,
    include: { progress: true },
  });

  const recentlyAdded: RecentBook[] = books.map((book) => ({
    ...toSpineBook(book),
    createdAt: book.createdAt,
  }));

  return (
    <WidgetCard
      title="Chegaram"
      action={{ href: "/library/new", label: "+ Adicionar" }}
    >
      {recentlyAdded.length === 0 ? (
        <p className="text-sm text-contrast/60">Nenhum livro adicionado ainda.</p>
      ) : (
        CONTENT[look][variant]({ books: recentlyAdded })
      )}
    </WidgetCard>
  );
}

type ContentProps = { books: RecentBook[] };

const CONTENT: Record<WidgetLook, Record<WidgetVariant, (props: ContentProps) => ReactNode>> = {
  cover: { wide: CoverRow, tall: CoverList },
  spine: { wide: SpineRow, tall: SpineStack },
};

function AddedOn({ date, className }: { date: Date; className: string }) {
  return (
    <time dateTime={date.toISOString()} className={className}>
      {dateFormatter.format(date)}
    </time>
  );
}

function CoverRow({ books }: ContentProps) {
  return (
    <ul className="scrollbar-none -mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
      {books.map((book) => (
        <li key={book.id} className="w-24 shrink-0">
          <Link href={`/library/${book.id}`} className="group block">
            <span className="relative block aspect-[7/10] w-full">
              <Image
                src={book.coverUrl ?? DEFAULT_COVER}
                alt=""
                fill
                sizes="96px"
                className="object-cover shadow-[0_10px_16px_-10px_rgb(0_0_0/0.8)] transition-transform group-hover:-translate-y-1"
              />
            </span>

            <span className="mt-2 block truncate text-sm font-medium group-hover:text-danger">
              {book.title}
            </span>

            <AddedOn
              date={book.createdAt}
              className="block text-xs tabular-nums text-contrast/45"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function CoverList({ books }: ContentProps) {
  return (
    <ul className="flex flex-col">
      {books.map((book) => (
        <li key={book.id} className="border-t border-contrast/10 first:border-t-0">
          <Link
            href={`/library/${book.id}`}
            className="group grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 py-2.5"
          >
            <span className="relative aspect-[7/10] w-full">
              <Image
                src={book.coverUrl ?? DEFAULT_COVER}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            </span>

            <span className="min-w-0">
              <span className="block truncate font-medium group-hover:text-danger">
                {book.title}
              </span>
              <span className="block truncate text-xs text-contrast/55">
                {book.creator ?? "Autor desconhecido"} · {typeLabel[book.type]}
              </span>
            </span>

            <AddedOn date={book.createdAt} className="text-xs tabular-nums text-contrast/40" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

function SpineRow({ books }: ContentProps) {
  return (
    <SpineShelf
      label="Últimos livros adicionados"
      items={books.map((book) => ({
        book,
        href: `/library/${book.id}`,
        caption: shortDateFormatter.format(book.createdAt),
      }))}
    />
  );
}

function SpineStack({ books }: ContentProps) {
  return (
    <BookStack
      items={books.map((book) => ({
        book,
        href: `/library/${book.id}`,
        detail: <AddedOn date={book.createdAt} className="tabular-nums" />,
      }))}
    />
  );
}
