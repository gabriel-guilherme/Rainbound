"use client";

import {
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState, useTransition } from "react";

import {
  resetDashboardLayout,
  saveDashboardLayout,
} from "@/app/(main)/dashboard/actions";
import {
  AREA_LABEL,
  MAX_TAB_LABEL_LENGTH,
  MAX_TABS_PER_AREA,
  MAX_WIDGETS_PER_TAB,
  WIDGET_IDS,
  WIDGET_INFO,
  isWidgetId,
  parseDashboardLayout,
  type DashboardArea,
  type DashboardLayout,
  type DashboardTab,
  type WidgetId,
} from "@/lib/dashboardLayout";

const AREAS: DashboardArea[] = ["top", "bottom"];

const AREA_HINT: Record<DashboardArea, string> = {
  top: `Até ${MAX_WIDGETS_PER_TAB} por aba, um embaixo do outro.`,
  bottom: `Até ${MAX_WIDGETS_PER_TAB} por aba, lado a lado.`,
};

const iconButtonClass =
  "flex size-8 shrink-0 cursor-pointer items-center justify-center text-contrast/60 transition-colors hover:bg-contrast/10 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-25";

const selectClass =
  "min-w-0 cursor-pointer border border-contrast/15 bg-darkest px-2 py-1 text-xs text-contrast outline-none focus:border-interaction max-sm:text-base";

function cloneLayout(layout: DashboardLayout): DashboardLayout {
  return {
    top: layout.top.map((tab) => ({ ...tab, widgets: [...tab.widgets] })),
    bottom: layout.bottom.map((tab) => ({ ...tab, widgets: [...tab.widgets] })),
  };
}

function swap<T>(items: T[], index: number, delta: number) {
  const target = index + delta;

  if (target < 0 || target >= items.length) return items;

  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];

  return next;
}

