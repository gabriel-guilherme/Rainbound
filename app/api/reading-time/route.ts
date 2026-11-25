import {
  getStreakSummary,
  parseReadingTimeEntries,
  recordReadingTime,
  rememberTimeZone,
} from "@/lib/streak/server";
import { getCurrentUser, isApproved } from "@/lib/auth/session";
import { isValidTimeZone } from "@/lib/streak/rules";

/*
 * Recebe o tempo de leitura contado no navegador (ReadingTracker) e
 * devolve a sequência atualizada. Chamado com fetch a cada minuto e com
 * `navigator.sendBeacon` quando a aba é escondida ou fechada (por isso
 * é uma rota, e não uma Server Action).
 *
 * Corpo: { timeZone, entries: [{ date: "AAAA-MM-DD", seconds }] }.
 */
export async function POST(request: Request) {
  /* O beacon leva o cookie de sessão (mesma origem). */
  const user = await getCurrentUser();

  if (!isApproved(user)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { timeZone, entries } = (typeof body === "object" && body !== null
    ? body
    : {}) as Record<string, unknown>;

  if (!isValidTimeZone(timeZone)) {
    return Response.json({ error: "Fuso inválido." }, { status: 400 });
  }

  const parsed = parseReadingTimeEntries(entries, timeZone);

  if (!parsed) {
    return Response.json({ error: "Tempo de leitura inválido." }, { status: 400 });
  }

  await Promise.all([recordReadingTime(user.id, parsed), rememberTimeZone(user.id, timeZone)]);

  return Response.json(await getStreakSummary(user.id, timeZone));
}
