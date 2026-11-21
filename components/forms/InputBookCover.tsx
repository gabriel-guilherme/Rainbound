"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { useState } from "react";

import { ALLOWED_COVER_TYPES, MAX_COVER_FILE_SIZE } from "@/lib/bookFiles";

type InputCoverProps = {
  src?: string;
  alt?: string;
  name?: string;
  onFileSelected?: (input: HTMLInputElement) => void;
};

export default function InputBookCover({
  src,
  alt = "Capa do livro",
  name = "cover",
  onFileSelected,
}: InputCoverProps) {
  const [selectedPreview, setSelectedPreview] = useState<string>();
  const [error, setError] = useState("");
  const preview = selectedPreview ?? src;

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!ALLOWED_COVER_TYPES.includes(file.type)) {
      setError("Use uma imagem JPG, PNG ou WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_COVER_FILE_SIZE) {
      setError("A imagem deve ter no máximo 10 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setSelectedPreview(URL.createObjectURL(file));
    onFileSelected?.(event.target);
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-2">
      <label className="group relative block h-full w-full cursor-pointer overflow-hidden rounded-md focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-interaction">
        <input
          type="file"
          name={name}
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          aria-label={preview ? "Trocar capa" : "Adicionar capa"}
          className="sr-only"
        />

        {preview ? (
          <>
            <Image
              src={preview}
              alt={alt}
              fill
              sizes="(max-width: 768px) 256px, 40vw"
              className="object-cover shadow-md shadow-black/50"
            />

            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 bg-darkest/70 py-2 text-sm text-contrast opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
              <ImagePlus size={16} aria-hidden="true" />
              Trocar capa
            </span>
          </>
        ) : (
          <span className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-contrast/20 bg-contrast/[0.04] text-contrast/45 transition-colors group-hover:border-interaction/60 group-hover:text-interaction">
            <ImagePlus size={32} strokeWidth={1.5} aria-hidden="true" />
            <span className="text-sm">Adicionar capa</span>
            <span className="text-xs opacity-70">JPG, PNG ou WEBP, até 10 MB</span>
          </span>
        )}
      </label>

      {error && (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
