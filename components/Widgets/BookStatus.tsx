import { prisma } from "@/lib/prisma";
import { statusColor, statusLabel, statusOptions } from "@/app/(main)/library/types";
import type { ReadingStatus } from "@/generated/prisma/enums";

/* Cor do trecho de cada status na barra (fundo / texto). */
const barColor: Record<ReadingStatus, string> = {
  READING: "bg-interaction text-darkest",
  READ: "bg-secondary text-contrast",
  WANT_TO_READ: "bg-interaction-contrast text-contrast",
  ABANDONED: "bg-danger text-primary",
};

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

  const stats = statusOptions.map((status) => ({
    status,
    count: countByStatus(status),
  }));

  return (
    <section aria-label="Livros por status" className="flex flex-col gap-4 bg-primary p-5">
      {total > 0 ? (
        <div className="flex h-10 w-full" aria-hidden="true">
          {stats
            .filter((stat) => stat.count > 0)
            .map((stat) => (
              <div
                key={stat.status}
                style={{ flexGrow: stat.count }}
                className={`flex min-w-0 basis-0 items-center overflow-hidden whitespace-nowrap px-3 font-display text-lg font-bold uppercase tracking-wide ${barColor[stat.status]}`}
              >
                {stat.count / total > 0.12 ? `${statusLabel[stat.status]} ` : ""}
                {stat.count}
              </div>
            ))}
        </div>
      ) : (
        <div className="h-10 w-full border border-dashed border-contrast/20" />
      )}

      <dl className="flex flex-wrap gap-x-8 gap-y-3 tabular-nums">
        <div className="flex items-baseline gap-2">
          <dt className="order-2 text-xs text-contrast/55">na estante</dt>
          <dd className="title-shelf text-3xl">{total}</dd>
        </div>

        {stats.map((stat) => (
          <div key={stat.status} className="flex items-baseline gap-2">
            <dt className="order-2 flex items-center gap-1.5 text-xs text-contrast/55">
              <span
                aria-hidden="true"
                className={`size-1.5 rounded-full ${statusColor[stat.status]}`}
              />
              {statusLabel[stat.status]}
            </dt>
            <dd className="title-shelf text-3xl">{stat.count}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
