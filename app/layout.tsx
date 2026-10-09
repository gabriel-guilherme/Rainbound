import type { Metadata } from "next";
import "@/app/globals.css";
import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "Rainbound",
  description: "Acompanhe suas leituras",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-dvh bg-darkest">{children}</body>
    </html>
  );
}
