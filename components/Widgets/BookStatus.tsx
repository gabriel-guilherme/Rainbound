import { prisma } from "@/lib/prisma";
import type { ReadingStatus } from "@/generated/prisma/enums";

export default async function BookStatus() {
  /*
   * Uma única consulta agrupada por status, em vez de um count por status.
   */
  const groups = await prisma.book.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  const countByStatus = (status: ReadingStatus) =>
    groups.find((group) => group.status === status)?._count._all ?? 0;

  const total = groups.reduce((sum, group) => sum + group._count._all, 0);
  const reading = countByStatus("READING");
  const read = countByStatus("READ");
  const wantToRead = countByStatus("WANT_TO_READ");

  const stats = [
    { label: "Total de livros", value: total },
    { label: "Lendo agora", value: reading },
    { label: "Já lidos", value: read },
    { label: "Quero ler", value: wantToRead },
  ];
  return (
    <div className="mb-10 grid w-full grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-2xl bg-contrast p-6 text-center shadow-md shadow-black/50 sm:p-7"
        >
          <p className="font-display text-4xl font-semibold text-primary">{stat.value}</p>
          <p className="mt-1 text-xs text-primary/60">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
