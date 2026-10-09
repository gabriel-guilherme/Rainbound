"use server";

import { ContentType, ReadingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { uploadBookCover, uploadBookFile } from "@/lib/upload";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getFileFormat } from "@/lib/utils";

export async function updateBook(formData: FormData) {
  const id = Number(formData.get("id"));

  const title = formData.get("title") as string;
  const creator = formData.get("creator") as string;

  const typeRaw = formData.get("type");
  const statusRaw = formData.get("status");

  const ratingRaw = formData.get("rating") as string;
  const notes = formData.get("notes") as string;

  const bookFile = formData.get("bookFile");
  const cover = formData.get("cover");

  const status = Object.values(ReadingStatus).includes(
    statusRaw as ReadingStatus,
  )
    ? (statusRaw as ReadingStatus)
    : ReadingStatus.WANT_TO_READ;

  const type = Object.values(ContentType).includes(typeRaw as ContentType)
    ? (typeRaw as ContentType)
    : null;

  const current = await prisma.book.findUniqueOrThrow({
    where: {
      id,
    },
  });

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

    if (current.coverPublicId) {
      await cloudinary.uploader.destroy(current.coverPublicId);
    }
  }

  /*
   * ==========================================
   * NOVO ARQUIVO
   * ==========================================
   */

  if (bookFile instanceof File && bookFile.size > 0) {
    /*
     * O formato muda automaticamente
     * de acordo com o novo arquivo.
     */
    data.format = getFileFormat(bookFile);

    const uploadedFile = await uploadBookFile(bookFile, id);

    data.filePath = uploadedFile.filePath;
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

  await prisma.book.update({
    where: {
      id,
    },
    data,
  });

  revalidatePath("/");
  revalidatePath("/library");
  revalidatePath(`/library/${id}`);
}

export async function deleteBook(formData: FormData) {
  const id = Number(formData.get("id"));

  const book = await prisma.book.findUniqueOrThrow({
    where: { id },
  });

  if (book.coverPublicId) {
    await cloudinary.uploader.destroy(book.coverPublicId);
  }

  await prisma.book.delete({
    where: { id },
  });

  revalidatePath("/");
  revalidatePath("/library");

  redirect("/library");
}
