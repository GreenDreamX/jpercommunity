"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, UserPlus, Sparkles, Copy, Check } from "lucide-react"
import { FirebaseError } from "firebase/app"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { firebaseAuth } from "@/lib/firebase/client"
import { registerSchema, type RegisterFormData } from "@/lib/validators/register"

const auth = firebaseAuth

type FormState = {
  namaLengkap: string
  tempatLahir: string
  tanggalLahir: string
  nomorTelepon: string
  email: string
  password: string
  confirmPassword: string
  angkatan: RegisterFormData["angkatan"]
  alasanIkut: string
  nisn: string
  nis: string
  
  // School fields
  asalSekolahSelect: string
  asalSekolahCustom: string
  
  // SMP field
  asalSmp: string
  
  // Active student class
  kelasSelect: string
  kelasCustom: string
  
  // Jurusan dropdown
  jurusanSelect: string
  jurusanCustom: string
  
  // Consent
  readinessConsent: boolean
}

const initialState: FormState = {
  namaLengkap: "",
  tempatLahir: "",
  tanggalLahir: "",
  nomorTelepon: "",
  email: "",
  password: "",
  confirmPassword: "",
  angkatan: "2026",
  alasanIkut: "",
  nisn: "",
  nis: "",
  asalSekolahSelect: "SMKN 1 Majalaya",
  asalSekolahCustom: "",
  asalSmp: "",
  kelasSelect: "10 TJKT 1",
  kelasCustom: "",
  jurusanSelect: "TJKT",
  jurusanCustom: "",
  readinessConsent: false,
}

