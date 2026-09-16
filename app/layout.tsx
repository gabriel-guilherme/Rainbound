import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Rainbound",
  description: "Acompanhe suas leituras",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
