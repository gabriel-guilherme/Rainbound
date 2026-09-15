"use client";

import { Search } from "lucide-react";
import { useRef, useState } from "react";

const stylePattern =
  "rounded-lg px-3 py-2 text-sm text-primary outline-none bg-contrast shadow shadow-black/75 opacity-85 focus:opacity-100 hover:opacity-100 focus:border-gray-900";

export default function SearchInput({
  q,
  iconOnly = false,
}: {
  q?: string;
  iconOnly?: boolean;
}) {
  const [searchOpen, setSearchOpen] = useState(Boolean(q) && !iconOnly);
  const searchInputRef = useRef<HTMLInputElement>(null);

  function openSearch() {
    setSearchOpen(true);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }

  return (
    <>
      <input
        ref={searchInputRef}
        type="text"
        name="q"
        defaultValue={q ?? ""}
        placeholder="Buscar por título ou autor..."
        onChange={(e) => e.target.form?.requestSubmit()}
        onBlur={() => setSearchOpen(false)}
        className={`${stylePattern} min-w-0 flex-1 ${searchOpen || !iconOnly ? "block" : "hidden"} ${iconOnly && !searchOpen ? "sm:hidden" : ""}`}
      />
      {!searchOpen && (
        <button
          type="button"
          aria-label="Abrir busca"
          onClick={openSearch}
          className={`${stylePattern} flex aspect-square items-center justify-center rounded-lg p-0 cursor-pointer ${iconOnly ? "" : "sm:hidden"}`}
        >
          <Search size={18} />
        </button>
      )}
    </>
  );
}
