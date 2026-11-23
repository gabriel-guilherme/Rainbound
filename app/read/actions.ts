"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  bookmarkSelect,
  isBookmarkId,
  parseBookmarkName,
  parseReadingProgress,
  saveReadingProgress,
  setReadingProgress,
} from "@/lib/readingProgress";

type ProgressData = {
  currentPosition: number;
  totalPositions: number;
  percentage: number;
  locator?: string | null;
};

function parseOrThrow(bookId: number, data: ProgressData) {
  const parsed = parseReadingProgress(bookId, data);

  if (!parsed) {
    throw new Error("Progresso de leitura inválido.");
  }

  return parsed;
}

/* Marcadores apontam para um lugar: sem locator não há para onde ir. */
function parsePositionOrThrow(bookId: number, data: ProgressData) {
  const parsed = parseOrThrow(bookId, data);
  const { locator } = parsed.progress;

  if (!locator) {
    throw new Error("Posição do marcador inválida.");
  }

  return { ...parsed, progress: { ...parsed.progress, locator } };
}

/* Salvamento automático do leitor: só avança (ver saveReadingProgress). */
export async function saveBookProgress(bookId: number, data: ProgressData) {
  const parsed = parseOrThrow(bookId, data);

  return saveReadingProgress(parsed.bookId, parsed.progress);
}

/*
 * "Salvar aqui" no marcador padrão: grava a posição atual mesmo que seja
 * anterior à salva.
 */
export async function setBookProgress(bookId: number, data: ProgressData) {
  const parsed = parseOrThrow(bookId, data);

  await setReadingProgress(parsed.bookId, parsed.progress);

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath(`/library/${parsed.bookId}`);
}

export async function createBookmark(
  bookId: number,
  name: string,
  data: ProgressData,
) {
  const parsedName = parseBookmarkName(name);

  if (!parsedName) {
    throw new Error("Nome do marcador inválido.");
  }

  const parsed = parsePositionOrThrow(bookId, data);

  const bookmark = await prisma.bookmark.create({
    data: { bookId: parsed.bookId, name: parsedName, ...parsed.progress },
    select: bookmarkSelect,
  });

  revalidatePath(`/read/${parsed.bookId}`);

  return bookmark;
}

/* Move o marcador para a posição atual. */
export async function moveBookmark(
  bookId: number,
  bookmarkId: number,
  data: ProgressData,
) {
  if (!isBookmarkId(bookmarkId)) {
    throw new Error("Marcador inválido.");
  }

  const parsed = parsePositionOrThrow(bookId, data);

  /* `bookId` no filtro: o marcador precisa ser deste livro. */
  const bookmark = await prisma.bookmark.update({
    where: { id: bookmarkId, bookId: parsed.bookId },
    data: parsed.progress,
    select: bookmarkSelect,
  });

  revalidatePath(`/read/${parsed.bookId}`);

  return bookmark;
}

export async function deleteBookmark(bookId: number, bookmarkId: number) {
  if (!isBookmarkId(bookmarkId) || !isBookmarkId(bookId)) {
    throw new Error("Marcador inválido.");
  }

  await prisma.bookmark.deleteMany({ where: { id: bookmarkId, bookId } });

  revalidatePath(`/read/${bookId}`);
}
