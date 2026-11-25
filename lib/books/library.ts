import type { Prisma } from "@/generated/prisma/client";

/*
 * Listagem da estante (/library): ordenação, visualização, paginação e o
 * link com os filtros. Rótulos do livro ficam em labels.ts.
 */

export const sortOptions = [
  { value: "added_desc", label: "Mais recentes" },
  { value: "added_asc", label: "Mais antigos" },
  { value: "title_asc", label: "Título (A–Z)" },
  { value: "title_desc", label: "Título (Z–A)" },
  { value: "progress_desc", label: "Mais avançados" },
  { value: "progress_asc", label: "Menos avançados" },
] as const;

export type SortOption = (typeof sortOptions)[number]["value"];

/*
 * Ordenações feitas no banco. Título fica de fora: é ordenado em JS com
 * `localeCompare("pt-BR")`, porque a collation do Postgres (ex.: "C" na
 * imagem alpine) não ordena acentos e maiúsculas como esperado.
 */
export const orderByOptions = {
  added_desc: { createdAt: "desc" },
  added_asc: { createdAt: "asc" },
  progress_desc: [{ progress: { percentage: "desc" } }, { createdAt: "desc" }],
  progress_asc: [{ progress: { percentage: "asc" } }, { createdAt: "desc" }],
} satisfies Partial<
  Record<
    SortOption,
    | Prisma.BookOrderByWithRelationInput
    | Prisma.BookOrderByWithRelationInput[]
  >
>;

/*
 * Visualizações da biblioteca (`?view=`). Lombadas é o padrão (sem escolha
 * salva na conta: lib/preferences).
 */
export const libraryViewOptions = [
  { value: "spines", label: "Lombadas" },
  { value: "covers", label: "Capas" },
] as const;

export type LibraryView = (typeof libraryViewOptions)[number]["value"];

export function isLibraryView(value: unknown): value is LibraryView {
  return libraryViewOptions.some((option) => option.value === value);
}

/*
 * Paginação da biblioteca (`?page=`). 48 fecha linhas inteiras na grade de
 * capas (2, 4 e 6 colunas); na estante, a última prateleira pode ficar
 * incompleta, porque a largura das lombadas varia.
 */
export const LIBRARY_PAGE_SIZE = 48;

/* Página da URL como inteiro ≥ 1; qualquer outra coisa vira 1. */
export function parsePageParam(value: unknown): number {
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return 1;
  }

  const page = Number(value);

  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

export type LibraryParams = {
  q?: string;
  status?: string;
  sort?: string;
  view?: string;
  page?: number;
};

/*
 * Monta o link da biblioteca mantendo os filtros. Página 1 fica fora da
 * URL. Visualização e ordem vão sempre que informadas: sem elas, a estante
 * usa a última escolha salva na conta, que pode não ser a padrão.
 */
export function buildLibraryHref(params: LibraryParams) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  if (params.view) search.set("view", params.view);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const query = search.toString();

  return query ? `/library?${query}` : "/library";
}
