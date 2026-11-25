import {
  AREA_VARIANT,
  MAX_WIDGETS_PER_TAB,
  getWidgetLook,
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

/* Um widget no editor: carrossel, aba e posição dentro da aba. */
export type WidgetSlot = { area: DashboardArea; tabId: string; index: number };

function cloneTab(tab: DashboardTab): DashboardTab {
  return { ...tab, widgets: [...tab.widgets], looks: { ...tab.looks } };
}

export function cloneLayout(layout: DashboardLayout): DashboardLayout {
  return { top: layout.top.map(cloneTab), bottom: layout.bottom.map(cloneTab) };
}

export function findTab(layout: DashboardLayout, area: DashboardArea, tabId: string) {
  return layout[area].find((tab) => tab.id === tabId) ?? null;
}

/* Widget de uma posição; null se a posição não existe mais. */
export function widgetAt(layout: DashboardLayout, slot: WidgetSlot) {
  return findTab(layout, slot.area, slot.tabId)?.widgets[slot.index] ?? null;
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

/* Muda uma aba de um carrossel. */
export function updateTab(
  layout: DashboardLayout,
  area: DashboardArea,
  tabId: string,
  update: (tab: DashboardTab) => DashboardTab,
): DashboardLayout {
  return {
    ...layout,
    [area]: layout[area].map((tab) => (tab.id === tabId ? update(tab) : tab)),
  };
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

export function canReceive(tab: DashboardTab, widget: WidgetId) {
  return tab.widgets.length < MAX_WIDGETS_PER_TAB && !tab.widgets.includes(widget);
}

/* "Em cima › Fila" de cada aba que tem o widget (menos a de `except`). */
export function placesOf(
  layout: DashboardLayout,
  widget: WidgetId,
  except?: { area: DashboardArea; tabId: string },
) {
  return AREAS.flatMap((area) =>
    layout[area]
      .filter(
        (tab) =>
          tab.widgets.includes(widget) &&
          !(except && except.area === area && except.tabId === tab.id),
      )
      .map((tab) => `${AREA_SHORT_LABEL[area]} › ${tab.label || "sem nome"}`),
  );
}

/*
 * Move um widget para o fim de outra aba (inclusive do outro carrossel).
 * Leva o visual que ele mostra agora, para não mudar sozinho ao trocar
 * de carrossel. Destino cheio ou inválido: null.
 */
export function moveWidget(
  layout: DashboardLayout,
  from: WidgetSlot,
  to: { area: DashboardArea; tabId: string },
): { layout: DashboardLayout; slot: WidgetSlot } | null {
  const origin = findTab(layout, from.area, from.tabId);
  const destination = findTab(layout, to.area, to.tabId);
  const widget = origin?.widgets[from.index];

  if (!origin || !widget || !destination || !canReceive(destination, widget)) {
    return null;
  }

  const look = hasLooks(widget)
    ? getWidgetLook(origin, widget, AREA_VARIANT[from.area])
    : undefined;

  const removed = updateTab(layout, from.area, from.tabId, (tab) =>
    removeWidget(tab, from.index),
  );
  const next = updateTab(removed, to.area, to.tabId, (tab) =>
    withLook(addWidget(tab, widget), widget, look),
  );

  return {
    layout: next,
    slot: { ...to, index: destination.widgets.length },
  };
}
