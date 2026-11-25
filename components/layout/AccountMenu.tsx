"use client";

import { LogOut, Palette, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Avatar from "@/components/profile/Avatar";
import AvatarEditor from "@/components/profile/AvatarEditor";
import { authClient } from "@/lib/auth/client";
import type { Avatar as AvatarData } from "@/lib/profile/avatar";

type AccountMenuProps = {
  displayName: string;
  profileUsername: string | null;
  avatar: AvatarData;
};

const itemClass =
  "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2.5 text-left text-sm text-contrast transition-colors hover:bg-secondary disabled:opacity-60";

/*
 * Avatar no canto da barra do topo. Abre um menu com o perfil, a troca do
 * avatar e "Sair".
 */
export default function AccountMenu({ displayName, profileUsername, avatar }: AccountMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setIsOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);

    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  async function signOut() {
    setIsSigningOut(true);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Conta de ${displayName}`}
        title={displayName}
        className="flex size-10 cursor-pointer items-center justify-center transition-opacity hover:opacity-85"
      >
        <Avatar avatar={avatar} size={34} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-10 mt-2 w-60 bg-primary shadow-[6px_6px_0_rgb(0_0_0/0.45)] ring-1 ring-contrast/10"
        >
          <div className="flex items-center gap-3 border-b border-contrast/10 px-3 py-3">
            <Avatar avatar={avatar} size={40} />
            <div className="min-w-0">
              <p className="truncate font-semibold">{displayName}</p>
              {profileUsername && (
                <p className="truncate text-xs text-contrast/70">@{profileUsername}</p>
              )}
            </div>
          </div>

          <div className="py-1">
            {profileUsername && (
              <Link
                role="menuitem"
                href={`/u/${profileUsername}`}
                onClick={() => setIsOpen(false)}
                className={itemClass}
              >
                <UserRound size={16} aria-hidden="true" />
                Meu perfil
              </Link>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                setIsEditingAvatar(true);
              }}
              className={itemClass}
            >
              <Palette size={16} aria-hidden="true" />
              Trocar avatar
            </button>
          </div>

          <div className="border-t border-contrast/10 py-1">
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              disabled={isSigningOut}
              className={itemClass}
            >
              <LogOut size={16} aria-hidden="true" />
              {isSigningOut ? "Saindo..." : "Sair"}
            </button>
          </div>
        </div>
      )}

      {isEditingAvatar && (
        <AvatarEditor avatar={avatar} onClose={() => setIsEditingAvatar(false)} />
      )}
    </div>
  );
}
