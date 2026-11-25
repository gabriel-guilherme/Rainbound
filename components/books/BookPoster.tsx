"use client";

import Image from "next/image";
import Link from "next/link";

import {
  statusColor,
  statusLabel,
  typeLabel,
  DEFAULT_COVER,
} from "@/lib/books/labels";
import BookActionsMenu from "@/components/books/BookActionsMenu";
import ProgressLabel from "@/components/books/ProgressLabel";
import type { Book, ReadingProgress } from "@/generated/prisma/client";
import { getReadPages } from "@/lib/reading/pages";

type BookPosterProps = Book & {
  progress: ReadingProgress | null;
};

export default function BookPoster(book: BookPosterProps) {
  const percentage = book.progress?.percentage ?? 0;
  const pages = getReadPages(book.progress);

  const cover = (
    <Image
      src={book.coverUrl ? book.coverUrl : DEFAULT_COVER}
      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
      alt={`Capa do livro ${book.title}`}
      fill
      loading="eager"
      className="object-cover shadow-[0_14px_22px_-12px_rgb(0_0_0/0.8)] transition-transform duration-300 group-hover/cover:-translate-y-1.5"
    />
  );

  return (
    <div className="group/progress mx-auto flex w-full flex-col gap-1">
      <div className="flex justify-end">
        <BookActionsMenu bookId={book.id} bookTitle={book.title} />
      </div>

      <div className="group/cover relative aspect-[7/10] w-full flex-1">
        {/* Sem arquivo: abre a página do livro, onde se registra a leitura. */}
        <Link
          href={book.filePath ? `/read/${book.id}` : `/library/${book.id}`}
          aria-label={book.filePath ? `Ler ${book.title}` : `Abrir ${book.title}`}
          title={book.filePath ? `Ler ${book.title}` : `Abrir ${book.title}`}
          className="absolute inset-0"
        >
          {cover}
        </Link>

        <span className="pointer-events-none absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 whitespace-nowrap bg-darkest/85 px-2 py-1 text-xs font-medium text-contrast">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${statusColor[book.status]}`}
          />
          {statusLabel[book.status]}
        </span>
      </div>

      <div className="mt-1 flex min-w-0 flex-col gap-1 text-contrast">
        <p className="title-shelf truncate text-lg" title={book.title}>
          {book.title}
        </p>

        <div className="flex justify-between text-xs text-contrast/50">
          <span>{typeLabel[book.type]}</span>

          <ProgressLabel percentage={percentage} pages={pages} />
        </div>
      </div>
    </div>
  );
}
