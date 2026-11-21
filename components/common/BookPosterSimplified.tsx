import Image from "next/image";

import { DEFAULT_COVER } from "@/app/(main)/library/types";

type BookCardProps = {
  book: {
    id: number;
    title: string;
    creator: string | null;
    coverUrl: string | null;
  };
};

export default function BookPosterSimplified({ book }: BookCardProps) {
  return (
    <div className="mx-auto flex w-full flex-col gap-1">
      <div className="relative aspect-[7/10] w-full flex-1">
        <Image
          src={
            book.coverUrl ? book.coverUrl : DEFAULT_COVER
          }
          sizes="full"
          alt={`Capa do livro ${book.title}`}
          fill
          className="rounded-md object-cover shadow-md shadow-black/50"
          title={book.title}
        />
      </div>

      <div className="mt-2 flex min-w-0 flex-col text-contrast">
        <p className="truncate font-display text-lg" title={book.title}>
          {book.title}
        </p>

        {book.creator && (
          <p className="truncate text-sm text-contrast/50">{book.creator}</p>
        )}
      </div>
    </div>
  );
}
