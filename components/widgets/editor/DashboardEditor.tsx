"use client";

import { LayoutGrid, X } from "lucide-react";
import { useRef, useState, useTransition } from "react";

import type { DashboardLayout, WidgetId } from "@/lib/dashboardLayout";

import EditorArea from "./EditorArea";
import EditorFooter from "./EditorFooter";
import { iconButtonClass } from "./editorStyles";
import { AREAS } from "./layoutEdits";
import { useLayoutDraft } from "./useLayoutDraft";
import WidgetCatalog from "./WidgetCatalog";
import WidgetPanel from "./WidgetPanel";

/*
 * Editor da arrumação do Início. À esquerda, um mapa da home (EditorArea:
 * os dois carrosséis, com as abas e os widgets no formato que terão); à
 * direita, as opções do widget escolhido (WidgetPanel; no celular, uma
 * folha que sobe de baixo). "Adicionar widget" abre o catálogo
 * (WidgetCatalog). O rascunho e as ações ficam em useLayoutDraft; as
 * mudanças na arrumação, em layoutEdits.ts.
 *
 * Serve à home (salva num cookie do aparelho: saveDashboardLayout) e ao
 * perfil (salva no banco: saveProfileLayout); quem usa passa as actions.
 */
type DashboardEditorProps = {
  layout: DashboardLayout;
  onSave: (layout: DashboardLayout) => Promise<void>;
  onReset: () => Promise<void>;
  /* Linha abaixo do título (onde a arrumação vale). */
  note: string;
  hiddenWidgets?: readonly WidgetId[];
};

export default function DashboardEditor({
  layout,
  onSave,
  onReset,
  note,
  hiddenWidgets = [],
}: DashboardEditorProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editor = useLayoutDraft(layout);
  const { draft, selection, catalogTarget } = editor;
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function open() {
    editor.reset(layout);
    setError("");
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
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
        onCancel={(event) => {
          /* Esc fecha primeiro o catálogo ou a folha do widget. */
          if (catalogTarget) {
            event.preventDefault();
            editor.closeCatalog();
          } else if (selection) {
            event.preventDefault();
            editor.clearSelection();
          }
        }}
        className="m-auto w-[min(72rem,calc(100vw-2rem))] bg-primary p-0 text-contrast shadow-[8px_8px_0_rgb(0_0_0/0.5)] backdrop:bg-darkest/80 max-md:h-dvh max-md:max-h-none max-md:w-screen max-md:max-w-none md:max-h-[90dvh]"
      >
        <div className="flex h-full flex-col md:max-h-[90dvh]">
          <div className="flex items-center justify-between gap-3 border-b border-contrast/10 px-5 py-3.5">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <h2 id="dashboard-editor-title" className="title-shelf text-3xl">
                Widgets do Início
              </h2>
              <p className="text-xs text-contrast/70">{note}</p>
            </div>

            <button type="button" onClick={close} aria-label="Fechar" className={iconButtonClass}>
              <X size={18} />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="flex min-h-0 flex-col gap-6 overflow-y-auto p-5 md:border-r md:border-contrast/10">
              <p className="text-sm text-contrast/70">
                Assim fica a sua home. Clique num widget para mudar o visual, mover ou tirar.
              </p>

              {AREAS.map((area) => (
                <EditorArea
                  key={area}
                  area={area}
                  tabs={draft[area]}
                  currentTab={editor.currentTabOf(area)}
                  selected={selection}
                  onPickTab={(tabId) => editor.pickTab(area, tabId)}
                  onAddTab={() => editor.addTab(area)}
                  onRenameTab={(label) => editor.renameTab(area, label)}
                  onMoveTab={(delta) => editor.moveTab(area, delta)}
                  onDeleteTab={() => editor.deleteTab(area)}
                  onSelectWidget={(index) => editor.selectWidget(area, index)}
                  onOpenCatalog={() => editor.openCatalog(area)}
                />
              ))}
            </div>

            <aside
              aria-label="Opções do widget"
              className={[
                "overflow-y-auto p-5 md:bg-darkest/25",
                selection
                  ? "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-10 max-md:max-h-[78dvh] max-md:border-t max-md:border-contrast/15 max-md:bg-primary max-md:shadow-[0_-8px_0_rgb(0_0_0/0.35)]"
                  : "max-md:hidden",
              ].join(" ")}
            >
              {selection ? (
                <WidgetPanel
                  layout={draft}
                  slot={selection}
                  onLookChange={editor.setLook}
                  onMove={editor.moveWithinTab}
                  onMoveTo={editor.moveToTab}
                  onRemove={editor.removeSelected}
                  onClose={editor.clearSelection}
                />
              ) : (
                <p className="text-sm text-contrast/70">
                  Escolha um widget no mapa para ver as opções dele.
                </p>
              )}
            </aside>
          </div>

          <EditorFooter
            error={error}
            isValid={editor.isValid}
            isPending={isPending}
            onReset={() => run(onReset, "Não foi possível restaurar o padrão.")}
            onCancel={close}
            onSave={() =>
              run(
                () => onSave(draft),
                "Não foi possível salvar. Confira os nomes das abas.",
              )
            }
          />
        </div>

        {catalogTarget && (
          <WidgetCatalog
            layout={draft}
            target={catalogTarget}
            hiddenWidgets={hiddenWidgets}
            onAdd={editor.addFromCatalog}
            onClose={editor.closeCatalog}
          />
        )}
      </dialog>
    </>
  );
}
