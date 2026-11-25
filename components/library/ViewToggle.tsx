import Link from "next/link";

import {
  buildLibraryHref,
  libraryViewOptions,
  type LibraryParams,
  type LibraryView,
} from "@/lib/books/library";

type ViewToggleProps = {
  view: LibraryView;
  /* Filtros e página atuais, mantidos ao trocar a visualização. */
  params: Omit<LibraryParams, "view">;
};

/* Alterna a biblioteca entre lombadas e capas via `?view=`. */
export default function ViewToggle({ view, params }: ViewToggleProps) {
  return (
    <nav aria-label="Visualização" className="flex gap-0.5 bg-darkest p-0.5">
      {libraryViewOptions.map((option) => (
        <Link
          key={option.value}
          href={buildLibraryHref({ ...params, view: option.value })}
          scroll={false}
          aria-current={view === option.value ? "page" : undefined}
          className={`px-3 py-1.5 text-sm transition-colors ${
            view === option.value
              ? "bg-contrast text-primary"
              : "text-contrast/60 hover:text-contrast"
          }`}
        >
          {option.label}
        </Link>
      ))}
    </nav>
  );
}
