/*
 * Uploads feitos no navegador. Usado pelos formulários de livro para que
 * arquivos grandes não passem pelo servidor (limite de ~4,5 MB da Vercel).
 */
import { requestBookUpload } from "@/app/(main)/library/actions";
import { formatFileSize, MAX_BOOK_FILE_SIZE } from "./bookFiles";

/*
 * Erro com mensagem pronta para mostrar ao usuário.
 */
export class UploadError extends Error {}

const COVER_MAX_DIMENSION = 1200;
const COVER_QUALITY = 0.85;

/* Capa que ainda passa pela Server Action precisa caber no limite dela. */
const MAX_COVER_UPLOAD_SIZE = 3.5 * 1024 * 1024;

export async function uploadBookFileDirect(file: File) {
  if (file.size > MAX_BOOK_FILE_SIZE) {
    throw new UploadError(
      `O arquivo deve ter no máximo ${formatFileSize(MAX_BOOK_FILE_SIZE)}.`,
    );
  }

  let upload: Awaited<ReturnType<typeof requestBookUpload>>;

  try {
    upload = await requestBookUpload(file.name, file.size);
  } catch {
    throw new UploadError("Não foi possível preparar o envio do arquivo.");
  }

  /*
   * Mesmo formato que o supabase-js usa em uploadToSignedUrl.
   */
  const body = new FormData();
  body.append("cacheControl", "3600");
  body.append("", file);

  let response: Response;

  try {
    response = await fetch(upload.signedUrl, {
      method: "PUT",
      headers: { "x-upsert": "false" },
      body,
    });
  } catch {
    throw new UploadError(
      "Falha de conexão ao enviar o arquivo. Verifique sua internet.",
    );
  }

  if (!response.ok) {
    const detail = await response
      .json()
      .then((data: { message?: string }) => data.message)
      .catch(() => undefined);

    throw new UploadError(
      detail?.includes("maximum allowed size")
        ? `O arquivo é maior que o limite do storage (${formatFileSize(MAX_BOOK_FILE_SIZE)}).`
        : "Não foi possível enviar o arquivo do livro.",
    );
  }

  return upload.path;
}

/*
 * Reduz a capa para no máximo 1200 px e converte para WEBP.
 */
export async function compressCover(file: File) {
  try {
    const bitmap = await createImageBitmap(file);

    const ratio = Math.min(
      1,
      COVER_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * ratio);
    canvas.height = Math.round(bitmap.height * ratio);

    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", COVER_QUALITY),
    );

    if (blob && blob.size < file.size) {
      const name = file.name.replace(/\.[^.]+$/, "") + ".webp";

      return new File([blob], name, { type: "image/webp" });
    }
  } catch {
    /* Sem suporte a canvas/WEBP: segue com o original, se couber. */
  }

  if (file.size > MAX_COVER_UPLOAD_SIZE) {
    throw new UploadError("A imagem da capa é grande demais. Use uma menor.");
  }

  return file;
}

/*
 * Prepara o FormData de um formulário de livro antes de chamar a action:
 * envia o arquivo direto ao storage (trocando-o pelo caminho) e comprime
 * a capa.
 */
export async function prepareBookFormData(formData: FormData) {
  const bookFile = formData.get("bookFile");

  formData.delete("bookFile");

  if (bookFile instanceof File && bookFile.size > 0) {
    formData.set("filePath", await uploadBookFileDirect(bookFile));
  }

  const cover = formData.get("cover");

  if (cover instanceof File && cover.size > 0) {
    formData.set("cover", await compressCover(cover));
  } else {
    formData.delete("cover");
  }

  return formData;
}
