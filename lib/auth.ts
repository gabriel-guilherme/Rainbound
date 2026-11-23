import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { username } from "better-auth/plugins";

import { prisma } from "@/lib/prisma";

/*
 * Autenticação (Better Auth). Usuários, sessões e senhas ficam no próprio
 * banco (modelos User, Session, Account, Verification e RateLimit do
 * schema.prisma): no dev, o Postgres do Docker; em produção, o Supabase.
 *
 * Cadastro aberto com aprovação: toda conta nasce PENDING e só usa a
 * estante depois que o admin aprova (/admin/pedidos). A conta com o
 * e-mail de ADMIN_EMAIL já nasce aprovada e como admin.
 */

/* Mesmo limite do formulário de cadastro. */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 8;

function isAdminEmail(email: string) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  return Boolean(adminEmail) && email.trim().toLowerCase() === adminEmail;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: PASSWORD_MIN_LENGTH,
    /* Sem envio de e-mail por enquanto: não exige confirmação. */
    requireEmailVerification: false,
    autoSignIn: true,
  },

  user: {
    /*
     * Campos do app. `input: false`: ninguém define pelo cadastro ou pela
     * edição de perfil; só o servidor (hook abaixo e aprovação do admin).
     */
    additionalFields: {
      status: { type: "string", input: false, defaultValue: "PENDING" },
      role: { type: "string", input: false, defaultValue: "USER" },
    },
  },

  /*
   * Limite de tentativas no banco: na Vercel cada requisição pode cair numa
   * instância diferente. Login e cadastro ficam mais restritos.
   */
  rateLimit: {
    enabled: true,
    storage: "database",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-in/username": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 3 },
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!isAdminEmail(user.email)) return;

          return {
            data: { ...user, status: "APPROVED", role: "ADMIN" },
          };
        },
        /*
         * Livros de antes da autenticação (sem dono) passam para o admin
         * assim que a conta dele existe.
         */
        after: async (user) => {
          if (!isAdminEmail(user.email)) return;

          await prisma.book.updateMany({
            where: { userId: null },
            data: { userId: user.id },
          });
        },
      },
    },
  },

  plugins: [
    username({
      minUsernameLength: USERNAME_MIN_LENGTH,
      maxUsernameLength: USERNAME_MAX_LENGTH,
      /* Letras sem acento, números e _ (guardado em minúsculas). */
      usernameValidator: (value) => /^[a-zA-Z0-9_]+$/.test(value),
    }),
    /* Precisa ser o último: grava os cookies em Server Actions. */
    nextCookies(),
  ],
});
