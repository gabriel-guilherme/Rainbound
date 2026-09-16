"use client";

import { FileText, Upload } from "lucide-react";
import { useState } from "react";

export default function InputBookFile() {
  const [fileName, setFileName] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setFileName("");
      return;
    }

    const isEpub =
      file.type === "application/epub+zip" ||
      file.name.toLowerCase().endsWith(".epub");

    if (!isEpub) {
      alert("Selecione um arquivo EPUB.");
      event.target.value = "";
      setFileName("");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert("O EPUB deve ter no máximo 50MB.");
      event.target.value = "";
      setFileName("");
      return;
    }

    setFileName(file.name);
  }

  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-contrast px-4 py-3 text-primary shadow shadow-black/75 transition hover:opacity-80">
      <Upload size={20} />

      <div className="flex min-w-0 items-center gap-2">
        <FileText size={18} />

        <span className="truncate">{fileName || "Selecionar EPUB"}</span>
      </div>

      <input
        type="file"
        name="bookFile"
        accept=".epub,application/epub+zip"
        onChange={handleChange}
        className="sr-only"
      />
    </label>
  );
}
