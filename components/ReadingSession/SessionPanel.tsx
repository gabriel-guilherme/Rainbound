"use client";

import { useState, type KeyboardEvent } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import {
  MAX_TIMER_MIN,
  MIN_TIMER_MIN,
  TIMER_PRESETS_MIN,
  type SessionMode,
} from "./sessionState";
import {
  formatClock,
  formatDuration,
  getElapsedMs,
  getRemainingMs,
} from "./sessionTime";
import { useReadingSession } from "./useReadingSession";

const MODES: { value: SessionMode; label: string }[] = [
  { value: "stopwatch", label: "Cronômetro" },
  { value: "timer", label: "Timer" },
];

/*
 * Controles da sessão de leitura: cronômetro ou timer (atalhos de 15 a
 * 60 min, ou clicar no número grande e digitar os minutos). Usado no
 * painel do rodapé do leitor e no widget "Sessão" da home; os dois
 * mostram a mesma sessão.
 */
export default function SessionPanel() {
  const { state, now, isActive, setMode, setDuration, start, pause, reset } =
    useReadingSession();
  const durationMin = Math.round(state.durationMs / 60_000);

  /* Minutos digitados no número grande; null quando não está editando. */
  const [draft, setDraft] = useState<string | null>(null);

  const isTimer = state.mode === "timer";
  /* Só dá para editar o tempo com o timer parado e zerado. */
  const canEdit = isTimer && !isActive && now !== null;
  const isEditing = canEdit && draft !== null;
  const timeMs =
    now === null
      ? null
      : isTimer
        ? getRemainingMs(state, now)
        : getElapsedMs(state, now);

  const timerProgress =
    isTimer && timeMs !== null && state.runMs > 0
      ? Math.min(100, Math.max(0, 100 - (timeMs / state.runMs) * 100))
      : 0;

  function describe() {
    if (now === null) return "";

    if (isTimer) {
      if (isEditing) return `minutos, de ${MIN_TIMER_MIN} a ${MAX_TIMER_MIN} · Enter confirma`;
      if (state.running && state.endsAt) return `termina às ${formatClock(state.endsAt)}`;
      if (isActive) return "pausado";

      return "toque no tempo para digitar";
    }

    if (state.firstStartedAt && isActive) {
      return `${state.running ? "lendo" : "pausado"} · desde ${formatClock(state.firstStartedAt)}`;
    }

    return "conta o tempo desta leitura";
  }

  /* Grava o que foi digitado (fora do limite, fica no mais próximo). */
  function commitDraft() {
    if (draft === null) return;

    const minutes = Number(draft);

    if (draft.trim() !== "" && Number.isFinite(minutes)) {
      setDuration(Math.min(Math.max(Math.round(minutes), MIN_TIMER_MIN), MAX_TIMER_MIN));
    }

    setDraft(null);
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitDraft();
    }

    if (event.key === "Escape") {
      /* Não fecha o painel junto: só cancela a edição. */
      event.stopPropagation();
      setDraft(null);
    }
  }

  const tabClass = (selected: boolean) =>
    [
      "h-9 text-sm transition-colors disabled:cursor-not-allowed",
      selected
        ? "bg-contrast/15 font-semibold text-contrast"
        : "cursor-pointer text-contrast/70 hover:text-contrast disabled:opacity-40",
    ].join(" ");

  return (
    <div className="flex flex-col gap-3.5">
      <div
        role="tablist"
        aria-label="Modo da sessão"
        className="grid grid-cols-2 bg-darkest p-[3px]"
      >
        {MODES.map((option) => {
          const selected = state.mode === option.value;

          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={!selected && isActive}
              title={!selected && isActive ? "Zere a sessão para trocar" : undefined}
              onClick={() => setMode(option.value)}
              className={tabClass(selected)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col items-center gap-1 pt-1">
        {isEditing ? (
          <div className="flex items-baseline gap-1.5">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={3}
              autoFocus
              aria-label={`Minutos do timer (de ${MIN_TIMER_MIN} a ${MAX_TIMER_MIN})`}
              value={draft}
              onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
              onFocus={(event) => event.target.select()}
              onBlur={commitDraft}
              onKeyDown={handleDraftKeyDown}
              className="title-shelf w-[3ch] border-b-2 border-danger bg-transparent text-center text-6xl tabular-nums text-contrast outline-none"
            />
            <span className="title-shelf text-2xl text-contrast/60">min</span>
          </div>
        ) : canEdit ? (
          <button
            type="button"
            onClick={() => setDraft(String(durationMin))}
            aria-label={`Tempo do timer: ${durationMin} minutos. Editar`}
            title="Editar o tempo"
            className="title-shelf cursor-text border-b-2 border-dashed border-contrast/25 text-6xl tabular-nums text-contrast transition-colors hover:border-danger"
          >
            {formatDuration(state.durationMs)}
          </button>
        ) : (
          <span
            aria-live="off"
            className="title-shelf text-6xl tabular-nums text-contrast"
          >
            {timeMs === null ? "--:--" : formatDuration(timeMs)}
          </span>
        )}
        <span className="min-h-4 text-xs text-contrast/60">{describe()}</span>
      </div>

      {isTimer && isActive && (
        <div aria-hidden="true" className="h-[3px] bg-contrast/10">
          <div
            className="h-full bg-danger transition-[width] duration-1000 ease-linear"
            style={{ width: `${timerProgress}%` }}
          />
        </div>
      )}

      {isTimer && !isActive && (
        <div role="group" aria-label="Atalhos de tempo" className="grid grid-cols-4 gap-1">
          {TIMER_PRESETS_MIN.map((minutes) => {
            const selected = durationMin === minutes;

            return (
              <button
                key={minutes}
                type="button"
                aria-pressed={selected}
                aria-label={`${minutes} minutos`}
                onClick={() => setDuration(minutes)}
                className={[
                  "h-9 cursor-pointer text-sm tabular-nums transition-colors",
                  selected
                    ? "bg-contrast font-semibold text-primary"
                    : "text-contrast/75 ring-1 ring-inset ring-contrast/15 hover:bg-contrast/10",
                ].join(" ")}
              >
                {minutes}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={state.running ? pause : start}
          disabled={now === null}
          className="btn-shelf flex-1 bg-danger text-primary hover:bg-contrast disabled:opacity-50"
        >
          {state.running ? (
            <Pause size={16} fill="currentColor" aria-hidden="true" />
          ) : (
            <Play size={16} fill="currentColor" aria-hidden="true" />
          )}
          {state.running ? "Pausar" : isActive ? "Continuar" : "Começar"}
        </button>

        {isActive && (
          <button
            type="button"
            onClick={reset}
            aria-label="Zerar"
            title="Zerar"
            className="flex w-11 cursor-pointer items-center justify-center text-contrast/75 ring-1 ring-inset ring-contrast/20 transition-colors hover:bg-contrast/10 hover:text-contrast"
          >
            <RotateCcw size={17} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
