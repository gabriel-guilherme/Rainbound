"use client";

import { Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { sortOptions } from "@/app/books/types";

const stylePattern =
  "rounded-lg px-3 py-2 text-sm text-primary outline-none bg-contrast shadow shadow-black/75 opacity-85 focus:opacity-100 hover:opacity-100 focus:border-gray-900";

type FilterButtonProps = {
  sort?: string;
};

export function FilterButton({ sort }: FilterButtonProps) {
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

  function handleSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set("sort", value);
    } else {
      params.delete("sort");
    }

    router.replace(`/books?${params.toString()}`, {
      scroll: false,
    });

    setIsOpen(false);
  }

  return (
    <div className="relative flex items-center justify-end" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        className={`${stylePattern} flex aspect-square cursor-pointer items-center justify-center rounded-lg p-0`}
        aria-label="Abrir filtros"
      >
        <Filter size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-0 z-50 flex w-36 flex-col overflow-hidden rounded-lg border border-primary bg-contrast shadow-lg ring-1 ring-black/5">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSort(option.value)}
              className={`flex w-full cursor-pointer gap-2 px-4 py-2 text-sm text-primary hover:bg-interaction ${
                sort === option.value ? "bg-interaction" : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
