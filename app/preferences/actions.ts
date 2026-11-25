"use server";

import { getApprovedUserId } from "@/lib/auth/session";
import { parseLibraryPatch, parseReaderPreferences } from "@/lib/preferences/rules";
import { updateUserPreferences } from "@/lib/preferences/server";

/*
 * Grava as preferências do leitor na conta (tema, tamanho do texto do
 * EPUB, itens do rodapé). Sem revalidatePath: o leitor já mostra o valor
 * novo, e recarregar a página reabriria o livro.
 */
export async function saveReaderPreferences(value: unknown) {
  const userId = await getApprovedUserId();
  const reader = parseReaderPreferences(value);

  if (!reader) return;

  await updateUserPreferences(userId, (current) => ({ ...current, reader }));
}

/*
 * Grava a visualização ou a ordem da estante. A URL da troca já leva o
 * valor (?view=, ?sort=); isto só vale para a próxima vez sem eles.
 */
export async function saveLibraryPreferences(value: unknown) {
  const userId = await getApprovedUserId();
  const patch = parseLibraryPatch(value);

  if (Object.keys(patch).length === 0) return;

  await updateUserPreferences(userId, (current) => ({
    ...current,
    library: { ...current.library, ...patch },
  }));
}
