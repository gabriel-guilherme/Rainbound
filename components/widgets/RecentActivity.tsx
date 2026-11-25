import ActivityItem from "@/components/profile/ActivityItem";
import { getRecentActivity } from "@/lib/reading/activity";

import type { WidgetProps } from "./types";
import WidgetCard from "./WidgetCard";

function activityNow() {
  return Date.now();
}

/*
 * "Atividade recente": começou, terminou e marcos da sequência dos
 * últimos meses (lib/reading/activity.ts), do mais novo ao mais antigo.
 * - wide: duas colunas;
 * - tall: uma coluna, menos itens.
 */
export default async function RecentActivity({ variant, owner, isOwner }: WidgetProps) {
  const events = await getRecentActivity(owner.id, owner.timeZone, variant === "wide" ? 8 : 5);
  const now = activityNow();

  return (
    <WidgetCard title="Atividade recente">
      {events.length === 0 ? (
        <p className="text-sm text-contrast/60">
          {isOwner ? "Nada por aqui ainda. Comece um livro!" : "Nenhuma atividade nos últimos meses."}
        </p>
      ) : (
        <ol className={variant === "wide" ? "grid gap-x-8 md:grid-cols-2" : "flex flex-col"}>
          {events.map((event, index) => (
            <li
              key={`${event.kind}-${index}`}
              className={`border-t border-contrast/10 first:border-t-0 ${
                variant === "wide" ? "md:[&:nth-child(2)]:border-t-0" : ""
              }`}
            >
              <ActivityItem event={event} isMine={isOwner} now={now} />
            </li>
          ))}
        </ol>
      )}
    </WidgetCard>
  );
}
