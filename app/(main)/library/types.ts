import type { Prisma } from "@/generated/prisma/client";
import { ContentType, ReadingStatus } from "@/generated/prisma/enums";

/*
 * Rótulos e opções da biblioteca. Tipados pelos enums do Prisma: se um
 * status ou tipo novo for criado no schema, o TypeScript acusa o que falta.
 */

/* Capa usada quando o livro não tem imagem própria. */
export const DEFAULT_COVER = "/default-cover.jpg";

export const statusLabel: Record<ReadingStatus, string> = {
  WANT_TO_READ: "Quero ler",
  READING: "Lendo",
  READ: "Lido",
  ABANDONED: "Abandonado",
};

/*
 * Cor do marcador de status (bolinha) no selo sobre a capa.
 */
/* Cores em app/globals.css (--color-status-*), as mesmas das fitas das lombadas. */
export const statusColor: Record<ReadingStatus, string> = {
  WANT_TO_READ: "bg-status-want",
  READING: "bg-status-reading",
  READ: "bg-status-read",
  ABANDONED: "bg-status-abandoned",
};

export const statusOptions = Object.values(ReadingStatus);

export function isReadingStatus(value: unknown): value is ReadingStatus {
  return statusOptions.includes(value as ReadingStatus);
}

export const typeLabel: Record<ContentType, string> = {
  BOOK: "Livro",
  COMIC: "Quadrinho",
  MANGA: "Mangá",
};

export const typeOptions = Object.values(ContentType).map((value) => ({
  value,
  label: typeLabel[value],
}));

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
 * Visualizações da biblioteca (`?view=`). Lombadas é o padrão.
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
 * Monta o link da biblioteca mantendo os filtros. Valores padrão
 * (lombadas, página 1) ficam fora da URL.
 */
export function buildLibraryHref(params: LibraryParams) {
  const search = new URLSearchParams();

  if (params.q) search.set("q", params.q);
  if (params.status) search.set("status", params.status);
  if (params.sort) search.set("sort", params.sort);
  if (params.view && params.view !== "spines") search.set("view", params.view);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const query = search.toString();

  return query ? `/library?${query}` : "/library";
}

/*
 * Número de páginas da edição (registro manual de leitura). Vazio ou
 * inválido vira null; o limite só barra valores absurdos.
 */
export const MAX_PAGE_COUNT = 100_000;

export function parsePageCount(value: unknown): number | null {
  const count = typeof value === "string" ? Number(value) : value;

  return Number.isInteger(count) &&
    (count as number) >= 1 &&
    (count as number) <= MAX_PAGE_COUNT
    ? (count as number)
    : null;
}

/*
 * Abas da página do livro (EditBookForm). `param` é o valor de `?aba=`
 * na URL (ex.: /library/12?aba=notas); a página, no servidor, lê o
 * parâmetro com bookTabFromParam.
 */
export const BOOK_TABS = [
  { id: "reading", label: "Leitura", param: "leitura" },
  { id: "details", label: "Detalhes", param: "detalhes" },
  { id: "notes", label: "Notas", param: "notas" },
] as const;

export type BookTabId = (typeof BOOK_TABS)[number]["id"];

/* Aba de `?aba=`; valor ausente ou desconhecido abre a Leitura. */
export function bookTabFromParam(param: string | string[] | undefined): BookTabId {
  return BOOK_TABS.find((item) => item.param === param)?.id ?? "reading";
}
