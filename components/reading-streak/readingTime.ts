/*
 * Contagem do tempo de leitura para a sequência, no localStorage
 * (compartilhada entre abas). Sem React aqui.
 *
 * - `countedUntil`: até quando o tempo já foi contado. Cada tique conta só
 *   o trecho depois disso, então duas abas abertas não contam em dobro;
 * - `pending`: milissegundos ainda não enviados, por dia ("AAAA-MM-DD").
 *
 * Conta como leitura, sem somar duas vezes o mesmo trecho:
 * - o leitor aberto, visível e em uso (ReadingTracker decide);
 * - o cronômetro/timer da Sessão rodando (pelos horários salvos, então
 *   conta mesmo com a aba fechada ou o celular bloqueado).
 *
 * O envio ao servidor está em readingTimeSync.ts.
 */

import { readSessionState } from "@/components/reading-session/sessionState";
import type { SessionState } from "@/components/reading-session/sessionState";
import { addDays, localDateKey, nextLocalMidnight } from "@/lib/streak/rules";

const STORAGE_KEY = "rainbound:reading-time";

/* Cronômetro esquecido ligado: conta no máximo as últimas 4 horas. */
const MAX_STOPWATCH_MS = 4 * 60 * 60 * 1000;

export type ReadingTimeData = {
  countedUntil: number | null;
  pending: Record<string, number>;
};

/// Leitura e gravação

let memoryValue: string | null = null;
const listeners = new Set<() => void>();

/* Texto salvo, como está no localStorage (ou na memória, se bloqueado). */
export function readReadingTimeRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryValue;
  }
}

export function readReadingTime(): ReadingTimeData {
  const raw = readReadingTimeRaw();

  if (!raw) return { countedUntil: null, pending: {} };

  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const pending: Record<string, number> = {};

    if (typeof data.pending === "object" && data.pending !== null) {
      for (const [date, ms] of Object.entries(data.pending)) {
        if (typeof ms === "number" && Number.isFinite(ms) && ms > 0) {
          pending[date] = ms;
        }
      }
    }

    const countedUntil =
      typeof data.countedUntil === "number" && Number.isFinite(data.countedUntil)
        ? data.countedUntil
        : null;

    return { countedUntil, pending };
  } catch {
    return { countedUntil: null, pending: {} };
  }
}

export function writeReadingTime(data: ReadingTimeData) {
  const value = JSON.stringify(data);
  memoryValue = value;

  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* Storage bloqueado: vale só enquanto a página estiver aberta. */
  }

  listeners.forEach((listener) => listener());
}

/* Avisa quando a contagem muda, nesta aba ou em outra. */
export function subscribeReadingTime(listener: () => void) {
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

/// Contagem

/* Trecho em que a sessão rodou até `now` (ou null, parada). */
function sessionRange(session: SessionState, now: number): [number, number] | null {
  if (!session.running) return null;

  if (session.mode === "stopwatch" && session.startedAt) {
    return [Math.max(session.startedAt, now - MAX_STOPWATCH_MS), now];
  }

  if (session.mode === "timer" && session.endsAt) {
    return [session.endsAt - session.remainingMs, Math.min(session.endsAt, now)];
  }

  return null;
}

/* Soma o trecho aos dias, partindo na meia-noite do aparelho. */
function addRange(pending: Record<string, number>, start: number, end: number) {
  let from = start;

  while (from < end) {
    const to = Math.min(end, nextLocalMidnight(from));
    const day = localDateKey(from);

    pending[day] = (pending[day] ?? 0) + (to - from);
    from = to;
  }
}

/* Junta trechos que se sobrepõem (leitor + sessão ao mesmo tempo). */
function mergeRanges(ranges: [number, number][]) {
  const sorted = ranges.filter(([start, end]) => end > start).sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];

  for (const range of sorted) {
    const last = merged.at(-1);

    if (last && range[0] <= last[1]) {
      last[1] = Math.max(last[1], range[1]);
    } else {
      merged.push([...range]);
    }
  }

  return merged;
}

/*
 * Conta o tempo desde a última contagem até `now`. `readerFrom`: desde
 * quando o leitor desta aba está em uso (null quando não está).
 */
export function countReadingTime(now: number, readerFrom: number | null) {
  const data = readReadingTime();
  const from = data.countedUntil ?? now;

  if (now <= from) {
    if (data.countedUntil === null) writeReadingTime({ ...data, countedUntil: now });
    return;
  }

  const ranges: [number, number][] = [];
  const session = sessionRange(readSessionState(), now);

  if (session) ranges.push([Math.max(session[0], from), session[1]]);
  if (readerFrom !== null) ranges.push([Math.max(readerFrom, from), now]);

  const pending = { ...data.pending };

  for (const [start, end] of mergeRanges(ranges)) {
    addRange(pending, start, end);
  }

  /* O servidor só aceita hoje e ontem: o resto não tem para onde ir. */
  const yesterday = addDays(localDateKey(now), -1);

  for (const date of Object.keys(pending)) {
    if (date < yesterday) delete pending[date];
  }

  writeReadingTime({ countedUntil: now, pending });
}
