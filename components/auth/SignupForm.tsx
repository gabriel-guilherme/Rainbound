"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { fieldClass, labelClass } from "@/components/common/fieldStyles";
import { authClient, describeAuthError } from "@/lib/auth/client";

/* Mesmos limites de lib/auth/server.ts (não importado: lá é código de servidor). */
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;
const PASSWORD_MIN_LENGTH = 8;

/*
 * Pedido de acesso: cria a conta (status PENDING) e leva para a tela de
 * espera até o admin aprovar.
 */
export default function SignupForm() {
  const router = useRouter();

  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!USERNAME_PATTERN.test(username)) {
      setError("O nome de usuário deve ter de 3 a 20 letras sem acento, números ou _.");
      return;
    }

    if (!email.includes("@")) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(`A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`);
      return;
    }

    setError("");
    setIsPending(true);

    const { error: authError } = await authClient.signUp.email({
      email,
      password,
      name: username,
      username,
    });

    if (authError) {
      setError(describeAuthError(authError));
      setIsPending(false);
      return;
    }

    router.replace("/aguardando");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-reading text-lg italic text-contrast/70">
        Cada pessoa tem a própria estante. Seu pedido fica em análise até ser
        aprovado.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col">
          <label htmlFor="signup-username" className={labelClass}>
            Nome de usuário
          </label>
          <input
            id="signup-username"
            name="username"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            minLength={3}
            maxLength={20}
            required
            aria-describedby="signup-username-hint"
            className={`${fieldClass} h-12 text-base`}
          />
          <p id="signup-username-hint" className="mt-1.5 text-xs text-contrast/50">
            3 a 20 caracteres: letras sem acento, números e _.
          </p>
        </div>

        <div className="flex flex-col">
          <label htmlFor="signup-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="signup-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`${fieldClass} h-12 text-base`}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="signup-password" className={labelClass}>
            Senha
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
            aria-describedby="signup-password-hint"
            className={`${fieldClass} h-12 text-base`}
          />
          <p id="signup-password-hint" className="mt-1.5 text-xs text-contrast/50">
            Pelo menos {PASSWORD_MIN_LENGTH} caracteres.
          </p>
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
          {isPending ? "Enviando..." : "Pedir acesso"}
        </button>
      </form>

      <p className="text-[15px] text-contrast/70">
        Já tem conta?{" "}
        <Link href="/login" className="text-danger underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
