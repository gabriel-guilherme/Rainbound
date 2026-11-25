import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import { DEFAULT_COVER } from "@/app/(main)/library/types";
import ProgressLabel from "@/components/books/ProgressLabel";
import type { WidgetVariant } from "@/lib/dashboardLayout";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/session";
import { getSpineLookForBook, toSpineBook, type SpineBook } from "@/lib/spine";

import WidgetCard from "./WidgetCard";

function clampProgress(book: SpineBook) {
  return Math.round(Math.min(Math.max(book.percentage, 0), 100));
}

function bookHref(book: SpineBook) {
  return book.hasFile ? `/read/${book.id}` : `/library/${book.id}`;
}

/*
 * "Lendo agora".
 * - tall: pilha de livros deitados (espessura vem das páginas, a linha
 *   embaixo mostra o progresso);
 * - wide: fileira de cartões com capa e barra de progresso.
 */
export default async function Reading({ variant }: { variant: WidgetVariant }) {
  const { id: userId } = await requireApprovedUser();

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
      action={{ href: "/library?status=READING", label: "Ver todos" }}
    >
      {currentlyReading.length === 0 ? (
        <p className="text-sm text-contrast/60">Nenhum livro em andamento.</p>
      ) : variant === "wide" ? (
        <ReadingRow books={currentlyReading} />
      ) : (
        <ReadingStack books={currentlyReading} />
      )}
    </WidgetCard>
  );
}

function ReadingRow({ books }: { books: SpineBook[] }) {
  return (
    <ul className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
      {books.map((book) => {
        const progress = clampProgress(book);

        return (
          <li key={book.id} className="w-60 shrink-0">
            <Link
              href={bookHref(book)}
              className="group group/progress grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 bg-darkest/40 p-2 transition-colors hover:bg-secondary"
            >
              <span className="relative aspect-[7/10] w-full">
                <Image
                  src={book.coverUrl ?? DEFAULT_COVER}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover"
                />
              </span>

              <span className="min-w-0">
                <span className="block truncate font-medium text-contrast group-hover:text-danger">
                  {book.title}
                </span>
                <span className="block text-xs text-contrast/50">
                  <ProgressLabel
                    percentage={progress}
                    pages={book.readPages}
                    suffix="lido"
                  />
                </span>
                <span aria-hidden="true" className="mt-2 block h-0.5 bg-contrast/15">
                  <span
                    className="block h-full bg-danger"
                    style={{ width: `${progress}%` }}
                  />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ReadingStack({ books }: { books: SpineBook[] }) {
  return (
    <ul className="flex flex-col items-start gap-0.5 border-b-[10px] border-darkest pt-2">
      {books.map((book) => {
        const look = getSpineLookForBook(book);
        const progress = clampProgress(book);

        /*
         * Largura do livro na pilha e um leve desalinhamento (0–8 px).
         * O deslocamento sai do id, não da posição na lista: cada livro
         * fica sempre no mesmo lugar, mesmo quando a lista muda.
         */
        const style = {
          width: `${70 + (look.height % 4) * 7}%`,
          height: `${Math.round(look.width * 0.72)}px`,
          marginLeft: `${(book.id * 5) % 9}px`,
          background: look.background,
          color: look.foreground,
        } satisfies CSSProperties;

        return (
          <li key={book.id} className="w-full">
            <Link
              href={bookHref(book)}
              style={style}
              className="group/progress relative flex max-w-full min-h-8 items-center justify-between gap-3 px-3.5 shadow-[inset_0_3px_0_rgb(255_255_255/0.07),inset_0_-5px_7px_rgb(0_0_0/0.35)] transition-transform hover:translate-x-2.5"
            >
              <span className="min-w-0 truncate font-display text-lg font-bold uppercase tracking-wide">
                {book.title}
              </span>

              <span className="shrink-0 text-[11px] opacity-75">
                <ProgressLabel percentage={progress} pages={book.readPages} />
              </span>

              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-[3px]"
                style={{ width: `${progress}%`, background: look.accent }}
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
