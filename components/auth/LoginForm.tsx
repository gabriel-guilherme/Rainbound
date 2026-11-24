"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { fieldClass, labelClass } from "@/components/common/fieldStyles";
import { authClient, describeAuthError } from "@/lib/authClient";

/*
 * Entrar com usuário OU e-mail + senha. Com "@" vai como e-mail; sem,
 * como nome de usuário (plugin username do Better Auth).
 */
export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!identifier || !password) {
      setError("Preencha usuário (ou e-mail) e senha.");
      return;
    }

    setError("");
    setIsPending(true);

    const { error: authError } = identifier.includes("@")
      ? await authClient.signIn.email({ email: identifier, password })
      : await authClient.signIn.username({ username: identifier, password });

    if (authError) {
      setError(describeAuthError(authError));
      setIsPending(false);
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col">
          <label htmlFor="login-identifier" className={labelClass}>
            Usuário ou e-mail
          </label>
          <input
            id="login-identifier"
            name="identifier"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            className={`${fieldClass} h-12 text-base`}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="login-password" className={labelClass}>
            Senha
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`${fieldClass} h-12 text-base`}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="btn-shelf mt-1 h-13 bg-danger text-primary shadow-[6px_6px_0_rgb(0_0_0/0.45)] hover:bg-contrast disabled:cursor-wait disabled:opacity-60"
        >
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-sm text-contrast/60">
        Esqueceu a senha? Fale com Gabriel, doidão.
      </p>

      <p className="text-[15px] text-contrast/70">
        Ainda não tem estante?{" "}
        <Link href="/cadastro" className="text-danger underline-offset-4 hover:underline">
          Pedir acesso
        </Link>
      </p>
    </div>
  );
}
