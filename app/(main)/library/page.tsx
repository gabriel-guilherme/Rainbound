import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireApprovedUser } from "@/lib/session";
import type { Prisma } from "@/generated/prisma/client";

import { FilterBar } from "@/components/common/FilterBar";
import BookPoster from "@/components/common/BookPoster";
import Bookcase from "@/components/common/Bookcase";
import Pagination from "@/components/common/Pagination";
import ViewToggle from "@/components/common/ViewToggle";
import StorageMeter from "@/components/common/StorageMeter";
import { getStorageUsage } from "@/lib/storage";
import { toSpineBook } from "@/lib/spine";
import {
  buildLibraryHref,
  isLibraryView,
  isReadingStatus,
  LIBRARY_PAGE_SIZE,
  orderByOptions,
  parsePageParam,
} from "./types";

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    sort?: string;
    view?: string;
    page?: string;
  }>;
}) {
  const { id: userId } = await requireApprovedUser();

  const { status, q, sort, view: viewParam, page: pageParam } =
    await searchParams;
  const view = isLibraryView(viewParam) ? viewParam : "spines";
  const page = parsePageParam(pageParam);

  /*
   * Status inválido na URL é ignorado (antes quebrava a consulta).
   */
  const statusFilter = isReadingStatus(status) ? status : undefined;

  const where: Prisma.BookWhereInput = {
    userId,
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

  const [totalItems, storage] = await Promise.all([
    prisma.book.count({ where }),
    getStorageUsage(userId),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalItems / LIBRARY_PAGE_SIZE));

  /* Filtros mantidos nos links (paginação, visualização). */
  const linkParams = { q, status: statusFilter, sort, view };

  /* Página além da última (ex.: depois de um filtro) leva à última. */
  if (page > totalPages) {
    redirect(buildLibraryHref({ ...linkParams, page: totalPages }));
  }

  const skip = (page - 1) * LIBRARY_PAGE_SIZE;

  let books;

  if (isTitleSort) {
    /*
     * Título é ordenado em JS para respeitar acentos e maiúsculas do pt-BR
     * (ver comentário em orderByOptions). Ordena só id + título de todos e
     * busca os dados completos apenas da página atual.
     */
    const titles = await prisma.book.findMany({
      where,
      select: { id: true, title: true },
    });

    titles.sort((a, b) => {
      const comparison = a.title.localeCompare(b.title, "pt-BR", {
        sensitivity: "base",
      });

      return sort === "title_asc" ? comparison : -comparison;
    });

    const pageIds = titles
      .slice(skip, skip + LIBRARY_PAGE_SIZE)
      .map((book) => book.id);

    const pageBooks = await prisma.book.findMany({
      where: { id: { in: pageIds }, userId },
      include: { progress: true },
    });

    const position = new Map(pageIds.map((id, index) => [id, index]));

    books = pageBooks.sort(
      (a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0),
    );
  } else {
    books = await prisma.book.findMany({
      where,
      orderBy,
      skip,
      take: LIBRARY_PAGE_SIZE,
      include: {
        progress: true,
      },
    });
  }

  const isFiltered = Boolean(q || statusFilter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pt-32">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">
          Minha estante
        </h1>

        <div className="flex w-full flex-col gap-3 sm:w-64">
          {totalItems > 0 && (
            <p className="text-sm tabular-nums text-contrast/50 sm:text-right">
              {totalItems} {totalItems === 1 ? "item" : "itens"}
              {totalPages > 1 && ` · página ${page} de ${totalPages}`}
            </p>
          )}

          <StorageMeter used={storage.used} limit={storage.limit} />
        </div>
      </div>

      <FilterBar
        q={q}
        status={statusFilter}
        marker={view === "spines" ? "ribbon" : "dot"}
      >
        <ViewToggle view={view} params={{ q, status: statusFilter, sort, page }} />
      </FilterBar>

      {books.length === 0 && (
        <div className="flex flex-col items-center gap-5 py-24 text-center">
          <p className="title-shelf text-3xl text-contrast/70">
            {isFiltered
              ? "Nenhum livro nessa prateleira."
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
              className="btn-shelf bg-danger text-primary hover:bg-contrast"
            >
              Colocar o primeiro livro
            </Link>
          )}
        </div>
      )}

      {books.length > 0 &&
        (view === "spines" ? (
          <Bookcase key={page} books={books.map(toSpineBook)} />
        ) : (
          <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 lg:grid-cols-6">
            {books.map((book) => (
              <li key={book.id}>
                <BookPoster {...book} />
              </li>
            ))}
          </ul>
        ))}

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        pageSize={LIBRARY_PAGE_SIZE}
        params={linkParams}
      />
    </div>
  );
}
