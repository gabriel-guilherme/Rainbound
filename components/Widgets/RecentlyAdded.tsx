import BookCard from "../Reader/BookCard";

import type { Book, ReadingProgress } from "@/generated/prisma/client";

type RecentlyAddedProps = {
  recentlyAdded: (Book & {
    progress: ReadingProgress | null;
  })[];
};

export default function RecentlyAdded({ recentlyAdded }: RecentlyAddedProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-contrast">
        Adicionados recentemente
      </h2>

      <ul className="flex flex-col gap-3">
        {recentlyAdded.map((book) => (
          <li key={book.id}>
            <BookCard
              book={{
                id: book.id,
                title: book.title,
                creator: book.creator,
                type: book.type,
                coverUrl: book.coverUrl,
                progress: book.progress
                  ? {
                      percentage: book.progress.percentage,
                    }
                  : null,
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
