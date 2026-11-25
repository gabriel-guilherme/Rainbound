import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { buildLibraryHref, type LibraryParams } from "@/lib/books/library";

type PaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  /* Filtros atuais, mantidos nos links. */
  params: Omit<LibraryParams, "page">;
};

/*
 * Números a mostrar: primeira, última e as vizinhas da atual; o resto vira
 * reticências. Ex.: página 6 de 12 → 1 … 5 6 7 … 12.
 */
function getPageItems(page: number, totalPages: number) {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);

  /* Evita reticências que escondem uma página só (1 … 3 vira 1 2 3). */
  if (page <= 4) [2, 3, 4, 5].forEach((p) => pages.add(p));
  if (page >= totalPages - 3)
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach(
      (p) => pages.add(p),
    );

  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= totalPages)
    .sort((a, b) => a - b);

  const items: (number | "gap")[] = [];

  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) items.push("gap");
    items.push(p);
  });

  return items;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  params,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);
  const hrefFor = (target: number) => buildLibraryHref({ ...params, page: target });

  const stepClass =
    "btn-shelf text-contrast ring-2 ring-inset ring-contrast/20 hover:bg-primary hover:ring-primary";
  const disabledClass =
    "btn-shelf pointer-events-none text-contrast/25 ring-2 ring-inset ring-contrast/10";

  return (
    <nav
      aria-label="Páginas da estante"
      className="mt-12 flex flex-col gap-4 border-t border-contrast/10 pt-6"
    >
      <div className="flex items-center justify-between gap-3">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} rel="prev" className={stepClass}>
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Anterior</span>
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            <ArrowLeft size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Anterior</span>
          </span>
        )}

        {/* Desktop: números. Celular: só "página X de Y". */}
        <ol className="hidden items-center gap-1 sm:flex">
          {getPageItems(page, totalPages).map((item, index) =>
            item === "gap" ? (
              <li
                key={`gap-${index}`}
                aria-hidden="true"
                className="px-1 font-display text-xl text-contrast/35"
              >
                …
              </li>
            ) : (
              <li key={item}>
                <Link
                  href={hrefFor(item)}
                  aria-label={`Página ${item}`}
                  aria-current={item === page ? "page" : undefined}
                  className={`flex h-10 min-w-10 items-center justify-center px-2 font-display text-xl font-bold tabular-nums transition-colors ${
                    item === page
                      ? "bg-contrast text-primary"
                      : "text-contrast/60 hover:bg-primary hover:text-contrast"
                  }`}
                >
                  {item}
                </Link>
              </li>
            ),
          )}
        </ol>

        <p className="font-display text-xl font-bold uppercase tabular-nums text-contrast sm:hidden">
          {page} <span className="text-contrast/40">de</span> {totalPages}
        </p>

        {page < totalPages ? (
          <Link href={hrefFor(page + 1)} rel="next" className={stepClass}>
            <span className="hidden sm:inline">Próxima</span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            <span className="hidden sm:inline">Próxima</span>
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        )}
      </div>

      <p className="text-center text-xs tabular-nums text-contrast/45">
        Mostrando {first}–{last} de {totalItems}
      </p>
    </nav>
  );
}
