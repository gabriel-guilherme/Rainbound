"use client";

import { useEffect } from "react";
import { Droplet } from "lucide-react";

import { formatDays, type StreakSummary } from "@/lib/streak/rules";

import { useStreak } from "./useStreak";

/* Some sozinho depois disso. */
const AUTO_DISMISS_MS = 8000;

type StreakNoticeProps = {
  initial: StreakSummary;
  /* Posição */
  className?: string;
};

/* Aviso "Dia garantido!" quando a meta de hoje é batida nesta aba. */
export default function StreakNotice({ initial, className = "" }: StreakNoticeProps) {
  const { summary, justMet, dismissJustMet } = useStreak(initial);

  useEffect(() => {
    if (!justMet) return;

    const timeout = setTimeout(dismissJustMet, AUTO_DISMISS_MS);

    return () => clearTimeout(timeout);
  }, [justMet, dismissJustMet]);

  if (!justMet) {
    return null;
  }

  return (
    <div
      role="status"
      className={[
        "grid grid-cols-[2.25rem_minmax(0,1fr)] items-start gap-x-3.5 gap-y-1 border border-contrast/15 bg-primary px-4 py-3.5 shadow-[6px_6px_0_rgb(0_0_0/0.45)]",
        className,
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="row-span-2 flex size-9 items-center justify-center bg-interaction/15 text-interaction"
      >
        <Droplet size={20} fill="currentColor" strokeWidth={1.5} />
      </span>

      <p className="title-shelf text-xl text-contrast">Dia garantido!</p>
      <p className="text-sm text-contrast/70">
        {formatDays(summary.current)} {summary.current === 1 ? "seguido" : "seguidos"}. Continue
        lendo à vontade.
      </p>

      <div className="col-start-2 mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={dismissJustMet}
          className="btn-shelf px-3.5 py-1.5 text-[15px] text-contrast/80 ring-1 ring-inset ring-contrast/20 hover:bg-contrast/10"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
