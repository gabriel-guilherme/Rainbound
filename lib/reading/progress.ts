import { ReadingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/services/prisma";

/* Maior valor de uma coluna Int do Postgres. */
const MAX_INT = 2_147_483_647;

/* CFIs de EPUB costumam ter poucas centenas de caracteres. */
const MAX_LOCATOR_LENGTH = 2000;

export type ReadingProgressInput = {
  currentPosition: number;
  totalPositions: number;
  percentage: number;
  locator: string | null;
};

function isIntInRange(value: unknown, min: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= MAX_INT;
}

/*
 * Confere o progresso vindo do navegador (Server Action ou sendBeacon).
 * Devolve null se algum campo estiver fora do esperado.
 */
export function parseReadingProgress(
  bookId: unknown,
  data: unknown,
): { bookId: number; progress: ReadingProgressInput } | null {
  if (!isIntInRange(bookId, 1) || typeof data !== "object" || data === null) {
    return null;
  }

  const { currentPosition, totalPositions, percentage, locator } = data as Record<string, unknown>;

  if (
    !isIntInRange(currentPosition, 0) ||
    !isIntInRange(totalPositions, 0) ||
    typeof percentage !== "number" ||
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    percentage > 100
  ) {
    return null;
  }

  if (
    locator !== undefined &&
    locator !== null &&
    (typeof locator !== "string" || locator.length > MAX_LOCATOR_LENGTH)
  ) {
    return null;
  }

  return {
    bookId,
    progress: {
      currentPosition,
      totalPositions,
      percentage,
      locator: locator ?? null,
    },
  };
}

/* O livro existe e é do usuário (progresso e marcadores pertencem a ele). */
export async function isOwnBook(bookId: number, userId: string) {
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true },
  });

  return book !== null;
}

/* Erro do Prisma quando o bookId não existe (chave estrangeira). */
export function isMissingBookError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2003"
  );
}

/*
 * Salvamento automático: só avança. Voltar páginas para reler não muda
 * o progresso salvo; para isso existe `setReadingProgress` (botão
 * "Salvar aqui"). Se o total de posições mudou (arquivo trocado), as
 * posições antigas não valem mais e grava normalmente.
 *
 * Devolve true se gravou.
 */
export async function saveReadingProgress(
  bookId: number,
  progress: ReadingProgressInput,
) {
  const { count } = await prisma.readingProgress.updateMany({
    where: {
      bookId,
      OR: [
        { currentPosition: { lt: progress.currentPosition } },
        { totalPositions: null },
        { totalPositions: { not: progress.totalPositions } },
      ],
    },
    data: progress,
  });

  if (count > 0) {
    return true;
  }

  /* Nada atualizado: ou já está à frente, ou ainda não existe. */
  const existing = await prisma.readingProgress.findUnique({
    where: { bookId },
    select: { id: true },
  });

  if (existing) {
    return false;
  }

  await prisma.readingProgress.create({ data: { bookId, ...progress } });

  return true;
}

/* Grava a posição mesmo que seja anterior à salva (botão "Salvar aqui"). */
export async function setReadingProgress(
  bookId: number,
  progress: ReadingProgressInput,
) {
  await prisma.readingProgress.upsert({
    where: { bookId },
    create: { bookId, ...progress },
    update: progress,
  });
}

/// Status pela leitura

/*
 * Status que o avanço da leitura implica (leitor do site e registro
 * manual seguem a mesma regra):
 * - chegou a 100%: → "Lido" (marca o fim e, se faltava, o início);
 * - primeiro avanço: "Quero ler"/"Abandonado" → "Lendo" (marca o início).
 * Nunca volta o status: reler um livro "Lido" não o tira de "Lido".
 * Devolve null quando não há o que mudar.
 */
export function statusChangeForProgress(
  book: { status: ReadingStatus; startedAt: Date | null },
  percentage: number,
  now = new Date(),
) {
  if (percentage >= 100) {
    return book.status === ReadingStatus.READ
      ? null
      : {
          status: ReadingStatus.READ,
          startedAt: book.startedAt ?? now,
          finishedAt: now,
        };
  }

  if (
    percentage > 0 &&
    (book.status === ReadingStatus.WANT_TO_READ ||
      book.status === ReadingStatus.ABANDONED)
  ) {
    return {
      status: ReadingStatus.READING,
      startedAt: book.startedAt ?? now,
    };
  }

  return null;
}

/*
 * Ajusta o status depois de gravar um progresso do leitor do site.
 * Devolve true se mudou (quem chama revalida as páginas da estante).
 */
export async function updateStatusFromProgress(
  bookId: number,
  percentage: number,
) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { status: true, startedAt: true },
  });

  const change = book && statusChangeForProgress(book, percentage);

  if (!change) {
    return false;
  }

  await prisma.book.update({ where: { id: bookId }, data: change });

  return true;
}

/// Registro manual (livro lido fora do site)

/*
 * Página atual (com o total da edição) ou porcentagem, como a pessoa
 * informou no bloco "Registrar leitura".
 */
export type ManualProgressEntry =
  | { mode: "page"; page: number; pageCount: number }
  | { mode: "percent"; percentage: number };

/*
 * Confere o registro manual e monta o progresso a gravar. O `locator`
 * marca a origem ("manual-page:120" / "manual-percent:45"), para não ser
 * confundido com uma posição do leitor do site. Na porcentagem, a página
 * é estimada pelo total já salvo (`pageCount`), se houver.
 */
export function parseManualProgress(
  entry: unknown,
  savedPageCount: number | null,
  maxPageCount: number,
) {
  if (typeof entry !== "object" || entry === null) {
    return null;
  }

  const { mode } = entry as Record<string, unknown>;

  if (mode === "page") {
    const { page, pageCount } = entry as Record<string, unknown>;

    if (
      !Number.isInteger(pageCount) ||
      (pageCount as number) < 1 ||
      (pageCount as number) > maxPageCount ||
      !Number.isInteger(page) ||
      (page as number) < 0 ||
      (page as number) > (pageCount as number)
    ) {
      return null;
    }

    const total = pageCount as number;
    const current = page as number;

    return {
      pageCount: total,
      currentPosition: current,
      totalPositions: total,
      percentage: Math.round((current / total) * 1000) / 10,
      locator: `manual-page:${current}`,
    };
  }

  if (mode === "percent") {
    const { percentage } = entry as Record<string, unknown>;

    if (
      typeof percentage !== "number" ||
      !Number.isFinite(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      return null;
    }

    const rounded = Math.round(percentage * 10) / 10;

    return {
      pageCount: savedPageCount,
      currentPosition: savedPageCount
        ? Math.round((rounded / 100) * savedPageCount)
        : 0,
      totalPositions: savedPageCount,
      percentage: rounded,
      locator: `manual-percent:${rounded}`,
    };
  }

  return null;
}

/// Marcadores

const MAX_BOOKMARK_NAME_LENGTH = 80;

/* Nome do marcador sem espaços nas pontas, com 1 a 80 caracteres. */
export function parseBookmarkName(name: unknown) {
  if (typeof name !== "string") {
    return null;
  }

  const trimmed = name.replace(/\s+/g, " ").trim();

  return trimmed.length >= 1 && trimmed.length <= MAX_BOOKMARK_NAME_LENGTH
    ? trimmed
    : null;
}

export function isBookmarkId(value: unknown): value is number {
  return isIntInRange(value, 1);
}

/* Campos do marcador enviados ao leitor. */
export const bookmarkSelect = {
  id: true,
  name: true,
  locator: true,
  currentPosition: true,
  totalPositions: true,
  percentage: true,
} as const;
