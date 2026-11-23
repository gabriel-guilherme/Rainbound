"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { deleteBook } from "@/app/(main)/library/[id]/actions";

type BookActionsMenuProps = {
  bookId: number;
  bookTitle: string;
};

export default function BookActionsMenu({
  bookId,
  bookTitle,
}: BookActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm(`Tem certeza que deseja excluir "${bookTitle}"?`)) {
      const formData = new FormData();
      formData.append("id", bookId.toString());
      await deleteBook(formData);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center justify-end" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`Opções do livro ${bookTitle}`}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex h-8 w-8 cursor-pointer items-center justify-center p-1 text-contrast transition hover:bg-danger hover:text-primary"
      >
        <Ellipsis size={24} strokeWidth={2} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 flex w-36 flex-col overflow-hidden bg-contrast shadow-[6px_6px_0_rgb(0_0_0/0.45)]"
        >
          <Link
            href={`/library/${bookId}`}
            role="menuitem"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-interaction/40"
          >
            <Pencil size={16} />
            Editar
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-sm text-red-800 hover:bg-red-800/10"
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
