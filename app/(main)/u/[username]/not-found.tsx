import Link from "next/link";
import { UserRound } from "lucide-react";

/* Usuário que não existe (ou ainda não foi aprovado). */
export default function ProfileNotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 pb-20 pt-32 text-center">
      <UserRound size={56} strokeWidth={1.25} aria-hidden="true" className="text-interaction" />

      <h1 className="title-shelf mt-6 text-5xl text-contrast">Perfil não encontrado</h1>

      <p className="mt-3 text-contrast/70">Não há ninguém com esse usuário no Rainbound.</p>

      <Link href="/dashboard" className="btn-shelf mt-8 bg-danger text-primary hover:bg-contrast">
        Voltar para o início
      </Link>
    </div>
  );
}
