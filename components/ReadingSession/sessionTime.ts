import type { SessionState } from "./sessionState";

/*
 * Cálculo e formatação dos tempos da sessão. Funções puras: recebem o
 * estado e a hora, não leem nada sozinhas.
 */

/* Há algo em andamento (rodando ou pausado) que precisa de "Zerar". */
export function isSessionActive(state: SessionState) {
  if (state.running) return true;

  return state.mode === "stopwatch"
    ? state.elapsedMs > 0
    : state.remainingMs < state.runMs;
}

/*
 * A hora do tique pode ser até 1 s mais antiga que o clique em Começar:
 * os limites abaixo impedem o cronômetro de ficar negativo e o timer de
 * mostrar mais que o tempo da rodada nesse instante.
 */
export function getElapsedMs(state: SessionState, now: number) {
  const running =
    state.running && state.startedAt ? Math.max(0, now - state.startedAt) : 0;

  return state.elapsedMs + running;
}

export function getRemainingMs(state: SessionState, now: number) {
  return state.running && state.endsAt
    ? Math.min(state.remainingMs, Math.max(0, state.endsAt - now))
    : state.remainingMs;
}

/* "18:42" ou "1:05:30" (acima de uma hora). */
export function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}

const timeFormat = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
});

/* "21:40". */
export function formatClock(time: number) {
  return timeFormat.format(time);
}
