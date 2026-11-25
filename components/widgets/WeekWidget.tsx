import WeekCard from "@/components/reading-streak/WeekCard";
import { requireApprovedUser } from "@/lib/auth/session";
import type { WidgetVariant } from "@/lib/dashboardLayout";
import { addDays, MAX_WEEKS_BACK, weekStartOf } from "@/lib/streak/rules";
import { getReadingDays, getStreakSummary, getTimeZone, todayIn } from "@/lib/streak/server";

/*
 * "Minutos da semana": minutos lidos por dia, dos mesmos registros da
 * sequência (ReadingDay). Busca as semanas que as setas alcançam e mais
 * uma, para comparar a mais antiga com a anterior.
 */
export default async function WeekWidget({ variant }: { variant: WidgetVariant }) {
  const { id: userId } = await requireApprovedUser();
  const timeZone = await getTimeZone();
  const from = addDays(weekStartOf(todayIn(timeZone)), -7 * (MAX_WEEKS_BACK + 1));

  const [summary, days] = await Promise.all([
    getStreakSummary(userId, timeZone),
    getReadingDays(userId, from),
  ]);

  return <WeekCard variant={variant} initial={summary} days={days} />;
}
