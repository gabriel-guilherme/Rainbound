import { ContentType, ReadingStatus } from "@/generated/prisma/enums";

/*
 * Rótulos e campos do livro: capa padrão, status, tipo, número de páginas
 * e abas da página do livro. Tipados pelos enums do Prisma: se um status
 * ou tipo novo for criado no schema, o TypeScript acusa o que falta.
 * A listagem da estante (ordenação, visualização, paginação) fica em
 * library.ts.
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
