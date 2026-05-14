import type { Metadata } from "next";
import { Playfair_Display, Inter, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Steal Your Stats — Grateful Dead",
  description: "Song stats, setlist history, and in-browser audio for the Grateful Dead.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfairDisplay.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-black focus:text-white focus:rounded"
        >
          Skip to content
        </a>
        <header className="border-b-2 border-ink bg-paper sticky top-0 z-40">
          <nav
            aria-label="Main navigation"
            className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between"
          >
            <Link
              href="/"
              className="font-serif font-bold text-ink text-base hover:opacity-70 transition-opacity"
            >
              Steal Your Stats
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="text-xs font-mono px-3 py-1.5 border-2 border-transparent hover:border-ink hover:bg-ink hover:text-paper transition-colors text-ink"
              >
                On This Day
              </Link>
              <Link
                href="/songs"
                className="text-xs font-mono px-3 py-1.5 border-2 border-transparent hover:border-ink hover:bg-ink hover:text-paper transition-colors text-ink"
              >
                Songs
              </Link>
              <Link
                href="/search"
                className="text-xs font-mono px-3 py-1.5 border-2 border-transparent hover:border-ink hover:bg-ink hover:text-paper transition-colors text-ink"
              >
                Search
              </Link>
            </div>
          </nav>
        </header>
        <main id="main-content" className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
