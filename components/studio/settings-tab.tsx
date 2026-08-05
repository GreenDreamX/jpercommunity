"use client"

import React, { useState } from "react"
import { Settings, ShieldAlert, Award, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { QuizManagement } from "@/components/studio/quiz-management"

interface SettingsTabProps {
  token: string
}

export function SettingsTab({ token }: SettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"general" | "security">("general")
  
  // General settings state (mocked/local save)
  const [ekskulName, setEkskulName] = useState("JPER Community")
  const [domain, setDomain] = useState("jper.my.id")
  const [version, setVersion] = useState("v2.4.1-stable")
  
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  const handleSaveGeneral = () => {
    setSavingGeneral(true)
    setSaveStatus(null)
    setTimeout(() => {
      setSavingGeneral(false)
      setSaveStatus("Pengaturan umum berhasil disimpan.")
    }, 800)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl font-black tracking-tight text-[#1C1B1A]">Pengaturan Studio</h2>
        <p className="text-xs text-[#6B6862]">Kelola konfigurasi sistem, keamanan, dan identitas JPER Community.</p>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex border-b border-[#E4E1DA] gap-4 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab("general")}
          className={`pb-2.5 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === "general"
              ? "border-[#2B3A55] text-[#2B3A55] font-bold"
              : "border-transparent text-[#6B6862] hover:text-[#1C1B1A]"
          }`}
        >
          <Settings className="size-4" />
          Identitas Ekskul
        </button>

        <button
          onClick={() => setActiveSubTab("security")}
          className={`pb-2.5 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
            activeSubTab === "security"
              ? "border-[#2B3A55] text-[#2B3A55] font-bold"
              : "border-transparent text-[#6B6862] hover:text-[#1C1B1A]"
          }`}
        >
          <ShieldAlert className="size-4" />
          Keamanan & Sesi
        </button>
      </div>

      {/* Sub tab contents */}
      <div className="space-y-6">
        {activeSubTab === "general" && (
          <div className="space-y-4 max-w-xl animate-in fade-in duration-200">
            <Card className="border-[#E4E1DA] bg-white rounded-xl shadow-none">
              <CardContent className="p-6 space-y-4 text-xs text-[#1C1B1A]">
                <h3 className="text-sm font-bold text-[#1C1B1A] border-b border-[#E4E1DA] pb-2">Identitas Ekskul</h3>
                
                {saveStatus && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg font-semibold">
                    {saveStatus}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="font-semibold block">Nama Ekstrakurikuler</label>
                  <Input
                    value={ekskulName}
                    onChange={(e) => setEkskulName(e.target.value)}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-semibold text-[#1C1B1A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block">Domain Resmi Website</label>
                  <Input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-semibold text-[#1C1B1A]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold block text-stone-500">Versi Studio System (Read Only)</label>
                  <Input
                    value={version}
                    disabled
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-semibold text-stone-400 cursor-not-allowed"
                  />
                </div>

                <Button
                  onClick={handleSaveGeneral}
                  disabled={savingGeneral}
                  className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 border-none font-bold rounded-lg text-xs h-9"
                >
                  {savingGeneral ? "Menyimpan..." : "Simpan Identitas"}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {activeSubTab === "security" && (
          <div className="space-y-4 max-w-xl animate-in fade-in duration-200">
            <Card className="border-[#E4E1DA] bg-white rounded-xl shadow-none">
              <CardContent className="p-6 space-y-4 text-xs text-[#1C1B1A]">
                <h3 className="text-sm font-bold text-[#1C1B1A] border-b border-[#E4E1DA] pb-2">Kebijakan Keamanan & Sesi</h3>

                <div className="space-y-3">
                  <div className="flex items-start justify-between border-b border-[#E4E1DA]/60 pb-3">
                    <div className="space-y-0.5 max-w-[80%]">
                      <div className="font-bold">Auto Logout Sesi Idle (Inaktif)</div>
                      <p className="text-[10px] text-[#6B6862]">Keluar otomatis jika pengguna tidak aktif melakukan aktivitas apa pun di halaman LMS/Studio.</p>
                    </div>
                    <span className="font-mono font-bold bg-[#FAF9F6] border border-[#E4E1DA] px-2.5 py-1 rounded text-stone-700">
                      10 Menit
                    </span>
                  </div>

                  <div className="flex items-start justify-between border-b border-[#E4E1DA]/60 pb-3">
                    <div className="space-y-0.5 max-w-[80%]">
                      <div className="font-bold">QR Token Short-Lived Absensi</div>
                      <p className="text-[10px] text-[#6B6862]">QR Code absensi di-generate dengan token unik yang berumur pendek untuk mencegah penyebaran tangkapan layar (screenshot).</p>
                    </div>
                    <span className="font-mono font-bold bg-[#FAF9F6] border border-[#E4E1DA] px-2.5 py-1 rounded text-stone-700">
                      Aktif
                    </span>
                  </div>

                  <div className="flex items-start justify-between pb-1">
                    <div className="space-y-0.5 max-w-[80%]">
                      <div className="font-bold">Row-Level Security (RLS) Database</div>
                      <p className="text-[10px] text-[#6B6862]">Enforce restriksi akses SQL langsung ke tingkat baris data pada tabel database Supabase.</p>
                    </div>
                    <span className="font-mono font-bold bg-[#FAF9F6] border border-[#E4E1DA] px-2.5 py-1 rounded text-emerald-700 bg-emerald-50 border-emerald-200">
                      Enforced
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
