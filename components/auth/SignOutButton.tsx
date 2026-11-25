"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth/client";

/* Encerra a sessão e volta para a home pública. */
export default function SignOutButton({
  variant = "icon",
  label = "Sair",
}: {
  variant?: "icon" | "button";
  label?: string;
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function signOut() {
    setIsPending(true);
    await authClient.signOut();
    router.replace("/");
    router.refresh();
  }

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={isPending}
        className="btn-shelf border-2 border-contrast/35 text-contrast hover:border-contrast disabled:opacity-60"
      >
        {isPending ? "Saindo..." : label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isPending}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 cursor-pointer items-center justify-center text-contrast/70 transition-colors hover:bg-contrast/10 hover:text-contrast disabled:opacity-60"
    >
      <LogOut size={19} />
    </button>
  );
}
