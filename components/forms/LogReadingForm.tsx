"use client";

import { Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";

import { logReadingProgress } from "@/app/(main)/library/[id]/actions";
import { MAX_PAGE_COUNT } from "@/app/(main)/library/types";

/*
 * "Registrar leitura": progresso anotado à mão, para livros lidos fora do
 * site (físico, Kindle, outro app). Visual de marcador: o número da
 * página em destaque, com − / + dos lados e a régua de progresso embaixo.
 * Por página ("120 de 350") ou, sem número de página, por porcentagem.
 *
 * −, +, +10 e +25 só ajustam o número; "Salvar" (ou Enter) grava.
 * "Terminei" vai para o fim e já grava (marca o livro como lido).
 *
 * Fica dentro do formulário da página do livro (aba Leitura), então não
 * tem <form> próprio e os campos não têm `name`: não entram no
 * salvamento automático dos detalhes.
 */

type LogReadingFormProps = {
  bookId: number;
  pageCount: number | null;
  progress: {
    currentPosition: number;
    totalPositions: number | null;
    percentage: number;
    locator: string | null;
  } | null;
};

type Mode = "page" | "percent";

type Entry = Parameters<typeof logReadingProgress>[1];

const QUICK_STEPS: Record<Mode, number[]> = {
  page: [10, 25],
  percent: [5, 10],
};

/* Campo numérico sem as setinhas do navegador. */
const bareNumberClass =
  "bg-transparent text-center text-contrast outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const stepButtonClass =
  "flex size-12 shrink-0 items-center justify-center text-contrast ring-1 ring-inset ring-contrast/25 transition-colors hover:bg-contrast/10 hover:text-danger disabled:opacity-40";

const chipClass =
  "btn-shelf px-3 py-1.5 text-base text-contrast ring-1 ring-inset ring-contrast/25 hover:bg-contrast/10 disabled:opacity-40";

/* Página salva: a própria, se o total bate; senão, estimada pela %. */
function getInitialPage(
  pageCount: number | null,
  progress: LogReadingFormProps["progress"],
) {
  if (!progress || !pageCount) {
    return 0;
  }

  return progress.totalPositions === pageCount
    ? progress.currentPosition
    : Math.round((progress.percentage / 100) * pageCount);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export default function LogReadingForm({
  bookId,
  pageCount,
  progress,
}: LogReadingFormProps) {
  /* Páginas por padrão; porcentagem se o último registro foi em %. */
  const [mode, setMode] = useState<Mode>(
    progress?.locator?.startsWith("manual-percent:") ? "percent" : "page",
  );
  const [page, setPage] = useState(String(getInitialPage(pageCount, progress)));
  const [total, setTotal] = useState(pageCount ? String(pageCount) : "");
  const [percent, setPercent] = useState(
    String(Math.round(progress?.percentage ?? 0)),
  );

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalNumber = Number(total);
  const hasTotal = Number.isInteger(totalNumber) && totalNumber >= 1;

  const max = mode === "page" ? (hasTotal ? totalNumber : MAX_PAGE_COUNT) : 100;
  const value = mode === "page" ? page : percent;
  const setValue = mode === "page" ? setPage : setPercent;

  /* A régua acompanha o que está digitado, antes mesmo de salvar. */
  const preview =
    mode === "page"
      ? hasTotal
        ? clamp((Number(page) / totalNumber) * 100, 0, 100)
        : 0
      : clamp(Number(percent), 0, 100);
  const previewPercent = Number.isFinite(preview) ? Math.round(preview) : 0;

  function adjust(step: number) {
    const next = clamp(Math.round((Number(value) || 0) + step), 0, max);

    setValue(String(next));
    setSaved(false);
    setError("");
  }

  function buildEntry(rawValue: string): Entry | null {
    if (mode === "page") {
      const pageNumber = Number(rawValue);

      if (!hasTotal || totalNumber > MAX_PAGE_COUNT) {
        setError("Informe o número de páginas da sua edição.");
        return null;
      }

      if (!Number.isInteger(pageNumber) || pageNumber < 0 || pageNumber > totalNumber) {
        setError(`A página precisa estar entre 0 e ${totalNumber}.`);
        return null;
      }

      return { mode: "page", page: pageNumber, pageCount: totalNumber };
    }

    const percentNumber = Number(rawValue);

    if (!Number.isFinite(percentNumber) || percentNumber < 0 || percentNumber > 100) {
      setError("A porcentagem precisa estar entre 0 e 100.");
      return null;
    }

    return { mode: "percent", percentage: percentNumber };
  }

  function save(rawValue = value) {
    setError("");

    const entry = buildEntry(rawValue);

    if (!entry) {
      return;
    }

    startTransition(async () => {
      try {
        await logReadingProgress(bookId, entry);
        setSaved(true);
      } catch {
        setError("Não foi possível salvar. Tente de novo.");
      }
    });
  }

  function finish() {
    const end = String(max);

    setValue(end);
    save(end);
  }

  /* Enter salva o registro (e não envia o formulário da página). */
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      save();
    }
  }

  function switchMode() {
    setError("");
    setSaved(false);
    setMode(mode === "page" ? "percent" : "page");
  }

  return (
    <section
      aria-label="Registrar leitura"
      className="mx-auto flex w-full max-w-2xl flex-col gap-6 pt-2 text-contrast"
    >
      <p className="text-center text-sm text-contrast/60">
        Lendo em outro lugar? Anote aqui onde você parou.
      </p>

      {/* Marcador: − número + */}
      <div className="flex items-center justify-center gap-4 sm:gap-8">
        <button
          type="button"
          onClick={() => adjust(-1)}
          disabled={isPending || Number(value) <= 0}
          aria-label={mode === "page" ? "Voltar uma página" : "Diminuir 1%"}
          className={stepButtonClass}
        >
          <Minus size={22} aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-col items-center">
          <label htmlFor="log-value" className="sr-only">
            {mode === "page" ? "Página atual" : "Porcentagem lida"}
          </label>

          <div className="flex items-baseline">
            <input
              id="log-value"
              type="number"
              inputMode={mode === "page" ? "numeric" : "decimal"}
              min={0}
              max={max}
              step={mode === "page" ? 1 : "any"}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setSaved(false);
              }}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={handleKeyDown}
              style={{ width: `${Math.max(String(value).length, 1) + 0.5}ch` }}
              className={`${bareNumberClass} title-shelf border-b-2 border-transparent text-7xl transition-colors hover:border-contrast/20 focus:border-danger sm:text-8xl`}
            />

            {mode === "percent" && (
              <span aria-hidden="true" className="title-shelf text-5xl text-contrast/60">
                %
              </span>
            )}
          </div>

          {mode === "page" ? (
            <div className="mt-1 flex items-center gap-2 text-sm text-contrast/60">
              <label htmlFor="log-total">de</label>

              <input
                id="log-total"
                type="number"
                inputMode="numeric"
                min={1}
                max={MAX_PAGE_COUNT}
                placeholder="total"
                value={total}
                onChange={(e) => {
                  setTotal(e.target.value);
                  setSaved(false);
                }}
                onKeyDown={handleKeyDown}
                className={`${bareNumberClass} w-20 border-b border-contrast/25 py-0.5 text-base placeholder:text-contrast/35 hover:border-contrast/45 focus:border-danger`}
              />

              <span>páginas</span>
            </div>
          ) : (
            <p className="mt-1 text-sm text-contrast/60">do livro</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => adjust(1)}
          disabled={isPending || Number(value) >= max}
          aria-label={mode === "page" ? "Avançar uma página" : "Aumentar 1%"}
          className={stepButtonClass}
        >
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>

      {/* Régua de progresso */}
      <div className="flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={previewPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso de leitura"
          className="h-3 flex-1 bg-contrast/15"
        >
          <div
            className="h-full bg-danger transition-[width] duration-300"
            style={{ width: `${previewPercent}%` }}
          />
        </div>

        <span className="title-shelf w-14 text-right text-xl">{previewPercent}%</span>
      </div>

      {/* Atalhos e salvar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {QUICK_STEPS[mode].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => adjust(step)}
              disabled={isPending || Number(value) >= max}
              aria-label={mode === "page" ? `Avançar ${step} páginas` : `Aumentar ${step}%`}
              className={chipClass}
            >
              +{step}
              {mode === "percent" && "%"}
            </button>
          ))}

          <button
            type="button"
            onClick={finish}
            disabled={isPending || (mode === "page" && !hasTotal)}
            className={chipClass}
          >
            Terminei
          </button>
        </div>

        <button
          type="button"
          onClick={() => save()}
          disabled={isPending}
          className="btn-shelf bg-danger text-primary shadow-[4px_4px_0_rgb(0_0_0/0.45)] hover:bg-contrast disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs">
        <button
          type="button"
          onClick={switchMode}
          className="text-sm text-contrast/60 underline-offset-4 hover:text-danger hover:underline"
        >
          {mode === "page" ? "Usar porcentagem" : "Usar páginas"}
        </button>

        <p
          role="status"
          aria-live="polite"
          className={error ? "text-danger" : "text-contrast/45"}
        >
          {error ||
            (saved
              ? "Progresso salvo."
              : "Chegar ao fim marca o livro como lido.")}
        </p>
      </div>
    </section>
  );
}
