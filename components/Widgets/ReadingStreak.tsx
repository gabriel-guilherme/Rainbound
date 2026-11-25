import StreakWidget from "@/components/ReadingStreak/StreakWidget";
import { getStreakSummary, getTimeZone } from "@/lib/readingStreak";
import { requireApprovedUser } from "@/lib/session";
import type { WidgetVariant } from "@/lib/dashboardLayout";

/*
 * "Sequência": dias seguidos lendo a meta diária. O servidor monta o
 * resumo (no fuso do aparelho, pelo cookie); o navegador soma o tempo
 * contado e ainda não enviado (components/ReadingStreak).
 */
export default async function ReadingStreak({ variant }: { variant: WidgetVariant }) {
  const { id: userId } = await requireApprovedUser();
  const summary = await getStreakSummary(userId, await getTimeZone());

  return <StreakWidget variant={variant} initial={summary} />;
}
