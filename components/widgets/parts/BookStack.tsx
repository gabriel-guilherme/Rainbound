import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import { getSpineLookForBook, type SpineBook } from "@/lib/books/spine";

export type BookStackItem = {
  book: SpineBook;
  href: string;
  /* Texto à direita do título (ex.: "45%", "há 40 dias"). */
  detail: ReactNode;
  /* 0 a 100: a linha embaixo do livro; sem valor, sem linha (ex.: fila). */
  progress?: number;
};

type BookStackProps = {
  items: BookStackItem[];
  /* Livros esmaecidos (ex: parados); voltam ao normal no hover. */
  muted?: boolean;
};

/*
 * Pilha de livros deitados (versão lombada lado a lado dos widgets de
 * livros): a espessura vem das páginas, a linha embaixo mostra o
 * progresso.
 */
export default function BookStack({ items, muted = false }: BookStackProps) {
  return (
    <ul className="flex flex-col items-start gap-0.5 border-b-[10px] border-darkest pt-2">
      {items.map(({ book, href, detail, progress }) => {
        const look = getSpineLookForBook(book);

        /*
         * Largura do livro na pilha e um leve desalinhamento (0–8 px).
         * O deslocamento sai do id, não da posição na lista: cada livro
         * fica sempre no mesmo lugar, mesmo quando a lista muda.
         */
        const style = {
          width: `${70 + (look.height % 4) * 7}%`,
          height: `${Math.round(look.width * 0.72)}px`,
          marginLeft: `${(book.id * 5) % 9}px`,
          background: look.background,
          color: look.foreground,
        } satisfies CSSProperties;

        return (
          <li key={book.id} className="w-full">
            <Link
              href={href}
              style={style}
              className={[
                "group/progress relative flex max-w-full min-h-8 items-center justify-between gap-3 px-3.5 shadow-[inset_0_3px_0_rgb(255_255_255/0.07),inset_0_-5px_7px_rgb(0_0_0/0.35)] transition hover:translate-x-2.5",
                muted ? "opacity-60 hover:opacity-100" : "",
              ].join(" ")}
            >
              <span className="min-w-0 truncate font-display text-lg font-bold uppercase tracking-wide">
                {book.title}
              </span>

              <span className="shrink-0 text-[11px] opacity-75">{detail}</span>

              {progress !== undefined && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[3px]"
                  style={{ width: `${progress}%`, background: look.accent }}
                />
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
