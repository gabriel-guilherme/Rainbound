import {
  AREA_VARIANT,
  getWidgetLook,
  type DashboardArea,
  type DashboardLayout,
} from "@/lib/dashboardLayout";

import { WIDGETS } from "./registry";
import type { WidgetOwner } from "./types";
import type { WidgetSectionItem } from "./WidgetSection";

/*
 * Colunas de cada carrossel: em cima um widget por linha (versão larga);
 * embaixo dois lado a lado a partir de md.
 */
const AREA_COLUMNS: Record<DashboardArea, (count: number) => string> = {
  top: () => "",
  bottom: (count) => (count > 1 ? "md:grid-cols-2" : ""),
};

/*
 * Abas de um carrossel (WidgetSection), já com os widgets na versão dele
 * e com os dados do dono. Usado na home (dono = quem está logado) e no
 * perfil (dono do perfil; `isOwner` falso para quem visita).
 */
export function buildWidgetSections(
  layout: DashboardLayout,
  area: DashboardArea,
  owner: WidgetOwner,
  isOwner: boolean,
): WidgetSectionItem[] {
  const variant = AREA_VARIANT[area];

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

        return (
          <Widget
            key={widgetId}
            variant={variant}
            look={getWidgetLook(tab, widgetId, variant)}
            owner={owner}
            isOwner={isOwner}
          />
        );
      }),
    }));
}
