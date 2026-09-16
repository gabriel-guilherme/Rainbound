import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
      <p className="text-6xl">📖</p>
      <h1 className="mt-4 text-xl font-bold text-gray-900">
        Página não encontrada
      </h1>
      <p className="mt-2 text-gray-500">
        Esse livro não existe ou foi removido.
      </p>
      <Link
        href="/library"
        className="mt-6 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
      >
        Voltar para meus livros
      </Link>
    </main>
  );
}
