"use client";

import { ArrowDownUp, Check } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { saveLibraryPreferences } from "@/app/preferences/actions";
import { sortOptions, type SortOption } from "@/lib/books/library";
import { toolbarFieldClass as stylePattern } from "@/components/common/fieldStyles";


/*
 * Menu de ordenação da estante. A escolha vai na URL (?sort=) e fica
 * salva na conta para a próxima vez (saveLibraryPreferences).
 */
export function FilterButton({ sort }: { sort: SortOption }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setIsOpen((prev) => !prev);
  }

  function handleSort(value: SortOption) {
    const params = new URLSearchParams(searchParams.toString());

    params.set("sort", value);
    saveLibraryPreferences({ sort: value }).catch(console.error);

    params.delete("page");

    router.replace(`/library?${params.toString()}`, {
      scroll: false,
    });

    setIsOpen(false);
  }

  return (
    <div className="relative flex items-center justify-end" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`${stylePattern} flex aspect-square cursor-pointer items-center justify-center p-0`}
        aria-label="Ordenar"
        title="Ordenar"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <ArrowDownUp size={18} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 flex w-44 flex-col overflow-hidden bg-contrast shadow-[6px_6px_0_rgb(0_0_0/0.45)]"
        >
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="menuitemradio"
              aria-checked={sort === option.value}
              onClick={() => handleSort(option.value)}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 px-4 py-2 text-left text-sm text-primary hover:bg-interaction/40 ${
                sort === option.value ? "bg-interaction/25 font-semibold" : ""
              }`}
            >
              {option.label}
              {sort === option.value && <Check size={14} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
