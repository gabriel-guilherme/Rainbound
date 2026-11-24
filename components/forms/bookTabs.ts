export const BOOK_TABS = [
  { id: "reading", label: "Leitura", param: "leitura" },
  { id: "details", label: "Detalhes", param: "detalhes" },
  { id: "notes", label: "Notas", param: "notas" },
] as const;

export type BookTabId = (typeof BOOK_TABS)[number]["id"];

/* Aba de `?aba=`; valor ausente ou desconhecido abre a Leitura. */
export function bookTabFromParam(param: string | string[] | undefined): BookTabId {
  return BOOK_TABS.find((item) => item.param === param)?.id ?? "reading";
}
