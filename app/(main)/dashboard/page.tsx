import { prisma } from "@/lib/prisma";
import { toSpineBook } from "@/lib/spine";

import BookStatus from "@/components/Widgets/BookStatus";
import Reading from "@/components/Widgets/Reading";
import RecentlyAdded from "@/components/Widgets/RecentlyAdded";

const todayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DashBoardPage() {
  const [recentlyAdded, currentlyReading] = await Promise.all([
    prisma.book.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        creator: true,
        type: true,
        coverUrl: true,
        createdAt: true,
      },
    }),

    prisma.book.findMany({
      where: {
        status: "READING",
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      include: {
        progress: true,
      },
    }),
  ]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-10 pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">Início</h1>

        <p className="text-sm text-contrast/50 first-letter:uppercase">
          {todayFormatter.format(new Date())}
        </p>
      </div>

      <BookStatus />

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Reading currentlyReading={currentlyReading.map(toSpineBook)} />
        <RecentlyAdded recentlyAdded={recentlyAdded} />
      </div>
    </div>
  );
}
