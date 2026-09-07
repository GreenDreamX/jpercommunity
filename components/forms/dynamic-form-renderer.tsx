"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Star, Sparkles, Loader2, FileText, UploadCloud, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { motion, AnimatePresence } from "framer-motion"

export type FormQuestion = {
  id: string
  form_id: string
  question_text: string
  question_type: "short_text" | "long_text" | "dropdown" | "single_choice" | "rating" | "file_upload"
  options?: string[]
  placeholder?: string
  is_required: boolean
  order_index: number
}

export type DynamicFormData = {
  id: string
  slug: string
  title: string
  description?: string | null
  is_published: boolean
  form_questions: FormQuestion[]
}

interface DynamicFormRendererProps {
  slug: string
  fallbackTitle?: string
  fallbackDescription?: string
}

export function DynamicFormRenderer({ slug, fallbackTitle, fallbackDescription }: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<DynamicFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [respondentName, setRespondentName] = useState("")
  const [respondentEmail, setRespondentEmail] = useState("")
  const [respondentPhone, setRespondentPhone] = useState("")
  const [answers, setAnswers] = useState<Record<string, unknown>>({})

  const fetchForm = useCallback(async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetch(`/api/forms/${slug}`)
      if (res.ok) {
        const data = await res.json()
        if (data.ok && data.form) {
          setFormData(data.form)

          // Pre-fill initial rating states
          const initialAnswers: Record<string, unknown> = {}
          data.form.form_questions?.forEach((q: FormQuestion) => {
            if (q.question_type === "rating") {
              initialAnswers[q.id] = 5
            }
          })
          setAnswers(initialAnswers)
        } else {
          setErrorMsg(data.message || "Formulir tidak ditemukan.")
        }
      } else {
        setErrorMsg("Formulir belum tersedia di Supabase.")
      }
    } catch {
      setErrorMsg("Gagal terhubung ke server database.")
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void fetchForm()
  }, [fetchForm])

  const handleAnswerChange = (questionId: string, val: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: val,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData) return

    // Validate required questions
    for (const q of formData.form_questions) {
      if (q.is_required) {
        const ans = answers[q.id]
        if (ans === undefined || ans === null || String(ans).trim() === "") {
          alert(`Pertanyaan "${q.question_text}" wajib diisi.`)
          return
        }
      }
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form_id: formData.id,
          respondent_name: respondentName || "Siswa / Member",
          respondent_email: respondentEmail || null,
          respondent_phone: respondentPhone || null,
          answers,
        }),
      })

      const data = await res.json()
      if (res.ok && data.ok) {
        setSubmitted(true)
      } else {
        alert(`⚠️ ${data.message || "Gagal mengirim respon."}`)
      }
    } catch {
      alert("⚠️ Terjadi kesalahan jaringan.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
        <div className="mx-auto max-w-2xl text-center space-y-3 py-16">
          <Loader2 className="size-8 text-[#2B3A55] animate-spin mx-auto" />
          <div className="text-xs font-mono text-[#6B6862]">Memuat formulir dari database Supabase...</div>
        </div>
      </main>
    )
  }

  const displayTitle = formData?.title || fallbackTitle || `Formulir ${slug}`
  const displayDesc = formData?.description || fallbackDescription || "Isi formulir resmi JPER Community di bawah ini."

  return (
    <main className="min-h-svh bg-[#FAF9F6] text-[#1C1B1A] px-6 py-12 md:px-12 lg:px-20 font-sans">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E4E1DA] pb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#6B6862] hover:text-[#B23A2E] transition-colors"
          >
            <ArrowLeft className="size-4" /> Kembali ke Portal Form (forms.jper.my.id)
          </Link>
          <div className="flex items-center gap-2">
            <img src="/image/J-PER.png" alt="JPER Logo" className="size-6 object-contain" />
            <span className="font-mono text-xs font-bold tracking-wider">forms.jper.my.id</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-900">
            <Sparkles className="size-3.5 text-emerald-600" />
            Formulir Layanan Anggota
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#1C1B1A]">
            {displayTitle}
          </h1>
          <p className="text-xs text-[#6B6862] leading-relaxed">
            {displayDesc}
          </p>
        </div>

        {errorMsg && !formData && (
          <Card className="border-amber-300 bg-amber-50/50 p-6 rounded-2xl text-center space-y-3">
            <AlertCircle className="size-8 text-amber-600 mx-auto" />
            <div className="text-sm font-bold text-[#1C1B1A]">Formulir Belum Aktif</div>
            <p className="text-xs text-[#6B6862] max-w-md mx-auto">{errorMsg}</p>
          </Card>
        )}

        {submitted ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="border border-emerald-300 bg-emerald-50/50 p-8 rounded-2xl text-center space-y-4 shadow-xs">
              <div className="size-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="size-8 stroke-[2]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#1C1B1A]">Terima Kasih Atas Respon Anda!</h2>
                <p className="text-xs text-[#6B6862] mt-1 max-w-md mx-auto">
                  Jawaban Anda telah berhasil tersimpan di database Supabase dan akan ditindaklanjuti oleh Pengurus & Pembina SMKN 1 Majalaya.
                </p>
              </div>
              <Button
                type="button"
                onClick={() => {
                  setSubmitted(false)
                  setAnswers({})
                }}
                className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-bold rounded-xl px-5 h-10 cursor-pointer"
              >
                Isi Formulir Lagi
              </Button>
            </Card>
          </motion.div>
        ) : (
          formData && (
            <form onSubmit={handleSubmit} className="bg-white border border-[#E4E1DA] p-6 md:p-8 rounded-2xl shadow-xs space-y-6">
              {/* RESPONDENT INFO SECTION */}
              <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-[#2B3A55]">Informasi Responden (Opsional)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B6862]">Nama Lengkap</label>
                    <Input
                      type="text"
                      placeholder="Budi Santoso"
                      value={respondentName}
                      onChange={(e) => setRespondentName(e.target.value)}
                      className="bg-white border-[#E4E1DA] text-xs h-9"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#6B6862]">Email / No. HP</label>
                    <Input
                      type="text"
                      placeholder="budi@jper.my.id / 0812..."
                      value={respondentEmail}
                      onChange={(e) => setRespondentEmail(e.target.value)}
                      className="bg-white border-[#E4E1DA] text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              {/* DYNAMIC QUESTIONS RENDERER */}
              <div className="space-y-5">
                {formData.form_questions.map((q, qIdx) => (
                  <div key={q.id} className="space-y-2">
                    <label className="text-xs font-bold text-[#1C1B1A] flex items-center justify-between">
                      <span>
                        {qIdx + 1}. {q.question_text} {q.is_required && <span className="text-[#B23A2E]">*</span>}
                      </span>
                    </label>

                    {/* TYPE: SHORT TEXT */}
                    {q.question_type === "short_text" && (
                      <Input
                        type="text"
                        required={q.is_required}
                        placeholder={q.placeholder || "Ketik jawaban singkat Anda..."}
                        value={String(answers[q.id] || "")}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="bg-[#FAF9F6] border-[#E4E1DA] text-xs h-10"
                      />
                    )}

                    {/* TYPE: LONG TEXT */}
                    {q.question_type === "long_text" && (
                      <textarea
                        required={q.is_required}
                        rows={4}
                        placeholder={q.placeholder || "Tuliskan uraian lengkap Anda di sini..."}
                        value={String(answers[q.id] || "")}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl text-xs p-3 min-h-[90px] text-[#1C1B1A] focus:outline-none focus:border-[#2B3A55]"
                      />
                    )}

                    {/* TYPE: DROPDOWN */}
                    {q.question_type === "dropdown" && (
                      <select
                        required={q.is_required}
                        value={String(answers[q.id] || "")}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        className="w-full bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl text-xs h-10 px-3 font-semibold text-[#1C1B1A] focus:outline-none focus:border-[#2B3A55]"
                      >
                        <option value="">{q.placeholder || "-- Pilih Salah Satu --"}</option>
                        {q.options?.map((opt, oIdx) => (
                          <option key={oIdx} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* TYPE: SINGLE CHOICE (RADIO) */}
                    {q.question_type === "single_choice" && (
                      <div className="space-y-2 bg-[#FAF9F6] border border-[#E4E1DA] p-3 rounded-xl">
                        {q.options?.map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className="flex items-center gap-2.5 text-xs font-semibold text-[#1C1B1A] cursor-pointer hover:text-[#B23A2E]"
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              required={q.is_required}
                              checked={answers[q.id] === opt}
                              onChange={() => handleAnswerChange(q.id, opt)}
                              className="size-4 text-[#B23A2E] focus:ring-[#B23A2E]"
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    )}

                    {/* TYPE: RATING (1-5 STARS) */}
                    {q.question_type === "rating" && (
                      <div className="flex items-center gap-2 bg-[#FAF9F6] border border-[#E4E1DA] p-3 rounded-xl">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const currentRating = Number(answers[q.id] || 5)
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, star)}
                              className="p-1 transition-transform hover:scale-110 cursor-pointer"
                            >
                              <Star
                                className={`size-7 ${
                                  star <= currentRating ? "fill-amber-400 text-amber-500" : "text-[#E4E1DA]"
                                }`}
                              />
                            </button>
                          )
                        })}
                        <span className="text-xs font-bold text-[#2B3A55] ml-2 font-mono">
                          ({Number(answers[q.id] || 5)} / 5 Bintang)
                        </span>
                      </div>
                    )}

                    {/* TYPE: FILE UPLOAD */}
                    {q.question_type === "file_upload" && (
                      <div className="space-y-1">
                        <Input
                          type="file"
                          required={q.is_required}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleAnswerChange(q.id, `Uploaded: ${file.name} (${Math.round(file.size / 1024)} KB)`)
                            }
                          }}
                          className="bg-[#FAF9F6] border-[#E4E1DA] text-xs h-10 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#2B3A55] file:text-white"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold h-11 rounded-xl shadow-xs cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Mengirim Jawaban...
                  </span>
                ) : (
                  "Kirim Respon Formulir ✨"
                )}
              </Button>
            </form>
          )
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-[#E4E1DA] text-center text-xs text-[#6B6862]">
          &copy; 2026 JPER Community — Portal Form forms.jper.my.id
        </div>
      </div>
    </main>
  )
}
