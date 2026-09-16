import Reader from "@/components/Reader/Reader";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import { getBookFileUrl } from "@/lib/upload";

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
    <div className="relative flex h-screen w-full flex-col bg-darkest text-contrast">
      <Reader
        bookId={book.id}
        bookUrl={url}
        format={book.format}
        initialCfi={book.progress?.locator}
      />
    </div>
  );
}
