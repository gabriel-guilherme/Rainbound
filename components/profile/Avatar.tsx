import type { Avatar as AvatarData } from "@/lib/profile/avatar";

type AvatarProps = {
  avatar: Pick<AvatarData, "background" | "foreground" | "letter">;
  /* Lado do quadrado, em px (32 no menu, 40 na atividade, 136 no perfil). */
  size: number;
  label?: string;
  className?: string;
};

/*
 * Avatar do perfil: quadrado na cor escolhida com a letra na fonte dos
 * títulos (lib/profile/avatar.ts). Cantos retos, como o resto do app.
 */
export default function Avatar({ avatar, size, label, className = "" }: AvatarProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`inline-flex shrink-0 select-none items-center justify-center font-display font-extrabold leading-none ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.72),
        background: avatar.background,
        color: avatar.foreground,
        boxShadow:
          size >= 64 ? `inset 0 -${Math.round(size / 20)}px 0 rgb(0 0 0 / 0.18)` : undefined,
      }}
    >
      {avatar.letter}
    </span>
  );
}