function mapFirebaseError(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Pendaftaran gagal. Coba lagi beberapa saat."
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "Email sudah dipakai. Gunakan email lain atau login."
    case "auth/invalid-email":
      return "Format email tidak valid."
    case "auth/weak-password":
      return "Password terlalu lemah. Gunakan minimal 8 karakter."
    default:
      return "Pendaftaran akun gagal. Periksa data Anda lalu coba lagi."
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialState)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)

  const copyToClipboard = (text: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text)
      setCopiedText(`${label} berhasil disalin!`)
      setTimeout(() => setCopiedText(null), 2500)
    }
  }

  const handleNextStep = async () => {
    setErrorMessage(null)
    if (!form.namaLengkap.trim()) {
      setErrorMessage("Nama lengkap wajib diisi.")
      return
    }
    if (!form.tempatLahir.trim()) {
      setErrorMessage("Tempat lahir wajib diisi.")
      return
    }
    if (!form.tanggalLahir.trim()) {
      setErrorMessage("Tanggal lahir wajib diisi.")
      return
    }
    if (form.nomorTelepon.length < 10) {
      setErrorMessage("Nomor telepon minimal 10 digit.")
      return
    }
    if (form.alasanIkut.length < 25) {
      setErrorMessage("Alasan mengikuti ekskul minimal 25 karakter.")
      return
    }

    // Cohort validation
    const isActiveStudent = ["2026", "2025", "2024"].includes(form.angkatan)
    const isProspectiveStudent = ["2027", "2028"].includes(form.angkatan)

    if (isActiveStudent) {
      if (!/^\d{9}$/.test(form.nis)) {
        setErrorMessage("NIS harus tepat 9 digit angka.")
        return
      }
      if (!/^\d{10}$/.test(form.nisn)) {
        setErrorMessage("NISN harus tepat 10 digit angka.")
        return
      }
      if (form.asalSekolahSelect === "Lainnya" && !form.asalSekolahCustom.trim()) {
        setErrorMessage("Silakan isi nama sekolah kustom Anda.")
        return
      }
      if (form.jurusanSelect === "Lainnya" && !form.jurusanCustom.trim()) {
        setErrorMessage("Silakan isi nama jurusan kustom Anda.")
        return
      }
      if (form.jurusanSelect === "Lainnya" && !form.kelasCustom.trim()) {
        setErrorMessage("Silakan isi kelas kustom Anda.")
        return
      }
    }

    if (isProspectiveStudent) {
      if (!form.asalSmp.trim()) {
        setErrorMessage("Asal SMP wajib diisi.")
        return
      }
      if (!form.readinessConsent) {
        setErrorMessage("Anda harus menyetujui pernyataan kesiapan.")
        return
      }
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/auth/generate-email?name=${encodeURIComponent(form.namaLengkap)}`)
      if (!response.ok) {
        throw new Error("Gagal menghasilkan email SSO.")
      }
      const data = await response.json()

      setForm((prev) => ({
        ...prev,
        email: data.email,
      }))
      setStep(2)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan saat membuat email SSO.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const formPayload = useMemo(() => {
    const base = {
      namaLengkap: form.namaLengkap,
      tempatLahir: form.tempatLahir,
      tanggalLahir: form.tanggalLahir,
      nomorTelepon: form.nomorTelepon,
      email: form.email,
      password: form.password,
      alasanIkut: form.alasanIkut,
      angkatan: form.angkatan,
    }

    const isAlumni = ["2023", "2022", "2021", "2020", "2019"].includes(form.angkatan)
    const isActiveStudent = ["2026", "2025", "2024"].includes(form.angkatan)
    const isProspectiveStudent = ["2027", "2028"].includes(form.angkatan)

    if (isAlumni) {
      return {
        ...base,
        angkatan: form.angkatan as "2023" | "2022" | "2021" | "2020" | "2019",
      }
    }

    if (isActiveStudent) {
      const selectedSchool = form.asalSekolahSelect === "Lainnya" ? form.asalSekolahCustom : form.asalSekolahSelect
      const selectedJurusan = form.jurusanSelect === "Lainnya" ? form.jurusanCustom : form.jurusanSelect
      const selectedClass = form.jurusanSelect === "Lainnya" ? form.kelasCustom : form.kelasSelect
      return {
        ...base,
        angkatan: form.angkatan as "2026" | "2025" | "2024",
        nisn: form.nisn,
        nis: form.nis,
        kelas: selectedClass,
        jurusan: selectedJurusan,
        asalSekolah: selectedSchool,
      }
    }

    if (isProspectiveStudent) {
      return {
        ...base,
        angkatan: form.angkatan as "2027" | "2028",
        asalSmp: form.asalSmp,
        readinessConsent: form.readinessConsent,
      }
    }

    return base
  }, [form])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (form.password !== form.confirmPassword) {
      setErrorMessage("Konfirmasi password tidak cocok dengan password yang dimasukkan.")
      setIsSubmitting(false)
      return
    }

    const parsed = registerSchema.safeParse(formPayload)
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Data pendaftaran belum valid.")
      setIsSubmitting(false)
      return
    }

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      )

      await updateProfile(credential.user, { displayName: form.namaLengkap })
      const idToken = await credential.user.getIdToken()

      const syncResponse = await fetch("/api/auth/sync-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          registerData: parsed.data,
        }),
      })

      if (!syncResponse.ok) {
        const errorPayload = (await syncResponse.json().catch(() => null)) as
          | { message?: string }
          | null
        setErrorMessage(
          errorPayload?.message ??
            "Akun berhasil dibuat, tetapi sinkronisasi profil gagal.",
        )
        setIsSubmitting(false)
        return
      }

      setSuccessMessage(
        "Pendaftaran berhasil. Akun Anda langsung aktif dan siap dipakai login.",
      )
      setForm(initialState)
      router.push("/login?registered=true")
    } catch (error) {
      setErrorMessage(mapFirebaseError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-svh bg-white p5-subtle-grid px-6 py-10 text-black md:px-8 lg:px-10 overflow-hidden">
      {/* Subtle Red & Gold Background Corner Accents */}
      <div className="absolute top-0 right-0 h-96 w-96 bg-gradient-to-bl from-[#E60012]/08 via-transparent to-transparent pointer-events-none -rotate-12 transform origin-top-right" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-gradient-to-tr from-[#FFC700]/10 via-transparent to-transparent pointer-events-none rotate-12 transform origin-bottom-left" />

      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-black shadow-[3px_3px_0px_#111] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#E60012] hover:text-white hover:shadow-[4px_4px_0px_#FFC700]"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali ke Landing Page</span>
        </Link>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-2 border-black bg-white shadow-[8px_8px_0px_#111] overflow-hidden rounded-none">
            <CardHeader className="border-b-2 border-black bg-[#FAF9F5] p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="inline-block bg-[#E60012] text-white px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest -skew-x-6 border border-black shadow-[2px_2px_0px_#FFC700]">
                  新規登録 • REGISTER MEMBER
                </span>
                <span className="font-mono text-xs font-black bg-black text-[#FFC700] px-2.5 py-0.5 border border-black">
                  STEP {step} / 2
                </span>
              </div>
              <CardTitle className="font-heading text-2xl md:text-3xl font-black uppercase tracking-tight text-black">
                Pendaftaran Anggota Baru.
              </CardTitle>
              <CardDescription className="text-xs font-medium text-zinc-700">
                Isi formulir pendaftaran dinamis JPER Community sesuai angkatan Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} method="POST">
                <FieldGroup className="space-y-4">
                  {step === 1 ? (
                    <>
                      <Field>
                        <FieldLabel htmlFor="namaLengkap" className="text-xs font-black uppercase tracking-wider text-black">
                          Nama Lengkap
                        </FieldLabel>
                        <Input
                          id="namaLengkap"
                          value={form.namaLengkap}
                          onChange={(event) => setForm((prev) => ({ ...prev, namaLengkap: event.target.value }))}
                          required
                          disabled={isSubmitting}
                          placeholder="Masukkan nama lengkap Anda"
                          className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="tempatLahir" className="text-xs font-black uppercase tracking-wider text-black">
                            Tempat Lahir
                          </FieldLabel>
                          <Input
                            id="tempatLahir"
                            value={form.tempatLahir}
                            onChange={(event) => setForm((prev) => ({ ...prev, tempatLahir: event.target.value }))}
                            required
                            disabled={isSubmitting}
                            placeholder="Contoh: Bandung"
                            className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="tanggalLahir" className="text-xs font-black uppercase tracking-wider text-black">
                            Tanggal Lahir
                          </FieldLabel>
                          <Input
                            id="tanggalLahir"
                            type="date"
                            value={form.tanggalLahir}
                            onChange={(event) => setForm((prev) => ({ ...prev, tanggalLahir: event.target.value }))}
                            required
                            disabled={isSubmitting}
                            className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="nomorTelepon" className="text-xs font-black uppercase tracking-wider text-black">
                          Nomor Telepon (WhatsApp)
                        </FieldLabel>
                        <Input
                          id="nomorTelepon"
                          value={form.nomorTelepon}
                          onChange={(event) => setForm((prev) => ({ ...prev, nomorTelepon: event.target.value.replace(/[^0-9]/g, "") }))}
                          required
                          disabled={isSubmitting}
                          placeholder="Contoh: 081234567890"
                          className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="angkatan" className="text-xs font-black uppercase tracking-wider text-black">
                          Angkatan
                        </FieldLabel>
                        <select
                          id="angkatan"
                          value={form.angkatan}
                          onChange={(event) => {
                            const val = event.target.value as FormState["angkatan"]
                            let grade = "10"
                            if (val === "2025") grade = "11"
                            if (val === "2024") grade = "12"
                            const initialClass = `${grade} TJKT 1`
                            setForm((prev) => ({
                              ...prev,
                              angkatan: val,
                              nisn: "",
                              nis: "",
                              asalSekolahSelect: "SMKN 1 Majalaya",
                              asalSekolahCustom: "",
                              asalSmp: "",
                              kelasSelect: initialClass,
                              kelasCustom: "",
                              jurusanSelect: "TJKT",
                              jurusanCustom: "",
                              readinessConsent: false,
                            }))
                          }}
                          className="w-full h-10 border-2 border-black bg-zinc-50 px-3.5 text-xs font-bold text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                          disabled={isSubmitting}
                        >
                          <option value="2028">2028 (Calon Siswa)</option>
                          <option value="2027">2027 (Calon Siswa)</option>
                          <option value="2026">2026 (Siswa Aktif - Kelas 10)</option>
                          <option value="2025">2025 (Siswa Aktif - Kelas 11)</option>
                          <option value="2024">2024 (Siswa Aktif - Kelas 12)</option>
                          <option value="2023">2023 (Alumni)</option>
                          <option value="2022">2022 (Alumni)</option>
                          <option value="2021">2021 (Alumni)</option>
                          <option value="2020">2020 (Alumni)</option>
                          <option value="2019">2019 (Alumni)</option>
                        </select>
                      </Field>

                      {["2026", "2025", "2024"].includes(form.angkatan) && (
                        <>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor="nis" className="text-xs font-black uppercase tracking-wider text-black">
                                NIS (Nomor Induk Siswa)
                              </FieldLabel>
                              <Input
                                id="nis"
                                value={form.nis}
                                onChange={(event) => setForm((prev) => ({ ...prev, nis: event.target.value.replace(/[^0-9]/g, "") }))}
                                required
                                disabled={isSubmitting}
                                placeholder="9 digit angka"
                                className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                              />
                            </Field>

                            <Field>
                              <FieldLabel htmlFor="nisn" className="text-xs font-black uppercase tracking-wider text-black">
                                NISN
                              </FieldLabel>
                              <Input
                                id="nisn"
                                value={form.nisn}
                                onChange={(event) => setForm((prev) => ({ ...prev, nisn: event.target.value.replace(/[^0-9]/g, "") }))}
                                required
                                disabled={isSubmitting}
                                placeholder="10 digit angka"
                                className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                              />
                            </Field>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor="jurusanSelect" className="text-xs font-black uppercase tracking-wider text-black">
                                Jurusan
                              </FieldLabel>
                              <select
                                id="jurusanSelect"
                                value={form.jurusanSelect}
                                onChange={(event) => {
                                  const majorVal = event.target.value
                                  const gradePrefix = form.angkatan === "2026" ? "10" : form.angkatan === "2025" ? "11" : "12"
                                  const nextClass = majorVal === "Lainnya" ? "" : `${gradePrefix} ${majorVal} 1`
                                  setForm((prev) => ({
                                    ...prev,
                                    jurusanSelect: majorVal,
                                    kelasSelect: nextClass,
                                  }))
                                }}
                                className="w-full h-10 border-2 border-black bg-zinc-50 px-3.5 text-xs font-bold text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                                disabled={isSubmitting}
                              >
                                <option value="TJKT">TJKT</option>
                                <option value="TEI">TEI</option>
                                <option value="DKV">DKV</option>
                                <option value="TITL">TITL</option>
                                <option value="TSM">TSM</option>
                                <option value="IPA">IPA</option>
                                <option value="IPS">IPS</option>
                                <option value="Lainnya">Lainnya (Custom)</option>
                              </select>
                            </Field>

                            <Field>
                              <FieldLabel htmlFor="kelasSelect" className="text-xs font-black uppercase tracking-wider text-black">
                                Kelas
                              </FieldLabel>
                              {form.jurusanSelect === "Lainnya" ? (
                                <Input
                                  id="kelasCustom"
                                  value={form.kelasCustom}
                                  onChange={(event) => setForm((prev) => ({ ...prev, kelasCustom: event.target.value }))}
                                  required
                                  disabled={isSubmitting}
                                  placeholder="Contoh: 10 TJKT 1"
                                  className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                                />
                              ) : (
                                <select
                                  id="kelasSelect"
                                  value={form.kelasSelect}
                                  onChange={(event) => setForm((prev) => ({ ...prev, kelasSelect: event.target.value }))}
                                  className="w-full h-10 border-2 border-black bg-zinc-50 px-3.5 text-xs font-bold text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                                  disabled={isSubmitting}
                                >
                                  {(() => {
                                    const gradePrefix = form.angkatan === "2026" ? "10" : form.angkatan === "2025" ? "11" : "12"
                                    const major = form.jurusanSelect
                                    return [1, 2, 3].map((num) => {
                                      const val = `${gradePrefix} ${major} ${num}`
                                      return (
                                        <option key={val} value={val}>
                                          {val}
                                        </option>
                                      )
                                    })
                                  })()}
                                </select>
                              )}
                            </Field>
                          </div>

                          {form.jurusanSelect === "Lainnya" && (
                            <Field>
                              <FieldLabel htmlFor="jurusanCustom" className="text-xs font-black uppercase tracking-wider text-black">
                                Nama Jurusan Kustom
                              </FieldLabel>
                              <Input
                                id="jurusanCustom"
                                value={form.jurusanCustom}
                                onChange={(event) => setForm((prev) => ({ ...prev, jurusanCustom: event.target.value }))}
                                required
                                disabled={isSubmitting}
                                placeholder="Ketik jurusan Anda"
                                className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                              />
                            </Field>
                          )}

                          <Field>
                            <FieldLabel htmlFor="asalSekolahSelect" className="text-xs font-black uppercase tracking-wider text-black">
                              Asal Sekolah
                            </FieldLabel>
                            <select
                              id="asalSekolahSelect"
                              value={form.asalSekolahSelect}
                              onChange={(event) => setForm((prev) => ({ ...prev, asalSekolahSelect: event.target.value }))}
                              className="w-full h-10 border-2 border-black bg-zinc-50 px-3.5 text-xs font-bold text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                              disabled={isSubmitting}
                            >
                              <option value="SMKN 1 Majalaya">SMKN 1 Majalaya</option>
                              <option value="SMAN 1 Majalaya">SMAN 1 Majalaya</option>
                              <option value="SMAN 2 Majalaya">SMAN 2 Majalaya</option>
                              <option value="SMK 2 LPPM RI Majalaya">SMK 2 LPPM RI Majalaya</option>
                              <option value="Lainnya">Lainnya (Custom)</option>
                            </select>
                          </Field>

                          {form.asalSekolahSelect === "Lainnya" && (
                            <Field>
                              <FieldLabel htmlFor="asalSekolahCustom" className="text-xs font-black uppercase tracking-wider text-black">
                                Nama Sekolah Kustom
                              </FieldLabel>
                              <Input
                                id="asalSekolahCustom"
                                value={form.asalSekolahCustom}
                                onChange={(event) => setForm((prev) => ({ ...prev, asalSekolahCustom: event.target.value }))}
                                required
                                disabled={isSubmitting}
                                placeholder="Ketik asal sekolah Anda"
                                className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                              />
                            </Field>
                          )}
                        </>
                      )}

                      {["2027", "2028"].includes(form.angkatan) && (
                        <>
                          <Field>
                            <FieldLabel htmlFor="asalSmp" className="text-xs font-black uppercase tracking-wider text-black">
                              Asal SMP
                            </FieldLabel>
                            <Input
                              id="asalSmp"
                              value={form.asalSmp}
                              onChange={(event) => setForm((prev) => ({ ...prev, asalSmp: event.target.value }))}
                              required
                              disabled={isSubmitting}
                              placeholder="Nama SMP asal Anda"
                              className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                            />
                          </Field>

                          <div className="flex items-start gap-2.5 py-2 border-2 border-black bg-zinc-50 p-3 shadow-[2px_2px_0px_#111]">
                            <input
                              id="readinessConsent"
                              type="checkbox"
                              checked={form.readinessConsent}
                              onChange={(event) => setForm((prev) => ({ ...prev, readinessConsent: event.target.checked }))}
                              required
                              disabled={isSubmitting}
                              className="size-4 rounded-none border-2 border-black bg-white text-[#E60012] focus:ring-0 mt-0.5"
                            />
                            <div className="grid gap-1 leading-none">
                              <label
                                htmlFor="readinessConsent"
                                className="text-xs font-bold text-black leading-relaxed cursor-pointer select-none"
                              >
                                Saya siap mengikuti kegiatan JPER Community apabila diterima di SMKN 1 Majalaya.
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      <Field>
                        <FieldLabel htmlFor="alasanIkut" className="text-xs font-black uppercase tracking-wider text-black">
                          Alasan Mengikuti Ekskul
                        </FieldLabel>
                        <textarea
                          id="alasanIkut"
                          value={form.alasanIkut}
                          onChange={(event) => setForm((prev) => ({ ...prev, alasanIkut: event.target.value }))}
                          rows={4}
                          className="w-full border-2 border-black bg-zinc-50 p-3 text-xs font-bold text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                          required
                          disabled={isSubmitting}
                          placeholder="Jelaskan motivasi dan alasan Anda mengikuti JPER Community (minimal 25 karakter)..."
                        />
                        <FieldDescription className="text-[10px] font-bold uppercase text-zinc-500">
                          Minimal 25 karakter. Saat ini: <span className="text-[#E60012] font-black">{form.alasanIkut.length}</span> karakter.
                        </FieldDescription>
                      </Field>

                      {errorMessage && (
                        <FieldError className="text-xs text-white bg-[#E60012] border-2 border-black p-3 shadow-[3px_3px_0px_#111] font-black uppercase tracking-tight">
                          {errorMessage}
                        </FieldError>
                      )}

                      <Field className="pt-2">
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className="w-full border-2 border-black bg-[#E60012] text-white py-3.5 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#FFC700] hover:bg-[#FFC700] hover:text-black hover:shadow-[5px_5px_0px_#111] transition-all duration-150 active:translate-x-1 active:translate-y-1 active:shadow-none"
                        >
                          Lanjutkan ke Akun SSO (Step 2) →
                        </button>
                      </Field>
                    </>
                  ) : (
                    <>
                      <div className="border-2 border-black bg-[#FAF9F5] p-4 shadow-[4px_4px_0px_#111] space-y-3">
                        <div className="flex items-center justify-between border-b-2 border-black pb-2">
                          <div className="flex items-center gap-2">
                            <div className="size-2.5 rounded-full bg-[#E60012] animate-ping" />
                            <span className="text-xs font-mono font-black tracking-wider text-black uppercase">AKUN SSO JPER DIHASILKAN</span>
                          </div>
                          <span className="text-[10px] bg-[#FFC700] text-black font-black uppercase px-2 py-0.5 border border-black">
                            RESMI
                          </span>
                        </div>
                        <p className="text-xs font-medium text-zinc-800 leading-relaxed">
                          Berikut adalah alamat email SSO resmi Anda untuk JPER Community. Salin email ini dan buatlah password Anda sendiri di bawah.
                        </p>
                        
                        <div className="bg-white border-2 border-black p-3 space-y-2 font-mono text-xs shadow-[2px_2px_0px_#111]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-zinc-600">EMAIL SSO ANDA:</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(form.email, "Email SSO")}
                              className="border border-black bg-[#E60012] text-white px-2 py-0.5 text-[10px] font-black uppercase shadow-[1px_1px_0px_#111] hover:bg-[#FFC700] hover:text-black"
                            >
                              Copy
                            </button>
                          </div>
                          <Input
                            id="email_sso"
                            type="email"
                            value={form.email}
                            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                            required
                            disabled={isSubmitting}
                            className="bg-zinc-50 border-2 border-black font-mono text-xs font-black text-black h-9"
                            placeholder="nama@shokunin.jper.my.id"
                          />
                        </div>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="password" className="text-xs font-black uppercase tracking-wider text-black">
                          Buat Password Baru
                        </FieldLabel>
                        <Input
                          id="password"
                          type="password"
                          value={form.password}
                          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                          required
                          disabled={isSubmitting}
                          placeholder="Masukkan password yang kuat (minimal 8 karakter)"
                          className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-wider text-black">
                          Konfirmasi Password
                        </FieldLabel>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={form.confirmPassword}
                          onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                          required
                          disabled={isSubmitting}
                          placeholder="Ketik ulang password baru Anda"
                          className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                        />
                      </Field>

                      {errorMessage && (
                        <FieldError className="text-xs text-white bg-[#E60012] border-2 border-black p-3 shadow-[3px_3px_0px_#111] font-black uppercase tracking-tight">
                          {errorMessage}
                        </FieldError>
                      )}

                      {successMessage && (
                        <div className="border-2 border-black bg-[#FFC700] p-3.5 text-xs font-black uppercase text-black shadow-[3px_3px_0px_#111]">
                          {successMessage}
                        </div>
                      )}

                      <div className="grid gap-3 sm:grid-cols-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="border-2 border-black bg-white text-black py-3.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#111] hover:bg-zinc-100 transition-all"
                          disabled={isSubmitting}
                        >
                          ← Kembali ke Data Diri
                        </button>
                        <button
                          type="submit"
                          className="border-2 border-black bg-[#E60012] text-white py-3.5 text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#FFC700] hover:bg-[#FFC700] hover:text-black hover:shadow-[5px_5px_0px_#111] transition-all duration-150 active:translate-x-1 active:translate-y-1 active:shadow-none"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Memproses..." : "Selesaikan Pendaftaran →"}
                        </button>
                      </div>
                    </>
                  )}
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          {/* RIGHT SIDE: STATUS & ATURAN PENDAFTARAN */}
          <Card className="border-2 border-black bg-[#FFC700] p-6 shadow-[6px_6px_0px_#111] space-y-4 rounded-none h-fit">
            <div className="border-b-2 border-black pb-3 space-y-1">
              <span className="bg-black text-[#FFC700] px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest -skew-x-6 border border-black shadow-[2px_2px_0px_#E60012]">
                ATURAN DIKECUALIKAN PER ANGKATAN
              </span>
              <CardTitle className="font-heading text-xl font-black uppercase text-black mt-2">
                Persyaratan Formulir Pendaftaran
              </CardTitle>
            </div>

            <div className="space-y-3 text-xs font-bold uppercase tracking-tight text-black leading-relaxed">
              <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#111]">
                <div className="font-black text-[#E60012] mb-0.5">★ 2027–2028 (Calon Siswa SMP):</div>
                <div>Asal SMP &amp; Centang Pernyataan Kesiapan Wajib</div>
              </div>

              <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#111]">
                <div className="font-black text-black mb-0.5">★ 2024–2026 (Siswa Aktif SMKN 1):</div>
                <div>NIS (9 Digit), NISN (10 Digit), Kelas, Jurusan &amp; Asal Sekolah</div>
              </div>

              <div className="border-2 border-black bg-white p-3 shadow-[3px_3px_0px_#111]">
                <div className="font-black text-zinc-700 mb-0.5">★ 2019–2023 (Alumni):</div>
                <div>Tempat &amp; Tanggal Lahir (Tanpa Data Sekolah Tambahan)</div>
              </div>
            </div>
          </Card>
        </section>
      </div>

      {copiedText && (
        <div className="fixed bottom-5 right-5 z-50 border-2 border-black bg-[#FFC700] text-black text-xs font-mono font-black uppercase px-4 py-2.5 shadow-[4px_4px_0px_#111]">
          {copiedText}
        </div>
      )}
    </main>
  )
}