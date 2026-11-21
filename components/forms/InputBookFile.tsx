"use client";

import { FileText, Upload } from "lucide-react";
import { useState } from "react";

import {
  BOOK_FILE_ACCEPT,
  formatFileSize,
  getBookFileExtension,
  MAX_BOOK_FILE_SIZE,
} from "@/lib/bookFiles";

type InputBookFileProps = {
  label?: string;
  required?: boolean;
  onFileSelected?: (input: HTMLInputElement) => void;
};

export default function InputBookFile({
  label = "Selecionar arquivo",
  required = false,
  onFileSelected,
}: InputBookFileProps) {
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setFileName("");
      return;
    }

    if (!getBookFileExtension(file.name)) {
      setError("Use um arquivo EPUB, PDF ou CBZ.");
      event.target.value = "";
      setFileName("");
      return;
    }

    if (file.size > MAX_BOOK_FILE_SIZE) {
      setError(
        `O arquivo deve ter no máximo ${formatFileSize(MAX_BOOK_FILE_SIZE)}.`,
      );
      event.target.value = "";
      setFileName("");
      return;
    }

    setError("");
    setFileName(file.name);
    onFileSelected?.(event.target);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-contrast/15 bg-contrast/[0.07] px-4 py-3 text-sm text-contrast transition-colors hover:border-interaction/60 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-interaction">
        {fileName ? (
          <FileText size={18} aria-hidden="true" className="shrink-0 text-interaction" />
        ) : (
          <Upload size={18} aria-hidden="true" className="shrink-0 text-contrast/60" />
        )}

        <span className={`truncate ${fileName ? "" : "text-contrast/70"}`}>
          {fileName || label}
        </span>

        <input
          type="file"
          name="bookFile"
          required={required}
          accept={BOOK_FILE_ACCEPT}
          onChange={handleChange}
          className="sr-only"
        />
      </label>

      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        !fileName && (
          <p className="text-xs text-contrast/40">EPUB, PDF ou CBZ, até {formatFileSize(MAX_BOOK_FILE_SIZE)}</p>
        )
      )}
    </div>
  );
}
