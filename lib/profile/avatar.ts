/*
 * Avatar do perfil: um quadrado numa cor da paleta com uma letra. Funções
 * puras, usadas no servidor e no navegador. No banco ficam só o id da cor
 * e a letra (User.avatarColor, User.avatarLetter); vazios, valem a cor
 * tirada do id da conta (sempre a mesma) e a inicial do nome.
 */

export type AvatarColor = {
  id: string;
  name: string;
  background: string;
  foreground: string;
};

const DARK_LETTER = "#080c0d";
const PRIMARY_LETTER = "#27191c";
const LIGHT_LETTER = "#e0e4ce";

export const AVATAR_COLORS: readonly AvatarColor[] = [
  { id: "sage", name: "Sálvia", background: "#6e9987", foreground: DARK_LETTER },
  { id: "teal", name: "Petróleo", background: "#114d4d", foreground: LIGHT_LETTER },
  { id: "rose", name: "Rosa antigo", background: "#d4a09a", foreground: PRIMARY_LETTER },
  { id: "wine", name: "Vinho", background: "#5e2f38", foreground: LIGHT_LETTER },
  { id: "umber", name: "Terra", background: "#5b4a3e", foreground: LIGHT_LETTER },
  { id: "sand", name: "Areia", background: "#b9b3a0", foreground: PRIMARY_LETTER },
  { id: "moss", name: "Musgo", background: "#a8c4a0", foreground: DARK_LETTER },
  { id: "slate", name: "Ardósia", background: "#4a5a6a", foreground: LIGHT_LETTER },
  { id: "ochre", name: "Ocre", background: "#c49a4a", foreground: PRIMARY_LETTER },
  { id: "plum", name: "Ameixa", background: "#6b4a6e", foreground: LIGHT_LETTER },
  { id: "night", name: "Noite", background: "#080c0d", foreground: LIGHT_LETTER },
  { id: "paper", name: "Papel", background: "#e0e4ce", foreground: PRIMARY_LETTER },
];

export type Avatar = {
  colorId: string;
  background: string;
  foreground: string;
  letter: string;
};

export function findAvatarColor(id: unknown) {
  return AVATAR_COLORS.find((color) => color.id === id) ?? null;
}

export function defaultAvatarColor(seed: string): AvatarColor {
  let hash = 0;

  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;

  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}


export function parseAvatarLetter(value: unknown) {
  if (typeof value !== "string") return null;

  const match = value.match(/[\p{L}\p{N}]/u);

  return match ? match[0].toLocaleUpperCase("pt-BR") : null;
}

export function defaultAvatarLetter(name: string) {
  return parseAvatarLetter(name) ?? "?";
}

export function getAvatar(user: {
  id: string;
  name: string;
  avatarColor: string | null;
  avatarLetter: string | null;
}): Avatar {
  const color = findAvatarColor(user.avatarColor) ?? defaultAvatarColor(user.id);

  return {
    colorId: color.id,
    background: color.background,
    foreground: color.foreground,
    letter: parseAvatarLetter(user.avatarLetter) ?? defaultAvatarLetter(user.name),
  };
}
