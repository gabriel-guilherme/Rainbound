/*
 * Regras de arquivos CBZ (ZIP de imagens) compartilhadas pelo leitor
 * (ComicReader) e pela compressão no upload (comicCompression).
 * Arquivo puro: pode ser importado no cliente e no servidor.
 */
import { unzip, type Unzipped, type UnzipFileInfo } from "fflate";

const IMAGE_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

export function getImageType(name: string): string | undefined {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";

  return IMAGE_TYPES[extension];
}

/* Lixo de compactadores (macOS) e arquivos ocultos. */
export function isJunkEntry(name: string) {
  const fileName = name.split("/").pop() ?? "";

  return name.startsWith("__MACOSX/") || fileName.startsWith(".");
}

export function isComicPage(name: string) {
  return Boolean(getImageType(name)) && !isJunkEntry(name);
}

/* Ordem natural de nome: página 2 antes da 10. */
export function sortComicPages(names: string[]) {
  return [...names].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
  );
}

/* Descompacta em worker (fflate), só com as entradas aceitas pelo filtro. */
export function unzipAsync(
  data: Uint8Array,
  filter: (file: UnzipFileInfo) => boolean,
) {
  return new Promise<Unzipped>((resolve, reject) => {
    unzip(data, { filter }, (error, files) =>
      error ? reject(error) : resolve(files),
    );
  });
}
