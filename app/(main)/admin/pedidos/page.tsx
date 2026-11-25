import type { Metadata } from "next";
import Link from "next/link";
import { Droplet } from "lucide-react";

import StorageLimitSelect from "@/components/admin/StorageLimitSelect";
import { SubmitButton } from "@/components/common/SubmitButton";
import { AccountStatus } from "@/generated/prisma/enums";
import {
  BYTES_PER_MB,
  DEFAULT_STORAGE_LIMIT_MB,
  formatStorageSize,
  R2_FREE_STORAGE_MB,
} from "@/lib/bookFiles";
import { prisma } from "@/lib/prisma";
import { getStreakSummary, getTimeZone, todayIn } from "@/lib/readingStreak";
import { listReadingDays } from "@/lib/readingStreakAdmin";
import { requireAdmin } from "@/lib/session";
import { addDays, dateKeyToUtc, formatDays, toMinutes } from "@/lib/streak";

import {
  adjustReadingDay,
  approveRequest,
  clearReadingDay,
  clearTestStreak,
  completeReadingDay,
  rejectRequest,
  seedTestStreak,
} from "./actions";

export const metadata: Metadata = { title: "Administração — Rainbound" };

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

/* Abas da página (`?aba=`): pedidos de acesso, usuários e espaço, testes da sequência. */
const ADMIN_TABS = [
  { id: "pedidos", label: "Pedidos" },
  { id: "usuarios", label: "Usuários e espaço" },
  { id: "sequencia", label: "Sequência" },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]["id"];

