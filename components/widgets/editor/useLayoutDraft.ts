"use client";

import { useState } from "react";

import {
  parseDashboardLayout,
  type DashboardArea,
  type DashboardLayout,
  type WidgetId,
  type WidgetLook,
} from "@/lib/dashboardLayout";

import {
  addWidget,
  cloneLayout,
  createTab,
  findTab,
  moveWidget,
  removeWidget,
  swap,
  updateTab,
  widgetAt,
  withLook,
  type WidgetSlot,
} from "./layoutEdits";

type TabRef = { area: DashboardArea; tabId: string };

const NO_ACTIVE_TABS: Record<DashboardArea, string | null> = { top: null, bottom: null };

/*
 * Estado do editor de widgets: o rascunho da arrumação, a aba aberta no
 * mapa de cada carrossel, o widget escolhido (painel) e a aba que está
 * recebendo um widget (catálogo). As ações de aba agem sobre a aba aberta
 * no carrossel; as de widget, sobre o widget escolhido. As mudanças em
 * si ficam em layoutEdits.ts.
 */
export function useLayoutDraft(initial: DashboardLayout) {
  const [draft, setDraft] = useState(initial);
  const [activeTabs, setActiveTabs] = useState(NO_ACTIVE_TABS);
  const [selected, setSelected] = useState<WidgetSlot | null>(null);
  const [catalogTarget, setCatalogTarget] = useState<TabRef | null>(null);

  /* Widget escolhido, se ainda existe no rascunho. */
  const selection = selected && widgetAt(draft, selected) ? selected : null;

  /* Aba mostrada no mapa: a escolhida ou, sem ela, a primeira. */
  function currentTabOf(area: DashboardArea) {
    const active = activeTabs[area];

    return (active && findTab(draft, area, active)) || draft[area][0] || null;
  }

  function showTab(area: DashboardArea, tabId: string | null) {
    setActiveTabs((current) => ({ ...current, [area]: tabId }));
  }

  /* Recomeça a partir de uma arrumação (ao abrir o editor). */
  function reset(layout: DashboardLayout) {
    setDraft(cloneLayout(layout));
    setActiveTabs(NO_ACTIVE_TABS);
    setSelected(null);
    setCatalogTarget(null);
  }

  /// Abas

  function pickTab(area: DashboardArea, tabId: string) {
    showTab(area, tabId);
    if (selection?.area === area) setSelected(null);
  }

  function addTab(area: DashboardArea) {
    const tab = createTab();

    setDraft((current) => ({ ...current, [area]: [...current[area], tab] }));
    pickTab(area, tab.id);
  }

  function renameTab(area: DashboardArea, label: string) {
    const tab = currentTabOf(area);

    if (tab) setDraft((current) => updateTab(current, area, tab.id, (item) => ({ ...item, label })));
  }

  function moveTab(area: DashboardArea, delta: -1 | 1) {
    const tab = currentTabOf(area);

    if (!tab) return;

    setDraft((current) => {
      const index = current[area].findIndex((item) => item.id === tab.id);

      return { ...current, [area]: swap(current[area], index, delta) };
    });
  }

  /* Apaga a aba aberta e abre a vizinha. */
  function deleteTab(area: DashboardArea) {
    const tab = currentTabOf(area);

    if (!tab) return;

    const index = draft[area].indexOf(tab);
    const neighbor = draft[area][index + 1] ?? draft[area][index - 1] ?? null;

    setDraft((current) => ({
      ...current,
      [area]: current[area].filter((item) => item.id !== tab.id),
    }));
    showTab(area, neighbor?.id ?? null);
    if (selection?.area === area && selection.tabId === tab.id) setSelected(null);
  }

  /// Widget escolhido

  function selectWidget(area: DashboardArea, index: number) {
    const tab = currentTabOf(area);

    if (tab) setSelected({ area, tabId: tab.id, index });
  }

  function clearSelection() {
    setSelected(null);
  }

  function setLook(look: WidgetLook) {
    if (!selection) return;

    const { area, tabId, index } = selection;

    setDraft((current) =>
      updateTab(current, area, tabId, (tab) => withLook(tab, tab.widgets[index], look)),
    );
  }

  /* Troca de lugar com o vizinho na mesma aba. */
  function moveWithinTab(delta: -1 | 1) {
    if (!selection) return;

    const tab = findTab(draft, selection.area, selection.tabId);
    const target = selection.index + delta;

    if (!tab || target < 0 || target >= tab.widgets.length) return;

    setDraft((current) =>
      updateTab(current, selection.area, selection.tabId, (item) => ({
        ...item,
        widgets: swap(item.widgets, selection.index, delta),
      })),
    );
    setSelected({ ...selection, index: target });
  }

  /* Leva para outra aba, que passa a ficar aberta no mapa. */
  function moveToTab(area: DashboardArea, tabId: string) {
    if (!selection) return;

    const result = moveWidget(draft, selection, { area, tabId });

    if (!result) return;

    setDraft(result.layout);
    setSelected(result.slot);
    showTab(area, tabId);
  }

  function removeSelected() {
    if (!selection) return;

    const { area, tabId, index } = selection;

    setDraft((current) => updateTab(current, area, tabId, (tab) => removeWidget(tab, index)));
    setSelected(null);
  }

  /// Catálogo

  /* Abre o catálogo para a aba aberta no carrossel. */
  function openCatalog(area: DashboardArea) {
    const tab = currentTabOf(area);

    if (tab) setCatalogTarget({ area, tabId: tab.id });
  }

  function closeCatalog() {
    setCatalogTarget(null);
  }

  /* Adiciona na aba do catálogo e já deixa o widget novo escolhido. */
  function addFromCatalog(widget: WidgetId) {
    if (!catalogTarget) return;

    const tab = findTab(draft, catalogTarget.area, catalogTarget.tabId);

    if (!tab) return;

    setDraft((current) =>
      updateTab(current, catalogTarget.area, catalogTarget.tabId, (item) => addWidget(item, widget)),
    );
    setSelected({ ...catalogTarget, index: tab.widgets.length });
    setCatalogTarget(null);
  }

  return {
    draft,
    isValid: parseDashboardLayout(draft) !== null,
    selection,
    catalogTarget,
    currentTabOf,
    reset,
    pickTab,
    addTab,
    renameTab,
    moveTab,
    deleteTab,
    selectWidget,
    clearSelection,
    setLook,
    moveWithinTab,
    moveToTab,
    removeSelected,
    openCatalog,
    closeCatalog,
    addFromCatalog,
  };
}
