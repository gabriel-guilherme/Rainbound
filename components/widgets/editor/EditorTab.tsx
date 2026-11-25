"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import {
  MAX_TAB_LABEL_LENGTH,
  MAX_WIDGETS_PER_TAB,
  WIDGET_IDS,
  WIDGET_INFO,
  isWidgetId,
  type DashboardTab,
  type WidgetVariant,
} from "@/lib/dashboardLayout";

import EditorWidgetRow from "./EditorWidgetRow";
import { iconButtonClass, selectClass } from "./editorStyles";
import { addWidget, removeWidget, swap, withLook } from "./layoutEdits";

type EditorTabProps = {
  tab: DashboardTab;
  variant: WidgetVariant;
  tabIndex: number;
  tabCount: number;
  /* Destinos de "Mover…" de cada widget (layoutEdits → destinationsFor). */
  destinationsFor: (widget: DashboardTab["widgets"][number]) => { value: string; label: string }[];
  onChange: (update: (tab: DashboardTab) => DashboardTab) => void;
  onMoveTab: (delta: -1 | 1) => void;
  onDelete: () => void;
  onRelocateWidget: (index: number, target: string) => void;
};

/*
 * Uma aba de um carrossel no editor: nome, ordem, apagar e os widgets
 * dela (até MAX_WIDGETS_PER_TAB).
 */
export default function EditorTab({
  tab,
  variant,
  tabIndex,
  tabCount,
  destinationsFor,
  onChange,
  onMoveTab,
  onDelete,
  onRelocateWidget,
}: EditorTabProps) {
  const labelLength = tab.label.trim().length;
  const isLabelInvalid = labelLength === 0 || labelLength > MAX_TAB_LABEL_LENGTH;
  const available = WIDGET_IDS.filter((id) => !tab.widgets.includes(id));

  return (
    <div className="flex flex-col gap-2 bg-darkest/40 p-3">
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
            onChange((current) => ({ ...current, label: event.target.value }))
          }
          className="min-w-0 flex-1 border border-contrast/15 bg-darkest px-2 py-1 font-display text-lg font-bold uppercase tracking-wide text-contrast outline-none focus:border-interaction aria-invalid:border-danger max-sm:text-base"
        />

        <button
          type="button"
          onClick={() => onMoveTab(-1)}
          disabled={tabIndex === 0}
          aria-label={`Mover a aba ${tab.label} para antes`}
          title="Mover aba para antes"
          className={iconButtonClass}
        >
          <ChevronUp size={16} />
        </button>
        <button
          type="button"
          onClick={() => onMoveTab(1)}
          disabled={tabIndex === tabCount - 1}
          aria-label={`Mover a aba ${tab.label} para depois`}
          title="Mover aba para depois"
          className={iconButtonClass}
        >
          <ChevronDown size={16} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Apagar a aba ${tab.label}`}
          title="Apagar aba"
          className={`${iconButtonClass} hover:text-danger`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      {tab.widgets.length === 0 && (
        <p className="text-xs text-contrast/40">Aba vazia: não aparece até ter um widget.</p>
      )}

      <ul className="flex flex-col gap-1">
        {tab.widgets.map((widget, index) => (
          <EditorWidgetRow
            key={widget}
            tab={tab}
            variant={variant}
            widget={widget}
            index={index}
            destinations={destinationsFor(widget)}
            onMove={(delta) =>
              onChange((current) => ({ ...current, widgets: swap(current.widgets, index, delta) }))
            }
            onLookChange={(look) => onChange((current) => withLook(current, widget, look))}
            onRelocate={(target) => onRelocateWidget(index, target)}
            onRemove={() => onChange((current) => removeWidget(current, index))}
          />
        ))}
      </ul>

      {tab.widgets.length < MAX_WIDGETS_PER_TAB && available.length > 0 && (
        <select
          value=""
          onChange={(event) => {
            const widget = event.target.value;

            if (isWidgetId(widget)) onChange((current) => addWidget(current, widget));
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
}
