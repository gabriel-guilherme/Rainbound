import { cookies } from "next/headers";

import { requireApprovedUser } from "@/lib/auth/session";

import DashboardEditor from "@/components/widgets/DashboardEditor";
import WidgetSection, {
  type WidgetSectionItem,
} from "@/components/widgets/WidgetSection";
import { WIDGETS } from "@/components/widgets/registry";
import {
  AREA_VARIANT,
  DASHBOARD_LAYOUT_COOKIE,
  readDashboardLayout,
  type DashboardArea,
  type DashboardLayout,
} from "@/lib/dashboardLayout";

const todayFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

/*
 * Colunas de cada carrossel: em cima um widget por linha (versão larga);
 * embaixo dois lado a lado a partir de md.
 */
const AREA_COLUMNS: Record<DashboardArea, (count: number) => string> = {
  top: () => "",
  bottom: (count) => (count > 1 ? "md:grid-cols-2" : ""),
};

/* Abas de um carrossel, já com os widgets na versão dele. */
function buildSections(
  layout: DashboardLayout,
  area: DashboardArea,
): WidgetSectionItem[] {
  return layout[area]
    .filter((tab) => tab.widgets.length > 0)
    .map((tab) => ({
      id: tab.id,
      label: tab.label,
      columnsClassName: AREA_COLUMNS[area](tab.widgets.length),
      /* Embaixo: no celular, os dois deslizam lado a lado. */
      mobileSlides: area === "bottom",
      content: tab.widgets.map((widgetId) => {
        const Widget = WIDGETS[widgetId];

        return <Widget key={widgetId} variant={AREA_VARIANT[area]} />;
      }),
    }));
}

export default async function DashBoardPage() {
  await requireApprovedUser();

  /* Arrumação deste aparelho (cookie); sem cookie, a padrão. */
  const layout = readDashboardLayout(
    (await cookies()).get(DASHBOARD_LAYOUT_COOKIE)?.value,
  );

  const topSections = buildSections(layout, "top");
  const bottomSections = buildSections(layout, "bottom");

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
