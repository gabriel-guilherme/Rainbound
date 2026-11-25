/*
 * Textos das notificações (servidor e navegador).
 */

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });

/* "agora", "há 12 min", "há 3 h", "ontem", "há 4 dias" ou a data. */
export function formatNotificationWhen(at: Date | string, now: number) {
  const time = new Date(at).getTime();
  const diff = Math.max(now - time, 0);

  if (diff < MINUTE_MS) return "agora";
  if (diff < HOUR_MS) return `há ${Math.floor(diff / MINUTE_MS)} min`;
  if (diff < DAY_MS) return `há ${Math.floor(diff / HOUR_MS)} h`;

  const days = Math.floor(diff / DAY_MS);

  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;

  return dateFormatter.format(new Date(time));
}

/* "Marina", "Marina e Caio", "Marina, Caio e mais 2". */
export function formatActorNames(names: string[]) {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} e ${names[1]}`;

  return `${names[0]}, ${names[1]} e mais ${names.length - 2}`;
}
