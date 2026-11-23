"use server";

import { ContentType, ReadingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getApprovedUserId } from "@/lib/session";
import {
  cleanupStorage,
  deleteBookCover,
  deleteBookFile,
  uploadBookCover,
  verifyUploadedBookFile,
} from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/* Livro do usuário atual; de outra pessoa (ou inexistente) é erro. */
async function findOwnBook(id: number, userId: string) {
  const book = Number.isInteger(id)
    ? await prisma.book.findFirst({ where: { id, userId } })
    : null;

  if (!book) {
    throw new Error("Livro não encontrado.");
  }

  return book;
}

export async function updateBook(formData: FormData) {
  const userId = await getApprovedUserId();
  const id = Number(formData.get("id"));

  const title = formData.get("title") as string;
  const creator = formData.get("creator") as string;

  const typeRaw = formData.get("type");
  const statusRaw = formData.get("status");

  const ratingRaw = formData.get("rating") as string;
  const notes = formData.get("notes") as string;

  const filePathRaw = formData.get("filePath");
  const cover = formData.get("cover");

  const status = Object.values(ReadingStatus).includes(
    statusRaw as ReadingStatus,
  )
    ? (statusRaw as ReadingStatus)
    : ReadingStatus.WANT_TO_READ;

  const type = Object.values(ContentType).includes(typeRaw as ContentType)
    ? (typeRaw as ContentType)
    : null;

  const current = await findOwnBook(id, userId);

  const data: Parameters<typeof prisma.book.update>[0]["data"] = {
    title,
    creator,

    status,

    type: type ?? current.type,

    /*
     * Por padrão mantém o formato atual.
     */
    format: current.format,

    notes: notes || null,

    rating: ratingRaw ? Number(ratingRaw) : null,
  };

  /*
   * ==========================================
   * NOVA CAPA
   * ==========================================
   */

  if (cover instanceof File && cover.size > 0) {
    const uploadedCover = await uploadBookCover(cover);

    data.coverUrl = uploadedCover.url;
    data.coverPublicId = uploadedCover.publicId;
  }

  /*
   * ==========================================
   * NOVO ARQUIVO
   * ==========================================
   */

  /*
   * O novo arquivo já foi enviado pelo navegador direto ao storage
   * (caminho novo e único). O formato muda de acordo com o arquivo.
   */
  if (typeof filePathRaw === "string" && filePathRaw) {
    try {
      const uploadedFile = await verifyUploadedBookFile(filePathRaw, userId);

      data.filePath = uploadedFile.filePath;
      data.format = uploadedFile.format;
    } catch (error) {
      const newCoverPublicId = data.coverPublicId;

      if (typeof newCoverPublicId === "string") {
        await cleanupStorage([deleteBookCover(newCoverPublicId)]);
      }

      throw error;
    }
  }

  /*
   * ==========================================
   * DATAS DE LEITURA
   * ==========================================
   */

  if (
    status === ReadingStatus.READING &&
    current.status !== ReadingStatus.READING &&
    !current.startedAt
  ) {
    data.startedAt = new Date();
  }

  if (status === ReadingStatus.READ && current.status !== ReadingStatus.READ) {
    data.finishedAt = new Date();
  }

  try {
    await prisma.book.update({
      where: {
        id,
      },
      data,
    });
  } catch (error) {
    /*
     * O banco não foi atualizado: remove a capa e o arquivo novos.
     */
    const newCoverPublicId = data.coverPublicId;
    const newFilePath = data.filePath;

    await cleanupStorage([
      ...(typeof newCoverPublicId === "string"
        ? [deleteBookCover(newCoverPublicId)]
        : []),
      ...(typeof newFilePath === "string" ? [deleteBookFile(newFilePath)] : []),
    ]);

    throw error;
  }

  /*
   * Só depois de o banco apontar para os novos arquivos,
   * remove os antigos que foram substituídos.
   */
  const replacedFiles: Array<Promise<unknown>> = [];

  if (data.coverPublicId && current.coverPublicId) {
    replacedFiles.push(deleteBookCover(current.coverPublicId));
  }

  if (
    typeof data.filePath === "string" &&
    current.filePath &&
    current.filePath !== data.filePath
  ) {
    replacedFiles.push(deleteBookFile(current.filePath));
  }

  await cleanupStorage(replacedFiles);

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath(`/library/${id}`);
}

async function removeBook(formData: FormData) {
  const userId = await getApprovedUserId();
  const id = Number(formData.get("id"));

  const book = await findOwnBook(id, userId);

  await prisma.book.delete({ where: { id: book.id } });

  /*
   * O registro já foi removido; falhas ao limpar o storage
   * não devem impedir a exclusão.
   */
  await cleanupStorage([
    ...(book.coverPublicId ? [deleteBookCover(book.coverPublicId)] : []),
    ...(book.filePath ? [deleteBookFile(book.filePath)] : []),
  ]);

  revalidatePath("/");
  revalidatePath("/library");
}

/*
 * Exclui o livro e permanece na página atual (ex.: menu do card).
 */
export async function deleteBook(formData: FormData) {
  await removeBook(formData);
}

/*
 * Exclui o livro e volta para a biblioteca (ex.: página de detalhe).
 */
export async function deleteBookAndRedirect(formData: FormData) {
  await removeBook(formData);

  redirect("/library");
}
