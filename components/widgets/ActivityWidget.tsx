import ActivityCard from "@/components/reading-streak/ActivityCard";
import { getReadingDays, getStreakSummary } from "@/lib/streak/server";

import type { WidgetProps } from "./types";

/*
 * "Atividade do ano": mapa dos dias lidos, a partir dos mesmos registros
 * da sequência (ReadingDay). Para o próprio dono, o navegador soma o tempo
 * de hoje ainda não enviado (components/reading-streak).
 */
export default async function ActivityWidget({ variant, owner, isOwner }: WidgetProps) {
  const [summary, days] = await Promise.all([
    getStreakSummary(owner.id, owner.timeZone),
    getReadingDays(owner.id),
  ]);

  return <ActivityCard variant={variant} initial={summary} days={days} isOwner={isOwner} />;
}
