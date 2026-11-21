import Link from "next/link";

export default function Footer() {
  return (
    <footer className="font-sans relative overflow-hidden bg-primary px-6 py-20 text-contrast sm:px-10 lg:px-16 xl:px-24">
      <div className="mx-auto flex min-h-[70vh] w-full max-w-7xl flex-col items-center justify-center text-center">
        {/* Marca */}
        <div className="font-display flex flex-col items-center gap-5">
          <Link
            href="/"
            className="text-sm text-contrast/40 transition-colors hover:text-interaction"
          >
            Rainbound
          </Link>

          <h2 className="text-balance text-[clamp(2.5rem,6vw,6rem)] leading-none tracking-tight">
            Um lugar para
            <br />
            cada história.
          </h2>

          <p className="max-w-md text-[clamp(0.9rem,1.2vw,1.1rem)] text-contrast/50">
            Seus livros, suas anotações e o caminho de cada leitura.
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/library"
          className="mt-10 rounded-full border border-contrast/30 px-6 py-3 text-sm text-contrast transition-colors duration-300 hover:border-interaction hover:bg-interaction hover:text-primary"
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
