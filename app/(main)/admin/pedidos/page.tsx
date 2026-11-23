import type { Metadata } from "next";

import { SubmitButton } from "@/components/common/SubmitButton";
import { AccountStatus } from "@/generated/prisma/enums";
import StorageLimitControl from "@/components/admin/StorageLimitControl";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

import { approveRequest, rejectRequest } from "./actions";

export const metadata: Metadata = { title: "Pedidos de acesso — Rainbound" };

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const statusLabel: Record<AccountStatus, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Recusado",
};

const userSelect = {
  id: true,
  username: true,
  displayUsername: true,
  email: true,
  status: true,
  createdAt: true,
  reviewedAt: true,
  storageLimitMb: true,
} as const;

export default async function AccessRequestsPage() {
  const admin = await requireAdmin();

  const [pending, reviewed, usage, adminLimit] = await Promise.all([
    prisma.user.findMany({
      where: { status: AccountStatus.PENDING },
      orderBy: { createdAt: "asc" },
      select: userSelect,
    }),
    prisma.user.findMany({
      where: { status: { not: AccountStatus.PENDING }, id: { not: admin.id } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      select: userSelect,
    }),
    /* Espaço usado por dono (livros antigos sem tamanho contam 0 até o dono abrir a estante). */
    prisma.book.groupBy({
      by: ["userId"],
      _sum: { fileSize: true },
    }),
    prisma.user.findUnique({
      where: { id: admin.id },
      select: { storageLimitMb: true },
    }),
  ]);

  const usedByUser = new Map(
    usage.map((row) => [row.userId, row._sum.fileSize ?? 0]),
  );

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-10 pt-32">
      <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">
        Pedidos de acesso
      </h1>

      <section aria-labelledby="own-storage-title" className="mt-10">
        <h2 id="own-storage-title" className="text-sm uppercase tracking-[0.3em] text-contrast/50">
          Seu espaço
        </h2>

        <StorageLimitControl
          userId={admin.id}
          used={usedByUser.get(admin.id) ?? 0}
          storageLimitMb={adminLimit?.storageLimitMb ?? null}
          className="mt-4"
        />
      </section>

      <section aria-labelledby="pending-title" className="mt-10">
        <h2 id="pending-title" className="text-sm uppercase tracking-[0.3em] text-danger">
          Esperando ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="mt-4 text-contrast/60">Nenhum pedido esperando.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-3">
            {pending.map((user) => (
              <li
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-4 border-l-[6px] border-danger bg-primary px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-contrast">
                    {user.displayUsername || user.username}
                  </p>
                  <p className="truncate text-sm text-contrast/60">{user.email}</p>
                  <p className="text-xs text-contrast/45">
                    Pediu em {dateFormatter.format(user.createdAt)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <form action={rejectRequest.bind(null, user.id)}>
                    <button
                      type="submit"
                      className="btn-shelf mt-2 border-2 border-contrast/30 text-contrast hover:border-contrast"
                    >
                      Recusar
                    </button>
                  </form>

                  <form action={approveRequest.bind(null, user.id)}>
                    <SubmitButton pendingLabel="Aprovando...">Aprovar</SubmitButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {reviewed.length > 0 && (
        <section aria-labelledby="reviewed-title" className="mt-14">
          <h2 id="reviewed-title" className="text-sm uppercase tracking-[0.3em] text-contrast/50">
            Já decididos
          </h2>

          <ul className="mt-4 divide-y divide-contrast/10">
            {reviewed.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-contrast">{user.displayUsername || user.username}</p>
                  <p className="truncate text-sm text-contrast/55">{user.email}</p>
                </div>

                {user.status === AccountStatus.APPROVED && (
                  <StorageLimitControl
                    userId={user.id}
                    used={usedByUser.get(user.id) ?? 0}
                    storageLimitMb={user.storageLimitMb}
                    className="w-full sm:order-last"
                  />
                )}

                <div className="flex items-center gap-3">
                  <span
                    className={
                      user.status === AccountStatus.APPROVED
                        ? "text-sm text-interaction"
                        : "text-sm text-contrast/50"
                    }
                  >
                    {statusLabel[user.status]}
                  </span>

                  {/* Mudar de ideia: recusado pode ser aprovado e vice-versa. */}
                  <form
                    action={(user.status === AccountStatus.APPROVED
                      ? rejectRequest
                      : approveRequest
                    ).bind(null, user.id)}
                  >
                    <button
                      type="submit"
                      className="text-sm text-danger underline-offset-4 hover:underline"
                    >
                      {user.status === AccountStatus.APPROVED ? "Revogar" : "Aprovar"}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
