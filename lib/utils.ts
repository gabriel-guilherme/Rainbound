import { presignObjectUrl } from "./r2";

/*
 * URL de leitura do arquivo do livro (R2), válida por 1 hora. O caminho
 * da URL não muda entre aberturas, então o cache do navegador
 * (lib/bookCache.ts) reconhece o mesmo arquivo.
 */
export async function getBookFileUrl(filePath: string) {
  return presignObjectUrl(filePath, "GET", 60 * 60);
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
