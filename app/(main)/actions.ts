"use server";

import cloudinary from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
}
