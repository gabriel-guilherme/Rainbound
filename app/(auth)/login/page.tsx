import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Entrar — Rainbound" };

/*
 * Destino depois do login (?next=, vindo do proxy). Só caminhos internos:
 * "//site.com" ou URLs completas virariam um redirecionamento para fora.
 */
function safeNext(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNext((await searchParams).next);

  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      eyebrow="Bem-vindo de volta"
      title={
        <>
          Sua <span className="text-danger">estante</span>
          <br />
          te espera
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
