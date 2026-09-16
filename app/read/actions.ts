"use server";

import { prisma } from "@/lib/prisma";

export async function saveBookProgress(
  bookId: number,
  data: {
    currentPage: number;
    progress: number;
    cfi: string;
  },
) {
  await prisma.book.update({
    where: {
      id: bookId,
    },
    data: {
      currentPage: data.currentPage,
      currentCfi: data.cfi,
    },
  });
}
