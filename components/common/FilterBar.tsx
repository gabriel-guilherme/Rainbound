"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useTransition } from "react";
import { statusLabel } from "@/app/books/types";
import SearchInput from "./SearchInput";
import { FilterButton } from "./FilterButton";

const statusOptions = ["WANT_TO_READ", "READING", "READ", "ABANDONED"];

const stylePattern =
  "rounded-lg px-3 py-2 text-sm text-primary outline-none bg-contrast shadow shadow-black/75 opacity-85 focus:opacity-100 hover:opacity-100 focus:border-gray-900";

export function FilterBar({ q, status }: { q?: string; status?: string }) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

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
      router.replace(queryString ? `/books?${queryString}` : "/books", {
        scroll: false,
      });
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 grid grid-cols-[1fr_44px] gap-3 wrap"
    >
      <div className="flex min-w-0 gap-5">
        <SearchInput q={q} />
        <select
          name="status"
          defaultValue={status ?? ""}
          onChange={(e) => e.target.form?.requestSubmit()}
          className={`${stylePattern} cursor-pointer`}
        >
          <option value="">Status</option>
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
