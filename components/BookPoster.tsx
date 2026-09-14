import Image from "next/image";

import { statusColor, statusLabel } from "@/app/books/types";
import BookActionsMenu from "./BookActionsMenu";

type BookCardProps = {
  book: {
    id: number;
    title: string;
    author: string;
    currentPage: number;
    totalPages: number;
    status: string;
    coverUrl: string;
  };
};

function bookProgress(currentPage: number, totalPages: number) {
  return ((currentPage / totalPages) * 100).toFixed(2);
}

export default function BookPoster({ book }: BookCardProps) {
  return (
    <div className={`mx-auto w-full  flex flex-col gap-1`}>
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
          className="rounded-md object-cover shadow-md shadow-black/50"
        />

        <span
          className={`pointer-events-none absolute top-3 right-3 z-10 inline-flex w-fit whitespace-nowrap items-center justify-center rounded-md px-2 py-1 text-center text-xs font-bold text-primary ${statusColor[book.status]} shadow-md`}
        >
          {statusLabel[book.status]}
        </span>
      </div>

      <div className="flex justify-between text-contrast">
        <>
          <p>Livro</p>
          <p>{bookProgress(book.currentPage, book.totalPages)}%</p>
        </>
      </div>
    </div>
  );
}
