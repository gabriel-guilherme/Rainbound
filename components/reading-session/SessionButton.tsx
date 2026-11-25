"use client";

import { useEffect, useRef, useState } from "react";
import { Timer } from "lucide-react";

import SessionPanel from "./SessionPanel";
import { formatDuration, getElapsedMs, getRemainingMs } from "./sessionTime";
import { useReadingSession } from "./useReadingSession";

/*
 * Botão "Sessão" do rodapé do leitor. Com a sessão em andamento mostra o
 * tempo (o que falta no timer, o que passou no cronômetro). Abre o painel
 * para cima; no celular, como uma folha logo acima do rodapé.
 */
export default function SessionButton() {
  const { state, now, isActive } = useReadingSession();
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

  const timeMs =
    now === null || !isActive
      ? null
      : state.mode === "timer"
        ? getRemainingMs(state, now)
        : getElapsedMs(state, now);

  const time = timeMs === null ? null : formatDuration(timeMs);
  const modeLabel = state.mode === "timer" ? "timer" : "cronômetro";
  const label = time
    ? `Sessão de leitura: ${modeLabel}, ${time}${state.running ? "" : " (pausado)"}`
    : "Sessão de leitura";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={label}
        title={label}
        aria-expanded={isOpen}
        className={[
          "flex h-8 cursor-pointer items-center gap-1.5 px-2 text-sm tabular-nums transition-colors",
          time
            ? "bg-contrast/10 font-semibold text-danger hover:bg-contrast/15"
            : "text-contrast/60 hover:bg-contrast/10 hover:text-contrast",
          time && !state.running ? "opacity-70" : "",
        ].join(" ")}
      >
        <Timer size={16} aria-hidden="true" />
        {time}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Sessão de leitura"
          className={[
            "fixed inset-x-2 bottom-[calc(2.5rem+env(safe-area-inset-bottom)+0.5rem)] z-50",
            "sm:absolute sm:inset-x-auto sm:bottom-full sm:right-0 sm:mb-2 sm:w-72",
            "border border-contrast/10 bg-primary p-3.5 shadow-[6px_6px_0_rgb(0_0_0/0.45)]",
          ].join(" ")}
        >
          <p className="mb-3 text-[11px] uppercase tracking-widest text-contrast/50">
            Sessão de leitura
          </p>
          <SessionPanel />
        </div>
      )}
    </div>
  );
}
