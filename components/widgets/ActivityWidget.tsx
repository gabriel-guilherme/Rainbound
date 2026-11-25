import ActivityCard from "@/components/reading-streak/ActivityCard";
import { requireApprovedUser } from "@/lib/auth/session";
import type { WidgetVariant } from "@/lib/dashboardLayout";
import { getReadingDays, getStreakSummary, getTimeZone } from "@/lib/streak/server";

/*
 * "Atividade do ano": mapa dos dias lidos, a partir dos mesmos registros
 * da sequência (ReadingDay). O navegador soma o tempo de hoje ainda não
 * enviado (components/reading-streak).
 */
export default async function ActivityWidget({ variant }: { variant: WidgetVariant }) {
  const { id: userId } = await requireApprovedUser();
  const timeZone = await getTimeZone();

  const [summary, days] = await Promise.all([
    getStreakSummary(userId, timeZone),
    getReadingDays(userId),
  ]);

  return <ActivityCard variant={variant} initial={summary} days={days} />;
}
