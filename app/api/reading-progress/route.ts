import {
  isMissingBookError,
  parseReadingProgress,
  saveReadingProgress,
} from "@/lib/readingProgress";

/*
 * Recebe o progresso enviado por `navigator.sendBeacon` quando a aba é
 * escondida ou fechada (uma Server Action pode ser cancelada no meio do
 * descarregamento da página). No resto do tempo o leitor usa a Server
 * Action `saveBookProgress`.
 */
export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const { bookId, ...data } = (typeof body === "object" && body !== null
    ? body
    : {}) as Record<string, unknown>;

  const parsed = parseReadingProgress(bookId, data);

  if (!parsed) {
    return Response.json({ error: "Progresso inválido." }, { status: 400 });
  }

  try {
    await saveReadingProgress(parsed.bookId, parsed.progress);
  } catch (error) {
    if (isMissingBookError(error)) {
      return Response.json({ error: "Livro não encontrado." }, { status: 404 });
    }

    throw error;
  }

  return new Response(null, { status: 204 });
}
