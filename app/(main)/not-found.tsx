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

      <h1 className="title-shelf mt-6 text-5xl text-contrast">
        Página não encontrada
      </h1>

      <p className="mt-3 text-contrast/60">
        Esse livro não existe ou foi removido.
      </p>

      <Link
        href="/library"
        className="btn-shelf mt-8 bg-danger text-primary hover:bg-contrast"
      >
        Voltar para a estante
      </Link>
    </div>
  );
}
