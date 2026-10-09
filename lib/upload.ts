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

function getBookFileInfo(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "epub":
      return {
        extension: "epub",
        contentType: "application/epub+zip",
      };

    case "pdf":
      return {
        extension: "pdf",
        contentType: "application/pdf",
      };

    case "cbz":
      return {
        extension: "cbz",
        contentType: "application/vnd.comicbook+zip",
      };

    default:
      throw new Error("Formato não suportado. Use EPUB, PDF ou CBZ.");
  }
}

export async function uploadBookFile(file: File, bookId: number) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const { extension, contentType } = getBookFileInfo(file);

  const filePath = `${bookId}/book.${extension}`;

  const { error } = await supabase.storage
    .from("ebooks")
    .upload(filePath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`Falha no upload do livro: ${error.message}`);
  }

  return {
    filePath,
  };
}
