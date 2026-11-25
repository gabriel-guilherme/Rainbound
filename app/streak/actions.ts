"use server";

import { revalidatePath } from "next/cache";

import { getStreakSummary, getTimeZone, setDailyGoal } from "@/lib/streak/server";
import { getApprovedUserId } from "@/lib/auth/session";
import {
  MAX_DAILY_GOAL_MIN,
  MIN_DAILY_GOAL_MIN,
  type StreakSummary,
} from "@/lib/streak/rules";

/*
 * Meta diária da sequência (painel do leitor e widget da home). Devolve
 * `{ error }` em vez de lançar: em produção a mensagem de um erro lançado
 * não chega ao navegador.
 */
export async function updateDailyGoal(
  minutes: number,
): Promise<{ summary?: StreakSummary; error?: string }> {
  const userId = await getApprovedUserId();

  if (
    !Number.isInteger(minutes) ||
    minutes < MIN_DAILY_GOAL_MIN ||
    minutes > MAX_DAILY_GOAL_MIN
  ) {
    return { error: `Use de ${MIN_DAILY_GOAL_MIN} a ${MAX_DAILY_GOAL_MIN} minutos.` };
  }

  const timeZone = await getTimeZone();

  await setDailyGoal(userId, minutes, timeZone);

  revalidatePath("/");
  revalidatePath("/dashboard");

  return { summary: await getStreakSummary(userId, timeZone) };
}
