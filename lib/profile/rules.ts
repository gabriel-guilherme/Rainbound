/*
 * Regras do perfil que valem no servidor e no navegador. O avatar tem as
 * dele em lib/profile/avatar.ts.
 */

export const MAX_BIO_LENGTH = 160;

/*
 * Frase de apresentação: uma linha, sem espaços repetidos, até
 * MAX_BIO_LENGTH caracteres. Vazia vira null. Texto inválido: undefined.
 */
export function parseBio(value: unknown): string | null | undefined {
  if (typeof value !== "string") return undefined;

  const bio = value.replace(/\s+/g, " ").trim();

  if (bio.length > MAX_BIO_LENGTH) return undefined;

  return bio || null;
}

/* Usuário do endereço (/u/<username>): o plugin guarda em minúsculas. */
export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export const MAX_PEOPLE_QUERY_LENGTH = 50;

/* Texto da busca de pessoas: sem "@" no começo e sem espaços nas pontas. */
export function normalizePeopleQuery(value: unknown) {
  if (typeof value !== "string") return "";

  return value.trim().replace(/^@+/, "").slice(0, MAX_PEOPLE_QUERY_LENGTH);
}
