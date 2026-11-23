/*
 * Cache de arquivos de livro no navegador (Cache API), para não baixar
 * o mesmo CBZ/EPUB do storage a cada leitura (economiza o tráfego do
 * Supabase e abre na hora).
 *
 * - A chave usa o caminho do arquivo (sem o token da URL assinada, que
 *   muda a cada visita). Trocar o arquivo gera caminho novo.
 * - Guarda os livros usados mais recentemente, até MAX_ENTRIES e
 *   MAX_TOTAL_BYTES; os mais antigos saem primeiro.
 * - Sem Cache API (HTTP fora de localhost, modo privado de alguns
 *   navegadores) ou sem espaço: baixa normalmente, sem cache.
 */

const CACHE_NAME = "rainbound-books-v1";
const INDEX_KEY = "rainbound:book-cache-index";

const MAX_ENTRIES = 8;
const MAX_TOTAL_BYTES = 400 * 1000 * 1000;

type CacheEntry = { key: string; bookId: number; size: number; usedAt: number };

function readIndex(): CacheEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(INDEX_KEY) ?? "[]");

    return Array.isArray(parsed) ? (parsed as CacheEntry[]) : [];
  } catch {
    return [];
  }
}

function writeIndex(entries: CacheEntry[]) {
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(entries));
  } catch {
    /* Sem localStorage: o cache funciona, só sem controle de tamanho. */
  }
}

function getCacheKey(bookId: number, bookUrl: string) {
  let path = bookUrl;

  try {
    path = new URL(bookUrl, window.location.origin).pathname;
  } catch {
    /* Usa a URL como está. */
  }

  return `${window.location.origin}/__book-cache/${bookId}${path}`;
}

async function openCache() {
  try {
    return typeof caches === "undefined" ? null : await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

async function download(bookUrl: string) {
  const response = await fetch(bookUrl);

  if (!response.ok) {
    throw new Error(`Erro ao baixar o arquivo: ${response.status}`);
  }

  return response.arrayBuffer();
}

/*
 * Mantém o novo arquivo e remove: versões antigas do mesmo livro e os
 * menos usados que passarem dos limites.
 */
async function store(cache: Cache, entry: CacheEntry, data: ArrayBuffer) {
  if (entry.size > MAX_TOTAL_BYTES) {
    return;
  }

  const others = readIndex().filter(
    (item) => item.key !== entry.key && item.bookId !== entry.bookId,
  );
  const stale = readIndex().filter(
    (item) => item.key !== entry.key && item.bookId === entry.bookId,
  );

  const kept: CacheEntry[] = [entry];
  let total = entry.size;

  for (const item of others.sort((a, b) => b.usedAt - a.usedAt)) {
    if (kept.length < MAX_ENTRIES && total + item.size <= MAX_TOTAL_BYTES) {
      kept.push(item);
      total += item.size;
    } else {
      stale.push(item);
    }
  }

  await Promise.all(stale.map((item) => cache.delete(item.key)));

  await cache.put(
    entry.key,
    new Response(data, {
      headers: { "Content-Length": String(entry.size) },
    }),
  );

  writeIndex(kept);
}

export async function fetchBookFile(bookId: number, bookUrl: string) {
  const cache = await openCache();

  if (!cache) {
    return download(bookUrl);
  }

  const key = getCacheKey(bookId, bookUrl);

  try {
    const cached = await cache.match(key);

    if (cached) {
      const data = await cached.arrayBuffer();

      writeIndex(
        readIndex().map((item) =>
          item.key === key ? { ...item, usedAt: Date.now() } : item,
        ),
      );

      return data;
    }
  } catch {
    /* Cache corrompido ou indisponível: baixa de novo. */
  }

  const data = await download(bookUrl);

  try {
    await store(
      cache,
      { key, bookId, size: data.byteLength, usedAt: Date.now() },
      data,
    );
  } catch {
    /* Sem espaço (QuotaExceededError): segue sem guardar. */
  }

  return data;
}
