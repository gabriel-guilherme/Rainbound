import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

import { FilterBar } from "@/components/common/FilterBar";
import BookPoster from "@/components/common/BookPoster";
import { isReadingStatus, orderByOptions } from "./types";

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

  /*
   * Status inválido na URL é ignorado (antes quebrava a consulta).
   */
  const statusFilter = isReadingStatus(status) ? status : undefined;

  const where: Prisma.BookWhereInput = {
    status: statusFilter,

    OR: q
      ? [
          { title: { contains: q, mode: "insensitive" } },
          { creator: { contains: q, mode: "insensitive" } },
        ]
      : undefined,
  };

  const isTitleSort = sort === "title_asc" || sort === "title_desc";

  const orderBy =
    sort && sort in orderByOptions
      ? orderByOptions[sort as keyof typeof orderByOptions]
      : orderByOptions.added_desc;

  const books = await prisma.book.findMany({
    where,
    orderBy: isTitleSort ? undefined : orderBy,
    include: {
      progress: true,
    },
  });

  /*
   * Título é ordenado aqui para respeitar acentos e maiúsculas do pt-BR
   * (ver comentário em orderByOptions).
   */
  if (isTitleSort) {
    books.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, "pt-BR", {
        sensitivity: "base",
      });

      return sort === "title_asc" ? comparison : -comparison;
    });
  }

  const isFiltered = Boolean(q || statusFilter);

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 py-10 pt-32">
      <div className="mb-8 flex items-baseline justify-between gap-4">
        <h1 className="font-display text-3xl text-contrast">Minha biblioteca</h1>

        {books.length > 0 && (
          <p className="text-sm text-contrast/50">
            {books.length} {books.length === 1 ? "item" : "itens"}
          </p>
        )}
      </div>

      <FilterBar q={q} status={statusFilter} />

      {books.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-24 text-center">
          <p className="font-display text-xl text-contrast/70">
            {isFiltered
              ? "Nenhum item encontrado com esse filtro."
              : "Sua estante ainda está vazia."}
          </p>

          {isFiltered ? (
            <Link
              href="/library"
              className="text-sm text-interaction underline-offset-4 hover:underline"
            >
              Limpar filtros
            </Link>
          ) : (
            <Link
              href="/library/new"
              className="rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 text-sm text-contrast transition-colors hover:bg-interaction hover:text-primary"
            >
              Adicionar o primeiro livro
            </Link>
          )}
        </div>
      )}

      <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 lg:grid-cols-6">
        {books.map((book) => (
          <li key={book.id}>
            <BookPoster {...book} />
          </li>
        ))}
      </ul>
    </div>
  );
}
