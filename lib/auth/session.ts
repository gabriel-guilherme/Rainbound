import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { AccountStatus, Role } from "@/generated/prisma/enums";

import { auth } from "./server";

/*
 * Sessão do usuário atual para Server Components, Server Actions e rotas.
 * O proxy.ts só redireciona quem não tem cookie de sessão; a checagem de
 * verdade (sessão válida, status e papel) é sempre aqui.
 */

export type CurrentUser = {
  id: string;
  username: string;
  email: string;
  status: AccountStatus;
  role: Role;
};

/* Uma consulta por requisição, mesmo chamada em vários componentes. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) return null;

  const { user } = session;

  return {
    id: user.id,
    username: user.displayUsername || user.username || user.name,
    email: user.email,
    status: user.status as AccountStatus,
    role: user.role as Role,
  };
});

export function isApproved(user: CurrentUser | null): user is CurrentUser {
  return user?.status === AccountStatus.APPROVED;
}

/* Páginas que exigem login (qualquer status). */
export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  return user;
}

/* Páginas da estante: pedido pendente ou recusado vai para a tela de espera. */
export async function requireApprovedUser() {
  const user = await requireUser();

  if (!isApproved(user)) redirect("/aguardando");

  return user;
}

/* Páginas do admin: para os demais, a página não existe. */
export async function requireAdmin() {
  const user = await requireApprovedUser();

  if (user.role !== Role.ADMIN) notFound();

  return user;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Não autorizado.");
  }
}

/*
 * Server Actions e rotas de API: não redirecionam, falham. Devolve o id do
 * usuário aprovado, para filtrar as consultas pelo dono.
 */
export async function getApprovedUserId() {
  const user = await getCurrentUser();

  if (!isApproved(user)) throw new UnauthorizedError();

  return user.id;
}

export async function getAdminUserId() {
  const user = await getCurrentUser();

  if (!isApproved(user) || user.role !== Role.ADMIN) {
    throw new UnauthorizedError();
  }

  return user.id;
}
