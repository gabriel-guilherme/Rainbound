import Link from "next/link";
import type { ReactNode } from "react";

type WidgetCardProps = {
  title?: string;
  /* Atalho à direita do título (ex.: "Ver todos"). */
  action?: { href: string; label: string };
  /* Nome da seção para leitores de tela quando não há título visível. */
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
};

/* Moldura comum dos widgets do Início. */
export default function WidgetCard({
  title,
  action,
  ariaLabel,
  className = "",
  children,
}: WidgetCardProps) {
  return (
    <section
      aria-label={title ? undefined : ariaLabel}
      className={`flex h-full flex-col gap-4 bg-primary p-5 ${className}`}
    >
      {(title || action) && (
        <div className="flex items-baseline justify-between gap-3">
          {title && <h2 className="title-shelf text-3xl text-contrast">{title}</h2>}

          {action && (
            <Link
              href={action.href}
              className="shrink-0 text-xs uppercase tracking-widest text-contrast/55 hover:text-danger"
            >
              {action.label}
            </Link>
          )}
        </div>
      )}

      {children}
    </section>
  );
}
