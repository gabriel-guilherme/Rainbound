/*
 * Uploads feitos no navegador. Usado pelos formulários de livro para que
 * arquivos grandes não passem pelo servidor (limite de ~4,5 MB da Vercel).
 */
import { requestBookUpload } from "@/app/(main)/library/actions";
import {
  formatFileSize,
  getBookFileExtension,
  getMaxSelectableSize,
  MAX_BOOK_FILE_SIZE,
} from "./bookFiles";

/*
 * Erro com mensagem pronta para mostrar ao usuário.
 */
export class UploadError extends Error {}

const COVER_MAX_DIMENSION = 1200;
const COVER_QUALITY = 0.85;

/* Capa que ainda passa pela Server Action precisa caber no limite dela. */
const MAX_COVER_UPLOAD_SIZE = 3.5 * 1024 * 1024;

/* `bookId`: livro cujo arquivo está sendo trocado (edição). */
export async function uploadBookFileDirect(file: File, bookId?: number) {
  if (file.size > MAX_BOOK_FILE_SIZE) {
    throw new UploadError(
      `O arquivo deve ter no máximo ${formatFileSize(MAX_BOOK_FILE_SIZE)}.`,
    );
  }

  let upload: Awaited<ReturnType<typeof requestBookUpload>>;

  try {
    upload = await requestBookUpload(file.name, file.size, bookId);
  } catch {
    throw new UploadError("Não foi possível preparar o envio do arquivo.");
  }

  /* Sem espaço: a mensagem já vem pronta (quanto falta e como liberar). */
  if ("error" in upload) {
    throw new UploadError(upload.error);
  }

  /* PUT do arquivo puro na URL pré-assinada do R2. */
  let response: Response;

  try {
    response = await fetch(upload.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": upload.contentType },
      body: file,
    });
  } catch {
    throw new UploadError(
      "Falha de conexão ao enviar o arquivo. Verifique sua internet.",
    );
  }

  if (!response.ok) {
    throw new UploadError("Não foi possível enviar o arquivo do livro.");
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
 * CBZ: comprime as páginas antes de enviar (lib/comicCompression.ts,
 * carregado só quando necessário). Os demais formatos vão como estão.
 */
async function optimizeBookFile(
  file: File,
  onStatus?: (message: string) => void,
) {
  const extension = getBookFileExtension(file.name);

  if (!extension) {
    throw new UploadError("Use um arquivo EPUB, PDF ou CBZ.");
  }

  const maxSize = getMaxSelectableSize(extension);

  if (file.size > maxSize) {
    throw new UploadError(
      `O arquivo deve ter no máximo ${formatFileSize(maxSize)}.`,
    );
  }

  if (extension !== "cbz") {
    return file;
  }

  const { compressComic } = await import("./comicCompression");

  let optimized: File;

  try {
    optimized = await compressComic(file, ({ done, total }) =>
      onStatus?.(`Otimizando páginas ${done} de ${total}...`),
    );
  } catch {
    throw new UploadError(
      "Não foi possível ler o CBZ. Confira se o arquivo é um ZIP de imagens.",
    );
  }

  if (optimized.size > MAX_BOOK_FILE_SIZE) {
    throw new UploadError(
      `Mesmo otimizado, o quadrinho ficou com ${formatFileSize(optimized.size)} ` +
        `(limite de ${formatFileSize(MAX_BOOK_FILE_SIZE)}). Divida em volumes menores.`,
    );
  }

  return optimized;
}

/*
 * Prepara o FormData de um formulário de livro antes de chamar a action:
 * otimiza e envia o arquivo direto ao storage (trocando-o pelo caminho) e
 * comprime a capa. `onStatus` recebe mensagens de progresso para a tela.
 */
export async function prepareBookFormData(
  formData: FormData,
  onStatus?: (message: string) => void,
) {
  const bookFile = formData.get("bookFile");

  formData.delete("bookFile");

  /* Na edição, o formulário tem o id do livro (arquivo substituído). */
  const bookId = Number(formData.get("id")) || undefined;

  if (bookFile instanceof File && bookFile.size > 0) {
    const file = await optimizeBookFile(bookFile, onStatus);

    onStatus?.(`Enviando arquivo (${formatFileSize(file.size)})...`);
    formData.set("filePath", await uploadBookFileDirect(file, bookId));
  }

  onStatus?.("Salvando...");

  const cover = formData.get("cover");

  if (cover instanceof File && cover.size > 0) {
    formData.set("cover", await compressCover(cover));
  } else {
    formData.delete("cover");
  }

  return formData;
}
