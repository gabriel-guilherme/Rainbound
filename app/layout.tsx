import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
      <body className="flex min-h-screen flex-col bg-secondary">
        <Navbar />

        <main className="flex-1 min-h-screen">{children}</main>

        <Footer />
      </body>
    </html>
  );
}
