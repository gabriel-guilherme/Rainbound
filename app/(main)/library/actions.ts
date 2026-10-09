"use server";

import { prisma } from "@/lib/prisma";
import {
  ContentType,
  FileFormat,
  ReadingStatus,
} from "@/generated/prisma/enums";
import { uploadBookCover, uploadBookFile } from "@/lib/upload";
import { getFileFormat } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBook(formData: FormData) {
  const title = formData.get("title") as string;
  const creator = formData.get("creator") as string;

  const typeRaw = formData.get("type");
  const statusRaw = formData.get("status");

  const ratingRaw = formData.get("rating") as string;
  const notes = formData.get("notes") as string;

  const coverUrlFromOpenLibrary = formData.get("coverUrl") as string;

  const bookFile = formData.get("bookFile");
  const cover = formData.get("cover");

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
   * O formato será determinado pelo arquivo.
   */
  if (!(bookFile instanceof File) || bookFile.size === 0) {
    throw new Error("Arquivo do livro é obrigatório");
  }

  const format = getFileFormat(bookFile);

  let coverUrl: string | null = coverUrlFromOpenLibrary || null;

  let coverPublicId: string | null = null;

  /*
   * Upload da capa.
   */
  if (cover instanceof File && cover.size > 0) {
    const uploadedCover = await uploadBookCover(cover);

    coverUrl = uploadedCover.url;
    coverPublicId = uploadedCover.publicId;
  }

  /*
   * Cria o livro já com o formato real.
   */
  const book = await prisma.book.create({
    data: {
      title,
      creator,

      type,
      format,

      status,

      rating: ratingRaw ? Number(ratingRaw) : null,

      notes: notes || null,

      coverUrl,
      coverPublicId,

      progress: {
        create: {},
      },
    },
  });

  /*
   * Upload do arquivo.
   */
  const uploadedFile = await uploadBookFile(bookFile, book.id);

  await prisma.book.update({
    where: {
      id: book.id,
    },
    data: {
      filePath: uploadedFile.filePath,
    },
  });

  revalidatePath("/");
  revalidatePath("/library");

  redirect("/library");
}
