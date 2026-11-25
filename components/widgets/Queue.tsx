import Link from "next/link";
import type { ReactNode } from "react";

import type { WidgetLook, WidgetVariant } from "@/lib/dashboardLayout";
import type { WidgetProps } from "./types";
import { prisma } from "@/lib/services/prisma";
import { getLastName, toSpineBook, type SpineBook } from "@/lib/books/spine";

import BookCardRow from "./parts/BookCardRow";
import BookLinkList from "./parts/BookLinkList";
import BookStack from "./parts/BookStack";
import FeaturedBook from "./parts/FeaturedBook";
import FeaturedBookHeading from "./parts/FeaturedBookHeading";
import SpineShelf from "./parts/SpineShelf";
import WidgetCard from "./WidgetCard";

type QueueBook = SpineBook & { description: string | null };

/*
 * Sugestão do dia: muda uma vez por dia (não a cada visita), para a
 * fila não "pular" toda vez que a página recarrega.
 */
function pickOfTheDay<T>(items: T[]) {
  const day = Math.floor(Date.now() / (24 * 60 * 60 * 1000));

  return items[day % items.length];
}

/*
 * "Fila": livros em "Quero ler", do mais antigo na fila para o mais novo,
 * com uma sugestão do dia. Duas versões (`look`, escolhida no editor; sem
 * escolha, larga com lombadas e lado a lado com capa, como era antes):
 * - cover: cartões com capa + a sugestão ao lado (larga) ou a sugestão
 *   com capa e descrição + os próximos (lado a lado);
 * - spine: prateleira de lombadas + a sugestão ao lado (larga) ou a
 *   sugestão em cima de uma pilha deitada dos próximos (lado a lado).
 */
export default async function Queue({ variant, look, owner, isOwner }: WidgetProps) {
  const userId = owner.id;

  const [books, total] = await Promise.all([
    prisma.book.findMany({
      where: { userId, status: "WANT_TO_READ" },
      orderBy: { createdAt: "asc" },
      take: 16,
      include: { progress: true },
    }),
    prisma.book.count({ where: { userId, status: "WANT_TO_READ" } }),
  ]);

  const queue: QueueBook[] = books.map((book) => ({
    ...toSpineBook(book),
    description: book.description,
  }));

  const suggestion = queue.length > 0 ? pickOfTheDay(queue) : null;

  return (
    <WidgetCard
      title="Fila"
      action={isOwner ? { href: "/library?status=WANT_TO_READ", label: `Ver todos (${total})` } : undefined}
    >
      {!suggestion ? (
        <p className="text-sm text-contrast/60">
          Nenhum livro em &quot;Quero ler&quot;.{" "}
          {isOwner && (
            <Link href="/library/new" className="text-danger hover:underline">
              Adicionar
            </Link>
          )}
        </p>
      ) : (
        CONTENT[look][variant]({ books: queue, suggestion, isOwner })
      )}
    </WidgetCard>
  );
}

function SuggestionActions({ book }: { book: QueueBook }) {
  return (
    <div className="flex flex-wrap gap-2">
      {book.hasFile && (
        <Link href={`/read/${book.id}`} className="btn-shelf bg-danger text-primary hover:bg-contrast">
          Começar
        </Link>
      )}

      <Link
        href={`/library/${book.id}`}
        className="btn-shelf text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
      >
        Ver livro
      </Link>
    </div>
  );
}

type ContentProps = { books: QueueBook[]; suggestion: QueueBook; isOwner: boolean };

const CONTENT: Record<WidgetLook, Record<WidgetVariant, (props: ContentProps) => ReactNode>> = {
  cover: { wide: QueueCoverRow, tall: QueueCard },
  spine: { wide: QueueShelf, tall: QueueStack },
};

/* Sugestão do dia ao lado da fileira ou da prateleira (versões largas). */
function SuggestionAside({ suggestion, isOwner }: { suggestion: QueueBook; isOwner: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      <FeaturedBookHeading
        eyebrow="Que tal este?"
        title={suggestion.title}
        subtitle={suggestion.creator ?? "Autor desconhecido"}
      />

      {isOwner && <SuggestionActions book={suggestion} />}
    </div>
  );
}

function QueueCoverRow({ books, suggestion, isOwner }: ContentProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <BookCardRow
        items={books.map((book) => ({
          book,
          href: isOwner ? `/library/${book.id}` : undefined,
          detail: book.creator ?? "Autor desconhecido",
        }))}
      />

      <SuggestionAside suggestion={suggestion} isOwner={isOwner} />
    </div>
  );
}

function QueueStack({ books, suggestion, isOwner }: ContentProps) {
  const next = books.filter((book) => book.id !== suggestion.id).slice(0, 5);

  return (
    <div className="flex flex-col gap-5">
      <SuggestionAside suggestion={suggestion} isOwner={isOwner} />

      {next.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-widest text-contrast/40">Depois</p>
          <BookStack
            items={next.map((book) => ({
              book,
              href: isOwner ? `/library/${book.id}` : undefined,
              detail: getLastName(book.creator),
            }))}
          />
        </div>
      )}
    </div>
  );
}

function QueueShelf({ books, suggestion, isOwner }: ContentProps) {
  return (
    <div className="grid grid-cols-1 items-end gap-5 md:grid-cols-[minmax(0,1fr)_16rem]">
      <SpineShelf
        label="Livros na fila"
        items={books.map((book) => ({ book, href: isOwner ? `/library/${book.id}` : undefined }))}
      />

      <SuggestionAside suggestion={suggestion} isOwner={isOwner} />
    </div>
  );
}

function QueueCard({ books, suggestion, isOwner }: ContentProps) {
  const next = books.filter((book) => book.id !== suggestion.id).slice(0, 4);

  return (
    <div className="flex flex-col gap-5">
      <FeaturedBook book={suggestion} eyebrow="Que tal este?">
        {suggestion.description && (
          <p className="line-clamp-3 font-reading text-sm italic text-contrast/65">
            {suggestion.description}
          </p>
        )}
      </FeaturedBook>

      {isOwner && <SuggestionActions book={suggestion} />}

      <BookLinkList
        label="Depois"
        items={next.map((book) => ({
          id: book.id,
          title: book.title,
          href: isOwner ? `/library/${book.id}` : undefined,
          meta: getLastName(book.creator),
        }))}
      />
    </div>
  );
}
