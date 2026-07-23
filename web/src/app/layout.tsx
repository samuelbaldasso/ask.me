import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import { PlaceCacheProvider } from "@/lib/place-cache";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ask.me — encontre lugares perto de você",
  description:
    "Busque estabelecimentos por proximidade ou pergunte em linguagem natural.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <PlaceCacheProvider>
          <NavBar />
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
            {children}
          </main>
        </PlaceCacheProvider>
      </body>
    </html>
  );
}
