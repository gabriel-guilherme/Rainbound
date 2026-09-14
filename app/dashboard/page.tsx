import BookStatus from "@/components/Widgets/BookStatus";
import Reading from "@/components/Widgets/Reading";
import RecentlyAdded from "@/components/Widgets/RecentlyAdded";

export default async function DashBoardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pt-32">
      <h1 className="mb-10 text-2xl font-bold text-contrast">Dashboard</h1>

      {/* Grid de estatísticas */}
      <BookStatus />

      <div className="grid gap-8 sm:grid-cols-2">
        <Reading />

        {/* Adicionados recentemente */}
        <RecentlyAdded />
      </div>
    </div>
  );
}
