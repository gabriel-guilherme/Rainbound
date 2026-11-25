import type { ReactNode } from "react";

import { ReadingStatus } from "@/generated/prisma/enums";
import type { WidgetLook, WidgetVariant } from "@/lib/dashboardLayout";
import { prisma } from "@/lib/services/prisma";
import { requireApprovedUser } from "@/lib/auth/session";
import { toSpineBook, type SpineBook } from "@/lib/books/spine";

import BookCardRow from "./parts/BookCardRow";
import BookLinkList from "./parts/BookLinkList";
import BookStack from "./parts/BookStack";
import ContinueActions from "./parts/ContinueActions";
import FeaturedBook from "./parts/FeaturedBook";
import FeaturedBookHeading from "./parts/FeaturedBookHeading";
import SpineShelf from "./parts/SpineShelf";
import { clampProgress, continueHref, remainingLabel } from "./parts/bookItem";
import WidgetCard from "./WidgetCard";

const NEARLY_FROM_PERCENT = 70;

const EYEBROW = "Mais perto do fim";

type NearlyProps = { variant: WidgetVariant; look: WidgetLook };

/*
 * "Quase lá": livros em leitura acima de 70%, do mais perto do fim para
 * o mais longe. Duas versões (`look`, escolhida no editor):
 * - cover: cartões com capa (larga) ou destaque com capa (lado a lado);
 * - spine: prateleira de lombadas (larga) ou pilha deitada (lado a lado).
 */
export default async function Nearly({ variant, look }: NearlyProps) {
  const { id: userId } = await requireApprovedUser();

  const books = await prisma.book.findMany({
    where: {
      userId,
      status: ReadingStatus.READING,
      progress: { is: { percentage: { gte: NEARLY_FROM_PERCENT, lt: 100 } } },
    },
    orderBy: { progress: { percentage: "desc" } },
    take: variant === "wide" ? 12 : 5,
    include: { progress: true },
  });

  const nearly = books.map(toSpineBook);

  return (
    <WidgetCard
      title="Quase lá"
      action={{ href: "/library?status=READING", label: "Ver todos" }}
    >
      {nearly.length === 0 ? (
        <p className="text-sm text-contrast/60">
          Nenhum livro em leitura passou de {NEARLY_FROM_PERCENT}% ainda.
        </p>
      ) : (
        CONTENT[look][variant]({ books: nearly })
      )}
    </WidgetCard>
  );
}

type ContentProps = { books: SpineBook[] };

const CONTENT: Record<WidgetLook, Record<WidgetVariant, (props: ContentProps) => ReactNode>> = {
  cover: { wide: CoverRow, tall: CoverCard },
  spine: { wide: SpineRow, tall: SpineStack },
};

function CoverRow({ books }: ContentProps) {
  return (
    <BookCardRow
      items={books.map((book) => ({
        book,
        href: continueHref(book),
        progress: clampProgress(book),
        detail: `${clampProgress(book)}% · ${remainingLabel(book)}`,
      }))}
    />
  );
}

function CoverCard({ books }: ContentProps) {
  const [first, ...rest] = books;
  const progress = clampProgress(first);

  return (
    <div className="flex flex-col gap-5">
      <FeaturedBook book={first} eyebrow={EYEBROW}>
        <div className="mt-1 flex flex-col gap-1.5">
          <p className="text-sm">{remainingLabel(first)}</p>
          <span aria-hidden="true" className="block h-0.5 bg-contrast/15">
            <span className="block h-full bg-danger" style={{ width: `${progress}%` }} />
          </span>
        </div>
      </FeaturedBook>

      <ContinueActions book={first} label="Terminar" />

      <BookLinkList
        label="Depois"
        items={rest.slice(0, 3).map((book) => ({
          id: book.id,
          title: book.title,
          href: continueHref(book),
          meta: `${clampProgress(book)}%`,
        }))}
      />
    </div>
  );
}

function SpineRow({ books }: ContentProps) {
  const [first] = books;

  return (
    <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <SpineShelf
        label="Livros quase no fim"
        items={books.map((book) => ({
          book,
          href: continueHref(book),
          caption: `${clampProgress(book)}%`,
        }))}
      />

      <div className="flex flex-col gap-3">
        <FeaturedBookHeading
          eyebrow={EYEBROW}
          title={first.title}
          subtitle={remainingLabel(first)}
        />
        <ContinueActions book={first} label="Terminar" />
      </div>
    </div>
  );
}

function SpineStack({ books }: ContentProps) {
  return (
    <BookStack
      items={books.map((book) => ({
        book,
        href: continueHref(book),
        progress: clampProgress(book),
        detail: remainingLabel(book),
      }))}
    />
  );
}
