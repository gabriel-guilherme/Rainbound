/*
 * Último resumo da sequência vindo do servidor (memória desta aba) e o
 * aviso "Dia garantido!". A tela também é avisada quando a contagem do
 * tempo muda (readingTime.ts), para somar o que ainda não foi enviado.
 * Sem React aqui: o hook está em useStreak.ts.
 */

import type { StreakSummary } from "@/lib/streak";

import { readReadingTimeRaw, subscribeReadingTime } from "./readingTime";

/// Resumo

let summary: StreakSummary | null = null;
/* A meta de hoje acabou de ser batida nesta aba: mostra o aviso. */
let justMet = false;

export function getSummary() {
  return summary;
}

/* Resumo da resposta de um envio (readingTimeSync.ts) ou da troca de meta. */
export function setSummary(next: StreakSummary) {
  if (summary && summary.today === next.today && !summary.metToday && next.metToday) {
    justMet = true;
  }

  summary = next;
  emit();
}

/*
 * Resumo vindo da página: fica se for mais novo que o desta aba (ex.: a
 * página foi montada depois de um teste no admin).
 */
export function seedSummary(initial: StreakSummary) {
  if (summary && summary.generatedAt >= initial.generatedAt) return;

  summary = initial;
  emit();
}

export function dismissJustMet() {
  justMet = false;
  emit();
}

/// Assinatura (useSyncExternalStore)

export type StreakSnapshot = {
  summary: StreakSummary | null;
  justMet: boolean;
  /* Texto salvo da contagem: muda a cada tique. */
  readingTimeRaw: string | null;
};

const serverSnapshot: StreakSnapshot = { summary: null, justMet: false, readingTimeRaw: null };

let snapshot = serverSnapshot;
const listeners = new Set<() => void>();
let unsubscribeReadingTime: (() => void) | null = null;

function emit() {
  snapshot = { summary, justMet, readingTimeRaw: readReadingTimeRaw() };
  listeners.forEach((listener) => listener());
}

export function getStreakSnapshot() {
  return snapshot;
}

export function getServerStreakSnapshot() {
  return serverSnapshot;
}

export function subscribeStreak(listener: () => void) {
  listeners.add(listener);

  /* Uma só assinatura da contagem para todos os componentes. */
  unsubscribeReadingTime ??= subscribeReadingTime(emit);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && unsubscribeReadingTime) {
      unsubscribeReadingTime();
      unsubscribeReadingTime = null;
    }
  };
}
