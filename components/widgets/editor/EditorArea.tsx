"use client";

import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import {
  AREA_LABEL,
  AREA_VARIANT,
  MAX_TAB_LABEL_LENGTH,
  MAX_TABS_PER_AREA,
  MAX_WIDGETS_PER_TAB,
  WIDGET_INFO,
  WIDGET_LOOK_LABEL,
  getWidgetLook,
  hasLooks,
  type DashboardArea,
  type DashboardTab,
} from "@/lib/dashboardLayout";

import { iconButtonClass } from "./editorStyles";
import type { WidgetSlot } from "./layoutEdits";
import WidgetThumb from "./WidgetThumb";

const AREA_HINT: Record<DashboardArea, string> = {
  top: `Até ${MAX_WIDGETS_PER_TAB} por aba, um embaixo do outro`,
  bottom: `Até ${MAX_WIDGETS_PER_TAB} por aba, lado a lado`,
};

type EditorAreaProps = {
  area: DashboardArea;
  tabs: DashboardTab[];
  /* Aba mostrada no mapa deste carrossel. */
  currentTab: DashboardTab | null;
  selected: WidgetSlot | null;
  onPickTab: (tabId: string) => void;
  onAddTab: () => void;
  onRenameTab: (label: string) => void;
  onMoveTab: (delta: -1 | 1) => void;
  onDeleteTab: () => void;
  onSelectWidget: (index: number) => void;
  onOpenCatalog: () => void;
};

/*
 * Um carrossel no mapa do editor: as abas como no Início e os widgets da
 * aba escolhida como blocos do formato que terão (largos em cima, lado a
 * lado embaixo). Clicar num bloco abre as opções dele (WidgetPanel).
 */
