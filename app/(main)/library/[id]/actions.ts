"use server";

import { ReadingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { uploadBookCover, uploadBookFile } from "@/lib/upload";
import cloudinary from "@/lib/cloudinary";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateBook(formData: FormData) {
  const id = Number(formData.get("id"));

  const title = formData.get("title") as string;
  const author = formData.get("author") as string;

  const statusRaw = formData.get("status");
  const ratingRaw = formData.get("rating") as string;
  const currentPageRaw = formData.get("currentPage") as string;
  const category = formData.get("category") as string;
  const notes = formData.get("notes") as string;

  const bookFile = formData.get("bookFile");

  const cover = formData.get("cover");

  const status = Object.values(ReadingStatus).includes(
    statusRaw as ReadingStatus,
  )
    ? (statusRaw as ReadingStatus)
    : ReadingStatus.WANT_TO_READ;

  const current = await prisma.book.findUniqueOrThrow({
    where: { id },
  });

  const data: Parameters<typeof prisma.book.update>[0]["data"] = {
    title,
    author,
    status,
    currentPage: currentPageRaw ? Number(currentPageRaw) : 0,
    notes: notes || null,
    rating: ratingRaw ? Number(ratingRaw) : null,
    category: category || null,
    //filePath: bookFile || null,
  };

  // Upload da nova capa
  if (cover instanceof File && cover.size > 0) {
    const uploadedCover = await uploadBookCover(cover);

    data.coverUrl = uploadedCover.url;
    data.coverPublicId = uploadedCover.publicId;

    if (current.coverPublicId) {
      await cloudinary.uploader.destroy(current.coverPublicId);
    }
  }

  if (bookFile instanceof File && bookFile.size > 0) {
    const uploadedFile = await uploadBookFile(bookFile, id);

    await prisma.book.update({
      where: {
        id: id,
      },
      data: {
        filePath: uploadedFile.filePath,
      },
    });
  }

  // Controle das datas de leitura
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
    where: { id },
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
