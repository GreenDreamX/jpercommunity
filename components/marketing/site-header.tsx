"use client"

import { useTheme } from "next-themes"
import { useMemo, useState, useEffect } from "react"
import { LogIn, MoonStar, SunMedium, UserRound } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type SiteHeaderProps = {
  className?: string
}

const navLinks = [
  { label: "Kurikulum", href: "#kurikulum" },
  { label: "Kontak", href: "#kontak" },
  { label: "Direktori", href: "/direktori" },
]

export function SiteHeader({ className }: SiteHeaderProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [session, setSession] = useState<{ name: string; role: string; email: string; avatarUrl?: string } | null>(null)

  useEffect(() => {
    const syncSession = () => {
      const mock = localStorage.getItem("jper_mock_session")
      if (mock) {
        try {
          setSession(JSON.parse(mock))
        } catch (e) {
          console.error(e)
        }
      }
    }
    syncSession()

    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        setSession((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            name: customEvent.detail.nama_lengkap ?? prev.name,
            avatarUrl: customEvent.detail.avatar_url ?? prev.avatarUrl,
          }
        })
      }
    }

    window.addEventListener("jper-profile-updated", handleProfileUpdated)
    return () => {
      window.removeEventListener("jper-profile-updated", handleProfileUpdated)
    }
  }, [])

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
          <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-white p-1 transition-transform duration-200 group-hover:-translate-y-0.5 shadow-sm">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-full object-contain" />
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

        {session ? (
          <a
            href={session.role === "admin" ? "/studio" : "/lms"}
            className="flex items-center gap-3 rounded-full border border-border bg-background px-2.5 py-1.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/35 animate-fade-in"
            aria-label="Ke Dashboard"
          >
            <div className="size-9 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center shrink-0">
              {session.avatarUrl ? (
                <img src={session.avatarUrl} alt="Avatar" className="size-full object-cover" />
              ) : (
                <UserRound className="size-4" />
              )}
            </div>
            <div className="hidden sm:block">
              <div className="text-[8px] uppercase tracking-[0.2em] text-[#6B6862] font-mono leading-none">LOGGED IN</div>
              <div className="text-xs font-bold text-foreground truncate max-w-[100px] mt-0.5">{session.name}</div>
            </div>
          </a>
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
          </>
        )}
      </div>
    </header>
  )
}