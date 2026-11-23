import supabase from "./supabase";

export async function getBookFileUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("ebooks")
    .createSignedUrl(filePath, 60 * 60);

  if (error || !data) {
    throw new Error(`Falha ao gerar URL do livro: ${error?.message}`);
  }

  return data.signedUrl;
}

/* Maior valor de uma coluna Int do Postgres. */
const MAX_INT_ID = 2_147_483_647;

/*
 * Converte o `[id]` da URL em número. Devolve null para texto, decimais,
 * zero, negativos ou valores acima do Int do banco (ex.: /library/abc),
 * para a página responder 404 em vez de quebrar na consulta.
 */
export function parseBookId(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const id = Number(value);

  return id > 0 && id <= MAX_INT_ID ? id : null;
}
