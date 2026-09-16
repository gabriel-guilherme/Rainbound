import Image from "next/image";
import BookActionsMenu from "../common/BookActionsMenu";
import ProgressBar from "../common/ProgressBar";

type BookCardProps = {
  book: {
    id: number;
    title: string;
    creator: string | null;
    type: "BOOK" | "COMIC" | "MANGA";
    coverUrl: string | null;
    progress: {
      percentage: number;
    } | null;
  };
};

const typeLabel = {
  BOOK: "Livro",
  COMIC: "Quadrinho",
  MANGA: "Mangá",
};

export default function BookCard({ book }: BookCardProps) {
  console.log(book);
  const percentage = book.progress?.percentage ?? 0;

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
            className="min-w-0 truncate text-lg font-bold text-contrast"
            title={book.title}
          >
            {book.title}
          </h3>

          <p
            className="text-base text-contrast"
            title={book.creator ?? undefined}
          >
            {book.creator ?? "Desconhecido"}
          </p>

          <div className="flex w-full gap-10">
            <p className="flex items-end text-sm text-contrast opacity-75">
              {typeLabel[book.type]}
            </p>

            <div className="flex-1">
              <ProgressBar percentage={percentage} />
            </div>
          </div>
        </div>

        <BookActionsMenu bookId={book.id} bookTitle={book.title} />
      </div>
    </div>
  );
}
