import { AwsClient } from "aws4fetch";

/*
 * Cloudflare R2 (API compatível com S3): storage dos arquivos de livro.
 * Só no servidor — usa a chave secreta. O navegador recebe apenas URLs
 * pré-assinadas e com prazo (envio e leitura).
 *
 * As variáveis são lidas na hora do uso, e não ao importar, para o build
 * não quebrar quando elas não estão definidas.
 */

type R2Config = {
  client: AwsClient;
  endpoint: string;
  bucket: string;
};

let cachedConfig: R2Config | null = null;

function getConfig(): R2Config {
  if (cachedConfig) return cachedConfig;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      "R2 não configurado: defina R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY e R2_BUCKET.",
    );
  }

  cachedConfig = {
    client: new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    }),
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    bucket,
  };

  return cachedConfig;
}

function objectUrl(key: string) {
  const { endpoint, bucket } = getConfig();
  const path = key.split("/").map(encodeURIComponent).join("/");

  return new URL(`${endpoint}/${bucket}/${path}`);
}

/*
 * URL pré-assinada para o navegador ler (GET) ou enviar (PUT) um objeto
 * direto ao R2, válida por `expiresIn` segundos.
 */
export async function presignObjectUrl(
  key: string,
  method: "GET" | "PUT",
  expiresIn: number,
) {
  const url = objectUrl(key);

  url.searchParams.set("X-Amz-Expires", String(expiresIn));

  const signed = await getConfig().client.sign(url, {
    method,
    aws: { signQuery: true },
  });

  return signed.url;
}

/* Tamanho do objeto em bytes, ou null se ele não existe. */
export async function getObjectSize(key: string) {
  const response = await getConfig().client.fetch(objectUrl(key), {
    method: "HEAD",
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error(`R2 respondeu ${response.status} ao consultar o arquivo.`);
  }

  const size = Number(response.headers.get("content-length"));

  return Number.isFinite(size) ? size : 0;
}

/* Apaga o objeto. Apagar algo que não existe não é erro. */
export async function deleteObject(key: string) {
  const response = await getConfig().client.fetch(objectUrl(key), {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 respondeu ${response.status} ao apagar o arquivo.`);
  }
}
