import { prisma } from "@/lib/services/prisma";
import { requireApprovedUser } from "@/lib/auth/session";
import { statusColor, statusLabel, statusOptions } from "@/app/(main)/library/types";
import type { ReadingStatus } from "@/generated/prisma/enums";
import type { WidgetVariant } from "@/lib/dashboardLayout";

import WidgetCard from "./WidgetCard";

/* Cor do trecho de cada status na barra (fundo / texto). */
const barColor: Record<ReadingStatus, string> = {
  READING: "bg-interaction text-darkest",
  READ: "bg-secondary text-contrast",
  WANT_TO_READ: "bg-interaction-contrast text-contrast",
  ABANDONED: "bg-danger text-primary",
};

/*
 * Livros por status.
 * - wide: uma barra dividida na largura toda + os números embaixo;
 * - tall: uma linha por status, com barra proporcional ao maior.
 */
export default async function BookStatus({ variant }: { variant: WidgetVariant }) {
  /*
   * Uma única consulta agrupada por status, em vez de um count por status.
   */
  const { id: userId } = await requireApprovedUser();

  const groups = await prisma.book.groupBy({
    by: ["status"],
    where: { userId },
    _count: { _all: true },
  });

  const countByStatus = (status: ReadingStatus) =>
    groups.find((group) => group.status === status)?._count._all ?? 0;

  const total = groups.reduce((sum, group) => sum + group._count._all, 0);

  const stats = statusOptions.map((status) => ({
    status,
    count: countByStatus(status),
  }));

  if (variant === "tall") {
    const max = Math.max(1, ...stats.map((stat) => stat.count));

    return (
      <WidgetCard title="Na estante" action={{ href: "/library", label: "Ver todos" }}>
        <p className="-mt-2 text-sm tabular-nums text-contrast/55">
          {total} {total === 1 ? "livro" : "livros"}
        </p>

        <dl className="flex flex-col gap-3">
          {stats.map((stat) => (
            <div key={stat.status} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-sm text-contrast/70">
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${statusColor[stat.status]}`}
                  />
                  {statusLabel[stat.status]}
                </dt>
                <dd className="title-shelf text-2xl tabular-nums">{stat.count}</dd>
              </div>

              <div aria-hidden="true" className="h-2 bg-darkest/50">
                <div
                  className={`h-full ${barColor[stat.status]}`}
                  style={{ width: `${(stat.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </dl>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard ariaLabel="Livros por status">
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
    </WidgetCard>
  );
}
