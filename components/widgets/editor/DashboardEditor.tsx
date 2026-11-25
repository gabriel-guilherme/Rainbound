"use client";

import { LayoutGrid, Plus, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import {
  resetDashboardLayout,
  saveDashboardLayout,
} from "@/app/(main)/dashboard/actions";
import {
  AREA_LABEL,
  AREA_VARIANT,
  MAX_TABS_PER_AREA,
  MAX_WIDGETS_PER_TAB,
  parseDashboardLayout,
  type DashboardArea,
  type DashboardLayout,
  type DashboardTab,
} from "@/lib/dashboardLayout";

import EditorTab from "./EditorTab";
import { iconButtonClass } from "./editorStyles";
import {
  AREAS,
  cloneLayout,
  createTab,
  destinationsFor,
  moveWidget,
  swap,
} from "./layoutEdits";

const AREA_HINT: Record<DashboardArea, string> = {
  top: `Até ${MAX_WIDGETS_PER_TAB} por aba, um embaixo do outro.`,
  bottom: `Até ${MAX_WIDGETS_PER_TAB} por aba, lado a lado.`,
};

/*
 * Editor da arrumação do Início: abas de cada carrossel, quais widgets
 * ficam em cada aba e em que ordem. A versão do widget segue o
 * carrossel (em cima: larga; embaixo: lado a lado); os widgets de
 * WIDGETS_WITH_LOOKS também escolhem capa ou lombada. Salva num cookie
 * deste aparelho (saveDashboardLayout).
 *
 * Peças: EditorTab (uma aba) → EditorWidgetRow (um widget); as mudanças
 * na arrumação ficam em layoutEdits.ts.
 */
export default function DashboardEditor({ layout }: { layout: DashboardLayout }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(layout);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const isValid = parseDashboardLayout(draft) !== null;

  function open() {
    setDraft(cloneLayout(layout));
    setError("");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  function updateTabs(
    area: DashboardArea,
    update: (tabs: DashboardTab[]) => DashboardTab[],
  ) {
    setDraft((current) => ({ ...current, [area]: update(current[area]) }));
  }

  function updateTab(
    area: DashboardArea,
    tabId: string,
    update: (tab: DashboardTab) => DashboardTab,
  ) {
    updateTabs(area, (tabs) =>
      tabs.map((tab) => (tab.id === tabId ? update(tab) : tab)),
    );
  }

  function run(action: () => Promise<void>, message: string) {
    setError("");

    startTransition(async () => {
      try {
        await action();
        close();
      } catch (actionError) {
        console.error(actionError);
        setError(message);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className="btn-shelf text-contrast ring-2 ring-inset ring-contrast/20 hover:bg-primary hover:ring-primary"
      >
        <LayoutGrid size={18} aria-hidden="true" />
        Editar widgets
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="dashboard-editor-title"
        className="m-auto max-h-[88dvh] w-[min(56rem,calc(100vw-2rem))] overflow-y-auto bg-primary p-0 text-contrast shadow-[8px_8px_0_rgb(0_0_0/0.5)] backdrop:bg-darkest/80"
      >
        <div className="flex items-center justify-between gap-3 border-b border-contrast/10 px-5 py-4">
          <h2 id="dashboard-editor-title" className="title-shelf text-3xl">
            Widgets do Início
          </h2>

          <button
            type="button"
            onClick={close}
            aria-label="Fechar"
            className={iconButtonClass}
          >
            <X size={18} />
          </button>
        </div>

        <p className="px-5 pt-4 text-sm text-contrast/55">
          Cada widget tem uma versão para cada carrossel: em cima ele aparece
          largo e baixo; embaixo, mais estreito, ao lado de outro. Alguns
          também mudam entre capas e lombadas. Vale só para este aparelho.
        </p>

        <div className="grid grid-cols-1 gap-6 p-5 md:grid-cols-2">
          {AREAS.map((area) => (
            <section key={area} aria-labelledby={`editor-area-${area}`} className="flex flex-col gap-3">
              <div>
                <h3 id={`editor-area-${area}`} className="font-display text-xl font-bold uppercase tracking-wide">
                  {AREA_LABEL[area]}
                </h3>
                <p className="text-xs text-contrast/45">{AREA_HINT[area]}</p>
              </div>

              {draft[area].length === 0 && (
                <p className="border border-dashed border-contrast/15 px-3 py-4 text-center text-sm text-contrast/45">
                  Sem abas: este carrossel não aparece.
                </p>
              )}

              {draft[area].map((tab, tabIndex) => (
                <EditorTab
                  key={tab.id}
                  tab={tab}
                  variant={AREA_VARIANT[area]}
                  tabIndex={tabIndex}
                  tabCount={draft[area].length}
                  destinationsFor={(widget) => destinationsFor(draft, area, tab.id, widget)}
                  onChange={(update) => updateTab(area, tab.id, update)}
                  onMoveTab={(delta) => updateTabs(area, (tabs) => swap(tabs, tabIndex, delta))}
                  onDelete={() =>
                    updateTabs(area, (tabs) => tabs.filter((item) => item.id !== tab.id))
                  }
                  onRelocateWidget={(index, target) =>
                    setDraft((current) => moveWidget(current, area, tab.id, index, target))
                  }
                />
              ))}

              <button
                type="button"
                onClick={() => updateTabs(area, (tabs) => [...tabs, createTab()])}
                disabled={draft[area].length >= MAX_TABS_PER_AREA}
                className="flex cursor-pointer items-center justify-center gap-1.5 border border-dashed border-contrast/20 px-3 py-2 text-xs uppercase tracking-widest text-contrast/60 transition-colors hover:border-contrast/40 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={14} aria-hidden="true" />
                Nova aba
              </button>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-contrast/10 px-5 py-4">
          <button
            type="button"
            onClick={() => run(resetDashboardLayout, "Não foi possível restaurar o padrão.")}
            disabled={isPending}
            className="cursor-pointer text-sm text-contrast/55 underline-offset-4 hover:text-danger hover:underline disabled:opacity-40"
          >
            Restaurar padrão
          </button>

          <div className="flex items-center gap-2">
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            {!isValid && !error && (
              <p className="text-sm text-danger">Toda aba precisa de um nome.</p>
            )}

            <button
              type="button"
              onClick={close}
              className="btn-shelf text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() =>
                run(
                  () => saveDashboardLayout(draft),
                  "Não foi possível salvar. Confira os nomes das abas.",
                )
              }
              disabled={!isValid || isPending}
              className="btn-shelf bg-danger text-primary hover:bg-contrast disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
