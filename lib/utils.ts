import supabase from "./supabase";

export async function getBookFileUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("ebooks")
    .createSignedUrl(filePath, 60 * 60);

  if (error || !data) {
    throw new Error(`Falha ao gerar URL do livro: ${error?.message}`);
  }

  return data.signedUrl;
}
