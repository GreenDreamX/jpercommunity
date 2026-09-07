"use client"

import { useState, useEffect } from "react"
import { Search, Command, BookOpen, QrCode, ClipboardList, Gamepad2, User, Trophy, Bookmark } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface KeyboardShortcutsDialogProps {
  onSelectTab?: (tab: string) => void
}

export function KeyboardShortcutsDialog({ onSelectTab }: KeyboardShortcutsDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const navItems = [
    { label: "Beranda Overview", value: "dashboard", icon: BookOpen, desc: "Ringkasan kelas & tugas" },
    { label: "Kelas Saya", value: "courses", icon: BookOpen, desc: "Modul & silabus mingguan" },
    { label: "Kamus & Kosakata", value: "dictionary", icon: BookOpen, desc: "Notasi Pitch & suara TTS" },
    { label: "Tata Bahasa (Bunpou)", value: "grammar", icon: Bookmark, desc: "Pola kalimat dasar-menengah" },
    { label: "Arcade Game (Beta)", value: "arcade", icon: Gamepad2, desc: "5 mini-game interaktif versi Beta" },
    { label: "Papan Peringkat (Leaderboard)", value: "leaderboard", icon: Trophy, desc: "Podium & Shokunin level" },
    { label: "Kehadiran Mandiri", value: "attendance", icon: QrCode, desc: "Pindai QR Code presensi" },
    { label: "Transkrip Nilai", value: "grades", icon: ClipboardList, desc: "Rekap kuis & tugas" },
    { label: "Profil & Pengaturan", value: "profile", icon: User, desc: "Kartu anggota digital & data" },
  ]

  const filtered = navItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.desc.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg bg-[#FAF9F6] border-[#E4E1DA] rounded-2xl p-4 shadow-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-sm font-bold text-[#1C1B1A] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Command className="size-4 text-[#B23A2E]" /> Pencarian Cepat LMS
            </span>
            <span className="text-[10px] font-mono text-[#6B6862] bg-[#E4E1DA]/50 px-2 py-0.5 rounded">
              Esc untuk tutup
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 size-4 text-[#6B6862]" />
            <Input
              placeholder="Cari tab menu atau fitur LMS..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-white border-[#E4E1DA] text-xs h-9 rounded-xl focus-visible:ring-[#2B3A55]"
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#6B6862] italic">
                Fitur tidak ditemukan.
              </div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.value}
                    onClick={() => {
                      onSelectTab?.(item.value)
                      setOpen(false)
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white hover:border hover:border-[#E4E1DA] text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-[#2B3A55]/10 border border-[#2B3A55]/20 flex items-center justify-center text-[#2B3A55] group-hover:bg-[#B23A2E] group-hover:text-white transition-colors">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#1C1B1A] group-hover:text-[#B23A2E] transition-colors">
                          {item.label}
                        </div>
                        <div className="text-[10px] text-[#6B6862]">{item.desc}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#6B6862] group-hover:text-[#1C1B1A]">
                      Buka →
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
