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

  const books = await prisma.book.findMany({
    take: 3,
  });

  return (
    <div className="w-full">
      <Hero />

      <Thoughts books={thoughts} />

      <Collection books={books} />
    </div>
  );
}
