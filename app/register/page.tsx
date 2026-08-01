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

  const handleNextStep = () => {
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

    // Generate the JPER SSO email based on their first name only
    const namePart = form.namaLengkap.trim().toLowerCase().split(" ")[0]?.replace(/[^a-z0-9]/g, "") || "member"
    const generatedEmail = `${namePart}@shokunin.jper.my.id`

    setForm((prev) => ({
      ...prev,
      email: generatedEmail,
    }))
    setStep(2)
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
            "Akun Firebase berhasil dibuat, tetapi sinkronisasi profile gagal.",
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
    <main className="min-h-svh bg-background px-6 py-10 text-foreground md:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit rounded-lg")}>
          <ArrowLeft />
          Kembali ke landing
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="bg-background">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <UserPlus className="size-4 text-primary" />
                Register member
              </CardDescription>
              <CardTitle className="text-3xl tracking-[-0.04em]">Pendaftaran anggota baru.</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} method="POST">
                <FieldGroup>
                  {step === 1 ? (
                    <>
                      <Field>
                        <FieldLabel htmlFor="namaLengkap">Nama lengkap</FieldLabel>
                        <Input
                          id="namaLengkap"
                          value={form.namaLengkap}
                          onChange={(event) => setForm((prev) => ({ ...prev, namaLengkap: event.target.value }))}
                          required
                          disabled={isSubmitting}
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor="tempatLahir">Tempat lahir</FieldLabel>
                          <Input
                            id="tempatLahir"
                            value={form.tempatLahir}
                            onChange={(event) => setForm((prev) => ({ ...prev, tempatLahir: event.target.value }))}
                            required
                            disabled={isSubmitting}
                            placeholder="Contoh: Bandung"
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="tanggalLahir">Tanggal lahir</FieldLabel>
                          <Input
                            id="tanggalLahir"
                            type="date"
                            value={form.tanggalLahir}
                            onChange={(event) => setForm((prev) => ({ ...prev, tanggalLahir: event.target.value }))}
                            required
                            disabled={isSubmitting}
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="nomorTelepon">Nomor telepon</FieldLabel>
                        <Input
                          id="nomorTelepon"
                          value={form.nomorTelepon}
                          onChange={(event) => setForm((prev) => ({ ...prev, nomorTelepon: event.target.value.replace(/[^0-9]/g, "") }))}
                          required
                          disabled={isSubmitting}
                          placeholder="Contoh: 081234567890"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="angkatan">Angkatan</FieldLabel>
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
                          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
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
                              <FieldLabel htmlFor="nis">NIS (Nomor Induk Siswa)</FieldLabel>
                              <Input
                                id="nis"
                                value={form.nis}
                                onChange={(event) => setForm((prev) => ({ ...prev, nis: event.target.value.replace(/[^0-9]/g, "") }))}
                                required
                                disabled={isSubmitting}
                                placeholder="9 digit angka"
                              />
                            </Field>

                            <Field>
                              <FieldLabel htmlFor="nisn">NISN</FieldLabel>
                              <Input
                                id="nisn"
                                value={form.nisn}
                                onChange={(event) => setForm((prev) => ({ ...prev, nisn: event.target.value.replace(/[^0-9]/g, "") }))}
                                required
                                disabled={isSubmitting}
                                placeholder="10 digit angka"
                              />
                            </Field>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor="jurusanSelect">Jurusan</FieldLabel>
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
                                className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
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
                              <FieldLabel htmlFor="kelasSelect">Kelas</FieldLabel>
                              {form.jurusanSelect === "Lainnya" ? (
                                <Input
                                  id="kelasCustom"
                                  value={form.kelasCustom}
                                  onChange={(event) => setForm((prev) => ({ ...prev, kelasCustom: event.target.value }))}
                                  required
                                  disabled={isSubmitting}
                                  placeholder="Contoh: 10 TJKT 1"
                                />
                              ) : (
                                <select
                                  id="kelasSelect"
                                  value={form.kelasSelect}
                                  onChange={(event) => setForm((prev) => ({ ...prev, kelasSelect: event.target.value }))}
                                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
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
                              <FieldLabel htmlFor="jurusanCustom">Nama Jurusan Kustom</FieldLabel>
                              <Input
                                id="jurusanCustom"
                                value={form.jurusanCustom}
                                onChange={(event) => setForm((prev) => ({ ...prev, jurusanCustom: event.target.value }))}
                                required
                                disabled={isSubmitting}
                                placeholder="Ketik jurusan Anda"
                              />
                            </Field>
                          )}

                          <Field>
                            <FieldLabel htmlFor="asalSekolahSelect">Asal Sekolah</FieldLabel>
                            <select
                              id="asalSekolahSelect"
                              value={form.asalSekolahSelect}
                              onChange={(event) => setForm((prev) => ({ ...prev, asalSekolahSelect: event.target.value }))}
                              className="h-9 rounded-lg border border-input bg-background px-3 text-sm w-full"
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
                              <FieldLabel htmlFor="asalSekolahCustom">Nama Sekolah Kustom</FieldLabel>
                              <Input
                                id="asalSekolahCustom"
                                value={form.asalSekolahCustom}
                                onChange={(event) => setForm((prev) => ({ ...prev, asalSekolahCustom: event.target.value }))}
                                required
                                disabled={isSubmitting}
                                placeholder="Ketik asal sekolah Anda"
                              />
                            </Field>
                          )}
                        </>
                      )}

                      {["2027", "2028"].includes(form.angkatan) && (
                        <>
                          <Field>
                            <FieldLabel htmlFor="asalSmp">Asal SMP</FieldLabel>
                            <Input
                              id="asalSmp"
                              value={form.asalSmp}
                              onChange={(event) => setForm((prev) => ({ ...prev, asalSmp: event.target.value }))}
                              required
                              disabled={isSubmitting}
                              placeholder="Nama SMP asal Anda"
                            />
                          </Field>

                          <div className="flex items-start gap-2 py-2">
                            <input
                              id="readinessConsent"
                              type="checkbox"
                              checked={form.readinessConsent}
                              onChange={(event) => setForm((prev) => ({ ...prev, readinessConsent: event.target.checked }))}
                              required
                              disabled={isSubmitting}
                              className="size-4 rounded border-[#E4E1DA] bg-background text-[#B23A2E] focus:ring-[#B23A2E] mt-0.5"
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label
                                htmlFor="readinessConsent"
                                className="text-xs font-medium text-[#6B6862] leading-relaxed cursor-pointer select-none"
                              >
                                Saya siap mengikuti JPER Community apabila diterima di SMKN 1 Majalaya
                              </label>
                            </div>
                          </div>
                        </>
                      )}

                      <Field>
                        <FieldLabel htmlFor="alasanIkut">Alasan mengikuti ekskul</FieldLabel>
                        <textarea
                          id="alasanIkut"
                          value={form.alasanIkut}
                          onChange={(event) => setForm((prev) => ({ ...prev, alasanIkut: event.target.value }))}
                          rows={4}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                          required
                          disabled={isSubmitting}
                        />
                        <FieldDescription>
                          Minimal 25 karakter. Saat ini {form.alasanIkut.length} karakter.
                        </FieldDescription>
                      </Field>

                      {errorMessage && <FieldError>{errorMessage}</FieldError>}

                      <Field>
                        <button
                          type="button"
                          onClick={handleNextStep}
                          className={cn(buttonVariants({ size: "lg" }), "w-full rounded-lg mt-2")}
                        >
                          Lanjutkan ke Akun SSO (Step 2) →
                        </button>
                      </Field>
                    </>
                  ) : (
                    <>
                      <div className="border border-green-500/20 bg-green-500/5 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-xs font-mono font-bold tracking-wider text-green-600 uppercase">AKUN SSO JPER DIHASILKAN</span>
                          </div>
                          <span className="text-[10px] bg-green-500/10 text-green-600 font-semibold px-2 py-0.5 rounded">Resmi</span>
                        </div>
                        <p className="text-[11px] text-[#6B6862] leading-relaxed">
                          Berikut adalah alamat email SSO resmi Anda untuk JPER Community. Salin email ini dan buatlah password Anda sendiri di bawah.
                        </p>
                        
                        <div className="bg-[#FAF9F6] border border-[#E4E1DA] rounded-lg p-2.5 space-y-1.5 font-mono text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] text-[#6B6862]">EMAIL SSO ANDA (Dapat Disesuaikan):</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(form.email, "Email SSO")}
                              className="text-[#B23A2E] hover:underline text-[10px] font-bold"
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
                            className="bg-white border-[#E4E1DA] font-mono text-xs font-bold text-[#1C1B1A]"
                            placeholder="nama@shokunin.jper.my.id"
                          />
                          <p className="text-[10px] text-[#6B6862] font-sans">
                            Jika nama depan Anda Muhammad atau memiliki konflik nama, Anda dapat mengubah alamat email di atas.
                          </p>
                        </div>
                      </div>

                      <Field>
                        <FieldLabel htmlFor="password">Buat Password Baru</FieldLabel>
                        <Input
                          id="password"
                          type="password"
                          value={form.password}
                          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                          required
                          disabled={isSubmitting}
                          placeholder="Masukkan password yang kuat"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="confirmPassword">Konfirmasi Password</FieldLabel>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={form.confirmPassword}
                          onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                          required
                          disabled={isSubmitting}
                          placeholder="Ketik ulang password"
                        />
                      </Field>

                      {errorMessage && <FieldError>{errorMessage}</FieldError>}
                      {successMessage && (
                        <FieldDescription className="text-primary">{successMessage}</FieldDescription>
                      )}

                      <div className="grid gap-2 sm:grid-cols-2 mt-2">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full rounded-lg")}
                          disabled={isSubmitting}
                        >
                          ← Kembali ke Data Diri
                        </button>
                        <button
                          type="submit"
                          className={cn(buttonVariants({ size: "lg" }), "w-full rounded-lg")}
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? "Memproses..." : "Selesaikan Pendaftaran"}
                        </button>
                      </div>
                    </>
                  )}
                </FieldGroup>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardDescription className="flex items-center gap-2 text-destructive">
                <BadgeCheck className="size-4" />
                Status
              </CardDescription>
              <CardTitle className="text-2xl tracking-[-0.03em]">Aturan pendaftaran aktif.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-foreground">
              <div className="flex items-center gap-2">• 2027-2028 (Calon Siswa): Asal SMP, centang kesiapan</div>
              <div className="flex items-center gap-2">• 2024-2026 (Siswa Aktif): NIS (9 digit), NISN (10 digit), Kelas, Jurusan, Asal Sekolah</div>
              <div className="flex items-center gap-2">• 2019-2023 (Alumni): Tempat & Tanggal Lahir, tanpa data sekolah</div>
            </CardContent>
          </Card>
        </section>
      </div>

      {copiedText && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#1C1B1A] text-[#FAF9F6] text-[11px] font-mono px-3.5 py-2 rounded-lg shadow-lg border border-white/10">
          {copiedText}
        </div>
      )}
    </main>
  )
}