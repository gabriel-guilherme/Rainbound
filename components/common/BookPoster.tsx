"use client";

import Image from "next/image";
import Link from "next/link";

import {
  statusColor,
  statusLabel,
  typeLabel,
  DEFAULT_COVER,
} from "@/app/(main)/library/types";
import BookActionsMenu from "@/components/common/BookActionsMenu";
import type { Book, ReadingProgress } from "@/generated/prisma/client";

type BookPosterProps = Book & {
  progress: ReadingProgress | null;
};

export default function BookPoster(book: BookPosterProps) {
  const percentage = book.progress?.percentage ?? 0;

  const cover = (
    <Image
      src={book.coverUrl ? book.coverUrl : DEFAULT_COVER}
      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
      alt={`Capa do livro ${book.title}`}
      fill
      loading="eager"
      className="rounded-md object-cover shadow-md shadow-black/50 transition-transform duration-300 group-hover/cover:-translate-y-1"
    />
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-1">
      <div className="flex justify-end">
        <BookActionsMenu bookId={book.id} bookTitle={book.title} />
      </div>

      <div className="group/cover relative aspect-[7/10] w-full flex-1">
        {book.filePath ? (
          <Link
            href={`/read/${book.id}`}
            aria-label={`Ler ${book.title}`}
            title={`Ler ${book.title}`}
            className="absolute inset-0 rounded-md"
          >
            {cover}
          </Link>
        ) : (
          cover
        )}

        <span className="pointer-events-none absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-darkest/75 px-2.5 py-1 text-xs font-medium text-contrast shadow-md backdrop-blur-sm">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${statusColor[book.status]}`}
          />
          {statusLabel[book.status]}
        </span>
      </div>

      <div className="mt-1 flex min-w-0 flex-col gap-1 text-contrast">
        <p className="truncate font-display text-base" title={book.title}>
          {book.title}
        </p>

        <div className="flex justify-between text-xs text-contrast/50">
          <span>{typeLabel[book.type]}</span>

          <span>{Math.round(percentage)}%</span>
        </div>
      </div>
    </div>
  );
}
