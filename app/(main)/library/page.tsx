import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

import { FilterBar } from "@/components/common/FilterBar";
import BookPoster from "@/components/common/BookPoster";
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
          { creator: { contains: q, mode: "insensitive" } },
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
    include: {
      progress: true,
    },
  });

  // Ordenação por título
  if (isTitleSort) {
    books.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, "pt-BR", {
        sensitivity: "base",
      });

      return sort === "title_asc" ? comparison : -comparison;
    });
  }

  // Ordenação por progresso
  if (isProgressSort) {
    books.sort((a, b) => {
      const progressA = a.progress?.percentage ?? 0;
      const progressB = b.progress?.percentage ?? 0;

      return sort === "progress_asc"
        ? progressA - progressB
        : progressB - progressA;
    });
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 pt-32">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-contrast">Minha Biblioteca</h1>
      </div>

      <FilterBar q={q} status={status} />

      {books.length === 0 && (
        <p className="text-gray-500">
          {q || status
            ? "Nenhum item encontrado com esse filtro."
            : "Nenhum item cadastrado ainda."}
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <li key={book.id}>
            <BookPoster {...book} />
          </li>
        ))}
      </ul>
    </div>
  );
}
