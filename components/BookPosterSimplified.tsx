import Image from "next/image";

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

export default function BookPosterSimplified({ book }: BookCardProps) {
  return (
    <div className={`mx-auto w-full  flex flex-col gap-1`}>
      <div className="relative aspect-[7/10] w-full flex-1">
        <Image
          src={
            book.coverUrl ? book.coverUrl : "/Capa_do_livro_Coração_de_Aço.jpg"
          }
          sizes="full"
          alt={`Capa do livro ${book.title}`}
          fill
          className="rounded-md object-cover shadow-md shadow-black/50"
          title={book.title}
        />
      </div>

      <div className="flex justify-between text-contrast">
        <p title={book.title}>{book.title}</p>
      </div>
    </div>
  );
}