export default function EditorArea({
  area,
  tabs,
  currentTab,
  selected,
  onPickTab,
  onAddTab,
  onRenameTab,
  onMoveTab,
  onDeleteTab,
  onSelectWidget,
  onOpenCatalog,
}: EditorAreaProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const variant = AREA_VARIANT[area];
  const tabIndex = currentTab ? tabs.indexOf(currentTab) : -1;
  const labelLength = currentTab?.label.trim().length ?? 0;
  const isLabelInvalid = labelLength === 0 || labelLength > MAX_TAB_LABEL_LENGTH;

  return (
    <section aria-labelledby={`editor-area-${area}`} className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 id={`editor-area-${area}`} className="font-display text-xl font-bold uppercase tracking-wide">
          {AREA_LABEL[area]}
        </h3>
        <p className="text-xs text-contrast/60">{AREA_HINT[area]}</p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {tabs.map((tab) => {
          const isCurrent = tab.id === currentTab?.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setIsRenaming(false);
                onPickTab(tab.id);
              }}
              aria-pressed={isCurrent}
              className={[
                "cursor-pointer px-3 py-1.5 font-display text-base font-bold uppercase tracking-wide transition-colors max-md:min-h-11",
                isCurrent
                  ? "bg-contrast text-primary"
                  : "text-contrast/70 hover:bg-secondary hover:text-contrast",
                tab.label.trim() ? "" : "ring-2 ring-inset ring-danger",
              ].join(" ")}
            >
              {tab.label.trim() || "Sem nome"}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => {
            setIsRenaming(true);
            onAddTab();
          }}
          disabled={tabs.length >= MAX_TABS_PER_AREA}
          className="flex cursor-pointer items-center gap-1 border border-dashed border-contrast/30 px-3 py-1.5 text-xs text-contrast/75 transition-colors hover:border-contrast/50 hover:text-contrast disabled:cursor-not-allowed disabled:opacity-40 max-md:min-h-11"
        >
          <Plus size={13} aria-hidden="true" />
          Aba
        </button>
      </div>

      {tabs.length === 0 && (
        <p className="border border-dashed border-contrast/15 px-3 py-4 text-center text-sm text-contrast/55">
          Sem abas: este carrossel não aparece.
        </p>
      )}

      {currentTab && (
        <div className="flex flex-col gap-2 bg-darkest/40 p-2.5">
          <div className="flex items-center gap-1">
            {isRenaming ? (
              <>
                <label htmlFor={`tab-label-${currentTab.id}`} className="sr-only">
                  Nome da aba
                </label>
                <input
                  id={`tab-label-${currentTab.id}`}
                  value={currentTab.label}
                  maxLength={MAX_TAB_LABEL_LENGTH}
                  aria-invalid={isLabelInvalid}
                  autoFocus
                  onChange={(event) => onRenameTab(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      setIsRenaming(false);
                    }
                  }}
                  className="min-w-0 flex-1 border border-contrast/15 bg-darkest px-2 py-1 font-display text-base font-bold uppercase tracking-wide text-contrast outline-none focus:border-interaction aria-invalid:border-danger max-md:min-h-11 max-sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setIsRenaming(false)}
                  className="cursor-pointer px-2 py-1 text-xs text-contrast/75 hover:text-contrast max-md:min-h-11"
                >
                  Pronto
                </button>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 truncate text-xs text-contrast/60">
                  Aba “{currentTab.label.trim() || "sem nome"}”
                </span>
                <button
                  type="button"
                  onClick={() => setIsRenaming(true)}
                  aria-label={`Renomear a aba ${currentTab.label}`}
                  title="Renomear aba"
                  className={iconButtonClass}
                >
                  <Pencil size={14} />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onMoveTab(-1)}
              disabled={tabIndex <= 0}
              aria-label={`Mover a aba ${currentTab.label} para a esquerda`}
              title="Mover aba para a esquerda"
              className={iconButtonClass}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => onMoveTab(1)}
              disabled={tabIndex === tabs.length - 1}
              aria-label={`Mover a aba ${currentTab.label} para a direita`}
              title="Mover aba para a direita"
              className={iconButtonClass}
            >
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRenaming(false);
                onDeleteTab();
              }}
              aria-label={`Apagar a aba ${currentTab.label}`}
              title="Apagar aba"
              className={`${iconButtonClass} hover:text-danger`}
            >
              <Trash2 size={15} />
            </button>
          </div>

          <div className={`grid gap-2.5 ${variant === "tall" ? "grid-cols-2" : "grid-cols-1"}`}>
            {currentTab.widgets.map((widget, index) => {
              const isSelected =
                selected?.area === area &&
                selected.tabId === currentTab.id &&
                selected.index === index;
              const look = hasLooks(widget) ? getWidgetLook(currentTab, widget, variant) : undefined;

              return (
                <button
                  key={widget}
                  type="button"
                  onClick={() => onSelectWidget(index)}
                  aria-pressed={isSelected}
                  className={[
                    "flex cursor-pointer flex-col justify-between gap-3 bg-secondary p-3 text-left transition-colors hover:bg-secondary/70",
                    variant === "tall" ? "min-h-28" : "min-h-22",
                    isSelected ? "outline-2 outline-offset-2 outline-danger" : "",
                  ].join(" ")}
                >
                  <span className="flex w-full items-start justify-between gap-2">
                    <span className="font-display text-lg font-bold uppercase leading-tight tracking-wide">
                      {WIDGET_INFO[widget].label}
                    </span>
                    {look && (
                      <span className="shrink-0 text-[11px] uppercase tracking-widest text-contrast/70">
                        {WIDGET_LOOK_LABEL[look]}
                      </span>
                    )}
                  </span>
                  <WidgetThumb widget={widget} look={look} size={variant === "tall" ? "sm" : "md"} />
                </button>
              );
            })}

            {currentTab.widgets.length < MAX_WIDGETS_PER_TAB && (
              <button
                type="button"
                onClick={onOpenCatalog}
                className={[
                  "flex cursor-pointer items-center justify-center gap-1.5 border border-dashed border-contrast/30 text-sm text-contrast/80 transition-colors hover:border-contrast/50 hover:text-contrast",
                  variant === "tall" ? "min-h-28" : "min-h-14",
                ].join(" ")}
              >
                <Plus size={15} aria-hidden="true" />
                Adicionar widget
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
