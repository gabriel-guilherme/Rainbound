"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { statusColor, statusLabel } from "@/app/(main)/library/types";
import BookActionsMenu from "@/components/common/BookActionsMenu";
import type { Book, ReadingProgress } from "@/generated/prisma/client";

type BookPosterProps = Book & {
  progress: ReadingProgress | null;
};

const typeLabel = {
  BOOK: "Livro",
  COMIC: "Quadrinho",
  MANGA: "Mangá",
};

export default function BookPoster(book: BookPosterProps) {
  const router = useRouter();

  const percentage = book.progress?.percentage ?? 0;

  function handleReadClick() {
    if (!book.filePath) {
      return;
    }

    router.push(`/read/${book.id}`);
  }

  return (
    <div className="mx-auto flex w-full flex-col gap-1">
      <div className="flex justify-end">
        <BookActionsMenu bookId={book.id} bookTitle={book.title} />
      </div>

      <div className="relative aspect-[7/10] w-full flex-1">
        <Image
          src={
            book.coverUrl ? book.coverUrl : "/Capa_do_livro_Coração_de_Aço.jpg"
          }
          sizes="full"
          alt={`Capa do livro ${book.title}`}
          fill
          loading="eager"
          title={book.title}
          className={`rounded-md object-cover shadow-md shadow-black/50 ${
            book.filePath ? "cursor-pointer" : ""
          }`}
          onClick={handleReadClick}
        />

        <span
          className={`pointer-events-none absolute top-3 right-3 z-10 inline-flex w-fit whitespace-nowrap items-center justify-center rounded-md px-2 py-1 text-center text-xs font-bold text-primary ${statusColor[book.status]} shadow-md`}
        >
          {statusLabel[book.status]}
        </span>
      </div>

      <div className="flex justify-between text-contrast">
        <p>{typeLabel[book.type]}</p>

        <p>{percentage.toFixed(2)}%</p>
      </div>
    </div>
  );
}
