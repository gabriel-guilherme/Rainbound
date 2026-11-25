import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import SignOutButton from "@/components/auth/SignOutButton";
import { AccountStatus } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Pedido de acesso — Rainbound" };

/* Tela de quem pediu acesso e ainda não foi aprovado (ou foi recusado). */
export default async function WaitingPage() {
  const user = await requireUser();

  if (user.status === AccountStatus.APPROVED) redirect("/dashboard");

  const isRejected = user.status === AccountStatus.REJECTED;

  return (
    <AuthShell
      eyebrow={isRejected ? "Pedido não aprovado" : "Pedido em análise"}
      title={
        isRejected ? (
          <>
            A estante <span className="text-danger">segue fechada</span>
          </>
        ) : (
          <>
            Quase <span className="text-danger">lá</span>
          </>
        )
      }
    >
      <div className="flex flex-col gap-6">
        <p className="font-reading text-xl italic leading-relaxed text-contrast/75">
          {isRejected
            ? "Seu pedido de acesso não foi aprovado desta vez."
            : "Seu pedido chegou. Assim que for aprovado, sua estante abre aqui mesmo: é só voltar e entrar."}
        </p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-l-[6px] border-danger bg-primary px-4 py-3 text-sm">
          <dt className="uppercase tracking-widest text-contrast/50">Usuário</dt>
          <dd className="min-w-0 truncate">{user.username}</dd>
          <dt className="uppercase tracking-widest text-contrast/50">E-mail</dt>
          <dd className="min-w-0 truncate">{user.email}</dd>
        </dl>

        <div>
          <SignOutButton variant="button" />
        </div>
      </div>
    </AuthShell>
  );
}
