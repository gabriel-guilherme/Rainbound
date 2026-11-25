type FeaturedBookHeadingProps = {
  title: string;
  /* Chamada acima do título (ex.: "Que tal este?"). */
  eyebrow: string;
  /* Linha abaixo do título (ex.: autor, quanto falta). */
  subtitle: string;
};

/*
 * Livro em destaque sem capa, ao lado da fileira ou da prateleira
 * (versões largas dos widgets de livros).
 */
export default function FeaturedBookHeading({
  title,
  eyebrow,
  subtitle,
}: FeaturedBookHeadingProps) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-widest text-danger">{eyebrow}</p>
      <p className="title-shelf mt-1 truncate text-2xl" title={title}>
        {title}
      </p>
      <p className="truncate text-sm text-contrast/55">{subtitle}</p>
    </div>
  );
}
