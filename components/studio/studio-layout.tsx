"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { LayoutGrid, BookOpen, Users, Edit3, FolderOpen, QrCode, ClipboardList, LogOut, ArrowLeft, AlertTriangle, Activity, Bookmark, Wallet, HelpCircle, Inbox, Settings, FileText } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"
import { useIdleTimeout } from "@/hooks/use-idle-timeout"

interface SidebarItem {
  label: string
  value: string
  icon: React.ReactNode
}

interface SidebarSection {
  title: string
  items: SidebarItem[]
}

interface StudioLayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab?: (tab: string) => void
  adminName?: string
  avatarUrl?: string
  userRole?: string
}

export function StudioLayout({ children, activeTab, setActiveTab, adminName, avatarUrl, userRole }: StudioLayoutProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const sections: SidebarSection[] = [
    {
      title: "Main",
      items: [
        { label: "Beranda Overview", value: "dashboard", icon: <LayoutGrid className="size-4 text-indigo-500" /> },
        { label: "Manajemen Member", value: "members", icon: <Users className="size-4 text-blue-500" /> },
        { label: "Keuangan & Uang Kas", value: "finance", icon: <Wallet className="size-4 text-emerald-600" /> },
      ]
    },
    {
      title: "Akademik & Kurikulum",
      items: [
        { label: "Kelas & Silabus", value: "courses", icon: <BookOpen className="size-4 text-rose-500" /> },
        { label: "Tugas & Submission", value: "submissions", icon: <Inbox className="size-4 text-sky-500" /> },
        { label: "Penilaian Siswa", value: "grades", icon: <ClipboardList className="size-4 text-pink-500" /> },
        { label: "Sesi QR Absensi", value: "attendance", icon: <QrCode className="size-4 text-teal-600" /> },
        { label: "Bank Soal & Kuis", value: "quizzes", icon: <HelpCircle className="size-4 text-amber-500" /> },
      ]
    },
    {
      title: "Konten & Database",
      items: [
        { label: "Formulir & Evaluasi", value: "forms", icon: <FileText className="size-4 text-emerald-600" /> },
        { label: "Kamus & Kosakata", value: "dictionary", icon: <BookOpen className="size-4 text-orange-500" /> },
        { label: "Tata Bahasa (Grammar)", value: "grammar", icon: <Bookmark className="size-4 text-cyan-500" /> },
        { label: "Arsip File Bank", value: "file_bank", icon: <FolderOpen className="size-4 text-amber-600" /> },
      ]
    },
    {
      title: "Manajemen Pengurus",
      items: [
        { label: "Jurnal Notulensi", value: "notulensi", icon: <Edit3 className="size-4 text-purple-500" /> },
        { label: "Laporan & Cetak Rapor", value: "rapor", icon: <FileText className="size-4 text-fuchsia-500" /> },
        { label: "Activity Logs", value: "logs", icon: <Activity className="size-4 text-red-500" /> },
        { label: "Pengaturan Studio", value: "settings", icon: <Settings className="size-4 text-stone-600" /> },
      ]
    }
  ]

  const confirmLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
    document.cookie = "jper_session=; path=/; max-age=0; SameSite=Lax"
    window.location.href = "/studio/login"
  }

  useIdleTimeout(confirmLogout, 10 * 60 * 1000)

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case "bendahara": return "Bendahara"
      case "pembina": return "Pembina"
      case "ketua_komunitas": return "Ketua"
      case "ketua_angkatan": return "Ketua Angkatan"
      default: return "Admin"
    }
  }

  return (
    <div className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#E4E1DA] bg-[#FAF9F6] p-5 flex flex-col shrink-0 md:h-screen md:sticky md:top-0">
        <div className="flex items-center justify-between md:justify-start gap-2.5 mb-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src="/image/J-PER.png" alt="JPER Community Logo" className="size-7 object-contain" />
            <span className="font-mono text-sm font-bold tracking-wider">JPER Studio</span>
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
        <nav className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-stone-200">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1">
              <div className="text-[9px] font-bold text-[#6B6862]/60 uppercase tracking-widest px-3 py-1 font-mono">
                {sec.title}
              </div>
              <div className="flex flex-col gap-0.5">
                {sec.items.map((item) => (
                  <motion.button
                    key={item.value}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab?.(item.value)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all w-full text-left",
                      activeTab === item.value
                        ? "bg-[#2B3A55]/10 text-[#2B3A55] border-l-2 border-[#2B3A55] rounded-l-none font-bold"
                        : "text-[#6B6862] hover:bg-[#E4E1DA]/20 hover:text-[#1C1B1A]"
                    )}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer Controls */}
        <div className="mt-auto pt-4 border-t border-[#E4E1DA]/50 flex flex-col gap-2 shrink-0">
          {/* Admin info */}
          <div className="py-2 flex items-center gap-3">
            <div className="size-9 rounded-full overflow-hidden bg-stone-200 text-[#6B6862] flex items-center justify-center shrink-0 border border-[#E4E1DA]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={adminName} className="size-full object-cover" />
              ) : (
                <Users className="size-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] text-[#6B6862] font-mono leading-none">LOGGED IN AS</div>
              <div className="text-xs font-bold truncate text-[#1C1B1A] mt-1">{adminName || "Pengurus Ekskul"}</div>
              <div className="text-[8px] text-[#B23A2E] font-mono font-semibold tracking-wider uppercase mt-0.5 leading-none">
                {formatRoleLabel(userRole)}
              </div>
            </div>
          </div>

          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full rounded-lg border-[#E4E1DA] text-[#6B6862] hover:text-[#1C1B1A] text-xs font-semibold justify-start h-8"
            )}
          >
            <ArrowLeft className="size-4 mr-2" />
            Ke Landing Page
          </Link>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center h-8 px-3 rounded-lg text-xs font-semibold text-[#B23A2E] hover:bg-[#B23A2E]/5 transition-colors text-left"
          >
            <LogOut className="size-4 mr-2.5" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Main workspace injection */}
          {children}
        </div>
      </main>

      {/* LOGOUT CONFIRMATION DIALOG MODAL */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#B23A2E]/10 rounded-full text-[#B23A2E]">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-base font-bold text-[#1C1B1A]">Konfirmasi Logout</h3>
            </div>
            <p className="text-xs text-[#6B6862] leading-relaxed">
              Apakah Anda yakin log out Akun? Sesi pengurus Studio akan diakhiri.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogoutModal(false)}
                className="border-[#E4E1DA] text-xs h-9 rounded-lg font-semibold"
              >
                Batal
              </Button>
              <Button
                size="sm"
                onClick={confirmLogout}
                className="bg-[#B23A2E] hover:bg-[#B23A2E]/90 text-white text-xs h-9 rounded-lg font-semibold border-none"
              >
                Ya, Logout
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
