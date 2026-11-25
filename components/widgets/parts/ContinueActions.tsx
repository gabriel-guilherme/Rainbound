import Link from "next/link";

type ContinueActionsProps = {
  book: { id: number; hasFile: boolean };
  /* Texto do botão principal (ex.: "Continuar", "Terminar"). */
  label: string;
};

/*
 * Botões do livro em destaque nos widgets de leitura: com arquivo, abre o
 * leitor e "Ver livro"; sem arquivo (lido fora do site), "Registrar
 * leitura" na página do livro.
 */
export default function ContinueActions({ book, label }: ContinueActionsProps) {
  if (!book.hasFile) {
    return (
      <Link href={`/library/${book.id}`} className="btn-shelf self-start bg-danger text-primary hover:bg-contrast">
        Registrar leitura
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link href={`/read/${book.id}`} className="btn-shelf bg-danger text-primary hover:bg-contrast">
        {label}
      </Link>
      <Link
        href={`/library/${book.id}`}
        className="btn-shelf text-contrast ring-2 ring-inset ring-secondary hover:bg-secondary"
      >
        Ver livro
      </Link>
    </div>
  );
}
