import type { Metadata } from "next";
import { VaultShell } from "@/components/vault/vault-shell";
import { SITE_URL } from "@/lib/site-config";
import "./globals.css";
import "./mobile.css";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Crimson+Pro:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,400..800;1,400..800&family=UnifrakturMaguntia&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <VaultShell>
          {children}
        </VaultShell>
      </body>
    </html>
  );
}
