"use client";

import { ArrowLeft } from "lucide-react";

import {
  AREA_VARIANT,
  WIDGET_IDS,
  WIDGET_INFO,
  defaultLookFor,
  hasLooks,
  type DashboardArea,
  type DashboardLayout,
  type WidgetId,
} from "@/lib/dashboardLayout";

import { iconButtonClass, sectionLabelClass } from "./editorStyles";
import { AREA_SHORT_LABEL, findTab, placesOf } from "./layoutEdits";
import WidgetThumb from "./WidgetThumb";

/* Grupos do catálogo, na ordem em que aparecem. */
const GROUPS: { title: string; widgets: WidgetId[] }[] = [
  { title: "Livros", widgets: ["reading", "queue", "recent", "nearly", "stalled"] },
  { title: "Tempo e ritmo de leitura", widgets: ["session", "streak", "activity", "week", "feed"] },
  { title: "Estante", widgets: ["status"] },
];

/* Widget novo que não entrou em nenhum grupo vai para o fim. */
const UNGROUPED = WIDGET_IDS.filter(
  (widget) => !GROUPS.some((group) => group.widgets.includes(widget)),
);

const CATALOG = UNGROUPED.length > 0 ? [...GROUPS, { title: "Outros", widgets: UNGROUPED }] : GROUPS;

type WidgetCatalogProps = {
  layout: DashboardLayout;
  target: { area: DashboardArea; tabId: string };
  hiddenWidgets: readonly WidgetId[];
  onAdd: (widget: WidgetId) => void;
  onClose: () => void;
};

/*
 * Catálogo para adicionar um widget numa aba: miniatura, descrição e onde
 * mais ele já está. Os que já estão na aba ficam desativados.
 */
export default function WidgetCatalog({
  layout,
  target,
  hiddenWidgets,
  onAdd,
  onClose,
}: WidgetCatalogProps) {
  const tab = findTab(layout, target.area, target.tabId);

  if (!tab) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-catalog-title"
      className="fixed inset-0 z-10 flex items-center justify-center bg-darkest/75 md:p-6"
    >
      <div className="flex max-h-full w-full flex-col overflow-y-auto bg-primary shadow-[8px_8px_0_rgb(0_0_0/0.5)] max-md:h-full md:max-h-[85dvh] md:max-w-3xl">
        <div className="flex items-center gap-2 border-b border-contrast/10 px-4 py-3 md:px-5">
          <button type="button" onClick={onClose} aria-label="Voltar ao mapa" className={iconButtonClass}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h3 id="widget-catalog-title" className="title-shelf text-2xl">
              Adicionar widget
            </h3>
            <p className="text-xs text-contrast/70">
              Em {AREA_SHORT_LABEL[target.area]} › {tab.label.trim() || "sem nome"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-5 p-4 md:p-5">
          {CATALOG.map((group) => ({
            ...group,
            widgets: group.widgets.filter((widget) => !hiddenWidgets.includes(widget)),
          }))
            .filter((group) => group.widgets.length > 0)
            .map((group) => (
            <section key={group.title} className="flex flex-col gap-2">
              <h4 className={sectionLabelClass}>{group.title}</h4>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {group.widgets.map((widget) => {
                  const isInTab = tab.widgets.includes(widget);
                  const elsewhere = placesOf(layout, widget, target);
                  const note = isInTab
                    ? "Já está nesta aba"
                    : elsewhere.length > 0
                      ? `Também em ${elsewhere.join(", ")}`
                      : "Adicionar";

                  return (
                    <button
                      key={widget}
                      type="button"
                      onClick={() => onAdd(widget)}
                      disabled={isInTab}
                      className="grid cursor-pointer grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3 bg-secondary p-2.5 text-left transition-colors hover:bg-secondary/70 disabled:cursor-not-allowed disabled:opacity-45 md:grid-cols-1 md:items-start"
                    >
                      <span className="flex h-12 items-end overflow-hidden bg-darkest/45 px-2 py-1.5">
                        <WidgetThumb
                          widget={widget}
                          look={hasLooks(widget) ? defaultLookFor(widget, AREA_VARIANT[target.area]) : undefined}
                          size="sm"
                        />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-sm font-semibold">{WIDGET_INFO[widget].label}</span>
                        <span className="text-xs text-contrast/75">{WIDGET_INFO[widget].description}</span>
                        <span className={`text-xs ${isInTab || elsewhere.length > 0 ? "text-contrast/70" : "text-danger"}`}>
                          {note}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
