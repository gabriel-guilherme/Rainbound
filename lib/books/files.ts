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
 * Limite por arquivo no R2 (200 MB, base decimal). O R2 aceitaria muito
 * mais; o limite é do app, para downloads e o cache do navegador.
 * Conferido no servidor depois do envio (verifyUploadedBookFile).
 */
export const MAX_BOOK_FILE_SIZE = 200 * 1000 * 1000;

/*
 * CBZ escolhido no formulário (antes da compressão no navegador, ver
 * lib/books/comicCompression.ts). Depois de comprimido ainda precisa caber em
 * MAX_BOOK_FILE_SIZE. O limite evita estourar a memória do navegador.
 */
export const MAX_COMIC_SOURCE_SIZE = 400 * 1000 * 1000;

/* Páginas de CBZ: maior lado em px e qualidade do WEBP/JPEG gerado. */
export const COMIC_PAGE_MAX_DIMENSION = 2400;
export const COMIC_PAGE_QUALITY = 0.8;

/* Tamanho máximo aceito no formulário para cada extensão. */
export function getMaxSelectableSize(extension: BookFileExtension) {
  return extension === "cbz" ? MAX_COMIC_SOURCE_SIZE : MAX_BOOK_FILE_SIZE;
}

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
 * "books/<userId>/<uuid>.<extensão>". A pasta do usuário impede que
 * alguém registre como seu um arquivo enviado por outra pessoa.
 */
const UPLOADED_FILE_NAME =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(epub|pdf|cbz)$/;

/* Ids do Better Auth: letras, números, - e _. */
const USER_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function buildUploadedBookPath(userId: string, fileName: string) {
  return `books/${userId}/${fileName}`;
}

export function isUploadedBookPath(path: string, userId: string) {
  if (!USER_ID.test(userId)) return false;

  const prefix = buildUploadedBookPath(userId, "");

  return path.startsWith(prefix) && UPLOADED_FILE_NAME.test(path.slice(prefix.length));
}

export function formatFileSize(bytes: number) {
  return `${Math.round(bytes / (1000 * 1000))} MB`;
}

/// Limite de espaço por usuário

export const BYTES_PER_MB = 1000 * 1000;

/*
 * Espaço padrão de cada usuário para arquivos de livro (1 GB). O admin
 * pode mudar o de cada pessoa em /admin/pedidos?aba=usuarios
 * (User.storageLimitMb).
 */
export const DEFAULT_STORAGE_LIMIT_MB = 1000;

/* Maior limite aceito no admin (100 GB), só para barrar erro de digitação. */
export const MAX_STORAGE_LIMIT_MB = 100_000;

/* Menor limite personalizado aceito (100 MB). */
export const MIN_STORAGE_LIMIT_MB = 100;

/* Opções prontas de limite no admin, além do padrão e do personalizado. */
export const STORAGE_LIMIT_PRESETS_MB = [2000, 5000, 10_000, 20_000] as const;

/*
 * Espaço grátis do Cloudflare R2 (10 GB). É da conta inteira: os buckets
 * de dev e de produção somam juntos.
 */
export const R2_FREE_STORAGE_MB = 10_000;

/* "320 MB", "1,2 GB" (base decimal, como o limite). */
export function formatStorageSize(bytes: number) {
  if (bytes >= 1000 * BYTES_PER_MB) {
    const gb = bytes / (1000 * BYTES_PER_MB);

    return `${gb.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} GB`;
  }

  const mb = bytes / BYTES_PER_MB;

  return mb > 0 && mb < 1 ? "< 1 MB" : `${Math.round(mb)} MB`;
}
