/*
 * Tipos e textos da atividade recente, sem nada de servidor: usados também
 * por componentes que rodam no navegador (aba Atividade de /pessoas).
 * A montagem dos eventos fica em activity.ts.
 */

type EventBase = { userId: string; at: Date };

export type ActivityEvent =
  | (EventBase & { kind: "started"; bookId: number; title: string; coverUrl: string | null })
  | (EventBase & {
      kind: "finished";
      bookId: number;
      title: string;
      coverUrl: string | null;
      rating: number | null;
    })
  | (EventBase & { kind: "streak"; days: number });

const DAY_MS = 24 * 60 * 60 * 1000;

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });

/* "hoje", "ontem", "há 3 dias", "há 2 semanas" ou a data. */
export function formatActivityWhen(at: Date, now: number) {
  const days = Math.floor((now - at.getTime()) / DAY_MS);

  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  if (days < 7) return `há ${days} dias`;
  if (days < 35) {
    const weeks = Math.floor(days / 7);

    return `há ${weeks} ${weeks === 1 ? "semana" : "semanas"}`;
  }

  return shortDateFormatter.format(at);
}
