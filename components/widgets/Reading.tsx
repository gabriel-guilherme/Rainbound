import type { ReactNode } from "react";

import ProgressLabel from "@/components/books/ProgressLabel";
import type { WidgetLook, WidgetVariant } from "@/lib/dashboardLayout";
import type { WidgetProps } from "./types";
import { prisma } from "@/lib/services/prisma";
import { toSpineBook, type SpineBook } from "@/lib/books/spine";

import BookCardRow from "./parts/BookCardRow";
import { clampProgress, continueHref } from "./parts/bookItem";
import BookLinkList from "./parts/BookLinkList";
import BookStack from "./parts/BookStack";
import ContinueActions from "./parts/ContinueActions";
import FeaturedBook from "./parts/FeaturedBook";
import FeaturedBookHeading from "./parts/FeaturedBookHeading";
import SpineShelf from "./parts/SpineShelf";
import WidgetCard from "./WidgetCard";

const EYEBROW = "Continue de onde parou";

/*
 * "Lendo agora": livros em andamento, do mexido por último para o mais
 * antigo. Duas versões (`look`, escolhida no editor; sem escolha, larga
 * com capas e lado a lado com lombadas, como era antes):
 * - cover: cartões com capa (larga) ou o último em destaque com capa
 *   grande e os outros em lista (lado a lado);
 * - spine: prateleira de lombadas com o último em destaque (larga) ou
 *   pilha de livros deitados (lado a lado).
 */
export default async function Reading({ variant, look, owner, isOwner }: WidgetProps) {
  const userId = owner.id;

  const books = await prisma.book.findMany({
    where: { userId, status: "READING" },
    orderBy: { updatedAt: "desc" },
    take: variant === "wide" ? 8 : 5,
    include: { progress: true },
  });

  const currentlyReading = books.map(toSpineBook);

  return (
    <WidgetCard
      title="Lendo agora"
      action={isOwner ? { href: "/library?status=READING", label: "Ver todos" } : undefined}
    >
      {currentlyReading.length === 0 ? (
        <p className="text-sm text-contrast/60">Nenhum livro em andamento.</p>
      ) : (
        CONTENT[look][variant]({ books: currentlyReading, isOwner })
      )}
    </WidgetCard>
  );
}

type ContentProps = { books: SpineBook[]; isOwner: boolean };

const CONTENT: Record<WidgetLook, Record<WidgetVariant, (props: ContentProps) => ReactNode>> = {
  cover: { wide: CoverRow, tall: CoverCard },
  spine: { wide: SpineRow, tall: SpineStack },
};

function progressText(book: SpineBook) {
  return `${clampProgress(book)}% lido`;
}

function CoverRow({ books, isOwner }: ContentProps) {
  return (
    <BookCardRow
      items={books.map((book) => ({
        book,
        href: isOwner ? continueHref(book) : undefined,
        progress: clampProgress(book),
        detail: (
          <ProgressLabel percentage={clampProgress(book)} pages={book.readPages} suffix="lido" />
        ),
      }))}
    />
  );
}

function CoverCard({ books, isOwner }: ContentProps) {
  const [last, ...rest] = books;
  const progress = clampProgress(last);

  return (
    <div className="flex flex-col gap-5">
      <FeaturedBook book={last} eyebrow={EYEBROW}>
        <div className="group/progress mt-1 flex flex-col gap-1.5">
          <p className="text-sm">
            <ProgressLabel percentage={progress} pages={last.readPages} suffix="lido" />
          </p>
          <span aria-hidden="true" className="block h-0.5 bg-contrast/15">
            <span className="block h-full bg-danger" style={{ width: `${progress}%` }} />
          </span>
        </div>
      </FeaturedBook>

      {isOwner && <ContinueActions book={last} label="Continuar" />}

      <BookLinkList
        label="Também lendo"
        items={rest.slice(0, 3).map((book) => ({
          id: book.id,
          title: book.title,
          href: isOwner ? continueHref(book) : undefined,
          meta: `${clampProgress(book)}%`,
        }))}
      />
    </div>
  );
}

function SpineRow({ books, isOwner }: ContentProps) {
  const [last] = books;

  return (
    <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <SpineShelf
        label="Livros em andamento"
        items={books.map((book) => ({
          book,
          href: isOwner ? continueHref(book) : undefined,
          caption: `${clampProgress(book)}%`,
        }))}
      />

      <div className="flex flex-col gap-3">
        <FeaturedBookHeading eyebrow={EYEBROW} title={last.title} subtitle={progressText(last)} />
        {isOwner && <ContinueActions book={last} label="Continuar" />}
      </div>
    </div>
  );
}

function SpineStack({ books, isOwner }: ContentProps) {
  return (
    <BookStack
      items={books.map((book) => ({
        book,
        href: isOwner ? continueHref(book) : undefined,
        progress: clampProgress(book),
        detail: <ProgressLabel percentage={clampProgress(book)} pages={book.readPages} />,
      }))}
    />
  );
}
