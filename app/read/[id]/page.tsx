import Reader from "@/components/Reader/Reader";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import { bookmarkSelect } from "@/lib/readingProgress";
import { requireApprovedUser } from "@/lib/session";
import { getBookFileUrl, parseBookId } from "@/lib/utils";

export default async function Read({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: userId } = await requireApprovedUser();
  const id = parseBookId((await params).id);

  if (id === null) {
    notFound();
  }

  /* Livro de outra pessoa responde 404, como se não existisse. */
  const book = await prisma.book.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      progress: true,
      bookmarks: {
        select: bookmarkSelect,
        orderBy: [{ currentPosition: "asc" }, { id: "asc" }],
      },
    },
  });

  /* Sem arquivo (lido fora do site): não há o que abrir no leitor. */
  if (!book || !book.filePath || !book.format) {
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
