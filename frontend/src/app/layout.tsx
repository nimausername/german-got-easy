import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { BRANDING } from "@/lib/branding";
import { cn } from "@/lib/utils";
import "./globals.css";

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(BRANDING.siteUrl),
  title: {
    default: BRANDING.productName,
    template: `%s · ${BRANDING.productName}`,
  },
  description: BRANDING.description,
  applicationName: BRANDING.productName,
  authors: [{ name: "Nima Khabbazi" }],
  creator: "Nima Khabbazi",
  keywords: [
    "German",
    "learn German",
    "CEFR",
    "flashcards",
    "spaced repetition",
    "A1",
    "Deutsch",
  ],
  manifest: BRANDING.manifest,
  icons: {
    icon: [
      { url: BRANDING.icon32, sizes: "32x32", type: "image/png" },
      { url: BRANDING.icon192, sizes: "192x192", type: "image/png" },
      { url: BRANDING.icon, sizes: "1000x1000", type: "image/png" },
    ],
    apple: [{ url: BRANDING.appleTouchIcon, sizes: "180x180", type: "image/png" }],
    shortcut: BRANDING.icon32,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BRANDING.siteUrl,
    siteName: BRANDING.productName,
    title: BRANDING.productName,
    description: BRANDING.description,
    images: [
      {
        url: BRANDING.ogImage,
        width: BRANDING.ogWidth,
        height: BRANDING.ogHeight,
        alt: `${BRANDING.productName} — learn German with a clear path`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRANDING.productName,
    description: BRANDING.description,
    images: [BRANDING.ogImage],
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#e8f0f4" },
    { media: "(prefers-color-scheme: dark)", color: "#1a2228" },
  ],
};

/**
 * Root document shell with brand fonts, theme provider, and semantic tokens.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", display.variable, geist.variable)}
    >
      <body className="min-h-dvh overflow-x-hidden font-sans antialiased">
        <QueryProvider>
          <ThemeProvider>
            {children}
            <MobileBottomNav />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
