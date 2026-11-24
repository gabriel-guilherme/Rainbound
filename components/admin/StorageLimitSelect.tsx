"use client";

import { useId, useState, useTransition, type FormEvent } from "react";

import { updateStorageLimit } from "@/app/(main)/admin/pedidos/actions";
import { fieldClass } from "@/components/common/fieldStyles";
import {
  DEFAULT_STORAGE_LIMIT_MB,
  MAX_STORAGE_LIMIT_MB,
  MIN_STORAGE_LIMIT_MB,
  STORAGE_LIMIT_PRESETS_MB,
} from "@/lib/bookFiles";

type StorageLimitSelectProps = {
  userId: string;
  label: string;
  /* null = padrão do app. */
  storageLimitMb: number | null;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT_OPTION = "default";
const CUSTOM_OPTION = "custom";

function formatGb(mb: number) {
  return `${(mb / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
}

/* Opção da lista para um limite salvo (fora das prontas = personalizado). */
function optionFor(limitMb: number | null) {
  if (limitMb === null) return DEFAULT_OPTION;

  return (STORAGE_LIMIT_PRESETS_MB as readonly number[]).includes(limitMb)
    ? String(limitMb)
    : CUSTOM_OPTION;
}

/*
 * Limite de espaço de um usuário em /admin/pedidos (aba "Usuários e
 * espaço"). Escolher uma opção pronta salva na hora; "Personalizado…"
 * abre um campo em GB com botão Salvar.
 */
export default function StorageLimitSelect({
  userId,
  label,
  storageLimitMb,
}: StorageLimitSelectProps) {
  const selectId = useId();
  const inputId = useId();
  const [option, setOption] = useState(optionFor(storageLimitMb));
  const [customGb, setCustomGb] = useState(
    storageLimitMb !== null && optionFor(storageLimitMb) === CUSTOM_OPTION
      ? String(storageLimitMb / 1000).replace(".", ",")
      : "",
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState("");
  const [, startTransition] = useTransition();

  function save(limitMb: number | null) {
    setSaveState("saving");

    startTransition(async () => {
      const result = await updateStorageLimit(userId, limitMb);

      if (result.error) {
        setError(result.error);
        setSaveState("error");
      } else {
        setSaveState("saved");
      }
    });
  }

  function handleSelect(value: string) {
    setOption(value);
    setSaveState("idle");

    if (value === CUSTOM_OPTION) return;

    save(value === DEFAULT_OPTION ? null : Number(value));
  }

  function handleCustomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const gb = Number(customGb.replace(",", ".").trim());
    const limitMb = Math.round(gb * 1000);

    if (!customGb.trim() || !Number.isFinite(gb) || limitMb < MIN_STORAGE_LIMIT_MB || limitMb > MAX_STORAGE_LIMIT_MB) {
      setError(
        `Use um valor entre ${formatGb(MIN_STORAGE_LIMIT_MB)} e ${formatGb(MAX_STORAGE_LIMIT_MB)}.`,
      );
      setSaveState("error");
      return;
    }

    save(limitMb);
  }

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={selectId} className="sr-only">
        {label}
      </label>
      <select
        id={selectId}
        value={option}
        onChange={(event) => handleSelect(event.target.value)}
        className={`${fieldClass} h-10 cursor-pointer py-0`}
      >
        <option value={DEFAULT_OPTION}>Padrão ({formatGb(DEFAULT_STORAGE_LIMIT_MB)})</option>
        {STORAGE_LIMIT_PRESETS_MB.map((mb) => (
          <option key={mb} value={String(mb)}>
            {formatGb(mb)}
          </option>
        ))}
        <option value={CUSTOM_OPTION}>Personalizado…</option>
      </select>

      {option === CUSTOM_OPTION && (
        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <label htmlFor={inputId} className="sr-only">
            {label}, em GB
          </label>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            autoFocus={storageLimitMb === null || optionFor(storageLimitMb) !== CUSTOM_OPTION}
            value={customGb}
            onChange={(event) => {
              setCustomGb(event.target.value);
              setSaveState("idle");
            }}
            placeholder="ex.: 3,5"
            className={`${fieldClass} h-10 w-24 py-0`}
          />
          <span className="text-sm text-contrast/60">GB</span>
          <button
            type="submit"
            className="btn-shelf h-10 bg-danger px-3 py-0 text-[15px] text-primary hover:bg-contrast"
          >
            Salvar
          </button>
        </form>
      )}

      <p aria-live="polite" className="min-h-4 text-xs">
        {saveState === "saving" && <span className="text-contrast/60">Salvando...</span>}
        {saveState === "saved" && <span className="text-status-read">Salvo</span>}
        {saveState === "error" && <span className="text-danger">{error}</span>}
      </p>
    </div>
  );
}
