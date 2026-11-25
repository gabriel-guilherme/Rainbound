/*
 * Compressão de CBZ no navegador, antes do upload.
 *
 * Cada página é reduzida para no máximo COMIC_PAGE_MAX_DIMENSION px no
 * lado maior e convertida para WEBP (JPEG no Safari, que não gera WEBP
 * pelo canvas). Páginas que não ficam menores mantêm o original. Outros
 * arquivos do ZIP (ex.: ComicInfo.xml) são mantidos; lixo do macOS sai.
 * O ZIP final é montado sem recompressão (as imagens já são comprimidas).
 */
import { zip, type Zippable } from "fflate";

import {
  BOOK_FILE_TYPES,
  COMIC_PAGE_MAX_DIMENSION,
  COMIC_PAGE_QUALITY,
} from "./files";
import { getImageType, isJunkEntry, unzipAsync } from "./comicFiles";

/* Quantas páginas são processadas ao mesmo tempo. */
const CONCURRENCY = 3;

/* Abaixo disso de economia, envia o arquivo original. */
const MIN_SAVING = 0.05;

/* Formatos que só são regravados se precisarem ser reduzidos. */
const KEEP_IF_SMALL = new Set(["image/webp", "image/avif"]);

export type CompressionProgress = { done: number; total: number };

type Encoded = { data: Uint8Array; extension: string };

let outputType: "image/webp" | "image/jpeg" | null = null;

async function encodeCanvas(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  type: string,
) {
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(width, height);
    const context = canvas.getContext("2d");

    if (context) {
      context.drawImage(bitmap, 0, 0, width, height);

      return canvas.convertToBlob({ type, quality: COMIC_PAGE_QUALITY });
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, COMIC_PAGE_QUALITY),
  );

  if (!blob) {
    throw new Error("Falha ao converter a página.");
  }

  return blob;
}

/* Converte uma página; devolve null para manter a original. */
async function compressPage(
  data: Uint8Array,
  sourceType: string,
): Promise<Encoded | null> {
  /* GIF pode ser animado: canvas perderia a animação. */
  if (sourceType === "image/gif") {
    return null;
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(
      new Blob([data as BlobPart], { type: sourceType }),
    );
  } catch {
    return null;
  }

  try {
    const ratio = Math.min(
      1,
      COMIC_PAGE_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    if (ratio === 1 && KEEP_IF_SMALL.has(sourceType)) {
      return null;
    }

    const width = Math.max(1, Math.round(bitmap.width * ratio));
    const height = Math.max(1, Math.round(bitmap.height * ratio));

    let blob = await encodeCanvas(bitmap, width, height, outputType ?? "image/webp");

    /* Descobre uma vez se o navegador gera WEBP (Safari devolve PNG). */
    if (!outputType) {
      outputType = blob.type === "image/webp" ? "image/webp" : "image/jpeg";

      if (outputType === "image/jpeg") {
        blob = await encodeCanvas(bitmap, width, height, outputType);
      }
    }

    if (ratio === 1 && blob.size >= data.byteLength) {
      return null;
    }

    return {
      data: new Uint8Array(await blob.arrayBuffer()),
      extension: outputType === "image/webp" ? "webp" : "jpg",
    };
  } catch {
    return null;
  } finally {
    bitmap.close();
  }
}

function zipAsync(files: Zippable) {
  return new Promise<Uint8Array>((resolve, reject) => {
    zip(files, { level: 0 }, (error, data) =>
      error ? reject(error) : resolve(data),
    );
  });
}

/* Troca a extensão sem colidir com outra página (ex.: 01.jpg e 01.png). */
function renamePage(name: string, extension: string, used: Set<string>) {
  const base = name.replace(/\.[^./]+$/, "");
  let candidate = `${base}.${extension}`;
  let suffix = 2;

  while (used.has(candidate)) {
    candidate = `${base}-${suffix}.${extension}`;
    suffix += 1;
  }

  return candidate;
}

/*
 * Devolve o CBZ comprimido, ou o próprio arquivo se a compressão não
 * compensar. Lança erro se o arquivo não for um ZIP válido.
 */
export async function compressComic(
  file: File,
  onProgress?: (progress: CompressionProgress) => void,
): Promise<File> {
  const files = await unzipAsync(
    new Uint8Array(await file.arrayBuffer()),
    (entry) => !isJunkEntry(entry.name) && !entry.name.endsWith("/"),
  );

  const names = Object.keys(files);
  const pages = names.filter((name) => getImageType(name));
  const total = pages.length;

  if (total === 0) {
    throw new Error("Nenhuma imagem encontrada no CBZ.");
  }

  const output: Zippable = {};
  const used = new Set(names.filter((name) => !getImageType(name)));

  for (const name of used) {
    output[name] = files[name];
  }

  let done = 0;
  let next = 0;

  onProgress?.({ done, total });

  async function worker() {
    while (next < total) {
      const name = pages[next];
      next += 1;

      const original = files[name];
      const encoded = await compressPage(original, getImageType(name) ?? "");

      if (encoded) {
        const newName = renamePage(name, encoded.extension, used);
        used.add(newName);
        output[newName] = encoded.data;
      } else {
        const newName = used.has(name) ? renamePage(name, name.split(".").pop() ?? "img", used) : name;
        used.add(newName);
        output[newName] = original;
      }

      /* Libera a memória da página original. */
      delete files[name];

      done += 1;
      onProgress?.({ done, total });
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const zipped = await zipAsync(output);

  if (zipped.byteLength > file.size * (1 - MIN_SAVING)) {
    return file;
  }

  return new File([zipped as BlobPart], file.name, {
    type: BOOK_FILE_TYPES.cbz.contentType,
  });
}
