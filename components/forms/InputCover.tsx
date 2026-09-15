"use client";

import Image from "next/image";
import { Plus } from "lucide-react";
import { useState } from "react";

type InputCoverProps = {
  src?: string;
  alt?: string;
  name?: string;
};

export default function InputCover({
  src,
  alt = "Capa do livro",
  name = "cover",
}: InputCoverProps) {
  const [selectedPreview, setSelectedPreview] = useState<string>();
  const preview = selectedPreview ?? src;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Formato de imagem inválido.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 5MB.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);

    setSelectedPreview(previewUrl);
  }

  return (
    <label className="relative block h-full w-full cursor-pointer overflow-hidden rounded-md">
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />

      <div
        className={`relative flex h-full w-full items-center justify-center ${
          preview
            ? ""
            : "border-10 border-dashed border-white bg-gray-400 text-white opacity-10 hover:opacity-20"
        }`}
      >
        {preview ? (
          <Image
            src={preview}
            alt={alt}
            fill
            sizes="(max-width: 768px) 256px, 40vw"
            className="object-cover"
          />
        ) : (
          <Plus size={36} />
        )}
      </div>
    </label>
  );
}
