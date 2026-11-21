import Reader from "@/components/Reader/Reader";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

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
      />
    </div>
  );
}
