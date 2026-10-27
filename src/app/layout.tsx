import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemedToaster } from "@/components/theme/themed-toaster";
import { THEME_COLORS, THEME_SCRIPT } from "@/components/theme/theme-script";

export const metadata: Metadata = {
  title: "Koetaw · Kasir & Analitik Kafe",
  description:
    "Aplikasi kasir, manajemen stok bahan baku, dan analisis penjualan kafe.",
  icons: {
    icon: "/brand/koetaw-mark.png",
    apple: "/brand/koetaw-mark.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={THEME_COLORS.light} id="koetaw-theme-color" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {children}
        <ThemedToaster />
      </body>
    </html>
  );
}
