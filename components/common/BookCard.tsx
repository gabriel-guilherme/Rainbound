import Image from "next/image";
import Link from "next/link";
import BookActionsMenu from "./BookActionsMenu";
import ProgressBar from "./ProgressBar";
import { DEFAULT_COVER, typeLabel } from "@/app/(main)/library/types";
import type { ContentType } from "@/generated/prisma/enums";

type BookCardProps = {
  book: {
    id: number;
    title: string;
    creator: string | null;
    type: ContentType;
    coverUrl: string | null;
    progress: {
      percentage: number;
    } | null;
  };
};

export default function BookCard({ book }: BookCardProps) {
  const percentage = book.progress?.percentage ?? 0;

  return (
    <div className="group block rounded-xl bg-primary p-4 shadow-[-5px_7px_10px_rgba(0,0,0,0.25)] transition-colors hover:bg-primary/80">
      <div className="grid grid-cols-[70px_1fr_30px] items-center gap-4">
        <div className="relative h-25 w-[70px]">
          <Image
            src={
              book.coverUrl
                ? book.coverUrl
                : DEFAULT_COVER
            }
            sizes="70px"
            alt={`Capa do livro ${book.title}`}
            fill
            loading="eager"
            className="rounded-md object-cover shadow-md shadow-black/50"
          />
        </div>

        <div className="grid grid-rows-[1fr_1fr_30px] gap-1">
          <h3
            className="min-w-0 truncate font-display text-lg font-semibold text-contrast"
            title={book.title}
          >
            <Link
              href={`/library/${book.id}`}
              className="rounded-sm hover:text-interaction"
            >
              {book.title}
            </Link>
          </h3>

          <p
            className="min-w-0 truncate text-sm text-contrast/70"
            title={book.creator ?? undefined}
          >
            {book.creator ?? "Desconhecido"}
          </p>

          <div className="flex w-full items-end gap-6">
            <p className="text-sm text-contrast/60">
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
