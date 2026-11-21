/*
 * Formatos e limites de arquivos de livro.
 *
 * CBR (RAR) não é aceito: ler RAR no navegador exige WASM pesado.
 * O enum FileFormat ainda tem CBR por compatibilidade com o banco.
 * Arquivo puro (sem dependências de servidor): pode ser importado
 * tanto no cliente quanto no servidor. É a fonte única desses valores.
 */
import type { FileFormat } from "@/generated/prisma/enums";

export const BOOK_FILE_TYPES = {
  epub: { format: "EPUB", contentType: "application/epub+zip" },
  pdf: { format: "PDF", contentType: "application/pdf" },
  cbz: { format: "CBZ", contentType: "application/vnd.comicbook+zip" },
} as const satisfies Record<string, { format: FileFormat; contentType: string }>;

export type BookFileExtension = keyof typeof BOOK_FILE_TYPES;

/*
 * Limite do bucket "ebooks" no Supabase (50 MB). Usa base decimal
 * para ficar sempre um pouco abaixo do limite real do bucket.
 */
export const MAX_BOOK_FILE_SIZE = 50 * 1000 * 1000;

/* Limite da imagem de capa escolhida (antes da compressão no navegador). */
export const MAX_COVER_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const BOOK_FILE_ACCEPT = [
  ...Object.keys(BOOK_FILE_TYPES).map((extension) => `.${extension}`),
  ...Object.values(BOOK_FILE_TYPES).map((type) => type.contentType),
].join(",");

export function getBookFileExtension(fileName: string): BookFileExtension | null {
  const extension = fileName.split(".").pop()?.toLowerCase() ?? "";

  return extension in BOOK_FILE_TYPES ? (extension as BookFileExtension) : null;
}

/*
 * Caminho no bucket de um arquivo enviado direto pelo navegador:
 * "books/<uuid>.<extensão>".
 */
const UPLOADED_BOOK_PATH =
  /^books\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(epub|pdf|cbz)$/;

export function isUploadedBookPath(path: string) {
  return UPLOADED_BOOK_PATH.test(path);
}

export function formatFileSize(bytes: number) {
  return `${Math.round(bytes / (1000 * 1000))} MB`;
}
