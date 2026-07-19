import type { Metadata } from "next";
import { DM_Serif_Display, Bodoni_Moda, Crimson_Pro, JetBrains_Mono, UnifrakturMaguntia } from "next/font/google";
import { VaultShell } from "@/components/vault/vault-shell";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";
import "./mobile.css";

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif-display",
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-bodoni-moda",
  display: "swap",
});

const crimsonPro = Crimson_Pro({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-crimson-pro",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const unifrakturMaguntia = UnifrakturMaguntia({
  subsets: ["latin"],
  weight: "400",
  style: ["normal"],
  variable: "--font-unifraktur-maguntia",
  display: "swap",
});

const fontVariables = [
  dmSerifDisplay.variable,
  bodoniModa.variable,
  crimsonPro.variable,
  jetbrainsMono.variable,
  unifrakturMaguntia.variable,
].join(" ");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "StealyourStats — Grateful Dead",
  description: "Song stats, setlist history, and in-browser audio for the Grateful Dead.",
  openGraph: {
    siteName: "StealyourStats",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontVariables}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body suppressHydrationWarning>
        <VaultShell>
          {children}
        </VaultShell>
      </body>
    </html>
  );
}
