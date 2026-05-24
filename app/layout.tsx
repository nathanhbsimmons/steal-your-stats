import type { Metadata } from "next";
import { VaultShell } from "@/components/vault/vault-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "StealyourStats — Grateful Dead",
  description: "Song stats, setlist history, and in-browser audio for the Grateful Dead.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Crimson+Pro:ital,wght@0,200..900;1,200..900&family=JetBrains+Mono:ital,wght@0,400..800;1,400..800&family=UnifrakturMaguntia&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <VaultShell>
          {children}
        </VaultShell>
      </body>
    </html>
  );
}
