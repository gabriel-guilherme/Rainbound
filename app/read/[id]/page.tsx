import Reader from "@/components/Reader/Reader";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import { bookmarkSelect } from "@/lib/readingProgress";
import { getBookFileUrl, parseBookId } from "@/lib/utils";

export default async function Read({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = parseBookId((await params).id);

  if (id === null) {
    notFound();
  }

  const book = await prisma.book.findUnique({
    where: {
      id,
    },
    include: {
      progress: true,
      bookmarks: {
        select: bookmarkSelect,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!book || !book.filePath) {
    notFound();
  }

  const url = await getBookFileUrl(book.filePath);

  return (
    <div className="min-h-dvh w-full bg-darkest text-contrast">
      <Reader
        bookId={book.id}
        bookUrl={url}
        title={book.title}
        format={book.format}
        locator={book.progress?.locator}
        savedProgress={
          book.progress
            ? {
                currentPosition: book.progress.currentPosition,
                totalPositions: book.progress.totalPositions ?? 0,
                percentage: book.progress.percentage,
                locator: book.progress.locator ?? "",
              }
            : null
        }
        bookmarks={book.bookmarks}
      />
    </div>
  );
}
