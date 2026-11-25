import {
  MAX_WIDGETS_PER_TAB,
  hasLooks,
  type DashboardArea,
  type DashboardLayout,
  type DashboardTab,
  type WidgetId,
  type WidgetLook,
} from "@/lib/dashboardLayout";

/*
 * Mudanças na arrumação do Início feitas pelo editor (DashboardEditor).
 * Funções puras: recebem a arrumação ou a aba e devolvem uma cópia.
 */

export const AREAS: DashboardArea[] = ["top", "bottom"];

export const AREA_SHORT_LABEL: Record<DashboardArea, string> = {
  top: "Em cima",
  bottom: "Embaixo",
};

function cloneTab(tab: DashboardTab): DashboardTab {
  return { ...tab, widgets: [...tab.widgets], looks: { ...tab.looks } };
}

export function cloneLayout(layout: DashboardLayout): DashboardLayout {
  return { top: layout.top.map(cloneTab), bottom: layout.bottom.map(cloneTab) };
}

/* Troca o item de lugar com o vizinho (delta -1: antes; 1: depois). */
export function swap<T>(items: T[], index: number, delta: number) {
  const target = index + delta;

  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];

  return next;
}

/* Aba nova, vazia (o id vai em atributos do HTML: só letras, números e hífen). */
export function createTab(): DashboardTab {
  return { id: `aba-${crypto.randomUUID().slice(0, 8)}`, label: "Nova aba", widgets: [] };
}

/* Aba com o visual de um widget trocado; sem `look`, volta ao padrão. */
export function withLook(
  tab: DashboardTab,
  widget: WidgetId,
  look: WidgetLook | undefined,
): DashboardTab {
  const looks = { ...tab.looks };

  if (look && hasLooks(widget)) looks[widget] = look;
  else delete looks[widget];

  return { ...tab, looks };
}

/* Tira o widget da posição `index` (e o visual escolhido para ele). */
export function removeWidget(tab: DashboardTab, index: number): DashboardTab {
  const widget = tab.widgets[index];
  const next = { ...tab, widgets: tab.widgets.filter((_, i) => i !== index) };

  return widget ? withLook(next, widget, undefined) : next;
}

export function addWidget(tab: DashboardTab, widget: WidgetId): DashboardTab {
  return { ...tab, widgets: [...tab.widgets, widget] };
}

function canReceive(tab: DashboardTab, widget: WidgetId) {
  return tab.widgets.length < MAX_WIDGETS_PER_TAB && !tab.widgets.includes(widget);
}

/*
 * Destino de "Mover…": "<area>:<id da aba>". Abas com espaço para o
 * widget, nos dois carrosséis, menos a de origem.
 */
export function destinationsFor(
  layout: DashboardLayout,
  area: DashboardArea,
  tabId: string,
  widget: WidgetId,
) {
  return AREAS.flatMap((targetArea) =>
    layout[targetArea]
      .filter(
        (tab) => !(targetArea === area && tab.id === tabId) && canReceive(tab, widget),
      )
      .map((tab) => ({
        value: `${targetArea}:${tab.id}`,
        label: `${AREA_SHORT_LABEL[targetArea]} › ${tab.label || "sem nome"}`,
      })),
  );
}

/*
 * Move um widget para outra aba (inclusive do outro carrossel), levando
 * o visual escolhido. Destino cheio ou inválido: nada muda.
 */
export function moveWidget(
  layout: DashboardLayout,
  fromArea: DashboardArea,
  fromTabId: string,
  index: number,
  target: string,
): DashboardLayout {
  const [toArea, toTabId] = target.split(":") as [DashboardArea, string];
  const origin = layout[fromArea].find((tab) => tab.id === fromTabId);
  const destination = layout[toArea]?.find((tab) => tab.id === toTabId);
  const widget = origin?.widgets[index];

  if (!origin || !widget || !destination || !canReceive(destination, widget)) {
    return layout;
  }

  const look = origin.looks?.[widget];
  const next = cloneLayout(layout);

  next[fromArea] = next[fromArea].map((tab) =>
    tab.id === fromTabId ? removeWidget(tab, index) : tab,
  );
  next[toArea] = next[toArea].map((tab) =>
    tab.id === toTabId ? withLook(addWidget(tab, widget), widget, look) : tab,
  );

  return next;
}
