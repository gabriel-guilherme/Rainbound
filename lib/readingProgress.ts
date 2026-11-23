import { prisma } from "@/lib/prisma";

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
