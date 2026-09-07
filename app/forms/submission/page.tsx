"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, UploadCloud, CheckCircle2, FileText, Sparkles, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function SubmissionFormPage() {
  const [file, setFile] = useState<File | null>(null)
  const [taskName, setTaskName] = useState("")
  const [studentName, setStudentName] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !taskName || !studentName) return

    setIsUploading(true)
    // Simulate upload to Supabase storage
    setTimeout(() => {
      setIsUploading(false)
      setSubmitted(true)
    }, 1500)
  }

  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6862] hover:text-[#B23A2E] transition-colors"
          >
            <ArrowLeft className="size-4" /> Kembali ke Portal Form (form.jper.my.id)
          </Link>
          <div className="flex items-center gap-2">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-6 object-contain" />
            <span className="font-mono text-xs font-bold tracking-wider">form.jper.my.id</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
            <UploadCloud className="size-3.5 text-blue-600" />
            Pengumpulan Berkas &amp; Tugas Mandiri
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#1C1B1A]">
            Form Pengumpulan Tugas Siswa
          </h1>
          <p className="text-xs text-[#6B6862]">
            Unggah file PDF catatan Bunpou, tugas Hiragana/Katakana, atau berkas pendukung ekstrakurikuler.
          </p>
        </div>

        {submitted ? (
          <Card className="border border-emerald-300 bg-emerald-50/50 p-8 rounded-2xl text-center space-y-4 shadow-sm">
            <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="size-8 stroke-[2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#1C1B1A]">Pengumpulan Berhasil!</h2>
              <p className="text-xs text-[#6B6862] mt-1">
                Tugas "{taskName}" atas nama {studentName} telah berhasil dikirim ke pengurus.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => {
                setSubmitted(false)
                setFile(null)
              }}
              className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold rounded-xl px-5 h-10"
            >
              Kirim Tugas Lain
            </Button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-[#E4E1DA] p-6 md:p-8 rounded-2xl shadow-xs space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1B1A]">Nama Lengkap Siswa</label>
              <Input
                required
                placeholder="Contoh: Budi Santoso"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="bg-[#FAF9F6] border-[#E4E1DA] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1B1A]">Judul Tugas / Modul Mingguan</label>
              <Input
                required
                placeholder="Contoh: Modul 2 - Catatan Hiragana K-Group"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                className="bg-[#FAF9F6] border-[#E4E1DA] rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#1C1B1A]">Pilih Berkas File (PDF / Gambar max 10MB)</label>
              <div className="border-2 border-dashed border-[#E4E1DA] bg-[#FAF9F6] p-6 rounded-xl text-center space-y-2">
                <FileText className="size-8 text-[#6B6862] mx-auto" />
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-xs text-[#6B6862] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2B3A55] file:text-white hover:file:bg-[#2B3A55]/90 cursor-pointer"
                />
                {file && <p className="text-xs font-mono font-bold text-emerald-700">{file.name} ({Math.round(file.size / 1024)} KB)</p>}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isUploading}
              className="w-full bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold h-11 rounded-xl shadow-xs"
            >
              {isUploading ? "Mengunggah Berkas..." : "Kirim Tugas Sekarang ✨"}
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] text-center text-xs text-[#6B6862]">
          &copy; 2026 JPER Community — Portal Form form.jper.my.id
        </div>
      </div>
    </main>
  )
}
