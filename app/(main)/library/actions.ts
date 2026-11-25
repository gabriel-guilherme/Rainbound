"use server";

import { prisma } from "@/lib/services/prisma";
import { getApprovedUserId } from "@/lib/auth/session";
import { ContentType, ReadingStatus } from "@/generated/prisma/enums";
import {
  cleanupStorage,
  createBookUploadUrl,
  deleteBookCover,
  deleteBookFile,
  uploadBookCover,
  verifyUploadedBookFile,
} from "@/lib/books/upload";
import { getStorageUsage, StorageLimitError } from "@/lib/books/quota";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parsePageCount } from "./types";

/*
 * Gera a URL assinada para o navegador enviar o arquivo do livro
 * direto ao R2. `bookId`: livro cujo arquivo será trocado (edição).
 *
 * Falta de espaço volta como `{ error }`, e não como exceção: em
 * produção o Next esconde a mensagem de erros lançados em Server Actions.
 */
export async function requestBookUpload(
  fileName: string,
  size: number,
  bookId?: number,
) {
  const userId = await getApprovedUserId();

  try {
    return await createBookUploadUrl(
      userId,
      String(fileName),
      Number(size),
      Number.isInteger(bookId) ? bookId : undefined,
    );
  } catch (error) {
    if (error instanceof StorageLimitError) {
      return { error: error.message };
    }

    throw error;
  }
}

/* Espaço usado e limite (bytes), para o formulário. */
export async function getMyStorageUsage() {
  const userId = await getApprovedUserId();

  return getStorageUsage(userId);
}

export async function createBook(formData: FormData) {
  const userId = await getApprovedUserId();

  const title = formData.get("title") as string;
  const creator = formData.get("creator") as string;

  const typeRaw = formData.get("type");
  const statusRaw = formData.get("status");

  const ratingRaw = formData.get("rating") as string;
  const notes = formData.get("notes") as string;

  const coverUrlFromOpenLibrary = formData.get("coverUrl") as string;

  const filePathRaw = formData.get("filePath");
  const cover = formData.get("cover");

  const pageCount = parsePageCount(formData.get("pageCount"));

  if (!title || !creator) {
    throw new Error("Título e criador são obrigatórios");
  }

  const status = Object.values(ReadingStatus).includes(
    statusRaw as ReadingStatus,
  )
    ? (statusRaw as ReadingStatus)
    : ReadingStatus.WANT_TO_READ;

  const type = Object.values(ContentType).includes(typeRaw as ContentType)
    ? (typeRaw as ContentType)
    : ContentType.BOOK;

  /*
   * Arquivo é opcional: sem ele, o livro é lido fora do site e o
   * progresso é registrado à mão. Se veio, já foi enviado pelo navegador;
   * aqui só conferimos que ele existe no bucket. O formato vem da
   * extensão do arquivo.
   */
  const { filePath, format, fileSize } =
    typeof filePathRaw === "string" && filePathRaw
      ? await verifyUploadedBookFile(filePathRaw, userId)
      : { filePath: null, format: null, fileSize: null };

  let coverUrl: string | null = coverUrlFromOpenLibrary || null;
  let coverPublicId: string | null = null;

  /*
   * Upload da capa e criação do livro. Se algo falhar, remove o que já
   * foi enviado para não deixar arquivos órfãos no storage.
   */
  try {
    if (cover instanceof File && cover.size > 0) {
      const uploadedCover = await uploadBookCover(cover);

      coverUrl = uploadedCover.url;
      coverPublicId = uploadedCover.publicId;
    }

    await prisma.book.create({
      data: {
        userId,

        title,
        creator,

        type,
        format,
        pageCount,

        status,

        /*
         * Mesma regra da edição (updateBook): começar como "Lendo" marca
         * o início e como "Lido", o fim. Sem isso, livros criados já
         * nesses status ficavam sem data.
         */
        startedAt: status === ReadingStatus.READING ? new Date() : null,
        finishedAt: status === ReadingStatus.READ ? new Date() : null,

        rating: ratingRaw ? Number(ratingRaw) : null,

        notes: notes || null,

        filePath,
        fileSize,

        coverUrl,
        coverPublicId,

        progress: {
          create: {},
        },
      },
    });
  } catch (error) {
    const uploadedCoverPublicId = coverPublicId;

    await cleanupStorage([
      ...(filePath ? [deleteBookFile(filePath)] : []),
      ...(uploadedCoverPublicId ? [deleteBookCover(uploadedCoverPublicId)] : []),
    ]);

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/library");

  redirect("/library");
}
