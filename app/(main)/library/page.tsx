import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

import { FilterBar } from "@/components/common/FilterBar";
import BookPoster from "@/components/BookPoster";
import { orderByOptions } from "./types";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    sort?: string;
  }>;
}) {
  const { status, q, sort } = await searchParams;

  const where: Prisma.BookWhereInput = {
    status: status
      ? (status as Prisma.EnumReadingStatusFilter["equals"])
      : undefined,

    OR: q
      ? [
          { title: { contains: q, mode: "insensitive" } },
          { author: { contains: q, mode: "insensitive" } },
        ]
      : undefined,
  };

  const isTitleSort = sort === "title_asc" || sort === "title_desc";

  const isProgressSort = sort === "progress_asc" || sort === "progress_desc";

  const isClientSort = isTitleSort || isProgressSort;

  const orderBy = isClientSort
    ? undefined
    : (orderByOptions[sort as keyof typeof orderByOptions] ??
      orderByOptions.added_desc);

  const books = await prisma.book.findMany({
    where,
    orderBy,
  });

  // Ordenacao por titulo
  if (isTitleSort) {
    books.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, "pt-BR", {
        sensitivity: "base",
      });

      return sort === "title_asc" ? comparison : -comparison;
    });
  }

  // Ordenacao por progresso
  if (isProgressSort) {
    books.sort((a, b) => {
      const progressA = a.totalPages ? a.currentPage / a.totalPages : 0;

      const progressB = b.totalPages ? b.currentPage / b.totalPages : 0;

      return sort === "progress_asc"
        ? progressA - progressB
        : progressB - progressA;
    });
  }

  console.log(books);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pt-32">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-contrast">Meus Livros</h1>
      </div>

      <FilterBar q={q} status={status} />

      {books.length === 0 && (
        <p className="text-gray-500">
          {q || status
            ? "Nenhum livro encontrado com esse filtro."
            : "Nenhum livro cadastrado ainda."}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <li key={book.id}>
            <BookPoster
              book={{
                id: book.id,
                title: book.title,
                author: book.author,
                currentPage: book.currentPage,
                totalPages: book.totalPages ?? 0,
                status: book.status,
                coverUrl: book.coverUrl || "",
              }}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
