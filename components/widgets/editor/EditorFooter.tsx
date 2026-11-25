"use client";

type EditorFooterProps = {
  error: string;
  /* Toda aba tem nome (parseDashboardLayout). */
  isValid: boolean;
  isPending: boolean;
  onReset: () => void;
  onCancel: () => void;
  onSave: () => void;
};

/* Rodapé do editor de widgets: restaurar padrão, erros, cancelar e salvar. */
export default function EditorFooter({
  error,
  isValid,
  isPending,
  onReset,
  onCancel,
  onSave,
}: EditorFooterProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-contrast/10 px-5 py-3.5">
      <button
        type="button"
        onClick={onReset}
        disabled={isPending}
        className="cursor-pointer text-sm text-contrast/70 underline-offset-4 hover:text-danger hover:underline disabled:opacity-40"
      >
        Restaurar padrão
      </button>

      <div className="flex flex-wrap items-center gap-2">
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
          onClick={onCancel}
          className="btn-shelf text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={!isValid || isPending}
          className="btn-shelf bg-danger text-primary hover:bg-contrast disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
