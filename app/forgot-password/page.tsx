"use client"

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, KeyRound, ShieldAlert, Eye, EyeOff, RefreshCw } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [nomorTelepon, setNomorTelepon] = useState("")
  const [nisn, setNisn] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    if (newPassword !== confirmPassword) {
      setErrorMessage("Konfirmasi password baru tidak cocok.")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password baru minimal 6 karakter.")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          tanggalLahir: tanggalLahir.trim(),
          nomorTelepon: nomorTelepon.trim(),
          nisn: nisn.trim(),
          newPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Gagal mereset kata sandi.")
      }

      setSuccessMessage(data.message || "Password berhasil diperbarui!")
      setEmail("")
      setTanggalLahir("")
      setNomorTelepon("")
      setNisn("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#FAF9F6] p-6 md:p-10 text-[#1C1B1A]">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/login"
          className="flex items-center gap-2 text-xs font-semibold text-[#6B6862] hover:text-[#1C1B1A] transition-colors w-fit"
        >
          <ArrowLeft className="size-4" /> Kembali ke Login
        </Link>

        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-6 flex flex-col items-center gap-3">
            <div className="size-14 rounded-2xl bg-[#B23A2E]/10 border border-[#B23A2E]/20 p-2 flex items-center justify-center shadow-sm">
              <KeyRound className="size-7 text-[#B23A2E]" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold tracking-tight text-[#1C1B1A]">
                Lupa Password Akun
              </CardTitle>
              <CardDescription className="text-xs text-[#6B6862] leading-relaxed">
                Verifikasi identitas terdaftar Anda untuk membuat password baru.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            {successMessage ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-col items-center text-center gap-2.5 text-emerald-800">
                  <CheckCircle2 className="size-8 text-emerald-600 shrink-0" />
                  <div className="text-xs leading-relaxed font-semibold">
                    {successMessage}
                  </div>
                </div>

                <Link
                  href="/login"
                  className="w-full h-10 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 rounded-lg text-xs font-bold shadow-sm flex items-center justify-center"
                >
                  Ke Halaman Login →
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} method="POST">
                <FieldGroup className="space-y-3.5">
                  <Field>
                    <FieldLabel htmlFor="email" className="text-xs font-semibold text-[#1C1B1A]">
                      Email SSO / Akun Terdaftar
                    </FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nama@shokunin.jper.my.id"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Field>
                      <FieldLabel htmlFor="tanggalLahir" className="text-xs font-semibold text-[#1C1B1A]">
                        Tanggal Lahir
                      </FieldLabel>
                      <Input
                        id="tanggalLahir"
                        type="date"
                        required
                        value={tanggalLahir}
                        onChange={(e) => setTanggalLahir(e.target.value)}
                        disabled={isLoading}
                        className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="nomorTelepon" className="text-xs font-semibold text-[#1C1B1A]">
                        Nomor Telepon
                      </FieldLabel>
                      <Input
                        id="nomorTelepon"
                        type="tel"
                        placeholder="081234567890"
                        required
                        value={nomorTelepon}
                        onChange={(e) => setNomorTelepon(e.target.value)}
                        disabled={isLoading}
                        className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                      />
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="nisn" className="text-xs font-semibold text-[#1C1B1A]">
                      NISN <span className="text-[10px] text-[#6B6862] font-normal">(Opsional bagi alumni)</span>
                    </FieldLabel>
                    <Input
                      id="nisn"
                      type="text"
                      placeholder="10 digit angka NISN"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
                      disabled={isLoading}
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                    />
                  </Field>

                  <div className="border-t border-[#E4E1DA]/60 pt-3 space-y-3">
                    <Field>
                      <FieldLabel htmlFor="newPassword" className="text-xs font-semibold text-[#1C1B1A]">
                        Password Baru
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Minimal 6 karakter"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isLoading}
                          className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A] pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6862] hover:text-[#1C1B1A] transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="confirmPassword" className="text-xs font-semibold text-[#1C1B1A]">
                        Konfirmasi Password Baru
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Ketik ulang password baru"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isLoading}
                          className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A] pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6862] hover:text-[#1C1B1A] transition-colors p-1"
                        >
                          {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </Field>
                  </div>

                  {errorMessage && (
                    <FieldError className="text-xs text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 p-2.5 rounded-lg flex items-start gap-2">
                      <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </FieldError>
                  )}

                  <Field className="pt-2">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className={cn(
                        "w-full h-10 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 rounded-lg text-xs font-bold transition-all shadow-sm",
                        isLoading && "opacity-70 cursor-not-allowed"
                      )}
                    >
                      {isLoading ? "Memverifikasi & Mereset..." : "Reset Kata Sandi Akun"}
                    </Button>
                  </Field>
                </FieldGroup>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
