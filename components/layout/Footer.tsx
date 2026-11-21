import Link from "next/link";

export default function Footer() {
  return (
    <footer className="font-sans relative overflow-hidden bg-primary px-6 py-20 text-contrast sm:px-10 lg:px-16 xl:px-24">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center text-center">
        {/* Marca */}
        <div className="flex flex-col items-center gap-5">
          <Link
            href="/"
            className="title-shelf text-lg text-contrast/40 transition-colors hover:text-danger"
          >
            Rainbound
          </Link>

          <h2 className="title-shelf text-balance text-[clamp(3rem,8vw,7.5rem)]">
            Um lugar para
            <br />
            <span className="text-danger italic">cada história.</span>
          </h2>

          <p className="max-w-md font-reading text-[clamp(1.05rem,1.4vw,1.25rem)] italic text-contrast/60">
            Seus livros, suas anotações e o caminho de cada leitura.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/library"
          className="btn-shelf mt-10 bg-danger text-primary hover:bg-contrast"
        >
          Abrir biblioteca
        </Link>

        {/* Navegação */}
        <nav
          aria-label="Rodapé"
          className="mt-20 flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-contrast/50"
        >
          <Link
            href="/dashboard"
            className="transition-colors hover:text-contrast"
          >
            Início
          </Link>

          <Link
            href="/library"
            className="transition-colors hover:text-contrast"
          >
            Biblioteca
          </Link>

          <Link
            href="/library/new"
            className="transition-colors hover:text-contrast"
          >
            Adicionar livro
          </Link>
        </nav>

        {/* Rodapé */}
        <div className="mt-16 flex flex-col items-center gap-2 text-xs text-contrast/30">
          <span>Feito com calma, em dias de chuva.</span>

          <span>© {new Date().getFullYear()} Rainbound</span>
        </div>
      </div>
    </footer>
  );
}
