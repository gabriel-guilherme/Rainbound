import { randomUUID } from "node:crypto";

import {
  BOOK_FILE_TYPES,
  type BookFileExtension,
  formatFileSize,
  getBookFileExtension,
  isUploadedBookPath,
  MAX_BOOK_FILE_SIZE,
} from "./bookFiles";
import cloudinary from "./cloudinary";
import supabase from "./supabase";

export async function uploadBookCover(file: File) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  return new Promise<{
    url: string;
    publicId: string;
  }>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "books/covers",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Falha no upload"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

/*
 * ==========================================
 * ARQUIVO DO LIVRO (upload direto do navegador)
 * ==========================================
 *
 * O arquivo não passa pelo servidor: a Vercel limita o corpo das
 * requisições a ~4,5 MB. O servidor só gera uma URL assinada de upload
 * e, depois, confere o arquivo que chegou ao bucket.
 */

const BOOKS_BUCKET = "ebooks";

export async function createBookUploadUrl(fileName: string, size: number) {
  const extension = getBookFileExtension(fileName);

  if (!extension) {
    throw new Error("Formato não suportado. Use EPUB, PDF ou CBZ.");
  }

  if (!Number.isFinite(size) || size <= 0 || size > MAX_BOOK_FILE_SIZE) {
    throw new Error(
      `O arquivo deve ter no máximo ${formatFileSize(MAX_BOOK_FILE_SIZE)}.`,
    );
  }

  const path = `books/${randomUUID()}.${extension}`;

  const { data, error } = await supabase.storage
    .from(BOOKS_BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Falha ao preparar o upload: ${error?.message}`);
  }

  return {
    path: data.path,
    signedUrl: data.signedUrl,
  };
}

/*
 * Confere se o caminho foi gerado por createBookUploadUrl e se o arquivo
 * realmente existe no bucket dentro do limite de tamanho.
 */
export async function verifyUploadedBookFile(path: string) {
  if (!isUploadedBookPath(path)) {
    throw new Error("Caminho de arquivo inválido.");
  }

  const { data, error } = await supabase.storage
    .from(BOOKS_BUCKET)
    .info(path);

  if (error || !data) {
    throw new Error("O arquivo do livro não foi encontrado no storage.");
  }

  if (data.size !== undefined && data.size > MAX_BOOK_FILE_SIZE) {
    await cleanupStorage([deleteBookFile(path)]);

    throw new Error(
      `O arquivo deve ter no máximo ${formatFileSize(MAX_BOOK_FILE_SIZE)}.`,
    );
  }

  const extension = getBookFileExtension(path) as BookFileExtension;

  return {
    filePath: path,
    format: BOOK_FILE_TYPES[extension].format,
  };
}

export async function deleteBookCover(publicId: string) {
  await cloudinary.uploader.destroy(publicId);
}

export async function deleteBookFile(filePath: string) {
  const { error } = await supabase.storage.from(BOOKS_BUCKET).remove([filePath]);

  if (error) {
    throw new Error(`Falha ao remover o arquivo do livro: ${error.message}`);
  }
}

/*
 * Limpeza que não deve interromper o fluxo principal:
 * falhas são apenas registradas no log.
 */
export async function cleanupStorage(tasks: Array<Promise<unknown>>) {
  const results = await Promise.allSettled(tasks);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Falha ao limpar storage:", result.reason);
    }
  }
}
