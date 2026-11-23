import { setStorageLimit } from "@/app/(main)/admin/pedidos/actions";
import StorageMeter from "@/components/common/StorageMeter";
import {
  BYTES_PER_MB,
  DEFAULT_STORAGE_LIMIT_MB,
  MAX_STORAGE_LIMIT_MB,
} from "@/lib/bookFiles";

/*
 * Espaço usado por um usuário e o campo para o admin mudar o limite
 * dele (em GB; vazio = padrão do app). Usado em /admin/pedidos.
 */
export default function StorageLimitControl({
  userId,
  used,
  storageLimitMb,
  className = "",
}: {
  userId: string;
  used: number;
  storageLimitMb: number | null;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      <StorageMeter
        used={used}
        limit={(storageLimitMb ?? DEFAULT_STORAGE_LIMIT_MB) * BYTES_PER_MB}
        className="min-w-48 flex-1"
      />

      <form action={setStorageLimit.bind(null, userId)} className="flex items-end gap-2">
        <label className="flex flex-col text-xs text-contrast/55">
          Limite (GB)
          <input
            type="number"
            name="limitGb"
            min={0}
            max={MAX_STORAGE_LIMIT_MB / 1000}
            step={0.5}
            defaultValue={storageLimitMb === null ? "" : storageLimitMb / 1000}
            placeholder={String(DEFAULT_STORAGE_LIMIT_MB / 1000)}
            className="mt-1 w-24 border border-contrast/15 bg-darkest px-2 py-1.5 text-sm text-contrast outline-none focus:border-interaction"
          />
        </label>

        <button
          type="submit"
          className="text-sm text-danger underline-offset-4 hover:underline"
        >
          Salvar
        </button>
      </form>
    </div>
  );
}
