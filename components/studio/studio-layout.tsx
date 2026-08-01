"use client"

import React, { useState } from "react"
import { LayoutGrid, BookOpen, Users, Edit3, FolderOpen, QrCode, ClipboardList, LogOut, ArrowLeft, AlertTriangle, Activity } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { buttonVariants, Button } from "@/components/ui/button"

interface SidebarItem {
  label: string
  value: string
  icon: React.ReactNode
}

interface StudioLayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
  adminName?: string
  avatarUrl?: string
}

export function StudioLayout({ children, activeTab, setActiveTab, adminName, avatarUrl }: StudioLayoutProps) {
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const menuItems: SidebarItem[] = [
    { label: "Beranda Overview", value: "dashboard", icon: <LayoutGrid className="size-4" /> },
    { label: "Kelas & Silabus", value: "courses", icon: <BookOpen className="size-4" /> },
    { label: "Manajemen Member", value: "members", icon: <Users className="size-4" /> },
    { label: "Jurnal Notulensi", value: "notulensi", icon: <Edit3 className="size-4" /> },
    { label: "Arsip File Bank", value: "file_bank", icon: <FolderOpen className="size-4" /> },
    { label: "Sesi QR Absensi", value: "attendance", icon: <QrCode className="size-4" /> },
    { label: "Penilaian Siswa", value: "grades", icon: <ClipboardList className="size-4" /> },
    { label: "Activity Logs", value: "logs", icon: <Activity className="size-4" /> },
  ]

  const confirmLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
    document.cookie = "jper_session=; path=/; max-age=0; SameSite=Lax"
    window.location.href = "/studio/login"
  }

  return (
    <div className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#E4E1DA] bg-[#FAF9F6] p-6 flex flex-col gap-6 shrink-0 md:h-screen md:sticky md:top-0">
        <div className="flex items-center justify-between md:justify-start gap-2">
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
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 scrollbar-none">
          {menuItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                activeTab === item.value
                  ? "bg-[#2B3A55]/10 text-[#2B3A55] font-semibold border-l-2 border-[#2B3A55] rounded-l-none"
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
          {/* Admin info */}
          <div className="py-2.5 border-b border-[#E4E1DA]/30 flex items-center gap-3">
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
              <div className="text-[8px] text-[#B23A2E] font-mono font-semibold tracking-wider uppercase mt-0.5 leading-none">ADMINISTRATOR</div>
            </div>
          </div>

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
            onClick={() => setShowLogoutModal(true)}
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
