"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Voltar para a página anterior"
      className="mb-6 inline-flex cursor-pointer items-center gap-2 py-1 pr-2 text-sm uppercase tracking-widest text-contrast/60 transition-colors hover:text-danger"
    >
      <ArrowLeft size={22} aria-hidden="true" />
      Voltar
    </button>
  );
}
