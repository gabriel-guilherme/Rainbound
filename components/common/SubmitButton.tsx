"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  pendingLabel = "Salvando...",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 cursor-pointer rounded-3xl border border-interaction bg-interaction-contrast px-5 py-3 font-medium text-contrast transition-colors hover:bg-interaction hover:text-primary disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
