import BookCard from "../BookCard";
import { Book } from "@/generated/prisma/client";

type RecentlyAddedProps = {
  recentlyAdded: Book[];
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
                ...book,
                totalPages: book.totalPages,
                coverUrl: book.coverUrl ?? "",
              }}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
