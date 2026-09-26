"use client"

import dynamic from "next/dynamic"

const OfflineBanner = dynamic(
  () => import("@/components/offline-banner").then((mod) => mod.OfflineBanner),
  { ssr: false }
)
const CookieBanner = dynamic(
  () => import("@/components/cookie-banner").then((mod) => mod.CookieBanner),
  { ssr: false }
)
const KeyboardShortcutsDialog = dynamic(
  () => import("@/components/keyboard-shortcuts-dialog").then((mod) => mod.KeyboardShortcutsDialog),
  { ssr: false }
)

export function GlobalClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OfflineBanner />
      <CookieBanner />
      <KeyboardShortcutsDialog />
      {children}
    </>
  )
}
