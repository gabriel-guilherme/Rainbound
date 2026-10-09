import Reader from "@/components/Reader/Reader";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import { getBookFileUrl } from "@/lib/utils";

export default async function Read({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const book = await prisma.book.findUnique({
    where: {
      id: Number(id),
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
        format={book.format}
        locator={book.progress?.locator}
      />
    </div>
  );
}
