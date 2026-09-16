"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import { deleteBook } from "@/app/actions";

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
        className="w-8 h-8 flex items-center justify-center rounded-md p-1 text-contrast transition hover:bg-interaction hover:text-primary cursor-pointer"
      >
        <Ellipsis size={24} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute top-0 right-0 z-50 flex w-36 flex-col rounded-lg opacity-90 bg-contrast shadow-lg ring-1 ring-black/5 overflow-hidden">
          <Link
            href={`/library/${bookId}`}
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary hover:bg-interaction"
          >
            <Pencil size={16} />
            Editar
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 cursor-pointer hover:bg-interaction"
          >
            <Trash2 size={16} />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
