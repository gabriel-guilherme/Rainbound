"use client";

import { useEffect, useRef, useState } from "react";

import { formatDays, toMinutes, type StreakSummary } from "@/lib/streak/rules";

import StreakPanel from "./StreakPanel";
import StreakRing from "./StreakRing";
import { useStreak } from "./useStreak";

/*
 * Sequência no rodapé do leitor. Antes da meta: anel com "6/10 min";
 * depois: gota cheia com os dias seguidos. Abre o painel para cima; no
 * celular, como uma folha logo acima do rodapé (como a Sessão).
 */
export default function StreakButton({ initial }: { initial: StreakSummary }) {
  const { summary, todaySeconds, todayProgress } = useStreak(initial);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const minutes = toMinutes(todaySeconds);
  const label = summary.metToday
    ? `Sequência: ${formatDays(summary.current)}, meta de hoje batida`
    : `Sequência: ${minutes} de ${summary.goalMinutes} minutos hoje`;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={label}
        title={label}
        aria-expanded={isOpen}
        className={[
          "flex h-8 cursor-pointer items-center gap-1.5 px-2 text-sm tabular-nums transition-colors hover:bg-contrast/10",
          summary.metToday ? "text-contrast" : "text-contrast/70 hover:text-contrast",
        ].join(" ")}
      >
        <StreakRing progress={todayProgress} met={summary.metToday} size={22} />
        <span className="max-sm:text-xs">
          {summary.metToday ? (
            <>
              {summary.current}
              <span className="max-sm:hidden"> {summary.current === 1 ? "dia" : "dias"}</span>
            </>
          ) : (
            <>
              {minutes}/{summary.goalMinutes}
              <span className="max-sm:hidden"> min</span>
            </>
          )}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Sequência de leitura"
          className={[
            "fixed inset-x-2 bottom-[calc(2.5rem+env(safe-area-inset-bottom)+0.5rem)] z-50",
            "sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-2 sm:w-80",
            "border border-contrast/10 bg-primary p-4 shadow-[6px_6px_0_rgb(0_0_0/0.45)]",
          ].join(" ")}
        >
          <p className="mb-3 text-[11px] uppercase tracking-widest text-contrast/50">
            Sequência de leitura
          </p>
          <StreakPanel summary={summary} todaySeconds={todaySeconds} />
        </div>
      )}
    </div>
  );
}
