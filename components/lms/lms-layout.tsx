"use client"

import React from "react"
import { LayoutGrid, BookOpen, QrCode, ClipboardList, LogOut, ArrowLeft, Languages, Bookmark, User } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface SidebarItem {
  label: string
  value: string
  icon: React.ReactNode
}

interface LmsLayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
  studentName?: string
  angkatan?: string
  studentEmail?: string
  avatarUrl?: string
}

export function LmsLayout({ children, activeTab, setActiveTab, studentName, angkatan, studentEmail, avatarUrl }: LmsLayoutProps) {
  const menuItems: SidebarItem[] = [
    { label: "Beranda Overview", value: "dashboard", icon: <LayoutGrid className="size-4" /> },
    { label: "Kelas Saya", value: "courses", icon: <BookOpen className="size-4" /> },
    { label: "Profil & Pengaturan", value: "profile", icon: <User className="size-4" /> },
    { label: "Glosarium & Kamus", value: "glossary", icon: <Bookmark className="size-4" /> },
    { label: "Kehadiran Mandiri", value: "attendance", icon: <QrCode className="size-4" /> },
    { label: "Transkrip Nilai", value: "grades", icon: <ClipboardList className="size-4" /> },
    { label: "Flash Cards Kana", value: "flashcards", icon: <Languages className="size-4" /> },
  ]

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
    // Delete session cookie
    document.cookie = "jper_session=; path=/; max-age=0; SameSite=Lax"
    window.location.href = "/login"
  }

  return (
    <div className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#E4E1DA] bg-[#FAF9F6] p-6 flex flex-col gap-6 shrink-0 md:h-screen md:sticky md:top-0">
        <div className="flex items-center justify-between md:justify-start gap-2">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-[#B23A2E] text-[#FAF9F6] flex items-center justify-center font-bold font-mono text-xs">
              L
            </div>
            <span className="font-mono text-sm font-bold tracking-wider">JPER LMS</span>
          </div>
          
          {/* Mobile logout or back to landing */}
          <Link 
            href="/" 
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "md:hidden rounded-lg border-[#E4E1DA] h-8 text-[10px]")}
          >
            Landing
          </Link>
        </div>

        {/* Sidebar Menu Items */}
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 scrollbar-none">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                activeTab === item.value
                  ? "bg-[#B23A2E]/10 text-[#B23A2E] font-semibold border-l-2 border-[#B23A2E] rounded-l-none"
                  : "text-[#6B6862] hover:bg-[#E4E1DA]/20 hover:text-[#1C1B1A]"
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="mt-auto hidden md:flex flex-col gap-2 pt-4 border-t border-[#E4E1DA]/50">
          {/* Student info */}
          <button 
            onClick={() => setActiveTab("profile")}
            className="w-full text-left py-2.5 px-2 -mx-2 rounded-lg hover:bg-[#E4E1DA]/20 border-b border-[#E4E1DA]/30 flex items-center gap-3 transition-colors group"
          >
            <div className="size-9 rounded-full overflow-hidden bg-stone-200 text-[#6B6862] flex items-center justify-center shrink-0 border border-[#E4E1DA] group-hover:border-[#B23A2E]/50 transition-colors">
              {avatarUrl ? (
                <img src={avatarUrl} alt={studentName} className="size-full object-cover" />
              ) : (
                <User className="size-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-[#6B6862] font-mono flex items-center justify-between leading-none">
                <span className="group-hover:text-[#B23A2E] font-semibold transition-colors">SETTINGS / PROFILE</span>
                {studentEmail?.endsWith("@shokunin.jper.my.id") && (
                  <span className="text-[8px] bg-green-500/10 text-green-600 px-1 rounded font-bold font-mono">SSO</span>
                )}
              </div>
              <div className="text-xs font-bold truncate text-[#1C1B1A] mt-1 group-hover:text-[#B23A2E] transition-colors">{studentName || "Siswa JPER"}</div>
              <div className="text-[8px] text-[#B23A2E] font-mono font-semibold tracking-wider uppercase mt-0.5 leading-none">
                SISWA AKTIF {angkatan ? `— ANGKATAN ${angkatan}` : ""}
              </div>
            </div>
          </button>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full rounded-lg border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A] text-xs font-semibold justify-start"
            )}
          >
            <ArrowLeft className="size-4 mr-2" />
            Ke Landing Page
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-semibold text-[#B23A2E] hover:bg-[#B23A2E]/5 transition-colors text-left"
          >
            <LogOut className="size-4 mr-2.5" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          {children}
        </div>
      </main>
    </div>
  )
}
