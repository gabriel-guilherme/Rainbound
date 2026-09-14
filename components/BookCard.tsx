import Image from "next/image";
import BookActionsMenu from "./BookActionsMenu";
import ProgressBar from "./ProgressBar";

type BookCardProps = {
  book: {
    id: number;
    title: string;
    author: string;
    currentPage: number;
    totalPages: number;
    coverUrl: string;
  };
};

export default function BookCard({ book }: BookCardProps) {
  return (
    <div className="group block rounded-xl bg-primary p-4 shadow-[-5px_7px_10px_rgba(0,0,0,0.25)] transition hover:shadow-sm">
      <div className="grid grid-cols-[70px_1fr_30px] items-center gap-4">
        <div className="relative h-25 w-[70px]">
          <Image
            src={
              book.coverUrl
                ? book.coverUrl
                : "/Capa_do_livro_Coração_de_Aço.jpg"
            }
            sizes="full"
            alt={`Capa do livro ${book.title}`}
            fill
            loading="eager"
            className="rounded-md object-cover shadow-md shadow-black/50"
          />
        </div>
        <div className="grid grid-rows-[1fr_1fr_30px] gap-1">
          <h3
            className="text-lg font-bold text-contrast truncate min-w-0"
            title={book.title}
          >
            {book.title}
          </h3>
          <p className="text-base text-contrast" title={book.author}>
            {book.author}
          </p>
          <div className="flex gap-10 w-full">
            <p className="flex text-sm text-contrast opacity-75 items-end">
              Livro
            </p>
            <div className="flex-1">
              <ProgressBar
                currentPage={book.currentPage}
                totalPages={book.totalPages}
              />
            </div>
          </div>
        </div>

        <BookActionsMenu bookId={book.id} bookTitle={book.title} />
      </div>
    </div>
  );
}
