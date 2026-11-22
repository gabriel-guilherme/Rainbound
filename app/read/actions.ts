"use server";

import { parseReadingProgress, saveReadingProgress } from "@/lib/readingProgress";

export async function saveBookProgress(
  bookId: number,
  data: {
    currentPosition: number;
    totalPositions: number;
    percentage: number;
    locator?: string | null;
  },
) {
  const parsed = parseReadingProgress(bookId, data);

  if (!parsed) {
    throw new Error("Progresso de leitura inválido.");
  }

  await saveReadingProgress(parsed.bookId, parsed.progress);
}
