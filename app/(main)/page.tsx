import Collection from "@/components/Home/Collection";
import Hero from "@/components/Home/Hero";
import Thoughts from "@/components/Home/Thoughts";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const thoughts = await prisma.$queryRaw<
    {
      title: string;
      note: string;
    }[]
  >`
    SELECT title, notes AS note
    FROM "Book"
    WHERE notes IS NOT NULL
      AND TRIM(notes) <> ''
    ORDER BY RANDOM()
    LIMIT 4
  `;

  const [books, continueReading] = await Promise.all([
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),

    prisma.book.findFirst({
      where: {
        status: "READING",
        filePath: { not: null },
      },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true },
    }),
  ]);

  return (
    <div className="w-full">
      <Hero continueReading={continueReading} />

      <Thoughts books={thoughts} />

      <Collection books={books} />
    </div>
  );
}
