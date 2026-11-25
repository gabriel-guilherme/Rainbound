"use client";

import { Bell, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { loadNotifications, markNotificationsRead } from "@/app/notifications/actions";
import type { NotificationGroup } from "@/lib/notifications/server";

import NotificationList from "./NotificationList";

const POLL_INTERVAL_MS = 60_000;

/*
 * Sino da barra do topo: número de não lidas e o painel com as recentes.
 * Sem tempo real: consulta /api/notifications/unread a cada minuto, ao
 * trocar de página e ao voltar para a aba. Abrir o painel marca tudo como
 * lido. No celular, o painel ocupa a tela.
 */
export default function NotificationBell({ initialUnread }: { initialUnread: number }) {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [unread, setUnread] = useState(initialUnread);
  const [isOpen, setIsOpen] = useState(false);
  const [groups, setGroups] = useState<NotificationGroup[] | null>(null);
  const [now, setNow] = useState(0);
  const [isLoading, startLoading] = useTransition();

  const refreshCount = useCallback(async () => {
    try {
      const response = await fetch("/api/notifications/unread", { cache: "no-store" });

      if (!response.ok) return;

      const data: { unread?: number } = await response.json();

      if (typeof data.unread === "number") setUnread(data.unread);
    } catch {
      /* Sem rede: tenta de novo na próxima vez. */
    }
  }, []);

  /* A cada minuto e ao voltar para a aba. */
  useEffect(() => {
    const interval = setInterval(refreshCount, POLL_INTERVAL_MS);

    function handleVisibility() {
      if (document.visibilityState === "visible") void refreshCount();
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshCount]);

  /* Ao trocar de página. */
  useEffect(() => {
    void refreshCount();
  }, [pathname, refreshCount]);

  /* Fecha ao clicar fora ou com Esc. */
  useEffect(() => {
    if (!isOpen) return;

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  function open() {
    setIsOpen(true);
    setNow(Date.now());

    startLoading(async () => {
      const loaded = await loadNotifications();

      setGroups(loaded);
      setUnread(0);

      if (loaded.some((group) => group.unread)) await markNotificationsRead();
    });
  }

  const label = unread > 0 ? `Notificações (${unread} novas)` : "Notificações";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        aria-label={label}
        title="Notificações"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={`relative flex h-10 w-10 cursor-pointer items-center justify-center transition-colors ${
          isOpen ? "bg-contrast text-primary" : "text-contrast/70 hover:bg-contrast/10 hover:text-contrast"
        }`}
      >
        <Bell size={19} aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-danger px-1 text-[11px] font-semibold tabular-nums text-primary ring-2 ring-primary"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          role="dialog"
          aria-label="Notificações"
          className="z-20 flex flex-col bg-primary shadow-[8px_8px_0_rgb(0_0_0/0.5)] ring-1 ring-contrast/10 max-sm:fixed max-sm:inset-0 sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:max-h-[70dvh] sm:w-[26rem]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-contrast/10 px-4 py-3">
            <h2 className="title-shelf text-2xl">Notificações</h2>
            <div className="flex items-center gap-2">
              <Link
                href="/notificacoes"
                onClick={() => setIsOpen(false)}
                className="text-xs uppercase tracking-widest text-contrast/70 hover:text-contrast"
              >
                Ver todas
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Fechar"
                className="flex size-10 cursor-pointer items-center justify-center text-contrast/70 hover:bg-contrast/10 hover:text-contrast sm:hidden"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {groups === null || (isLoading && groups.length === 0) ? (
              <p className="px-4 py-8 text-center text-sm text-contrast/70">Carregando…</p>
            ) : groups.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-contrast/70">
                Nenhuma notificação ainda.
              </p>
            ) : (
              <NotificationList groups={groups} now={now} onNavigate={() => setIsOpen(false)} />
            )}
          </div>
        </section>
      )}
    </div>
  );
}
