import Link from "next/link";
import type { CSSProperties } from "react";

import { statusLabel } from "@/app/(main)/library/types";
import type { ReadingStatus } from "@/generated/prisma/enums";
import { getLastName, type SpineLook } from "@/lib/books/spine";

import SpineRibbon from "./SpineRibbon";

type BookSpineProps = {
  book: {
    title: string;
    creator: string | null;
    status: ReadingStatus;
    percentage: number;
  };
  look: SpineLook;
  /* Vira link. */
  href?: string;
  /* Vira botão (ex.: selecionar na estante). */
  onSelect?: () => void;
  selected?: boolean;
  /* Acabou de ser desmarcado: fica parado mesmo com o mouse em cima. */
  released?: boolean;
  onPointerLeave?: () => void;
  /* Altura fixa, para prévias. */
  height?: number;
};

/*
 * Lombada de um livro. Sem `href` nem `onSelect`, é só decorativa.
 * Estilos em app/globals.css (.spine*).
 */
export default function BookSpine({
  book,
  look,
  href,
  onSelect,
  selected = false,
  released = false,
  onPointerLeave,
  height,
}: BookSpineProps) {
  const showProgress =
    book.status === "READING" || book.status === "ABANDONED";
  const progress = Math.min(Math.max(book.percentage, 0), 100);

  const style = {
    "--spine-w": `${look.width}px`,
    "--spine-h": `${height ?? look.height}px`,
    "--spine-bg": look.background,
    "--spine-fg": look.foreground,
    "--spine-accent": look.accent,
    "--spine-fs": `${look.fontSize}px`,
    "--spine-p": `${progress}%`,
  } as CSSProperties;

  const label = `${book.title}${book.creator ? `, ${book.creator}` : ""}, ${statusLabel[book.status]}`;

  const content = (
    <>
      <span aria-hidden="true" className="spine-bands" />
      <SpineRibbon status={book.status} />
      <span aria-hidden="true" className="spine-title">
        {book.title}
      </span>
      <span aria-hidden="true" className="spine-author">
        {getLastName(book.creator)}
      </span>
      {showProgress && <span aria-hidden="true" className="spine-progress" />}
    </>
  );

  const shared = {
    className: "spine",
    style,
    "data-tilt": book.status === "ABANDONED",
    "data-selected": selected,
    "data-released": released,
    title: label,
  };

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={onSelect}
        aria-label={label}
        aria-pressed={selected}
        onPointerLeave={onPointerLeave}
        onBlur={onPointerLeave}
        {...shared}
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} aria-label={label} {...shared}>
        {content}
      </Link>
    );
  }

  return (
    <span
      role="img"
      aria-label={label}
      {...shared}
      className="spine spine-static"
    >
      {content}
    </span>
  );
}
