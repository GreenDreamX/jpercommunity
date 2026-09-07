import { Geist, Geist_Mono, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const display = Geist({
  subsets: ["latin"],
  variable: "--font-display",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata = {
  title: {
    default: "JPER Community - Komunitas & Belajar Bahasa Jepang",
    template: "%s - JPER Community",
  },
  description: "JPER Community adalah website pembelajaran bahasa Jepang interaktif. Belajar kanji, belajar hiragana, katakana, tata bahasa (grammar), dan kosakata bahasa Jepang. Gabung komunitas bahasa Jepang, buat karya paperart menarik, dan ikuti LMS bahasa Jepang terstruktur.",
  keywords: [
    "LMS bahasa jepang",
    "belajar kanji",
    "belajar hiragana",
    "komunitas bahasa jepang",
    "paperart",
    "JPER Community",
    "jper.my.id",
    "belajar bahasa jepang online",
    "kelas bahasa jepang",
    "nihongo"
  ],
  metadataBase: new URL("https://jper.my.id"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "JPER Community - Komunitas & Belajar Bahasa Jepang",
    description: "LMS Bahasa Jepang & Komunitas Belajar Bahasa Jepang Interaktif.",
    url: "https://jper.my.id",
    siteName: "JPER Community",
    locale: "id_ID",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
}

import { OfflineBanner } from "@/components/offline-banner"
import { CookieBanner } from "@/components/cookie-banner"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        display.variable,
        fontMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body>
        <ThemeProvider>
          <OfflineBanner />
          <CookieBanner />
          <KeyboardShortcutsDialog />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
