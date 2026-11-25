import { cookies } from "next/headers";

import { requireApprovedUser } from "@/lib/auth/session";

import DashboardEditor from "@/components/widgets/editor/DashboardEditor";
import WidgetSection from "@/components/widgets/WidgetSection";
import { buildWidgetSections } from "@/components/widgets/buildWidgetSections";
import { DASHBOARD_LAYOUT_COOKIE, readDashboardLayout } from "@/lib/dashboardLayout";
import { getTimeZone } from "@/lib/streak/server";

const todayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function DashBoardPage() {
  const { id: userId } = await requireApprovedUser();

  /* Arrumação deste aparelho (cookie); sem cookie, a padrão. */
  const layout = readDashboardLayout(
    (await cookies()).get(DASHBOARD_LAYOUT_COOKIE)?.value,
  );

  /* Na home, os widgets mostram os dados de quem está logado (fuso do aparelho). */
  const owner = { id: userId, timeZone: await getTimeZone() };
  const topSections = buildWidgetSections(layout, "top", owner, true);
  const bottomSections = buildWidgetSections(layout, "bottom", owner, true);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 pt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="title-shelf text-5xl text-contrast sm:text-6xl">Início</h1>

          <p className="mt-2 text-sm text-contrast/50 first-letter:uppercase">
            {todayFormatter.format(new Date())}
          </p>
        </div>

        <DashboardEditor layout={layout} />
      </div>

      {topSections.length > 0 && (
        <WidgetSection label="Widgets de cima" sections={topSections} />
      )}

      {bottomSections.length > 0 && (
        <WidgetSection label="Widgets de baixo" sections={bottomSections} />
      )}

      {topSections.length === 0 && bottomSections.length === 0 && (
        <p className="py-16 text-center text-contrast/50">
          Nenhum widget no Início. Use &quot;Editar widgets&quot; para colocar alguns.
        </p>
      )}
    </div>
  );
}
