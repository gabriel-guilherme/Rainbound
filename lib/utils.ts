import supabase from "./supabase";
import { FileFormat } from "@/generated/prisma/enums";

export async function getBookFileUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("ebooks")
    .createSignedUrl(filePath, 60 * 60);

  if (error || !data) {
    throw new Error(`Falha ao gerar URL do livro: ${error?.message}`);
  }

  return data.signedUrl;
}

export function getFileFormat(file: File): FileFormat {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "epub":
      return FileFormat.EPUB;

    case "pdf":
      return FileFormat.PDF;

    case "cbz":
      return FileFormat.CBZ;

    case "cbr":
      return FileFormat.CBR;

    default:
      throw new Error(
        "Formato de arquivo não suportado. Envie EPUB, PDF, CBZ ou CBR.",
      );
  }
}
