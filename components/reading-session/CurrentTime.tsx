"use client";

import { formatClock } from "./sessionTime";
import { useNow } from "@/lib/useNow";

type CurrentTimeProps = {
  className?: string;
};

/*
 * Hora atual ("21:40"), do relógio do navegador. Antes da hidratação não
 * mostra nada: a hora do servidor não é a de quem está lendo.
 */
export default function CurrentTime({ className = "" }: CurrentTimeProps) {
  const now = useNow();

  return (
    <time
      dateTime={now === null ? undefined : new Date(now).toISOString()}
      className={["tabular-nums", className].join(" ")}
    >
      {now === null ? "" : formatClock(now)}
    </time>
  );
}
