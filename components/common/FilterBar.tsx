"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useTransition } from "react";
import {
  statusColor,
  statusLabel,
  statusOptions,
} from "@/app/(main)/library/types";
import type { ReadingStatus } from "@/generated/prisma/enums";
import SearchInput from "./SearchInput";
import { FilterButton } from "./FilterButton";

type FilterBarProps = {
  q?: string;
  status?: ReadingStatus;
  /* Controles extras à direita (ex.: alternar lombadas/capas). */
  children?: React.ReactNode;
};

export function FilterBar({ q, status, children }: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [, startTransition] = useTransition();

  /*
   * Parte dos parâmetros atuais para não perder ordenação e
   * visualização ao buscar ou filtrar.
   */
  function navigate(changes: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }

    /* Outro filtro, outra lista: volta para a primeira página. */
    params.delete("page");

    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `/library?${queryString}` : "/library", {
        scroll: false,
      });
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    navigate({ q: String(formData.get("q") ?? "").trim() });
  }

  const chipClass = (isActive: boolean) =>
    `flex cursor-pointer items-center gap-1.5 whitespace-nowrap px-3 py-1.5 text-sm transition-colors ${
      isActive
        ? "bg-contrast/15 text-contrast"
        : "text-contrast/60 hover:bg-contrast/5 hover:text-contrast"
    }`;

  return (
    <div className="mb-10 flex flex-wrap items-center gap-2 bg-primary p-2">
      <form
        onSubmit={handleSubmit}
        className="flex min-w-0 flex-[1_1_16rem] gap-2"
      >
        <SearchInput q={q} />
      </form>

      <div role="group" aria-label="Filtrar por status" className="flex flex-wrap gap-0.5">
        <button
          type="button"
          aria-pressed={!status}
          onClick={() => navigate({ status: "" })}
          className={chipClass(!status)}
        >
          Todos
        </button>

        {statusOptions.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={status === option}
            onClick={() => navigate({ status: option })}
            className={chipClass(status === option)}
          >
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${statusColor[option]}`}
            />
            {statusLabel[option]}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <FilterButton />
        {children}
      </div>
    </div>
  );
}
