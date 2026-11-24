"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import {
  bookmarkSelect,
  isBookmarkId,
  isOwnBook,
  parseBookmarkName,
  parseReadingProgress,
  saveReadingProgress,
  setReadingProgress,
  updateStatusFromProgress,
} from "@/lib/readingProgress";
import { getApprovedUserId } from "@/lib/session";

type ProgressData = {
  currentPosition: number;
  totalPositions: number;
  percentage: number;
  locator?: string | null;
};

/* Toda action do leitor: usuário aprovado e dono do livro. */
async function assertOwnBook(bookId: number) {
  const userId = await getApprovedUserId();

  if (!(await isOwnBook(bookId, userId))) {
    throw new Error("Livro não encontrado.");
  }
}

async function parseOrThrow(bookId: number, data: ProgressData) {
  const parsed = parseReadingProgress(bookId, data);

  if (!parsed) {
    throw new Error("Progresso de leitura inválido.");
  }

  await assertOwnBook(parsed.bookId);

  return parsed;
}

/* Marcadores apontam para um lugar: sem locator não há para onde ir. */
async function parsePositionOrThrow(bookId: number, data: ProgressData) {
  const parsed = await parseOrThrow(bookId, data);
  const { locator } = parsed.progress;

  if (!locator) {
    throw new Error("Posição do marcador inválida.");
  }

  return { ...parsed, progress: { ...parsed.progress, locator } };
}

/* Estante, home e página do livro mostram o status. */
function revalidateShelf(bookId: number) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/library");
  revalidatePath(`/library/${bookId}`);
}

/*
 * Salvamento automático do leitor: só avança (ver saveReadingProgress).
 * Quando avança, ajusta o status ("Lendo" no começo, "Lido" no fim).
 */
export async function saveBookProgress(bookId: number, data: ProgressData) {
  const parsed = await parseOrThrow(bookId, data);

  const saved = await saveReadingProgress(parsed.bookId, parsed.progress);

  if (
    saved &&
    (await updateStatusFromProgress(parsed.bookId, parsed.progress.percentage))
  ) {
    revalidateShelf(parsed.bookId);
  }

  return saved;
}

/*
 * "Salvar aqui" no marcador padrão: grava a posição atual mesmo que seja
 * anterior à salva.
 */
export async function setBookProgress(bookId: number, data: ProgressData) {
  const parsed = await parseOrThrow(bookId, data);

  await setReadingProgress(parsed.bookId, parsed.progress);
  await updateStatusFromProgress(parsed.bookId, parsed.progress.percentage);

  revalidateShelf(parsed.bookId);
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

  const parsed = await parsePositionOrThrow(bookId, data);

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

  const parsed = await parsePositionOrThrow(bookId, data);

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

  await assertOwnBook(bookId);

  await prisma.bookmark.deleteMany({ where: { id: bookmarkId, bookId } });

  revalidatePath(`/read/${bookId}`);
}
