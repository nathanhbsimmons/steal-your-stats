import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/glass/sidebar";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`} suppressHydrationWarning>
      <body>
        <div className="scene" aria-hidden="true" />
        <div style={{
          display: 'flex',
          height: '100vh',
          overflow: 'hidden',
          position: 'relative',
          zIndex: 1,
        }}>
          <Sidebar />
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
