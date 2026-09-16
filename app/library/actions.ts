"use server";

import { prisma } from "@/lib/prisma";
import { ReadingStatus } from "@/generated/prisma/enums";
import { uploadBookCover, uploadBookFile } from "@/lib/upload";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createBook(formData: FormData) {
  const title = formData.get("title") as string;
  const author = formData.get("author") as string;

  const totalPagesRaw = formData.get("totalPages") as string;

  const statusRaw = formData.get("status");

  const status = Object.values(ReadingStatus).includes(
    statusRaw as ReadingStatus,
  )
    ? (statusRaw as ReadingStatus)
    : ReadingStatus.WANT_TO_READ;

  const ratingRaw = formData.get("rating") as string;
  const currentPageRaw = formData.get("currentPage") as string;

  const category = formData.get("category") as string;
  const notes = formData.get("notes") as string;

  const coverUrlFromOpenLibrary = formData.get("coverUrl") as string;

  //InputBookFile
  const bookFile = formData.get("bookFile");

  // InputBookCover
  const cover = formData.get("cover");

  if (!title || !author) {
    throw new Error("Título e autor são obrigatórios");
  }

  let coverUrl: string | null = coverUrlFromOpenLibrary || null;
  let coverPublicId: string | null = null;

  // Prioridade Local
  if (cover instanceof File && cover.size > 0) {
    const uploadedCover = await uploadBookCover(cover);

    coverUrl = uploadedCover.url;
    coverPublicId = uploadedCover.publicId;
  }

  const book = await prisma.book.create({
    data: {
      title,
      author,
      totalPages: totalPagesRaw ? Number(totalPagesRaw) : undefined,
      status,
      rating: ratingRaw ? Number(ratingRaw) : 0,
      currentPage: currentPageRaw ? Number(currentPageRaw) : 0,
      category: category || null,
      notes: notes || null,

      coverUrl,
      coverPublicId,
    },
  });

  if (bookFile instanceof File && bookFile.size > 0) {
    const uploadedFile = await uploadBookFile(bookFile, book.id);

    await prisma.book.update({
      where: {
        id: book.id,
      },
      data: {
        filePath: uploadedFile.filePath,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/library");
  redirect("/library");
}
