import type {
  ContentType,
  FileFormat,
  ReadingStatus,
} from "@/generated/prisma/enums";

/*
 * Aparência das lombadas na estante.
 *
 * Não há campos no banco para cor ou número de páginas: a cor sai de um
 * hash estável (o mesmo livro tem sempre a mesma cor) e a largura vem do
 * total de posições salvo pelo leitor. Sem esse total, a largura também
 * sai do hash.
 */

/* Dados mínimos de um livro para desenhar a lombada e o painel da estante. */
export type SpineBook = {
  id: number;
  title: string;
  creator: string | null;
  type: ContentType;
  format: FileFormat;
  status: ReadingStatus;
  coverUrl: string | null;
  hasFile: boolean;
  percentage: number;
  currentPosition: number;
  totalPositions: number | null;
};

export type SpineLook = {
  background: string;
  foreground: string;
  accent: string;
  width: number;
  height: number;
  fontSize: number;
  pages: number | null;
};

/*
 * Cores da paleta usadas nas lombadas (sem `darkest`, que some no fundo).
 * `accent` é a cor da fita e da linha de progresso.
 */
const SPINE_COLORS = [
  { background: "var(--color-secondary)", foreground: "var(--color-contrast)" },
  { background: "var(--color-primary)", foreground: "var(--color-contrast)" },
  { background: "var(--color-contrast)", foreground: "var(--color-primary)" },
  {
    background: "var(--color-interaction-contrast)",
    foreground: "var(--color-contrast)",
  },
  { background: "var(--color-interaction)", foreground: "var(--color-darkest)" },
  { background: "var(--color-danger)", foreground: "var(--color-primary)" },
] as const;

/*
 * Posições do EPUB (locations do epub-ts) são trechos menores que uma
 * página impressa; o fator aproxima para páginas.
 */
const EPUB_POSITIONS_PER_PAGE = 1.5;

function hashString(value: string) {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/* Número aproximado de páginas, ou null se o livro nunca foi aberto. */
export function estimatePages(
  format: FileFormat,
  totalPositions: number | null,
): number | null {
  if (!totalPositions) {
    return null;
  }

  return format === "EPUB"
    ? Math.round(totalPositions / EPUB_POSITIONS_PER_PAGE)
    : totalPositions;
}

/*
 * `seed` identifica o livro (ex.: `book-12`); num rascunho sem id, use o
 * título para a prévia mudar enquanto a pessoa digita.
 */
export function getSpineLook(
  seed: string,
  type: ContentType,
  pages: number | null,
): SpineLook {
  const hash = hashString(seed);
  const color = SPINE_COLORS[hash % SPINE_COLORS.length];
  const fallbackPages = 180 + (hash % 280);
  const width = clamp(Math.round(20 + (pages ?? fallbackPages) / 13), 28, 66);

  /*
   * Quadrinhos e mangás são mais altos que livros. Máximo de 232px, abaixo
   * da altura da prateleira (--slot em .bookcase).
   */
  const height = (type === "BOOK" ? 172 : 196) + ((hash >> 3) % 5) * 9;

  return {
    ...color,
    accent:
      color.background === "var(--color-danger)"
        ? "var(--color-primary)"
        : "var(--color-danger)",
    width,
    height,
    fontSize: width < 34 ? 14 : width < 44 ? 16 : 18,
    pages,
  };
}

export function getSpineLookForBook(book: SpineBook) {
  return getSpineLook(
    `book-${book.id}`,
    book.type,
    estimatePages(book.format, book.totalPositions),
  );
}

/* Sobrenome para o pé da lombada ("Machado de Assis" → "Assis"). */
export function getLastName(creator: string | null) {
  if (!creator) {
    return "";
  }

  const parts = creator.trim().split(/\s+/);

  return parts[parts.length - 1] ?? "";
}

/* Converte um livro com progresso do Prisma para o formato da estante. */
export function toSpineBook(book: {
  id: number;
  title: string;
  creator: string | null;
  type: ContentType;
  format: FileFormat;
  status: ReadingStatus;
  coverUrl: string | null;
  filePath: string | null;
  progress: {
    percentage: number;
    currentPosition: number;
    totalPositions: number | null;
  } | null;
}): SpineBook {
  return {
    id: book.id,
    title: book.title,
    creator: book.creator,
    type: book.type,
    format: book.format,
    status: book.status,
    coverUrl: book.coverUrl,
    hasFile: Boolean(book.filePath),
    percentage: book.status === "READ" ? 100 : (book.progress?.percentage ?? 0),
    currentPosition: book.progress?.currentPosition ?? 0,
    totalPositions: book.progress?.totalPositions ?? null,
  };
}
