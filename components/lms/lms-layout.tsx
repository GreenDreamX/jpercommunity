"use client"

import React, { useState } from "react"
import { LayoutGrid, BookOpen, QrCode, ClipboardList, LogOut, ArrowLeft, Languages, Bookmark, User, AlertTriangle, Trophy, Gamepad2 } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import { useIdleTimeout } from "@/hooks/use-idle-timeout"
import { motion } from "framer-motion"

import { clearSessionCookie } from "@/lib/session-cookie"

interface SidebarItem {
  label: string
  value: string
  icon: React.ReactNode
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

interface LmsLayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab?: (tab: string) => void
  studentName?: string
  angkatan?: string
  studentEmail?: string
  avatarUrl?: string
  studentRole?: string
}

export function LmsLayout({ children, activeTab, setActiveTab, studentName, angkatan, studentEmail, avatarUrl, studentRole }: LmsLayoutProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const sections: SidebarSection[] = [
    {
      title: "Pembelajaran Utama",
      items: [
        { label: "Beranda Overview", value: "dashboard", icon: <LayoutGrid className="size-4 text-sky-500" /> },
        { label: "Kelas Saya", value: "courses", icon: <BookOpen className="size-4 text-emerald-500" /> },
        { label: "Kamus dan Kosakata", value: "dictionary", icon: <BookOpen className="size-4 text-cyan-500" /> },
        { label: "Tata Bahasa", value: "grammar", icon: <Bookmark className="size-4 text-purple-500" /> },
        { label: "Flash Cards Kana", value: "flashcards", icon: <Languages className="size-4 text-orange-500" /> },
        { label: "Kehadiran Mandiri", value: "attendance", icon: <QrCode className="size-4 text-rose-500" /> },
        { label: "Transkrip Nilai", value: "grades", icon: <ClipboardList className="size-4 text-teal-500" /> },
      ]
    },
    {
      title: "Gamifikasi & Fitur Ekstra",
      items: [
        { label: "Arcade Game", value: "arcade", icon: <Gamepad2 className="size-4 text-amber-500" /> },
        { label: "Papan Peringkat", value: "leaderboard", icon: <Trophy className="size-4 text-yellow-500" /> },
        { label: "Profil dan Pengaturan", value: "profile", icon: <User className="size-4 text-indigo-500" /> },
      ]
    }
  ]

  const confirmLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
    clearSessionCookie()
    window.location.href = "/login"
  }

  useIdleTimeout(confirmLogout, 10 * 60 * 1000)

  return (
    <div className="min-h-svh bg-white p5-subtle-grid text-black flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 border-b-2 md:border-b-0 md:border-r-2 border-black bg-white p-6 flex flex-col gap-6 shrink-0 md:h-screen md:sticky md:top-0 overflow-y-auto no-scrollbar shadow-[4px_0px_0px_#111]">
        <div className="flex items-center justify-between md:justify-start gap-3 border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <img src="/image/J-PER.png" alt="JPER Community Logo" className="h-10 w-auto object-contain shrink-0 transition-transform hover:scale-105" />
            <div>
              <span className="font-heading text-base font-black tracking-tight uppercase text-black">JPER LMS</span>
              <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[#E60012] leading-none">MEMBER PORTAL</div>
            </div>
          </div>
          
          {/* Mobile logout or back to landing */}
          <Link 
            href="/" 
            className="md:hidden border-2 border-black bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#111]"
          >
            LANDING
          </Link>
        </div>

        {/* Sidebar Menu Sections */}
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-5 pb-2 md:pb-0 no-scrollbar">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1.5 w-full shrink-0 md:shrink">
              <div className="hidden md:block text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest px-1 py-0.5">
                ★ {sec.title}
              </div>
              <div className="flex flex-row md:flex-col gap-1.5">
                {sec.items.map((item) => (
                  <motion.button
                    key={item.value}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab?.(item.value)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap w-full text-left border-2",
                      activeTab === item.value
                        ? "border-black bg-[#E60012] text-white shadow-[3px_3px_0px_#FFC700]"
                        : "border-transparent text-zinc-700 hover:border-black hover:bg-zinc-100"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="mt-auto hidden md:flex flex-col gap-3 pt-4 border-t-2 border-black">
          {/* Student info */}
          <button 
            onClick={() => setActiveTab?.("profile")}
            className="w-full text-left p-3 border-2 border-black bg-[#FAF9F5] shadow-[3px_3px_0px_#111] hover:shadow-[4px_4px_0px_#E60012] flex items-center gap-3 transition-all group cursor-pointer"
          >
            <div className="size-9 rounded-full overflow-hidden bg-white text-black flex items-center justify-center shrink-0 border-2 border-black group-hover:bg-[#FFC700] transition-colors">
              {avatarUrl ? (
                <img src={avatarUrl} alt={studentName} className="size-full object-cover" />
              ) : (
                <User className="size-4 text-black" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-mono font-black uppercase tracking-widest text-[#E60012] flex items-center justify-between leading-none">
                <span>PROFILE</span>
                {studentEmail?.endsWith("@shokunin.jper.my.id") && (
                  <span className="text-[8px] bg-black text-[#FFC700] px-1 font-bold font-mono border border-black">SSO</span>
                )}
              </div>
              <div className="text-xs font-black truncate text-black mt-0.5 group-hover:text-[#E60012] transition-colors">{studentName || "Siswa JPER"}</div>
              <div className="text-[8px] text-zinc-600 font-mono font-bold tracking-wider uppercase mt-0.5 leading-none truncate">
                {studentRole === "admin"
                  ? (angkatan ? `ADMIN • ANGKATAN ${angkatan}` : "ADMIN")
                  : (studentRole === "alumni" || (angkatan && parseInt(angkatan, 10) <= 2023))
                  ? `ALUMNI • ANGKATAN ${angkatan || ""}`
                  : (angkatan && parseInt(angkatan, 10) >= 2027)
                  ? `CALON SISWA • ANGKATAN ${angkatan}`
                  : `SISWA AKTIF • ANGKATAN ${angkatan || ""}`}
              </div>
            </div>
          </button>

          <Link
            href="/"
            className="w-full flex items-center justify-center border-2 border-black bg-white px-3 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#111] hover:bg-zinc-100 transition-all"
          >
            <ArrowLeft className="size-4 mr-2 text-[#E60012]" />
            Ke Landing Page
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center justify-center px-3 py-2 border-2 border-black bg-white text-[#E60012] font-black uppercase text-xs tracking-wider shadow-[2px_2px_0px_#111] hover:bg-[#E60012] hover:text-white transition-all text-left cursor-pointer"
          >
            <LogOut className="size-4 mr-2" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto no-scrollbar">
        <div className="mx-auto max-w-6xl space-y-8">
          {children}
        </div>
      </main>

      {/* LOGOUT CONFIRMATION DIALOG MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm border-2 border-black bg-white p-6 shadow-[8px_8px_0px_#111] space-y-4 rounded-none">
            <div className="flex items-center gap-3 border-b-2 border-black pb-3">
              <div className="p-2 bg-[#E60012] text-white border-2 border-black -skew-x-6 shadow-[2px_2px_0px_#FFC700]">
                <AlertTriangle className="size-5 skew-x-6" />
              </div>
              <div>
                <span className="bg-black text-[#FFC700] text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 -skew-x-6 border border-black">
                  警告 • LOGOUT
                </span>
                <h3 className="font-heading text-lg font-black uppercase text-black">Konfirmasi Logout</h3>
              </div>
            </div>
            <p className="text-xs font-bold text-zinc-800 leading-relaxed">
              Apakah Anda yakin ingin keluar dari Akun? Sesi belajar LMS Anda akan diakhiri.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[2px_2px_0px_#111] hover:bg-zinc-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="border-2 border-black bg-[#E60012] text-white px-4 py-2 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#FFC700] hover:bg-[#FFC700] hover:text-black transition-all"
              >
                Ya, Logout →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
