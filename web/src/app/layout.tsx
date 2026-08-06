import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NavBar } from "@/components/nav-bar";
import { SiteFooter } from "@/components/site-footer";
import { GoogleAdsTag } from "@/components/google-ads-tag";
import { AnalyticsTag } from "@/components/analytics-tag";
import { AuthProvider } from "@/lib/auth/auth-context";
import { FavoritesProvider } from "@/lib/favorites/favorites-context";
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

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s | ask.me",
    default: "ask.me — encontre lugares perto de você",
  },
  description:
    "Busque estabelecimentos por proximidade ou pergunte em linguagem natural.",
  openGraph: {
    siteName: "ask.me",
    type: "website",
    locale: "pt_BR",
    title: "ask.me — encontre lugares perto de você",
    description:
      "Busque estabelecimentos por proximidade ou pergunte em linguagem natural.",
  },
  twitter: {
    card: "summary",
    title: "ask.me — encontre lugares perto de você",
    description:
      "Busque estabelecimentos por proximidade ou pergunte em linguagem natural.",
  },
};

// Site é light-only — evita que o navegador force dark mode/inversão de
// cores automática (ver comentário em globals.css).
export const viewport: Viewport = {
  colorScheme: "light",
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
        <GoogleAdsTag />
        <AnalyticsTag />
        <AuthProvider>
          <FavoritesProvider>
            <PlaceCacheProvider>
              <NavBar />
              <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
                {children}
              </main>
              <SiteFooter />
            </PlaceCacheProvider>
          </FavoritesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
