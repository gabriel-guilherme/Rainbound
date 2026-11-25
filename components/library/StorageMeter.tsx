import { formatStorageSize } from "@/lib/books/files";

/*
 * Espaço usado pelos arquivos de livro: "320 MB de 1 GB" e uma régua.
 * Acima de 90% a régua fica vermelha.
 * Sem estado nem APIs do navegador: serve no servidor e no cliente.
 */

type StorageMeterProps = {
  used: number;
  limit: number;
  className?: string;
};

const NEARLY_FULL = 0.9;

export default function StorageMeter({ used, limit, className = "" }: StorageMeterProps) {
  const ratio = limit > 0 ? Math.min(used / limit, 1) : 1;
  const percent = Math.round(ratio * 100);
  const nearlyFull = ratio >= NEARLY_FULL;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3 text-xs text-contrast/60">
        <span className="uppercase tracking-widest">Espaço</span>
        <span className="tabular-nums">
          <span className={nearlyFull ? "text-danger" : "text-contrast"}>
            {formatStorageSize(used)}
          </span>{" "}
          de {formatStorageSize(limit)}
        </span>
      </div>

      <div
        role="meter"
        aria-label="Espaço usado pelos arquivos"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${formatStorageSize(used)} de ${formatStorageSize(limit)}`}
        className="h-1.5 w-full bg-contrast/15"
      >
        <div
          className={`h-full ${nearlyFull ? "bg-danger" : "bg-interaction"}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {nearlyFull && (
        <p className="text-xs text-danger">
          Quase sem espaço. Exclua livros que não usa mais para liberar.
        </p>
      )}
    </div>
  );
}
