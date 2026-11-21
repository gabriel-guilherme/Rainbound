"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useTransition } from "react";
import { statusLabel, statusOptions } from "@/app/(main)/library/types";
import SearchInput from "./SearchInput";
import { FilterButton } from "./FilterButton";
import { toolbarFieldClass as stylePattern } from "@/components/forms/fieldStyles";



export function FilterBar({ q, status }: { q?: string; status?: string }) {
  const router = useRouter();

  const [, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    const query = String(formData.get("q") ?? "").trim();
    const selectedStatus = String(formData.get("status") ?? "");

    if (query) params.set("q", query);
    if (selectedStatus) params.set("status", selectedStatus);

    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `/library?${queryString}` : "/library", {
        scroll: false,
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 grid grid-cols-[1fr_40px] gap-3"
    >
      <div className="flex min-w-0 gap-3">
        <SearchInput q={q} />
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label="Filtrar por status"
          onChange={(e) => e.target.form?.requestSubmit()}
          className={`${stylePattern} cursor-pointer`}
        >
          <option value="">Todos os status</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
      </div>
      <FilterButton />
    </form>
  );
}
