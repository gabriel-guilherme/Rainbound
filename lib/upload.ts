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

export async function uploadBookFile(file: File, bookId: number) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const filePath = `${bookId}/book.epub`;

  const { error } = await supabase.storage
    .from("ebooks")
    .upload(filePath, buffer, {
      contentType: "application/epub+zip",
      upsert: true,
    });

  if (error) {
    throw new Error(`Falha no upload do EPUB: ${error.message}`);
  }

  return {
    filePath,
  };
}

export async function getBookFileUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from("ebooks")
    .createSignedUrl(filePath, 60 * 60);

  if (error || !data) {
    throw new Error(`Falha ao gerar URL do EPUB: ${error?.message}`);
  }

  return data.signedUrl;
}
