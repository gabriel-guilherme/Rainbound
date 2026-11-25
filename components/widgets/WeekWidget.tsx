import WeekCard from "@/components/reading-streak/WeekCard";
import { addDays, MAX_WEEKS_BACK, weekStartOf } from "@/lib/streak/rules";
import { getReadingDays, getStreakSummary, todayIn } from "@/lib/streak/server";

import type { WidgetProps } from "./types";

/*
 * "Minutos da semana": minutos lidos por dia, dos mesmos registros da
 * sequência (ReadingDay). Busca as semanas que as setas alcançam e mais
 * uma, para comparar a mais antiga com a anterior.
 */
export default async function WeekWidget({ variant, owner, isOwner }: WidgetProps) {
  const from = addDays(weekStartOf(todayIn(owner.timeZone)), -7 * (MAX_WEEKS_BACK + 1));

  const [summary, days] = await Promise.all([
    getStreakSummary(owner.id, owner.timeZone),
    getReadingDays(owner.id, from),
  ]);

  return <WeekCard variant={variant} initial={summary} days={days} isOwner={isOwner} />;
}
