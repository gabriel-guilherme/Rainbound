import type { Metadata, Viewport } from "next";
import { Big_Shoulders, EB_Garamond, Instrument_Sans } from "next/font/google";
import "@/app/globals.css";

/* Condensada das lombadas e títulos (eixo óptico acompanha o tamanho). */
const bigShoulders = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-big-shoulders",
  axes: ["opsz"],
  display: "swap",
  /* O Next não tem métricas de fallback dessa família; sem isto, avisa no build. */
  adjustFontFallback: false,
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

/* Texto corrido: notas e mensagens do leitor. */
const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  style: ["normal", "italic"],
  display: "swap",
});

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
  themeColor: "#27191c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${bigShoulders.variable} ${instrumentSans.variable} ${ebGaramond.variable}`}>
      <body className="min-h-dvh bg-darkest font-sans text-contrast">
        {children}
      </body>
    </html>
  );
}
