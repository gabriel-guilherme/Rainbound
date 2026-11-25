import type { MetadataRoute } from "next";

/*
 * Manifest do app instalável (Android/Chrome/Edge). No iPhone, o ícone da
 * tela de início vem do apple-touch-icon (metadata do app/layout.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Rainbound",
    short_name: "Rainbound",
    description: "Acompanhe suas leituras",
    lang: "pt-BR",
    start_url: "/",
    display: "standalone",
    background_color: "#080c0d",
    theme_color: "#27191c",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
