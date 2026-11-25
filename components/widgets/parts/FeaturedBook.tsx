import Image from "next/image";
import type { ReactNode } from "react";

import { DEFAULT_COVER } from "@/lib/books/labels";

type FeaturedBookProps = {
  book: { title: string; creator: string | null; coverUrl: string | null };
  /* Chamada acima do título (ex: "Que tal este?"). */
  eyebrow: string;
  /* Capa esmaecida (ex: livro parado). */
  muted?: boolean;
  /* Abaixo do autor (ex: descrição, quanto falta). */
  children?: ReactNode;
};

/*
 * Livro em destaque com capa grande (versão capa lado a lado dos widgets
 * de livros).
 */
export default function FeaturedBook({
  book,
  eyebrow,
  muted = false,
  children,
}: FeaturedBookProps) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-4">
      <div className="relative aspect-[7/10] w-full">
        <Image
          src={book.coverUrl ?? DEFAULT_COVER}
          alt={`Capa do livro ${book.title}`}
          fill
          sizes="88px"
          className={`object-cover shadow-[0_14px_22px_-12px_rgb(0_0_0/0.8)] ${muted ? "opacity-60" : ""}`}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-[11px] uppercase tracking-widest text-danger">{eyebrow}</p>
        <p className="title-shelf text-2xl leading-none">{book.title}</p>
        <p className="truncate text-sm text-contrast/55">
          {book.creator ?? "Autor desconhecido"}
        </p>

        {children}
      </div>
    </div>
  );
}
