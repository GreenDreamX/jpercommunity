"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Link2, Copy, Check, Sparkles, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

export type ShortlinkItem = {
  id?: string
  slug: string
  target_url: string
  title: string | null
  click_count: number
  created_at?: string
}

export default function ShortlinkPage() {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [customSlug, setCustomSlug] = useState("")
  const [customUrl, setCustomUrl] = useState("")
  const [customTitle, setCustomTitle] = useState("")
  const [linksList, setLinksList] = useState<ShortlinkItem[]>([])
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchShortlinks = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/s")
      if (res.ok) {
        const data = await res.json()
        setLinksList(Array.isArray(data.shortlinks) ? data.shortlinks : [])
      } else {
        setLinksList([])
      }
    } catch {
      setLinksList([])
    } finally {
      setTimeout(() => setIsLoading(false), 400)
    }
  }, [])

  useEffect(() => {
    void fetchShortlinks()
  }, [fetchShortlinks])

  function handleCopy(slug: string) {
    const fullShortlink = `https://s.jper.my.id/${slug}`
    void navigator.clipboard.writeText(fullShortlink)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2500)
  }

  async function handleCreateShortlink(e: React.FormEvent) {
    e.preventDefault()
    if (!customSlug || !customUrl) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/s", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: customSlug,
          targetUrl: customUrl,
          title: customTitle || undefined,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setCustomSlug("")
        setCustomUrl("")
        setCustomTitle("")
        setToastMsg(`✨ Shortlink "s.jper.my.id/${customSlug}" berhasil dibuat!`)
        setTimeout(() => setToastMsg(null), 4500)
        void fetchShortlinks()
      } else {
        setToastMsg(`⚠️ ${data.message || "Gagal membuat shortlink."}`)
        setTimeout(() => setToastMsg(null), 4500)
      }
    } catch {
      setToastMsg("⚠️ Terjadi kesalahan koneksi jaringan.")
      setTimeout(() => setToastMsg(null), 4500)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#E4E1DA] pb-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-8 object-contain" />
            <div>
              <div className="font-mono text-sm font-bold tracking-wider text-[#1C1B1A]">s.jper.my.id</div>
              <div className="text-xs text-[#6B6862]">Jper Community Link Shortener</div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold">
            <a
              href="https://jper.my.id"
              className="inline-flex items-center gap-1.5 text-[#6B6862] hover:text-[#B23A2E] transition-colors"
            >
              <ArrowLeft className="size-4" /> Beranda Utama
            </a>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight text-[#1C1B1A]">
            Pemendek Tautan Resmi JPER
          </h1>
          <p className="text-sm md:text-base text-[#6B6862] max-w-2xl leading-relaxed">
            Pusat tautan ringkas resmi untuk pendaftaran anggota, portal LMS, dokumen legalitas, dan saluran komunikasi ekstrakurikuler.
          </p>
        </div>

        {/* TOAST NOTIFICATION */}
        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs"
            >
              <span>{toastMsg}</span>
              <span className="text-[10px] font-mono bg-emerald-200/60 px-2 py-0.5 rounded">Berhasil</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CREATE SHORTLINK FORM */}
        <Card className="border border-[#E4E1DA] bg-white p-6 rounded-2xl shadow-xs space-y-4">
          <div className="text-sm font-bold text-[#1C1B1A] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Link2 className="size-4 text-[#B23A2E]" /> Buat Shortlink Baru
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void fetchShortlinks()}
              className="h-7 text-[10px] border-[#E4E1DA] font-mono cursor-pointer"
            >
              <RefreshCw className={`size-3 mr-1 ${isLoading ? "animate-spin" : ""}`} /> Perbarui Tautan
            </Button>
          </div>

          <form onSubmit={handleCreateShortlink} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6B6862]">Slug Custom</label>
                <div className="flex items-center bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl px-3 h-10 text-xs">
                  <span className="text-[#6B6862] font-mono mr-1">s.jper.my.id/</span>
                  <input
                    type="text"
                    required
                    placeholder="link-saya"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    className="w-full bg-transparent text-xs font-bold text-[#1C1B1A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-bold text-[#6B6862]">Judul / Keterangan Tautan</label>
                <Input
                  type="text"
                  placeholder="Contoh: Form Pendaftaran Angkatan 2026"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="bg-[#FAF9F6] border-[#E4E1DA] rounded-xl text-xs h-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#6B6862]">Target URL Tujuan (http/https)</label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  required
                  placeholder="https://forms.jper.my.id/register"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="bg-[#FAF9F6] border-[#E4E1DA] rounded-xl text-xs flex-1 h-10"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold rounded-xl h-10 px-5 shrink-0 shadow-xs cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" /> Menyimpan...
                    </span>
                  ) : (
                    "Buat Shortlink ✨"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Card>

        {/* INTERACTIVE LOADING SCREEN / SHORTLINKS LIST */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-bold text-[#1C1B1A]">
            <span>Daftar Shortlink Aktif ({linksList.length})</span>
            <span className="text-xs text-[#6B6862] font-normal">Tautan Terverifikasi</span>
          </div>

          {isLoading ? (
            /* INTERACTIVE SKELETON LOADING STATE */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white border border-[#E4E1DA] p-4 rounded-xl flex items-center justify-between gap-4 animate-pulse shadow-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#E4E1DA]/60 rounded-md w-1/3" />
                    <div className="h-3 bg-[#E4E1DA]/40 rounded-md w-2/3" />
                    <div className="h-2.5 bg-[#E4E1DA]/30 rounded-md w-1/2" />
                  </div>
                  <div className="h-8 w-24 bg-[#E4E1DA]/50 rounded-lg shrink-0" />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 gap-3"
            >
              {linksList.length === 0 ? (
                <div className="bg-white border border-[#E4E1DA] p-8 rounded-2xl text-center space-y-2 shadow-xs">
                  <Link2 className="size-8 text-[#6B6862]/40 mx-auto" />
                  <div className="text-sm font-bold text-[#1C1B1A]">Belum Ada Shortlink Terdaftar</div>
                  <p className="text-xs text-[#6B6862] max-w-md mx-auto">
                    Shortlink yang Anda buat melalui form di atas akan tersimpan langsung di database dan ditampilkan di sini.
                  </p>
                </div>
              ) : (
                linksList.map((item) => (
                  <motion.div
                    key={item.slug}
                    whileHover={{ y: -2 }}
                    className="bg-white border border-[#E4E1DA] p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs hover:border-[#2B3A55] transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 px-2.5 py-0.5 rounded-md">
                          s.jper.my.id/{item.slug}
                        </span>
                        <span className="text-[10px] font-mono text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          {item.click_count || 0} Klik
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#1C1B1A]">{item.title || `Shortlink /${item.slug}`}</div>
                      <div className="text-[11px] text-[#6B6862] font-mono truncate max-w-md">{item.target_url}</div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        onClick={() => handleCopy(item.slug)}
                        className="h-8 text-xs font-bold rounded-lg bg-[#FAF9F6] border border-[#E4E1DA] text-[#1C1B1A] hover:bg-[#E4E1DA]/40 cursor-pointer"
                      >
                        {copiedSlug === item.slug ? (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <Check className="size-3.5" /> Tersalin!
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Copy className="size-3.5 text-[#6B6862]" /> Salin Tautan
                          </span>
                        )}
                      </Button>

                      <a
                        href={item.target_url}
                        target="_blank"
                        rel="noreferrer"
                        className="h-8 px-3 inline-flex items-center gap-1 text-xs font-bold rounded-lg bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 transition-colors"
                      >
                        Buka <ExternalLink className="size-3" />
                      </a>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6B6862]">
          <div>&copy; 2026 JPER Community — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.</div>
          <div className="font-mono">s.jper.my.id</div>
        </div>
      </div>
    </main>
  )
}
