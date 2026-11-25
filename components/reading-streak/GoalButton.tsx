import { Pencil, X } from "lucide-react";

type GoalButtonProps = {
  goalMinutes: number;
  isOpen: boolean;
  onToggle: () => void;
  /* "Meta: 10 min/dia" (com espaço) ou "Meta: 10 min". */
  showPerDay?: boolean;
};

/*
 * Botão que abre e fecha a troca da meta diária (GoalPicker), no widget e
 * no painel do rodapé do leitor.
 */
export default function GoalButton({
  goalMinutes,
  isOpen,
  onToggle,
  showPerDay = false,
}: GoalButtonProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Fechar a meta diária" : `Meta diária: ${goalMinutes} minutos. Editar`}
      className={[
        "flex h-8 shrink-0 cursor-pointer items-center gap-1.5 px-2.5 text-sm tabular-nums transition-colors",
        isOpen
          ? "bg-contrast/15 text-contrast hover:bg-contrast/20"
          : "text-contrast/80 ring-1 ring-inset ring-contrast/20 hover:bg-contrast/10 hover:text-contrast",
      ].join(" ")}
    >
      {isOpen ? (
        <>
          <X size={14} aria-hidden="true" />
          Fechar
        </>
      ) : (
        <>
          <Pencil size={13} aria-hidden="true" />
          Meta: {goalMinutes} min{showPerDay ? "/dia" : ""}
        </>
      )}
    </button>
  );
}
