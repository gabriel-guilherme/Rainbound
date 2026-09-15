import BookCard from "../BookCard";
import { Book } from "@/generated/prisma/client";

type ReadingProps = {
  currentlyReading: Book[];
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
        {currentlyReading.map((book) => {
          return (
            <li key={book.id}>
              <BookCard
                book={{
                  ...book,
                  totalPages: book.totalPages ?? 0,
                  coverUrl: book.coverUrl ?? "",
                }}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
