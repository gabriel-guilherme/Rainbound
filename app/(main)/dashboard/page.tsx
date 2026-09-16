import { prisma } from "@/lib/prisma";
import BookStatus from "@/components/Widgets/BookStatus";
import WidgetSection from "@/components/Widgets/WidgetSection";
import Reading from "@/components/Widgets/Reading";
import RecentlyAdded from "@/components/Widgets/RecentlyAdded";

export default async function DashBoardPage() {
  const [recentlyAdded, currentlyReading] = await Promise.all([
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    prisma.book.findMany({
      where: { status: "READING" },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const sections = [
    {
      id: 0,
      content: [
        <Reading key="reading" currentlyReading={currentlyReading} />,
        <RecentlyAdded key="recently-added" recentlyAdded={recentlyAdded} />,
      ],
    },
    {
      id: 1,
      content: [
        <RecentlyAdded key="recently-added" recentlyAdded={recentlyAdded} />,
        <Reading key="reading" currentlyReading={currentlyReading} />,
      ],
    },
  ];

  const headerSections = [
    {
      id: 0,
      content: [<BookStatus key={"book-status"} />],
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pt-32">
      <h1 className="mb-10 text-2xl font-bold text-contrast">Dashboard</h1>

      <WidgetSection sections={headerSections} navStyle="top-right" />

      <WidgetSection sections={sections} />
    </div>
  );
}
