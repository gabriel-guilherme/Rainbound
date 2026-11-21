"use server";

import { prisma } from "@/lib/prisma";
import { ContentType, ReadingStatus } from "@/generated/prisma/enums";
import {
  cleanupStorage,
  createBookUploadUrl,
  deleteBookCover,
  deleteBookFile,
  uploadBookCover,
  verifyUploadedBookFile,
} from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/*
 * Gera a URL assinada para o navegador enviar o arquivo do livro
 * direto ao Supabase Storage.
 */
export async function requestBookUpload(fileName: string, size: number) {
  return createBookUploadUrl(String(fileName), Number(size));
}

export async function createBook(formData: FormData) {
  const title = formData.get("title") as string;
  const creator = formData.get("creator") as string;

  const typeRaw = formData.get("type");
  const statusRaw = formData.get("status");

  const ratingRaw = formData.get("rating") as string;
  const notes = formData.get("notes") as string;

  const coverUrlFromOpenLibrary = formData.get("coverUrl") as string;

  const filePathRaw = formData.get("filePath");
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
   * O arquivo já foi enviado pelo navegador; aqui só conferimos que ele
   * existe no bucket. O formato vem da extensão do arquivo.
   */
  if (typeof filePathRaw !== "string" || !filePathRaw) {
    throw new Error("Arquivo do livro é obrigatório");
  }

  const { filePath, format } = await verifyUploadedBookFile(filePathRaw);

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
        title,
        creator,

        type,
        format,

        status,

        rating: ratingRaw ? Number(ratingRaw) : null,

        notes: notes || null,

        filePath,

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
      deleteBookFile(filePath),
      ...(uploadedCoverPublicId ? [deleteBookCover(uploadedCoverPublicId)] : []),
    ]);

    throw error;
  }

  revalidatePath("/");
  revalidatePath("/library");

  redirect("/library");
}
