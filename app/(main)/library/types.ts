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
export const statusColor: Record<ReadingStatus, string> = {
  WANT_TO_READ: "bg-contrast/60",
  READING: "bg-interaction",
  READ: "bg-[#a8c4a0]",
  ABANDONED: "bg-danger",
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
