"use client";

import { useEffect, useRef, useState, useTransition, type RefObject } from "react";

import { loadNotifications } from "@/app/notifications/actions";
import type { NotificationPage } from "@/lib/notifications/server";

import NotificationList from "./NotificationList";

type NotificationFeedProps = {
  initial: NotificationPage;
  now: number;
  /* Caixa que rola (painel); sem ela, a própria página. */
  scrollRoot?: RefObject<HTMLElement | null>;
  /* Títulos "Hoje", "Ontem"... entre os dias (página /notificacoes). */
  withDays?: boolean;
  today?: string;
  onNavigate?: () => void;
};

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function dayTitle(day: string, today: string) {
  const diff = Math.round(
    (new Date(`${today}T00:00:00Z`).getTime() - new Date(`${day}T00:00:00Z`).getTime()) / 86_400_000,
  );

  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";

  return dayFormatter.format(new Date(`${day}T00:00:00Z`));
}

/*
 * Lista de notificações que carrega mais sozinha ao chegar no fim
 * (IntersectionObserver num marcador depois do último item).
 */
export default function NotificationFeed({
  initial,
  now,
  scrollRoot,
  withDays = false,
  today = "",
  onNavigate,
}: NotificationFeedProps) {
  const [groups, setGroups] = useState(initial.groups);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [error, setError] = useState(false);
  const [isLoading, startLoading] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!sentinel || !cursor || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting || isLoading) return;

        startLoading(async () => {
          try {
            const next = await loadNotifications(cursor);

            setGroups((current) => [
              ...current,
              ...next.groups.filter((group) => !current.some((item) => item.key === group.key)),
            ]);
            setCursor(next.nextCursor);
          } catch {
            setError(true);
          }
        });
      },
      { root: scrollRoot?.current ?? null, rootMargin: "200px" },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [cursor, error, isLoading, scrollRoot]);

  if (groups.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-contrast/70">Nenhuma notificação ainda.</p>;
  }

  const sections = withDays
    ? groups.reduce<{ day: string; groups: typeof groups }[]>((list, group) => {
        const last = list[list.length - 1];

        if (last?.day === group.day) last.groups.push(group);
        else list.push({ day: group.day, groups: [group] });

        return list;
      }, [])
    : [{ day: "", groups }];

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => (
        <section key={section.day || "all"} className="flex flex-col gap-2">
          {withDays && (
            <h2 className="text-xs uppercase tracking-widest text-contrast/70 first-letter:uppercase">
              {dayTitle(section.day, today)}
            </h2>
          )}
          <div className={withDays ? "bg-primary" : ""}>
            <NotificationList groups={section.groups} now={now} onNavigate={onNavigate} />
          </div>
        </section>
      ))}

      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {isLoading && <p className="pb-4 text-center text-xs text-contrast/60">Carregando mais…</p>}
      {error && (
        <button
          type="button"
          onClick={() => setError(false)}
          className="mx-auto mb-4 cursor-pointer text-xs text-danger underline-offset-4 hover:underline"
        >
          Não foi possível carregar. Tentar de novo
        </button>
      )}
      {!cursor && groups.length > 0 && withDays && (
        <p className="pb-4 text-center text-xs text-contrast/60">
          Isso é tudo. As lidas somem depois de 90 dias.
        </p>
      )}
    </div>
  );
}
