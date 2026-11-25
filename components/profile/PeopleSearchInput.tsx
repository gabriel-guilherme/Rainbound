"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { toolbarFieldClass } from "@/components/common/fieldStyles";
import { MAX_PEOPLE_QUERY_LENGTH } from "@/lib/profile/rules";

const SEARCH_DELAY_MS = 300;

/* Campo da busca de pessoas: atualiza ?q= enquanto a pessoa digita. */
export default function PeopleSearchInput({ q }: { q: string }) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function search(next: string) {
    const query = next.trim();

    router.replace(query ? `/pessoas?q=${encodeURIComponent(query)}` : "/pessoas", {
      scroll: false,
    });
  }

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        search(value);
      }}
      className="relative"
    >
      <label htmlFor="people-search" className="sr-only">
        Buscar pessoas por nome ou usuário
      </label>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-contrast/50"
      />
      <input
        id="people-search"
        type="search"
        value={value}
        maxLength={MAX_PEOPLE_QUERY_LENGTH}
        autoFocus
        autoComplete="off"
        placeholder="Nome ou @usuário"
        onChange={(event) => {
          const next = event.target.value;

          setValue(next);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => search(next), SEARCH_DELAY_MS);
        }}
        className={`${toolbarFieldClass} w-full py-3 pl-10 text-base`}
      />
    </form>
  );
}
