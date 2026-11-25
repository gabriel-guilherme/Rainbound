/*
 * Estado salvo da sessão de leitura (cronômetro ou timer), compartilhado
 * entre o leitor e o widget da home. Fica no localStorage do navegador
 * (nada vai para o banco): começou no leitor, continua contando na home,
 * e o contrário.
 *
 * Guarda horários, não contagens: rodando, o cronômetro guarda quando
 * começou e o timer guarda quando acaba. Assim o tempo segue certo mesmo
 * com a aba fechada ou em segundo plano.
 *
 * Sem React aqui: o hook está em useReadingSession.ts.
 */

export type SessionMode = "stopwatch" | "timer";

export type SessionState = {
  mode: SessionMode;
  running: boolean;
  /* Cronômetro: tempo acumulado das partes pausadas. */
  elapsedMs: number;
  /* Cronômetro rodando: quando a parte atual começou. */
  startedAt: number | null;
  /* Primeiro início da sessão ("lendo desde 21:08"). */
  firstStartedAt: number | null;
  /* Timer: duração escolhida (fica para a próxima rodada). */
  durationMs: number;
  /*
   * Timer: tamanho da rodada atual. Igual à duração, exceto depois de
   * "Mais 5 min" (rodada de 5 min sem mudar a duração escolhida).
   */
  runMs: number;
  /* Timer: quanto falta (parado ou pausado). */
  remainingMs: number;
  /* Timer rodando: quando acaba. */
  endsAt: number | null;
  /* Timer acabou e o aviso ainda não foi fechado. */
  finishedAt: number | null;
};

export const TIMER_PRESETS_MIN = [15, 25, 45, 60] as const;
export const MIN_TIMER_MIN = 1;
export const MAX_TIMER_MIN = 180;

const DEFAULT_DURATION_MS = 25 * 60_000;

export const DEFAULT_SESSION_STATE: SessionState = {
  mode: "timer",
  running: false,
  elapsedMs: 0,
  startedAt: null,
  firstStartedAt: null,
  durationMs: DEFAULT_DURATION_MS,
  runMs: DEFAULT_DURATION_MS,
  remainingMs: DEFAULT_DURATION_MS,
  endsAt: null,
  finishedAt: null,
};

const STORAGE_KEY = "rainbound:reading-session";

let memoryValue: string | null = null;
const listeners = new Set<() => void>();

/* Texto salvo, como está no localStorage (ou na memória, se bloqueado). */
export function readSessionRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryValue;
  }
}

export function readSessionState() {
  return parseSessionState(readSessionRaw());
}

export function writeSessionState(state: SessionState) {
  const value = JSON.stringify(state);
  memoryValue = value;

  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Storage bloqueado: vale só enquanto a página estiver aberta. */
  }

  listeners.forEach((listener) => listener());
}

/* Avisa quando a sessão muda, nesta aba ou em outra. */
export function subscribeSession(listener: () => void) {
  listeners.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function clampDuration(ms: number) {
  return Math.min(Math.max(ms, MIN_TIMER_MIN * 60_000), MAX_TIMER_MIN * 60_000);
}

function isTime(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function timeOrNull(value: unknown) {
  return isTime(value) ? value : null;
}

/* Lê o salvo; qualquer coisa fora do formato volta ao padrão. */
export function parseSessionState(raw: string | null): SessionState {
  if (!raw) {
    return DEFAULT_SESSION_STATE;
  }

  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const durationMs = isTime(data.durationMs)
      ? clampDuration(data.durationMs)
      : DEFAULT_DURATION_MS;
    const runMs = isTime(data.runMs) && data.runMs > 0 ? data.runMs : durationMs;

    const state: SessionState = {
      mode: data.mode === "stopwatch" ? "stopwatch" : "timer",
      running: data.running === true,
      elapsedMs: isTime(data.elapsedMs) ? data.elapsedMs : 0,
      startedAt: timeOrNull(data.startedAt),
      firstStartedAt: timeOrNull(data.firstStartedAt),
      durationMs,
      runMs,
      remainingMs: isTime(data.remainingMs)
        ? Math.min(data.remainingMs, runMs)
        : runMs,
      endsAt: timeOrNull(data.endsAt),
      finishedAt: timeOrNull(data.finishedAt),
    };

    /* Rodando sem o horário de referência não tem como contar. */
    if (state.running && (state.mode === "stopwatch" ? !state.startedAt : !state.endsAt)) {
      return { ...state, running: false };
    }

    return state;
  } catch {
    return DEFAULT_SESSION_STATE;
  }
}
