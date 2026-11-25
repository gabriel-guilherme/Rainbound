"use client";

import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/*
 * Cliente do Better Auth no navegador (login, cadastro, sair). Fala com a
 * rota /api/auth/[...all], que aplica o limite de tentativas.
 */
export const authClient = createAuthClient({
  plugins: [usernameClient()],
});

/* Mensagens do Better Auth traduzidas para a interface. */
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Usuário ou senha incorretos.",
  INVALID_USERNAME_OR_PASSWORD: "Usuário ou senha incorretos.",
  USER_ALREADY_EXISTS: "Já existe uma conta com este e-mail.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Já existe uma conta com este e-mail.",
  USERNAME_IS_ALREADY_TAKEN: "Este nome de usuário já está em uso.",
  USERNAME_TOO_SHORT: "O nome de usuário é curto demais.",
  USERNAME_TOO_LONG: "O nome de usuário é longo demais.",
  INVALID_USERNAME: "Use só letras sem acento, números e _ no nome de usuário.",
  INVALID_EMAIL: "E-mail inválido.",
  PASSWORD_TOO_SHORT: "A senha é curta demais.",
  PASSWORD_TOO_LONG: "A senha é longa demais.",
};

export function describeAuthError(
  error: { code?: string; status?: number } | null | undefined,
) {
  if (error?.status === 429) {
    return "Muitas tentativas. Espere um pouco e tente de novo.";
  }

  return (
    (error?.code && ERROR_MESSAGES[error.code]) ||
    "Não foi possível concluir. Tente de novo."
  );
}
