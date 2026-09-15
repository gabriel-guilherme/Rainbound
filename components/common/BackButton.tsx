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
      className="mb-6 inline-block cursor-pointer text-sm text-primary hover:text-interaction"
    >
      <ArrowLeft size={36} />
    </button>
  );
}
