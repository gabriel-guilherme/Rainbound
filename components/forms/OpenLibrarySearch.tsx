"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

const stylePattern =
  "rounded-lg px-3 py-2 text-sm text-primary outline-none bg-contrast shadow shadow-black/75 opacity-85 focus:opacity-100 hover:opacity-100 focus:border-gray-900";

export default function OpenLibrarySearch({
  onSelect,
}: OpenLibrarySearchProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [books, setBooks] = useState<OpenLibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

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
    <div className="relative flex min-w-0 flex-1 justify-end">
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
            onBlur={() => setSearchOpen(false)}
            placeholder="Buscar na Open Library..."
            aria-label="Buscar livros na Open Library"
            className={`${stylePattern} w-full`}
          />

          {(isLoading || books.length > 0) && (
            <div
              role="listbox"
              aria-label="Resultados da Open Library"
              className="absolute left-0 top-full z-20 mt-2 w-full overflow-hidden rounded-lg bg-contrast shadow-lg"
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
                    className="block w-full cursor-pointer border-b border-primary/10 px-3 py-2 text-left text-sm text-primary transition hover:bg-interaction"
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
          className={`${stylePattern} flex size-10 cursor-pointer items-center justify-center rounded-lg p-0`}
        >
          <Search size={18} />
        </button>
      )}
    </div>
  );
}