/* Acima disso a régua fica vermelha ("quase cheio"), como na estante. */
const NEARLY_FULL = 0.9;

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

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string | string[] }>;
}) {
  const admin = await requireAdmin();
  const { aba } = await searchParams;
  const tab: AdminTab =
    ADMIN_TABS.find((item) => item.id === aba)?.id ?? "pedidos";

  const pendingCount = await prisma.user.count({
    where: { status: AccountStatus.PENDING },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pt-32">
      <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">
        Administração
      </h1>

      <nav
        aria-label="Seções do admin"
        className="mt-8 grid grid-cols-3 bg-darkest p-[3px] sm:inline-grid sm:grid-cols-[auto_auto_auto]"
      >
        {ADMIN_TABS.map((item) => {
          const isCurrent = item.id === tab;

          return (
            <Link
              key={item.id}
              href={`/admin/pedidos?aba=${item.id}`}
              aria-current={isCurrent ? "page" : undefined}
              className={[
                "flex min-h-10 items-center justify-center gap-2 px-2 py-1 text-center text-sm leading-tight transition-colors sm:px-4",
                isCurrent
                  ? "bg-contrast/15 font-semibold text-contrast"
                  : "text-contrast/70 hover:text-contrast",
              ].join(" ")}
            >
              {item.label}
              {item.id === "pedidos" && pendingCount > 0 && (
                <span className="bg-danger px-1.5 text-[11px] font-semibold tabular-nums text-primary">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {tab === "pedidos" && <RequestsTab adminId={admin.id} />}
      {tab === "usuarios" && <UsersTab adminId={admin.id} />}
      {tab === "sequencia" && <StreakTab adminId={admin.id} />}
    </div>
  );
}

/// Aba "Pedidos": esperando e já decididos (aprovar, recusar, revogar)

async function RequestsTab({ adminId }: { adminId: string }) {
  const [pending, reviewed] = await Promise.all([
    prisma.user.findMany({
      where: { status: AccountStatus.PENDING },
      orderBy: { createdAt: "asc" },
      select: userSelect,
    }),
    prisma.user.findMany({
      where: { status: { not: AccountStatus.PENDING }, id: { not: adminId } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      select: userSelect,
    }),
  ]);

  return (
    <>
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
    </>
  );
}

/// Aba "Usuários e espaço": total do R2 e o limite de cada um

async function UsersTab({ adminId }: { adminId: string }) {
  const [users, usage] = await Promise.all([
    prisma.user.findMany({
      where: { status: AccountStatus.APPROVED },
      orderBy: { createdAt: "asc" },
      select: userSelect,
    }),
    /* Livros e espaço por dono (livros antigos sem tamanho contam 0 até o dono abrir a estante). */
    prisma.book.groupBy({
      by: ["userId"],
      _sum: { fileSize: true },
      _count: { _all: true },
    }),
  ]);

  const usageByUser = new Map(
    usage.map((row) => [
      row.userId,
      { bytes: row._sum.fileSize ?? 0, books: row._count._all },
    ]),
  );

  /* Total de todos os donos (inclui livros sem dono, se houver). */
  const totalBytes = usage.reduce((sum, row) => sum + (row._sum.fileSize ?? 0), 0);
  const freeBytes = R2_FREE_STORAGE_MB * BYTES_PER_MB;
  const totalRatio = Math.min(totalBytes / freeBytes, 1);

  /* O admin primeiro; os outros na ordem de cadastro. */
  const rows = [...users].sort(
    (a, b) => Number(b.id === adminId) - Number(a.id === adminId),
  );

  return (
    <>
      <section aria-labelledby="total-title" className="mt-10 bg-primary p-5">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div className="flex flex-col gap-1">
            <h2 id="total-title" className="text-[11px] uppercase tracking-[0.2em] text-contrast/60">
              Espaço usado pelos livros
            </h2>
            <p className="title-shelf text-4xl text-contrast">
              {formatStorageSize(totalBytes)}{" "}
              <span className="text-2xl text-contrast/55">
                de {formatStorageSize(freeBytes)} grátis no R2
              </span>
            </p>
          </div>
          <p className="text-xs text-contrast/55">
            Os 10 GB são da conta: dev e produção somam.
          </p>
        </div>

        <div
          role="meter"
          aria-label="Espaço usado no R2"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(totalRatio * 100)}
          className="mt-4 h-1.5 bg-contrast/15"
        >
          <div
            className={`h-full ${totalRatio >= NEARLY_FULL ? "bg-danger" : "bg-interaction"}`}
            style={{ width: `${totalRatio * 100}%` }}
          />
        </div>
      </section>

      <section aria-labelledby="users-title" className="mt-10">
        <h2 id="users-title" className="text-sm uppercase tracking-[0.3em] text-contrast/50">
          Usuários ({rows.length})
        </h2>

        {/* Cabeçalho das colunas (só a partir de md; no celular cada usuário é um bloco). */}
        <div
          aria-hidden="true"
          className="mt-4 hidden grid-cols-[minmax(0,1.2fr)_4rem_minmax(0,1.4fr)_13rem] gap-6 pb-2 text-[11px] uppercase tracking-[0.15em] text-contrast/50 md:grid"
        >
          <span>Usuário</span>
          <span className="text-right">Livros</span>
          <span>Espaço usado</span>
          <span>Limite</span>
        </div>

        <ul className="divide-y divide-contrast/10 border-y border-contrast/10 max-md:mt-4">
          {rows.map((user) => {
            const name = user.displayUsername || user.username;
            const isAdmin = user.id === adminId;
            const { bytes, books } = usageByUser.get(user.id) ?? { bytes: 0, books: 0 };
            const limitBytes = (user.storageLimitMb ?? DEFAULT_STORAGE_LIMIT_MB) * BYTES_PER_MB;
            const ratio = limitBytes > 0 ? Math.min(bytes / limitBytes, 1) : 1;
            const percent = Math.round(ratio * 100);
            const nearlyFull = ratio >= NEARLY_FULL;

            return (
              <li
                key={user.id}
                className="grid gap-3 py-4 md:grid-cols-[minmax(0,1.2fr)_4rem_minmax(0,1.4fr)_13rem] md:items-start md:gap-6"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate font-medium text-contrast">
                    {isAdmin ? "Você" : name}
                    {isAdmin && (
                      <span className="border border-contrast/25 px-1.5 text-[11px] font-normal text-contrast/70">
                        admin
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-contrast/55">{user.email}</p>
                </div>

                <p className="text-sm tabular-nums text-contrast/80 md:pt-0.5 md:text-right">
                  <span className="md:hidden">Livros: </span>
                  {books}
                </p>

                <div className="flex flex-col gap-1.5 md:pt-0.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm tabular-nums">
                    <span className={nearlyFull ? "font-semibold text-danger" : "text-contrast"}>
                      {bytes > 0 ? formatStorageSize(bytes) : "Nada enviado"}
                      <span className="font-normal text-contrast/55">
                        {" "}de {formatStorageSize(limitBytes)}
                      </span>
                    </span>
                    <span className={`text-xs ${nearlyFull ? "text-danger" : "text-contrast/55"}`}>
                      {percent}%{nearlyFull ? " · quase cheio" : ""}
                    </span>
                  </div>
                  <div
                    role="meter"
                    aria-label={`Espaço de ${isAdmin ? "você" : name}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-valuetext={`${formatStorageSize(bytes)} de ${formatStorageSize(limitBytes)}`}
                    className="h-1.5 bg-contrast/15"
                  >
                    <div
                      className={`h-full ${nearlyFull ? "bg-danger" : "bg-interaction"}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                <StorageLimitSelect
                  userId={user.id}
                  label={isAdmin ? "Seu limite" : `Limite de ${name}`}
                  storageLimitMb={user.storageLimitMb}
                />
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

/// Aba "Sequência": testes da sequência de leitura na conta do admin

/* Dias mostrados na lista (de hoje para trás). */
const STREAK_TEST_DAYS = 21;

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const smallButtonClass =
  "h-8 min-w-10 cursor-pointer px-2 text-sm tabular-nums text-contrast/80 ring-1 ring-inset ring-contrast/15 transition-colors hover:bg-contrast/10 hover:text-contrast";

async function StreakTab({ adminId }: { adminId: string }) {
  const timeZone = await getTimeZone();
  const today = todayIn(timeZone);

  const [summary, rows] = await Promise.all([
    getStreakSummary(adminId, timeZone),
    listReadingDays(adminId, addDays(today, -(STREAK_TEST_DAYS - 1)), today),
  ]);

  const byDate = new Map(rows.map((row) => [row.date, row]));
  const days = Array.from({ length: STREAK_TEST_DAYS }, (_, index) => {
    const date = addDays(today, -index);
    const row = byDate.get(date);

    return {
      date,
      seconds: row?.seconds ?? 0,
      met: date === today ? summary.metToday : Boolean(row?.goalMet),
    };
  });

  const stats = [
    { label: "Sequência", value: formatDays(summary.current) },
    { label: "Recorde", value: formatDays(summary.best) },
    { label: "Meta", value: `${summary.goalMinutes} min` },
    {
      label: "Hoje",
      value: summary.metToday ? "Batida" : `${toMinutes(summary.todaySeconds)} min`,
    },
  ];

  return (
    <>
      <section aria-labelledby="streak-test-title" className="mt-10 flex flex-col gap-2">
        <h2 id="streak-test-title" className="text-sm uppercase tracking-[0.3em] text-contrast/50">
          Testes na sua conta
        </h2>
        <p className="max-w-2xl text-sm text-contrast/65">
          Mexe direto nos seus dias de leitura (fuso: {timeZone}). O tempo contado no
          navegador e ainda não enviado (até 1 min) soma depois. Para ver o aviso
          &quot;Dia garantido!&quot;, deixe hoje 1 min abaixo da meta e leia 1 min no leitor.
        </p>
      </section>

      <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 bg-primary p-4">
            <dt className="text-[11px] uppercase tracking-[0.2em] text-contrast/60">{stat.label}</dt>
            <dd className="title-shelf text-3xl text-contrast">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 bg-primary p-4">
        <form action={seedTestStreak} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm text-contrast/70">
            Criar sequência de
            <span className="flex items-center gap-2">
              <input
                type="number"
                name="days"
                min={1}
                max={400}
                defaultValue={7}
                required
                className="h-9 w-20 border border-contrast/15 bg-darkest text-center tabular-nums text-contrast outline-none focus:border-danger"
              />
              dias
            </span>
          </label>
          <label className="flex h-9 items-center gap-2 text-sm text-contrast/70">
            <input type="checkbox" name="includeToday" className="accent-interaction" />
            terminando hoje (senão, ontem)
          </label>
          <SubmitButton pendingLabel="Criando...">Criar</SubmitButton>
        </form>

        <form action={clearTestStreak}>
          <button
            type="submit"
            className="btn-shelf border-2 border-danger/60 text-danger hover:border-danger"
          >
            Apagar histórico
          </button>
        </form>
      </div>

      <section aria-labelledby="streak-days-title" className="mt-10">
        <h2 id="streak-days-title" className="text-sm uppercase tracking-[0.3em] text-contrast/50">
          Últimos {STREAK_TEST_DAYS} dias
        </h2>

        <ul className="mt-4 divide-y divide-contrast/10 border-y border-contrast/10">
          {days.map((day) => {
            const label =
              day.date === today ? "Hoje" : day.date === addDays(today, -1) ? "Ontem" : null;

            return (
              <li
                key={day.date}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    aria-hidden="true"
                    className={[
                      "flex size-7 shrink-0 items-center justify-center",
                      day.met ? "bg-interaction text-darkest" : "bg-contrast/10",
                    ].join(" ")}
                  >
                    {day.met && <Droplet size={14} fill="currentColor" strokeWidth={1.5} />}
                  </span>
                  <span className="text-sm text-contrast first-letter:uppercase">
                    {dayFormatter.format(dateKeyToUtc(day.date))}
                  </span>
                  {label && (
                    <span className="border border-contrast/25 px-1.5 text-[11px] text-contrast/70">
                      {label}
                    </span>
                  )}
                  <span className="text-sm tabular-nums text-contrast/60">
                    {toMinutes(day.seconds)} min{day.met ? " · meta batida" : ""}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  <form action={adjustReadingDay.bind(null, day.date, -5)}>
                    <button type="submit" className={smallButtonClass} aria-label="Tirar 5 minutos">
                      −5
                    </button>
                  </form>
                  <form action={adjustReadingDay.bind(null, day.date, -1)}>
                    <button type="submit" className={smallButtonClass} aria-label="Tirar 1 minuto">
                      −1
                    </button>
                  </form>
                  <form action={adjustReadingDay.bind(null, day.date, 1)}>
                    <button type="submit" className={smallButtonClass} aria-label="Somar 1 minuto">
                      +1
                    </button>
                  </form>
                  <form action={adjustReadingDay.bind(null, day.date, 5)}>
                    <button type="submit" className={smallButtonClass} aria-label="Somar 5 minutos">
                      +5
                    </button>
                  </form>
                  <form action={completeReadingDay.bind(null, day.date)}>
                    <button type="submit" className={smallButtonClass}>
                      Meta
                    </button>
                  </form>
                  <form action={clearReadingDay.bind(null, day.date)}>
                    <button type="submit" className={`${smallButtonClass} text-danger`}>
                      Zerar
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
