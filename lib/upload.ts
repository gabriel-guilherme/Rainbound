import { randomUUID } from "node:crypto";

import {
  BOOK_FILE_TYPES,
  type BookFileExtension,
  formatFileSize,
  buildUploadedBookPath,
  getBookFileExtension,
  isUploadedBookPath,
  MAX_BOOK_FILE_SIZE,
} from "./bookFiles";
import cloudinary from "./cloudinary";
import { deleteObject, getObjectSize, presignObjectUrl } from "./r2";

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
 * requisições a ~4,5 MB. O servidor só gera uma URL pré-assinada de
 * upload no R2 e, depois, confere o arquivo que chegou ao bucket.
 */

/* Prazo para o navegador começar o envio depois de receber a URL. */
const UPLOAD_URL_EXPIRES_IN = 30 * 60;

export async function createBookUploadUrl(
  userId: string,
  fileName: string,
  size: number,
) {
  const extension = getBookFileExtension(fileName);

  if (!extension) {
    throw new Error("Formato não suportado. Use EPUB, PDF ou CBZ.");
  }

  if (!Number.isFinite(size) || size <= 0 || size > MAX_BOOK_FILE_SIZE) {
    throw new Error(
      `O arquivo deve ter no máximo ${formatFileSize(MAX_BOOK_FILE_SIZE)}.`,
    );
  }

  /* Cada usuário tem a própria pasta: books/<userId>/<uuid>.<ext>. */
  const path = buildUploadedBookPath(userId, `${randomUUID()}.${extension}`);

  return {
    path,
    signedUrl: await presignObjectUrl(path, "PUT", UPLOAD_URL_EXPIRES_IN),
    contentType: BOOK_FILE_TYPES[extension].contentType,
  };
}

/*
 * Confere se o caminho foi gerado por createBookUploadUrl PARA ESTE
 * usuário (pasta dele) e se o arquivo realmente existe no bucket dentro
 * do limite de tamanho. A URL de envio
 * não trava o tamanho (o R2 não assina Content-Length); a conferência é
 * aqui, e o que passar do limite é apagado.
 */
export async function verifyUploadedBookFile(path: string, userId: string) {
  if (!isUploadedBookPath(path, userId)) {
    throw new Error("Caminho de arquivo inválido.");
  }

  const size = await getObjectSize(path);

  if (size === null) {
    throw new Error("O arquivo do livro não foi encontrado no storage.");
  }

  if (size > MAX_BOOK_FILE_SIZE) {
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
  await deleteObject(filePath);
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
