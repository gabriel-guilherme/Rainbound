/*
 * Envio do tempo de leitura (readingTime.ts) a /api/reading-time. A
 * resposta é o resumo da sequência, que vai para o streakStore.ts.
 * Sem React aqui: quem chama é o ReadingTracker.
 */

import {
  goalSeconds,
  isValidTimeZone,
  localDateKey,
  TIME_ZONE_COOKIE,
  type StreakSummary,
} from "@/lib/streak";

import { readReadingTime, writeReadingTime } from "./readingTime";
import { getSummary, setSummary } from "./streakStore";

const ENDPOINT = "/api/reading-time";

type Entry = { date: string; seconds: number };

/// Fuso

export function getTimeZone() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return isValidTimeZone(timeZone) ? timeZone : null;
}

/* O servidor usa o fuso para saber o "hoje" ao montar as páginas. */
export function saveTimeZoneCookie() {
  const timeZone = getTimeZone();

  if (!timeZone) return;

  const value = encodeURIComponent(timeZone);

  if (!document.cookie.split("; ").includes(`${TIME_ZONE_COOKIE}=${value}`)) {
    document.cookie = `${TIME_ZONE_COOKIE}=${value}; path=/; max-age=31536000; samesite=lax`;
  }
}

/// Tempo enviado e ainda não confirmado

/*
 * Tempo enviado que nenhum resumo do servidor confirmou ainda. Continua
 * somando na tela até a resposta chegar (sem isso, a contagem voltava ao
 * valor antigo do servidor enquanto o envio estava a caminho). Toda
 * mudança aqui vem junto de uma gravação da contagem ou de um resumo
 * novo, que avisam a tela.
 */
type SentEntry = Entry & { id: number };

let unconfirmed: SentEntry[] = [];
let nextSentId = 1;

function markSent(entries: Entry[]) {
  const sent = entries.map((entry) => ({ ...entry, id: nextSentId++ }));
  unconfirmed = [...unconfirmed, ...sent];

  return sent.map((entry) => entry.id);
}

/* Envio que falhou: volta para o pendente, para ir no próximo. */
function restorePending(entries: Entry[], sentIds: number[]) {
  const ids = new Set(sentIds);
  unconfirmed = unconfirmed.filter((item) => !ids.has(item.id));

  const data = readReadingTime();
  const pending = { ...data.pending };

  for (const { date, seconds } of entries) {
    pending[date] = (pending[date] ?? 0) + seconds * 1000;
  }

  writeReadingTime({ ...data, pending });
}

/*
 * Milissegundos de um dia que o resumo do servidor ainda não inclui: os
 * não enviados e os enviados sem resposta (a caminho, ou por beacon).
 */
export function getUnsyncedMs(date: string) {
  const sent = unconfirmed
    .filter((item) => item.date === date)
    .reduce((sum, item) => sum + item.seconds * 1000, 0);

  return (readReadingTime().pending[date] ?? 0) + sent;
}

/* Hoje no aparelho já passou da meta (contando o que não foi confirmado)? */
export function isGoalReachedLocally() {
  const summary = getSummary();

  if (!summary || summary.metToday) return false;

  const today = localDateKey(Date.now());

  if (summary.today !== today) return false;

  return summary.todaySeconds + getUnsyncedMs(today) / 1000 >= goalSeconds(summary.goalMinutes);
}

/// Envio

let isFlushing = false;

/*
 * Envia os segundos inteiros pendentes (a fração fica para a próxima).
 * "beacon": ao esconder/fechar a aba (sobrevive ao descarregamento, sem
 * resposta). "fetch": no resto do tempo; a resposta atualiza o resumo.
 */
export async function flushReadingTime(transport: "fetch" | "beacon") {
  const timeZone = getTimeZone();

  if (!timeZone || isFlushing) return;

  const data = readReadingTime();
  const entries: Entry[] = [];
  const remainder: Record<string, number> = {};

  for (const [date, ms] of Object.entries(data.pending)) {
    const seconds = Math.floor(ms / 1000);

    if (seconds > 0) entries.push({ date, seconds });
    if (ms - seconds * 1000 > 0) remainder[date] = ms - seconds * 1000;
  }

  /* Sem tempo novo, só pede o resumo se há envio por beacon sem confirmação. */
  if (entries.length === 0 && (transport === "beacon" || unconfirmed.length === 0)) return;

  /*
   * Tira do pendente antes de enviar (outra aba não envia o mesmo tempo) e
   * guarda como "a caminho" na mesma gravação: a tela não pisca.
   */
  const sentIds = markSent(entries);
  writeReadingTime({ ...data, pending: remainder });

  const body = JSON.stringify({ timeZone, entries });

  if (transport === "beacon") {
    const sent =
      typeof navigator !== "undefined" &&
      navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }));

    /* Enviado: fica "a caminho" até o próximo resumo do servidor. */
    if (!sent) restorePending(entries, sentIds);

    return;
  }

  /* O resumo da resposta inclui tudo o que foi enviado antes deste pedido. */
  const confirmedIds = new Set(unconfirmed.map((item) => item.id));
  isFlushing = true;

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });

    if (!response.ok) throw new Error(String(response.status));

    const next = (await response.json()) as StreakSummary;

    unconfirmed = unconfirmed.filter((item) => !confirmedIds.has(item.id));
    setSummary(next);
  } catch {
    /* Sem conexão ou erro: devolve para tentar de novo no próximo envio. */
    restorePending(entries, sentIds);
  } finally {
    isFlushing = false;
  }
}
