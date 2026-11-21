import Link from "next/link";
import { CloudRainWind } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 pb-20 pt-32 text-center">
      <CloudRainWind
        size={56}
        strokeWidth={1.25}
        aria-hidden="true"
        className="text-interaction"
      />

      <h1 className="mt-6 font-display text-3xl text-contrast">
        Página não encontrada
      </h1>

      <p className="mt-3 text-contrast/60">
        Esse livro não existe ou foi removido.
      </p>

      <Link
        href="/library"
        className="mt-8 rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 text-sm text-contrast transition-colors hover:bg-interaction hover:text-primary"
      >
        Voltar para a biblioteca
      </Link>
    </div>
  );
}
