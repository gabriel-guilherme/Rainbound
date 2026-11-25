import { getCurrentUser, isApproved } from "@/lib/auth/session";
import { countUnread } from "@/lib/notifications/server";

/*
 * Quantas notificações não lidas. O navegador consulta
 * a cada ~60 s e ao trocar de página (NotificationBell): sem tempo real.
 */
export async function GET() {
  const user = await getCurrentUser();

  if (!isApproved(user)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  return Response.json(
    { unread: await countUnread(user.id) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