/*
 * Editor da arrumação do Início: abas de cada carrossel, quais widgets
 * ficam em cada aba e em que ordem. A versão do widget segue o
 * carrossel (em cima: larga; embaixo: lado a lado). Salva num cookie
 * deste aparelho (saveDashboardLayout).
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

  function addTab(area: DashboardArea) {
    const id = `aba-${crypto.randomUUID().slice(0, 8)}`;

    updateTabs(area, (tabs) => [...tabs, { id, label: "Nova aba", widgets: [] }]);
  }

  /* Move um widget para outra aba (inclusive do outro carrossel). */
  function relocateWidget(
    fromArea: DashboardArea,
    fromTabId: string,
    index: number,
    target: string,
  ) {
    const [toArea, toTabId] = target.split(":") as [DashboardArea, string];

    setDraft((current) => {
      const widget = current[fromArea].find((tab) => tab.id === fromTabId)
        ?.widgets[index];
      const destination = current[toArea].find((tab) => tab.id === toTabId);

      if (
        !widget ||
        !destination ||
        destination.widgets.length >= MAX_WIDGETS_PER_TAB ||
        destination.widgets.includes(widget)
      ) {
        return current;
      }

      const next = cloneLayout(current);

      next[fromArea] = next[fromArea].map((tab) =>
        tab.id === fromTabId
          ? { ...tab, widgets: tab.widgets.filter((_, i) => i !== index) }
          : tab,
      );
      next[toArea] = next[toArea].map((tab) =>
        tab.id === toTabId ? { ...tab, widgets: [...tab.widgets, widget] } : tab,
      );

      return next;
    });
  }

  function save() {
    setError("");

    startTransition(async () => {
      try {
        await saveDashboardLayout(draft);
        close();
      } catch (saveError) {
        console.error(saveError);
        setError("Não foi possível salvar. Confira os nomes das abas.");
      }
    });
  }

  function reset() {
    setError("");

    startTransition(async () => {
      try {
        await resetDashboardLayout();
        close();
      } catch (resetError) {
        console.error(resetError);
        setError("Não foi possível restaurar o padrão.");
      }
    });
  }

  /* Abas com espaço para receber o widget, nos dois carrosséis. */
  function destinationsFor(
    area: DashboardArea,
    tabId: string,
    widget: WidgetId,
  ) {
    return AREAS.flatMap((targetArea) =>
      draft[targetArea]
        .filter(
          (tab) =>
            !(targetArea === area && tab.id === tabId) &&
            tab.widgets.length < MAX_WIDGETS_PER_TAB &&
            !tab.widgets.includes(widget),
        )
        .map((tab) => ({
          value: `${targetArea}:${tab.id}`,
          label: `${targetArea === "top" ? "Em cima" : "Embaixo"} › ${tab.label || "sem nome"}`,
        })),
    );
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
          largo e baixo; embaixo, mais estreito, ao lado de outro. Vale só
          para este aparelho.
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

              {draft[area].map((tab, tabIndex) => {
                const labelLength = tab.label.trim().length;
                const isLabelInvalid =
                  labelLength === 0 || labelLength > MAX_TAB_LABEL_LENGTH;
                const available = WIDGET_IDS.filter((id) => !tab.widgets.includes(id));

                return (
                  <div key={tab.id} className="flex flex-col gap-2 bg-darkest/40 p-3">
                    <div className="flex items-center gap-1">
                      <label htmlFor={`tab-label-${tab.id}`} className="sr-only">
                        Nome da aba
                      </label>
                      <input
                        id={`tab-label-${tab.id}`}
                        value={tab.label}
                        maxLength={MAX_TAB_LABEL_LENGTH}
                        aria-invalid={isLabelInvalid}
                        onChange={(event) =>
                          updateTab(area, tab.id, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                        className="min-w-0 flex-1 border border-contrast/15 bg-darkest px-2 py-1 font-display text-lg font-bold uppercase tracking-wide text-contrast outline-none focus:border-interaction aria-invalid:border-danger max-sm:text-base"
                      />

                      <button
                        type="button"
                        onClick={() => updateTabs(area, (tabs) => swap(tabs, tabIndex, -1))}
                        disabled={tabIndex === 0}
                        aria-label={`Mover a aba ${tab.label} para antes`}
                        title="Mover aba para antes"
                        className={iconButtonClass}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTabs(area, (tabs) => swap(tabs, tabIndex, 1))}
                        disabled={tabIndex === draft[area].length - 1}
                        aria-label={`Mover a aba ${tab.label} para depois`}
                        title="Mover aba para depois"
                        className={iconButtonClass}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateTabs(area, (tabs) => tabs.filter((item) => item.id !== tab.id))
                        }
                        aria-label={`Apagar a aba ${tab.label}`}
                        title="Apagar aba"
                        className={`${iconButtonClass} hover:text-danger`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    {tab.widgets.length === 0 && (
                      <p className="text-xs text-contrast/40">
                        Aba vazia: não aparece até ter um widget.
                      </p>
                    )}

                    <ul className="flex flex-col gap-1">
                      {tab.widgets.map((widget, index) => {
                        const destinations = destinationsFor(area, tab.id, widget);

                        return (
                          <li key={widget} className="flex items-center gap-1 bg-primary/60 py-1 pl-2.5">
                            <span className="min-w-0 flex-1 truncate text-sm" title={WIDGET_INFO[widget].description}>
                              {WIDGET_INFO[widget].label}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                updateTab(area, tab.id, (current) => ({
                                  ...current,
                                  widgets: swap(current.widgets, index, -1),
                                }))
                              }
                              disabled={index === 0}
                              aria-label={`Mover ${WIDGET_INFO[widget].label} para antes`}
                              className={iconButtonClass}
                            >
                              <ChevronUp size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateTab(area, tab.id, (current) => ({
                                  ...current,
                                  widgets: swap(current.widgets, index, 1),
                                }))
                              }
                              disabled={index === tab.widgets.length - 1}
                              aria-label={`Mover ${WIDGET_INFO[widget].label} para depois`}
                              className={iconButtonClass}
                            >
                              <ChevronDown size={15} />
                            </button>

                            {destinations.length > 0 && (
                              <select
                                value=""
                                onChange={(event) =>
                                  relocateWidget(area, tab.id, index, event.target.value)
                                }
                                aria-label={`Mover ${WIDGET_INFO[widget].label} para outra aba`}
                                className={`${selectClass} w-24`}
                              >
                                <option value="" disabled>
                                  Mover…
                                </option>
                                {destinations.map((destination) => (
                                  <option key={destination.value} value={destination.value}>
                                    {destination.label}
                                  </option>
                                ))}
                              </select>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                updateTab(area, tab.id, (current) => ({
                                  ...current,
                                  widgets: current.widgets.filter((_, i) => i !== index),
                                }))
                              }
                              aria-label={`Tirar ${WIDGET_INFO[widget].label} da aba`}
                              title="Tirar da aba"
                              className={`${iconButtonClass} hover:text-danger`}
                            >
                              <X size={15} />
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {tab.widgets.length < MAX_WIDGETS_PER_TAB && available.length > 0 && (
                      <select
                        value=""
                        onChange={(event) => {
                          const widget = event.target.value;

                          if (!isWidgetId(widget)) return;

                          updateTab(area, tab.id, (current) => ({
                            ...current,
                            widgets: [...current.widgets, widget],
                          }));
                        }}
                        aria-label={`Adicionar widget na aba ${tab.label}`}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          + Adicionar widget
                        </option>
                        {available.map((id) => (
                          <option key={id} value={id}>
                            {WIDGET_INFO[id].label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => addTab(area)}
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
            onClick={reset}
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
              onClick={save}
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
