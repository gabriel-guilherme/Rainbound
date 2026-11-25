import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Arquivos de livro vão direto ao Supabase; aqui só passam campos e a capa
      // comprimida. Fica abaixo do limite de ~4,5 MB da Vercel.
      bodySizeLimit: "4mb",
      allowedOrigins: [
        "localhost:3000",
        "127.0.0.1:3000",
        "*.devtunnels.ms",
        "*.app.github.dev",
      ],
    },
  },
  /*
   * O admin saiu de /admin/pedidos para /admin (agora com abas). A query
   * (?aba=...) é repassada.
   */
  async redirects() {
    return [{ source: "/admin/pedidos", destination: "/admin", permanent: true }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "books.google.com",
      },
      {
        protocol: "http",
        hostname: "books.google.com",
      },
    ],
  },
};

export default nextConfig;
