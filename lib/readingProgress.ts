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

export async function saveReadingProgress(
  bookId: number,
  progress: ReadingProgressInput,
) {
  await prisma.readingProgress.upsert({
    where: { bookId },
    create: { bookId, ...progress },
    update: progress,
  });
}
