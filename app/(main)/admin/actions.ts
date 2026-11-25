"use server";

import { revalidatePath } from "next/cache";

import { AccountStatus } from "@/generated/prisma/enums";
import { MAX_STORAGE_LIMIT_MB, MIN_STORAGE_LIMIT_MB } from "@/lib/books/files";
import { prisma } from "@/lib/services/prisma";
import { getGoalMinutes, getTimeZone, todayIn } from "@/lib/streak/server";
import {
  clearReadingDays,
  getReadingDaySeconds,
  seedReadingStreak,
  setReadingDaySeconds,
} from "@/lib/streak/admin";
import { getAdminUserId } from "@/lib/auth/session";
import { addDays, isDateKey } from "@/lib/streak/rules";

/*
 * Aprovar ou recusar um pedido de acesso. Só o admin; ele não muda o
 * próprio status. O usuário vê o resultado no próximo acesso (a sessão
 * relê o status do banco a cada requisição).
 */
async function reviewRequest(userId: string, status: AccountStatus) {
  const adminId = await getAdminUserId();

  if (typeof userId !== "string" || userId === adminId) {
    throw new Error("Pedido inválido.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status, reviewedAt: new Date() },
  });

  revalidatePath("/admin");
  revalidatePath("/", "layout");
}

export async function approveRequest(userId: string) {
  await reviewRequest(userId, AccountStatus.APPROVED);
}

export async function rejectRequest(userId: string) {
  await reviewRequest(userId, AccountStatus.REJECTED);
}

/*
 * Limite de espaço de um usuário (o próprio admin incluído), em MB.
 * `null` volta ao padrão do app. Devolve `{ error }` em vez de lançar:
 * em produção a mensagem de um erro lançado não chega ao navegador.
 */
export async function updateStorageLimit(
  userId: string,
  limitMb: number | null,
): Promise<{ error?: string }> {
  await getAdminUserId();

  if (typeof userId !== "string" || !userId) {
    return { error: "Usuário inválido." };
  }

  if (
    limitMb !== null &&
    (!Number.isInteger(limitMb) ||
      limitMb < MIN_STORAGE_LIMIT_MB ||
      limitMb > MAX_STORAGE_LIMIT_MB)
  ) {
    return {
      error: `Use um valor entre ${MIN_STORAGE_LIMIT_MB / 1000} e ${MAX_STORAGE_LIMIT_MB / 1000} GB.`,
    };
  }

  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: { storageLimitMb: limitMb },
  });

  if (count === 0) {
    return { error: "Usuário não encontrado." };
  }

  revalidatePath("/admin");
  revalidatePath("/library");

  return {};
}

/*
 * Aba "Sequência": testes da sequência de leitura na conta do próprio
 * admin. Mexem direto nos dias (ReadingDay), sem passar pelo leitor.
 */

/* Até quantos dias para trás os testes mexem. */
const STREAK_TEST_MAX_DAYS = 400;

function revalidateStreak() {
  revalidatePath("/admin");
  revalidatePath("/");
  revalidatePath("/dashboard");
}

async function assertTestDate(date: string) {
  const today = todayIn(await getTimeZone());

  if (!isDateKey(date) || date > today || date < addDays(today, -STREAK_TEST_MAX_DAYS)) {
    throw new Error("Dia inválido.");
  }
}

/* Soma (ou tira, com negativo) minutos de um dia. */
export async function adjustReadingDay(date: string, minutes: number) {
  const adminId = await getAdminUserId();

  await assertTestDate(date);

  if (!Number.isInteger(minutes) || Math.abs(minutes) > 24 * 60) {
    throw new Error("Minutos inválidos.");
  }

  const seconds = await getReadingDaySeconds(adminId, date);

  await setReadingDaySeconds(adminId, date, seconds + minutes * 60);

  revalidateStreak();
}

/* Dia batido: exatamente a meta. */
export async function completeReadingDay(date: string) {
  const adminId = await getAdminUserId();

  await assertTestDate(date);

  await setReadingDaySeconds(adminId, date, (await getGoalMinutes(adminId)) * 60);

  revalidateStreak();
}

/* Dia sem leitura (apaga o registro). */
export async function clearReadingDay(date: string) {
  const adminId = await getAdminUserId();

  await assertTestDate(date);
  await setReadingDaySeconds(adminId, date, 0);

  revalidateStreak();
}

/*
 * Cria uma sequência de N dias terminando ontem (ou hoje, se marcado).
 * Os dias antes dela ficam como estão.
 */
export async function seedTestStreak(formData: FormData) {
  const adminId = await getAdminUserId();
  const days = Number(formData.get("days"));
  const includeToday = formData.get("includeToday") === "on";

  if (!Number.isInteger(days) || days < 1 || days > STREAK_TEST_MAX_DAYS) {
    throw new Error("Número de dias inválido.");
  }

  const today = todayIn(await getTimeZone());

  await seedReadingStreak(adminId, includeToday ? today : addDays(today, -1), days);

  revalidateStreak();
}

/* Apaga todo o histórico de leitura do admin (sequência e recorde zeram). */
export async function clearTestStreak() {
  const adminId = await getAdminUserId();

  await clearReadingDays(adminId);

  revalidateStreak();
}
