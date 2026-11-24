"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toolbarFieldClass as stylePattern } from "@/components/common/fieldStyles";

export type OpenLibraryBook = {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
  number_of_pages_median?: number;
  subject?: string[];
};

type OpenLibrarySearchProps = {
  onSelect: (book: OpenLibraryBook) => void;
};


export default function OpenLibrarySearch({
  onSelect,
}: OpenLibrarySearchProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /*
   * Fecha ao tocar/clicar fora ou com Esc. Não fecha no blur: no
   * celular, esconder o teclado tira o foco e sumiria com os resultados.
   */
  useEffect(() => {
    if (!searchOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [searchOpen]);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const response = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(
            normalizedQuery,
          )}&limit=6&fields=key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Open Library request failed");
        }

        const data: { docs?: OpenLibraryBook[] } = await response.json();

        setBooks(data.docs ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setBooks([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  function openSearch() {
    setSearchOpen(true);

    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }

  function selectBook(book: OpenLibraryBook) {
    onSelect(book);

    setQuery(book.title);
    setBooks([]);
    setSearchOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={[
        "relative flex min-w-0 justify-end",
        searchOpen ? "flex-1 max-sm:basis-full" : "shrink-0",
      ].join(" ")}
    >
      {searchOpen ? (
        <div className="relative w-full sm:max-w-sm">
          <input
            ref={searchInputRef}
            type="search"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);

              if (value.trim().length < 2) {
                setBooks([]);
                setIsLoading(false);
              }
            }}
            placeholder="Buscar na Open Library..."
            aria-label="Buscar livros na Open Library"
            /* 16px no celular: abaixo disso o iPhone dá zoom ao focar. */
            className={`${stylePattern} w-full max-sm:text-base`}
          />

          {(isLoading || books.length > 0) && (
            <div
              role="listbox"
              aria-label="Resultados da Open Library"
              className="absolute left-0 top-full z-20 mt-2 max-h-[60vh] w-full overflow-y-auto bg-contrast shadow-[6px_6px_0_rgb(0_0_0/0.45)]"
            >
              {isLoading ? (
                <p className="px-3 py-2 text-sm text-primary/70">
                  Buscando livros...
                </p>
              ) : (
                books.map((book) => (
                  <button
                    key={book.key}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectBook(book)}
                    className="block w-full cursor-pointer border-b border-primary/10 px-3 py-2 text-left text-sm text-primary transition last:border-b-0 hover:bg-interaction/40"
                  >
                    <span className="block font-semibold">{book.title}</span>

                    <span className="block text-xs text-primary/70">
                      {book.author_name?.slice(0, 2).join(", ") ||
                        "Autor desconhecido"}

                      {book.first_publish_year &&
                        ` - ${book.first_publish_year}`}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          aria-label="Buscar livro na Open Library"
          onClick={openSearch}
          className={`${stylePattern} flex h-10 cursor-pointer items-center justify-center gap-2 px-3`}
        >
          <Search size={18} aria-hidden="true" />
          <span className="hidden sm:inline">Buscar na Open Library</span>
        </button>
      )}
    </div>
  );
}
