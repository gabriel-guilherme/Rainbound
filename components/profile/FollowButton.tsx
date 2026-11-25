"use client";

import { useState, useTransition } from "react";

import { setFollowing } from "@/app/profile/actions";

type FollowButtonProps = {
  userId: string;
  name: string;
  following: boolean;
  size?: "md" | "sm";
  onColor?: boolean;
};

/*
 * "Seguir" / "Seguindo". Muda na hora e desfaz se o servidor recusar.
 * Seguindo, o hover mostra "Deixar de seguir".
 */
export default function FollowButton({
  userId,
  name,
  following,
  size = "md",
  onColor = false,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(following);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !isFollowing;

    setIsFollowing(next);
    setError("");

    startTransition(async () => {
      const result = await setFollowing({ userId, follow: next });

      if (result.error) {
        setIsFollowing(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={isFollowing}
        aria-label={isFollowing ? `Deixar de seguir ${name}` : `Seguir ${name}`}
        className={[
          "group btn-shelf cursor-pointer disabled:cursor-wait",
          size === "sm" ? "px-3 py-1.5 text-sm" : "",
          onColor
            ? isFollowing
              ? "bg-darkest/25 text-current hover:bg-darkest/45"
              : "bg-primary text-contrast hover:bg-darkest"
            : isFollowing
              ? "text-contrast ring-2 ring-inset ring-contrast/25 hover:text-danger hover:ring-danger/60"
              : "bg-danger text-primary hover:bg-contrast",
        ].join(" ")}
      >
        {isFollowing ? (
          <>
            <span className="group-hover:hidden">Seguindo</span>
            <span className="hidden group-hover:inline">Deixar de seguir</span>
          </>
        ) : (
          "Seguir"
        )}
      </button>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
