"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, UserPlus } from "lucide-react"
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
  nomorTelepon: string
  email: string
  password: string
  angkatan: RegisterFormData["angkatan"]
  alasanIkut: string
  nisn: string
  nis: string
  asalSekolah: string
  kelas: string
}

const initialState: FormState = {
  namaLengkap: "",
  nomorTelepon: "",
  email: "",
  password: "",
  angkatan: "2026",
  alasanIkut: "",
  nisn: "",
  nis: "",
  asalSekolah: "",
  kelas: "",
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

  const requiresSchool = form.angkatan === "2026"
  const requiresClass = form.angkatan === "2025" || form.angkatan === "2024"

  const formPayload = useMemo(() => {
    const base = {
      namaLengkap: form.namaLengkap,
      nomorTelepon: form.nomorTelepon,
      email: form.email,
      password: form.password,
      alasanIkut: form.alasanIkut,
      angkatan: form.angkatan,
    }

    if (form.angkatan === "2026") {
      return {
        ...base,
        nisn: form.nisn,
        nis: form.nis,
        asalSekolah: form.asalSekolah,
      }
    }

    if (form.angkatan === "2025" || form.angkatan === "2024") {
      return {
        ...base,
        nisn: form.nisn,
        nis: form.nis,
        kelas: form.kelas,
      }
    }

    return base
  }, [form])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(null)
    setSuccessMessage(null)

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
        "Pendaftaran berhasil. Akun Anda langsung aktif dan bisa dipakai login.",
      )
      setForm(initialState)
      router.push("/lms")
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
              <form onSubmit={handleSubmit}>
                <FieldGroup>
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

                  <Field>
                    <FieldLabel htmlFor="nomorTelepon">Nomor telepon</FieldLabel>
                    <Input
                      id="nomorTelepon"
                      value={form.nomorTelepon}
                      onChange={(event) => setForm((prev) => ({ ...prev, nomorTelepon: event.target.value }))}
                      required
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="angkatan">Angkatan</FieldLabel>
                    <select
                      id="angkatan"
                      value={form.angkatan}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          angkatan: event.target.value as FormState["angkatan"],
                          nisn: "",
                          nis: "",
                          asalSekolah: "",
                          kelas: "",
                        }))
                      }
                      className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                      disabled={isSubmitting}
                    >
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023 (alumni)</option>
                      <option value="2022">2022 (alumni)</option>
                      <option value="2021">2021 (alumni)</option>
                      <option value="2020">2020 (alumni)</option>
                      <option value="2019">2019 (alumni)</option>
                    </select>
                  </Field>

                  {(requiresSchool || requiresClass) && (
                    <>
                      <Field>
                        <FieldLabel htmlFor="nisn">NISN</FieldLabel>
                        <Input
                          id="nisn"
                          value={form.nisn}
                          onChange={(event) => setForm((prev) => ({ ...prev, nisn: event.target.value }))}
                          required
                          disabled={isSubmitting}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="nis">NIS</FieldLabel>
                        <Input
                          id="nis"
                          value={form.nis}
                          onChange={(event) => setForm((prev) => ({ ...prev, nis: event.target.value }))}
                          required
                          disabled={isSubmitting}
                        />
                      </Field>
                    </>
                  )}

                  {requiresSchool && (
                    <Field>
                      <FieldLabel htmlFor="asalSekolah">Asal sekolah (SMP)</FieldLabel>
                      <Input
                        id="asalSekolah"
                        value={form.asalSekolah}
                        onChange={(event) => setForm((prev) => ({ ...prev, asalSekolah: event.target.value }))}
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                  )}

                  {requiresClass && (
                    <Field>
                      <FieldLabel htmlFor="kelas">Kelas</FieldLabel>
                      <Input
                        id="kelas"
                        value={form.kelas}
                        onChange={(event) => setForm((prev) => ({ ...prev, kelas: event.target.value }))}
                        required
                        disabled={isSubmitting}
                      />
                    </Field>
                  )}

                  <Field>
                    <FieldLabel htmlFor="email">Email pribadi</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      required
                      disabled={isSubmitting}
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                    <Input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      required
                      disabled={isSubmitting}
                    />
                  </Field>

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
                  {successMessage && (
                    <FieldDescription className="text-primary">{successMessage}</FieldDescription>
                  )}

                  <Field>
                    <button
                      type="submit"
                      className={cn(buttonVariants({ size: "lg" }), "w-full rounded-lg")}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Memproses..." : "Buat akun"}
                    </button>
                  </Field>
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
              <div className="flex items-center gap-2">• 2026: NISN, NIS, asal sekolah</div>
              <div className="flex items-center gap-2">• 2025/2024: NISN, NIS, kelas</div>
              <div className="flex items-center gap-2">• 2019-2023: field dasar saja</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}