"use server";

import { prisma } from "@/lib/prisma";

export async function saveBookProgress(
  bookId: number,
  data: {
    currentPosition: number;
    totalPositions: number;
    percentage: number;
    locator?: string | null;
  },
) {
  await prisma.readingProgress.upsert({
    where: {
      bookId,
    },

    create: {
      bookId,
      currentPosition: data.currentPosition,
      totalPositions: data.totalPositions,
      percentage: data.percentage,
      locator: data.locator ?? null,
    },

    update: {
      currentPosition: data.currentPosition,
      totalPositions: data.totalPositions,
      percentage: data.percentage,
      locator: data.locator ?? null,
    },
  });
}
