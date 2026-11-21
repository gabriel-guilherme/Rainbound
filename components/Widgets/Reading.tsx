import Link from "next/link";
import type { CSSProperties } from "react";

import { getSpineLookForBook, type SpineBook } from "@/lib/spine";

type ReadingProps = {
  currentlyReading: SpineBook[];
};

/*
 * "Lendo agora" como uma pilha de livros deitados: a espessura vem das
 * páginas e a linha embaixo mostra o progresso.
 */
export default function Reading({ currentlyReading }: ReadingProps) {
  return (
    <section className="flex flex-col gap-4 bg-primary p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="title-shelf text-3xl text-contrast">Lendo agora</h2>

        <Link
          href="/library?status=READING"
          className="text-xs uppercase tracking-widest text-contrast/55 hover:text-danger"
        >
          Ver todos
        </Link>
      </div>

      {currentlyReading.length === 0 ? (
        <p className="text-sm text-contrast/60">Nenhum livro em andamento.</p>
      ) : (
        <ul className="flex flex-col items-start gap-0.5 border-b-[10px] border-darkest pt-2">
          {currentlyReading.map((book, index) => {
            const look = getSpineLookForBook(book);
            const progress = Math.round(
              Math.min(Math.max(book.percentage, 0), 100),
            );

            /* Largura do livro na pilha e um leve desalinhamento entre eles. */
            const style = {
              width: `${70 + (look.height % 4) * 7}%`,
              height: `${Math.round(look.width * 0.72)}px`,
              marginLeft: index % 2 ? "14px" : 0,
              background: look.background,
              color: look.foreground,
            } satisfies CSSProperties;

            return (
              <li key={book.id} className="w-full">
                <Link
                  href={book.hasFile ? `/read/${book.id}` : `/library/${book.id}`}
                  style={style}
                  className="relative flex max-w-full min-h-8 items-center justify-between gap-3 px-3.5 shadow-[inset_0_3px_0_rgb(255_255_255/0.07),inset_0_-5px_7px_rgb(0_0_0/0.35)] transition-transform hover:translate-x-2.5"
                >
                  <span className="min-w-0 truncate font-display text-lg font-bold uppercase tracking-wide">
                    {book.title}
                  </span>

                  <span className="shrink-0 text-[11px] tabular-nums opacity-75">
                    {progress}%
                  </span>

                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-0 h-[3px]"
                    style={{ width: `${progress}%`, background: look.accent }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
