"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
};

export function SubmitButton({ children }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 rounded-lg bg-interaction px-4 py-2 font-medium text-contrast transition cursor-pointer hover:bg-interaction-contrast disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "Salvando..." : children}
    </button>
  );
}
