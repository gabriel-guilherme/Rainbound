import BookSpine from "@/components/books/BookSpine";
import { getSpineLookForBook, type SpineBook } from "@/lib/books/spine";

export type SpineShelfItem = {
  book: SpineBook;
  href: string;
  /* Rótulo curto acima da lombada (ex.: "92%", "47 d"). */
  caption?: string;
};

type SpineShelfProps = {
  items: SpineShelfItem[];
  /* Nome da lista para leitores de tela. */
  label: string;
  /* Lombadas esmaecidas (ex: parados); voltam ao normal no hover. */
  muted?: boolean;
};

/*
 * Prateleira baixa de lombadas (versão lombada larga dos widgets de
 * livros).
 */
export default function SpineShelf({ items, label, muted = false }: SpineShelfProps) {
  return (
    /*
     * Lombadas a 65%: a versão larga é baixa. O espaço em cima deixa
     * a lombada subir no hover sem ser cortada.
     */
    <ul
      aria-label={label}
      className="scrollbar-none flex items-end gap-[3px] overflow-x-auto border-b-[10px] border-darkest pt-5 [zoom:0.65]"
    >
      {items.map(({ book, href, caption }) => (
        <li
          key={book.id}
          className={[
            "flex shrink-0 flex-col items-center justify-end gap-2",
            muted ? "opacity-60 transition-opacity hover:opacity-100" : "",
          ].join(" ")}
        >
          {/* Com o zoom de 65%, 17px fica com ~11px na tela. */}
          {caption && (
            <span aria-hidden="true" className="text-[17px] tabular-nums text-contrast/70">
              {caption}
            </span>
          )}

          <BookSpine book={book} look={getSpineLookForBook(book)} href={href} />
        </li>
      ))}
    </ul>
  );
}
