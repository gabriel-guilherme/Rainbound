import StreakCard from "@/components/ReadingStreak/StreakCard";
import { getStreakSummary, getTimeZone } from "@/lib/streak/server";
import { requireApprovedUser } from "@/lib/auth/session";
import type { WidgetVariant } from "@/lib/dashboardLayout";

/*
 * "Sequência": dias seguidos lendo a meta diária. O servidor monta o
 * resumo (no fuso do aparelho, pelo cookie); o navegador soma o tempo
 * contado e ainda não enviado (components/ReadingStreak).
 */
export default async function StreakWidget({ variant }: { variant: WidgetVariant }) {
  const { id: userId } = await requireApprovedUser();
  const summary = await getStreakSummary(userId, await getTimeZone());

  return <StreakCard variant={variant} initial={summary} />;
}
