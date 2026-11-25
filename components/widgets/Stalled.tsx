import Link from "next/link";
import type { ReactNode } from "react";

import { ReadingStatus } from "@/generated/prisma/enums";
import type { WidgetLook, WidgetVariant } from "@/lib/dashboardLayout";
import { prisma } from "@/lib/services/prisma";
import { requireApprovedUser } from "@/lib/auth/session";
import { toSpineBook, type SpineBook } from "@/lib/books/spine";

import AbandonButton from "./parts/AbandonButton";
import BookCardRow from "./parts/BookCardRow";
import BookLinkList from "./parts/BookLinkList";
import BookStack from "./parts/BookStack";
import FeaturedBook from "./parts/FeaturedBook";
import FeaturedBookHeading from "./parts/FeaturedBookHeading";
import SpineShelf from "./parts/SpineShelf";
import {
  clampProgress,
  continueHref,
  daysSince,
  formatDaysAgo,
} from "./parts/bookItem";
import WidgetCard from "./WidgetCard";

const STALLED_AFTER_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

type StalledBook = SpineBook & { days: number };

/*
 * Livros em "Lendo" sem avanço há mais de 30 dias, do parado há mais
 * tempo para o mais recente. O avanço é o último progresso salvo; sem
 * progresso, a última alteração do livro.
 */
async function getStalledBooks(userId: string) {
  const now = Date.now();
  const cutoff = new Date(now - STALLED_AFTER_DAYS * DAY_MS);

  const books = await prisma.book.findMany({
    where: {
      userId,
      status: ReadingStatus.READING,
      OR: [
        { progress: { is: { updatedAt: { lt: cutoff } } } },
        { progress: { is: null }, updatedAt: { lt: cutoff } },
      ],
    },
    include: { progress: true },
  });

  return books
    .map((book) => ({
      ...toSpineBook(book),
      days: daysSince(book.progress?.updatedAt ?? book.updatedAt, now),
    }))
    .sort((a, b) => b.days - a.days);
}

type StalledProps = { variant: WidgetVariant; look: WidgetLook };

/*
 * "Parados": livros em leitura esquecidos, com atalho para retomar ou
 * abandonar. Capas e lombadas esmaecidas, para diferenciar do "Quase lá".
 * Duas versões (`look`, escolhida no editor):
 * - cover: cartões com capa (larga) ou destaque com capa (lado a lado);
 * - spine: prateleira de lombadas (larga) ou pilha deitada (lado a lado).
 */
export default async function Stalled({ variant, look }: StalledProps) {
  const { id: userId } = await requireApprovedUser();

  const stalled = await getStalledBooks(userId);
  const shown = stalled.slice(0, variant === "wide" ? 12 : 5);

  return (
    <WidgetCard
      title="Parados"
      action={{ href: "/library?status=READING", label: "Ver todos" }}
    >
      {shown.length === 0 ? (
        <p className="text-sm text-contrast/60">Nada parado. Tudo em dia.</p>
      ) : (
        CONTENT[look][variant]({ books: shown })
      )}
    </WidgetCard>
  );
}

type ContentProps = { books: StalledBook[] };

const CONTENT: Record<WidgetLook, Record<WidgetVariant, (props: ContentProps) => ReactNode>> = {
  cover: { wide: CoverRow, tall: CoverCard },
  spine: { wide: SpineRow, tall: SpineStack },
};

function detailOf(book: StalledBook) {
  return `${clampProgress(book)}% · ${formatDaysAgo(book.days)}`;
}

function StalledActions({ book }: { book: StalledBook }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link href={continueHref(book)} className="btn-shelf bg-danger text-primary hover:bg-contrast">
        Retomar
      </Link>
      <AbandonButton book={book} />
    </div>
  );
}

/* Destaque ao lado da fileira (versão larga). */
function OldestAside({ book }: { book: StalledBook }) {
  return (
    <div className="flex flex-col gap-3">
      <FeaturedBookHeading
        eyebrow="Parado há mais tempo"
        title={book.title}
        subtitle={detailOf(book)}
      />
      <StalledActions book={book} />
    </div>
  );
}

function CoverRow({ books }: ContentProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <BookCardRow
        muted
        items={books.map((book) => ({
          book,
          href: continueHref(book),
          progress: clampProgress(book),
          detail: detailOf(book),
        }))}
      />
      <OldestAside book={books[0]} />
    </div>
  );
}

function CoverCard({ books }: ContentProps) {
  const [oldest, ...rest] = books;
  const progress = clampProgress(oldest);

  return (
    <div className="flex flex-col gap-5">
      <FeaturedBook
        book={oldest}
        eyebrow={`Parado ${formatDaysAgo(oldest.days)}`}
        muted
      >
        <div className="mt-1 flex flex-col gap-1.5">
          <p className="text-sm">parou em {progress}%</p>
          <span aria-hidden="true" className="block h-0.5 bg-contrast/15">
            <span className="block h-full bg-status-want" style={{ width: `${progress}%` }} />
          </span>
        </div>
      </FeaturedBook>

      <StalledActions book={oldest} />

      <BookLinkList
        label="Também parados"
        items={rest.slice(0, 3).map((book) => ({
          id: book.id,
          title: book.title,
          href: continueHref(book),
          meta: formatDaysAgo(book.days),
        }))}
      />
    </div>
  );
}

function SpineRow({ books }: ContentProps) {
  return (
    <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <SpineShelf
        muted
        label="Livros parados"
        items={books.map((book) => ({
          book,
          href: continueHref(book),
          caption: `${book.days} d`,
        }))}
      />
      <OldestAside book={books[0]} />
    </div>
  );
}

function SpineStack({ books }: ContentProps) {
  return (
    <BookStack
      muted
      items={books.map((book) => ({
        book,
        href: continueHref(book),
        progress: clampProgress(book),
        detail: formatDaysAgo(book.days),
      }))}
    />
  );
}
