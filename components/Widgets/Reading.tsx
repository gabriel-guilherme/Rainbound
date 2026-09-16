import BookCard from "../Reader/BookCard";

import type { Book, ReadingProgress } from "@/generated/prisma/client";

type ReadingProps = {
  currentlyReading: (Book & {
    progress: ReadingProgress | null;
  })[];
};

export default function Reading({ currentlyReading }: ReadingProps) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-contrast">
        Lendo agora
      </h2>

      {currentlyReading.length === 0 && (
        <p className="text-sm text-contrast">Nenhum livro em andamento.</p>
      )}

      <ul className="flex flex-col gap-3">
        {currentlyReading.map((book) => (
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
