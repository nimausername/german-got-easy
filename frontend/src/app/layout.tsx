import type { Metadata, Viewport } from "next";
import { Fraunces, Geist } from "next/font/google";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
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
  title: "German Got Easy",
  description: "Learn German with a clear path, flashcards, and real progress.",
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
      <body className="min-h-full overflow-x-hidden font-sans antialiased">
        <ThemeProvider>
          {children}
          <MobileBottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
