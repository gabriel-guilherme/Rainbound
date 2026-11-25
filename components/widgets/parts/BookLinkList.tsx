import MaybeLink from "./MaybeLink";

type BookLinkListProps = {
  /* Título da lista (ex.: "Depois"). */
  label: string;
  items: { id: number; title: string; href?: string; meta: string }[];
};

/*
 * Lista curta de livros abaixo do destaque (versão capa lado a lado dos
 * widgets de livros).
 */
export default function BookLinkList({ label, items }: BookLinkListProps) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-contrast/40">{label}</p>

      <ol className="mt-2 flex flex-col">
        {items.map((item) => (
          <li key={item.id} className="border-t border-contrast/10 first:border-t-0">
            <MaybeLink
              href={item.href}
              className={`flex items-baseline justify-between gap-3 py-2 ${item.href ? "hover:text-danger" : ""}`}
            >
              <span className="min-w-0 truncate text-sm">{item.title}</span>
              <span className="shrink-0 text-xs text-contrast/40">{item.meta}</span>
            </MaybeLink>
          </li>
        ))}
      </ol>
    </div>
  );
}
