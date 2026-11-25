import StreakCard from "@/components/reading-streak/StreakCard";
import { getStreakSummary } from "@/lib/streak/server";

import type { WidgetProps } from "./types";

/*
 * "Sequência": dias seguidos lendo a meta diária. O servidor monta o
 * resumo no fuso do dono; para o próprio dono, o navegador soma o tempo
 * contado e ainda não enviado (components/reading-streak).
 */
export default async function StreakWidget({ variant, owner, isOwner }: WidgetProps) {
  const summary = await getStreakSummary(owner.id, owner.timeZone);

  return <StreakCard variant={variant} initial={summary} isOwner={isOwner} />;
}
