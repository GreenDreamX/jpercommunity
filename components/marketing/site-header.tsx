"use client"

import { useState, useEffect } from "react"
import { LogIn, UserRound, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import Image from "next/image"

type SiteHeaderProps = {
  className?: string
}

const navLinks = [
  { label: "Kurikulum", href: "#kurikulum" },
  { label: "Kontak", href: "#kontak" },
  { label: "Direktori", href: "/direktori" },
]

export function SiteHeader({ className }: SiteHeaderProps) {
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

  return (
    <header className={cn("flex flex-wrap items-center justify-between gap-4 border-b-2 border-black pb-4 text-sm transition-all duration-200", className)}>
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <a
          href="#top"
          className="group flex items-center gap-3 transition-transform hover:-translate-y-0.5"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <Image src="/image/J-PER.png" alt="JPER Logo" width={48} height={48} priority className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
          </div>
          <div className="hidden sm:block">
            <div className="font-heading text-base font-black tracking-tight text-black flex items-center gap-1.5 uppercase">
              JPER <span className="bg-[#E60012] text-white px-1.5 py-0.5 text-xs font-black -skew-x-6">COMMUNITY</span>
            </div>
            <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600 flex items-center gap-1">
              <span>日本語部</span>
              <span className="text-[#E60012]">•</span>
              <span>SMKN 1 Majalaya</span>
            </div>
          </div>
        </a>
      </div>

      {/* Nav links right-aligned right next to Login & Daftar buttons */}
      <div className="flex items-center gap-4 sm:gap-6 md:gap-8 ml-auto">
        <nav className="flex items-center gap-3 sm:gap-5 md:gap-6 text-black font-black uppercase tracking-wider text-xs">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative text-black hover:text-[#E60012] transition-colors py-1"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#E60012] transition-all duration-200 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {session ? (
            <a
              href={session.role === "admin" ? "/studio" : "/lms/dashboard"}
              className="flex items-center gap-2.5 border-2 border-black bg-white px-3 py-1.5 text-left transition-transform hover:-translate-y-0.5 shadow-[3px_3px_0px_#E60012]"
              aria-label="Ke Dashboard"
            >
              <div className="size-7 rounded-full overflow-hidden bg-[#E60012] text-white flex items-center justify-center shrink-0 border border-black">
                {session.avatarUrl ? (
                  <img src={session.avatarUrl} alt="Avatar" className="size-full object-cover" />
                ) : (
                  <UserRound className="size-3.5" />
                )}
              </div>
              <div className="hidden sm:block">
                <div className="text-[8px] uppercase tracking-[0.2em] text-[#E60012] font-mono font-bold leading-none">MEMBER</div>
                <div className="text-xs font-black text-black truncate max-w-[100px] mt-0.5">{session.name}</div>
              </div>
            </a>
          ) : (
            <>
              <a
                href="/login"
                className="flex items-center gap-1.5 border-2 border-black bg-white px-3.5 py-1.5 text-xs font-black uppercase text-black transition-transform hover:-translate-y-0.5 shadow-[2px_2px_0px_#111] hover:bg-zinc-100"
              >
                <LogIn className="size-3.5 text-[#E60012]" />
                Login
              </a>
              <a
                href="https://forms.jper.my.id/register"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 border-2 border-black bg-[#E60012] px-3.5 py-1.5 text-xs font-black uppercase tracking-wider text-white transition-transform hover:-translate-y-0.5 shadow-[3px_3px_0px_#FFC700] hover:bg-[#D00010]"
              >
                Daftar
                <ExternalLink className="size-3.5 text-[#FFC700]" />
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
