"use client"

import { useTheme } from "next-themes"
import { useMemo, useState } from "react"
import { LogIn, MoonStar, SunMedium, UserRound } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  className?: string
}

const navLinks = [
  { label: "Kurikulum", href: "#kurikulum" },
  { label: "Kontak", href: "#kontak" },
  { label: "Alumni", href: "/alumni" },
]

export function SiteHeader({ className }: SiteHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const themeLabel = useMemo(
    () => (resolvedTheme === "dark" ? "Light mode" : "Dark mode"),
    [resolvedTheme],
  )

  const isDark = resolvedTheme === "dark"

  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-4 border-b border-border/70 pb-4 text-sm", className)}>
      <div className="flex items-center gap-3">
        <a
          href="#top"
          className="group flex items-center gap-3 transition-opacity hover:opacity-90"
        >
          <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-background font-heading text-sm font-semibold tracking-[0.18em] text-primary transition-transform duration-200 group-hover:-translate-y-0.5">
            JP
          </div>
          <div className="hidden sm:block">
            <div className="font-heading text-base font-semibold tracking-[-0.03em] text-foreground">
              JPER Community
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-stone">
              Ekstrakurikuler Bahasa Jepang
            </div>
          </div>
        </a>
      </div>

      <nav className="order-3 flex w-full flex-wrap items-center gap-5 text-stone md:order-none md:w-auto md:gap-6">
        {navLinks.map((link) => (
          <a key={link.label} href={link.href} className="transition-colors hover:text-foreground">
            {link.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 md:gap-3">
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "rounded-lg border-border bg-background text-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35",
          )}
          aria-label={themeLabel}
          title={themeLabel}
        >
          {isDark ? <SunMedium /> : <MoonStar />}
        </button>

        {isLoggedIn ? (
          <button
            type="button"
            onClick={() => setIsLoggedIn(false)}
            className="flex items-center gap-3 rounded-full border border-border bg-background px-2.5 py-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35"
            aria-label="Preview status login"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <UserRound className="size-4" />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs uppercase tracking-[0.2em] text-stone">Logged in</div>
              <div className="text-sm font-medium text-foreground">Pembina</div>
            </div>
          </button>
        ) : (
          <>
            <a
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-lg border-border bg-background px-4 hover:-translate-y-0.5 hover:border-primary/35",
              )}
            >
              <LogIn className="size-4" />
              Login
            </a>
            <a
              href="/register"
              className={cn(
                buttonVariants({ size: "sm" }),
                "rounded-lg px-4 shadow-none hover:-translate-y-0.5",
              )}
            >
              Sign up
            </a>
            <button
              type="button"
              onClick={() => setIsLoggedIn(true)}
              className="rounded-lg border border-dashed border-destructive/25 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive transition-all duration-200 hover:-translate-y-0.5 hover:border-destructive/40"
            >
              Preview avatar
            </button>
          </>
        )}
      </div>
    </header>
  )
}