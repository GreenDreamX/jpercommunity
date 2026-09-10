"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FirebaseError } from "firebase/app"
import { signInWithEmailAndPassword } from "firebase/auth"
import { CheckCircle2, Shield, User, Eye, EyeOff, KeyRound, ShieldAlert, RefreshCw } from "lucide-react"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { firebaseAuth } from "@/lib/firebase/client"
import { Button } from "@/components/ui/button"
import { setSessionCookie } from "@/lib/session-cookie"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const auth = firebaseAuth

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Terjadi gangguan saat login. Coba lagi beberapa saat."
  }

  switch (error.code) {
    case "auth/invalid-email":
      return "Format email tidak valid."
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Email atau password tidak cocok."
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan login. Tunggu beberapa menit lalu coba lagi."
    default:
      return "Login gagal. Periksa kembali data akun Anda."
  }
}

interface LoginFormProps extends React.ComponentProps<"div"> {
  initialMode?: "lms" | "studio"
}

export function LoginForm({
  className,
  initialMode = "lms",
  ...props
}: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered") === "true"

  const [mode, setMode] = useState<"lms" | "studio">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successBanner, setSuccessBanner] = useState<string | null>(null)

  const [failedCount, setFailedCount] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  // Reset Password Modal State
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState("")
  const [resetTanggalLahir, setResetTanggalLahir] = useState("")
  const [resetNomorTelepon, setResetNomorTelepon] = useState("")
  const [resetNisn, setResetNisn] = useState("")
  const [resetNewPassword, setResetNewPassword] = useState("")
  const [resetConfirmPassword, setResetConfirmPassword] = useState("")
  const [resetShowPassword, setResetShowPassword] = useState(false)

  const [isResetLoading, setIsResetLoading] = useState(false)
  const [resetErrorMessage, setResetErrorMessage] = useState<string | null>(null)
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  function handleOpenResetModal() {
    setResetEmail(email.trim())
    setResetErrorMessage(null)
    setResetSuccessMessage(null)
    setResetTanggalLahir("")
    setResetNomorTelepon("")
    setResetNisn("")
    setResetNewPassword("")
    setResetConfirmPassword("")
    setIsResetOpen(true)
  }

  async function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsResetLoading(true)
    setResetErrorMessage(null)
    setResetSuccessMessage(null)

    if (resetNewPassword !== resetConfirmPassword) {
      setResetErrorMessage("Konfirmasi password baru tidak cocok.")
      setIsResetLoading(false)
      return
    }

    if (resetNewPassword.length < 6) {
      setResetErrorMessage("Password baru minimal 6 karakter.")
      setIsResetLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          tanggalLahir: resetTanggalLahir.trim(),
          nomorTelepon: resetNomorTelepon.trim(),
          nisn: resetNisn.trim(),
          newPassword: resetNewPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || "Gagal mereset kata sandi.")
      }

      setResetSuccessMessage(data.message || "Password berhasil diperbarui!")
      setEmail(resetEmail.trim())
      setPassword("")
      setSuccessBanner("Password akun berhasil diubah! Silakan login menggunakan password baru Anda.")
    } catch (err) {
      setResetErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan.")
    } finally {
      setIsResetLoading(false)
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (cooldown > 0) {
      setErrorMessage(`Terlalu banyak percobaan gagal. Silakan tunggu ${cooldown} detik.`)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)
    setSuccessBanner(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()

      setFailedCount(0)
      setCooldown(0)

      if (mode === "studio") {
        const response = await fetch("/api/studio/overview", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          // Record unauthorized access log
          fetch("/api/auth/record-log", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "LOGIN_UNAUTHORIZED",
              details: `Pengguna (${userCredential.user.email}) mencoba masuk ke Studio Admin tetapi ditolak (Bukan pengurus/admin).`,
              category: "MEMBER",
            }),
          }).catch(() => {})

          await auth.signOut()
          setErrorMessage("Akses ditolak. Akun Anda bukan admin/pengurus Studio.")
          setIsLoading(false)
          return
        }
      }

      // Record activity log
      fetch("/api/auth/record-log", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "LOGIN",
          details: `Pengguna (${userCredential.user.email}) berhasil login ke ${mode === "studio" ? "Studio Admin" : "LMS Member"}.`,
          category: "MEMBER",
        }),
      }).catch(() => {})

      if (typeof window !== "undefined") {
        localStorage.removeItem("jper_mock_session")
      }
      setSessionCookie()
      if (typeof window !== "undefined" && !window.location.hostname.includes("localhost")) {
        window.location.href = mode === "studio" ? "https://studio.jper.my.id" : "https://lms.jper.my.id"
      } else {
        router.push(mode === "studio" ? "/studio" : "/lms")
      }
    } catch (error) {
      const errorMsg = getAuthErrorMessage(error)
      const nextCount = failedCount + 1
      setFailedCount(nextCount)

      if (nextCount >= 5) {
        setCooldown(60)
        setErrorMessage("Terlalu banyak percobaan login gagal (5x). Tombol login dikunci sementara selama 60 detik untuk keamanan database.")
      } else {
        setErrorMessage(errorMsg)
      }

      // Record failed login activity
      fetch("/api/auth/record-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "LOGIN_FAILED",
          actorName: email || "Anonymous",
          details: `Percobaan login gagal ke portal ${mode === "studio" ? "Studio Admin" : "LMS Member"}. Alasan: ${errorMsg}`,
          category: "MEMBER",
        }),
      }).catch(() => {})
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-md rounded-2xl overflow-hidden">
        {/* LOGO & BRANDING HEADER */}
        <CardHeader className="text-center pb-2 pt-6 flex flex-col items-center gap-3">
          <div className="size-16 rounded-2xl bg-white border border-[#E4E1DA] p-2 flex items-center justify-center shadow-sm">
            <img
              src="/image/J-PER.png"
              alt="JPER Community Logo"
              className="size-full object-contain"
            />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-[#1C1B1A]">
              JPER Community Login
            </CardTitle>
            <CardDescription className="text-xs text-[#6B6862]">
              Masuk ke portal pembelajaran dan sistem manajemen ekskul
            </CardDescription>
          </div>

          {/* DESTINATION PORTAL TAB SWITCHER */}
          <div className="grid grid-cols-2 gap-1 w-full bg-[#E4E1DA]/40 p-1 rounded-xl mt-2">
            <button
              type="button"
              onClick={() => {
                setMode("lms")
                setErrorMessage(null)
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === "lms"
                  ? "bg-[#FAF9F6] text-[#B23A2E] shadow-sm"
                  : "text-[#6B6862] hover:text-[#1C1B1A]"
              }`}
            >
              <User className="size-3.5" />
              LMS (Member)
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("studio")
                setErrorMessage(null)
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === "studio"
                  ? "bg-[#FAF9F6] text-[#2B3A55] shadow-sm"
                  : "text-[#6B6862] hover:text-[#1C1B1A]"
              }`}
            >
              <Shield className="size-3.5" />
              Studio (Admin)
            </button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {registered && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-emerald-800 mb-4">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-medium">
                Pendaftaran berhasil! Akun Anda langsung aktif. Silakan masuk di bawah.
              </div>
            </div>
          )}

          {successBanner && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-emerald-800 mb-4">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-medium">
                {successBanner}
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} method="POST">
            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel htmlFor="email" className="text-xs font-semibold text-[#1C1B1A]">
                  Email SSO / Akun
                </FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={mode === "studio" ? "admin@jper.my.id" : "nama@shokunin.jper.my.id"}
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isLoading}
                  className="border-[#E4E1DA] bg-white text-xs h-10 rounded-lg text-[#1C1B1A]"
                />
              </Field>
              
              <Field>
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="password" className="text-xs font-semibold text-[#1C1B1A]">
                    Password
                  </FieldLabel>
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="text-xs text-[#B23A2E] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer"
                  >
                    Lupa password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isLoading || cooldown > 0}
                    className="border-[#E4E1DA] bg-white text-xs h-10 rounded-lg text-[#1C1B1A] pr-10"
                    placeholder="Masukkan password akun Anda"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6862] hover:text-[#1C1B1A] transition-colors p-1"
                    title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </Field>

              {errorMessage && (
                <FieldError className="text-xs text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 p-2.5 rounded-lg">
                  {errorMessage}
                </FieldError>
              )}

              <Field className="pt-2 space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading || cooldown > 0}
                  className={cn(
                    "w-full h-10 text-xs font-bold rounded-lg text-white border-none shadow-sm transition-all",
                    mode === "studio"
                      ? "bg-[#2B3A55] hover:bg-[#2B3A55]/90"
                      : "bg-[#B23A2E] hover:bg-[#B23A2E]/90"
                  )}
                >
                  {isLoading
                    ? "Memproses Login..."
                    : cooldown > 0
                    ? `Kunci Keamanan (${cooldown}s)`
                    : mode === "studio"
                    ? "Masuk ke Studio Admin"
                    : "Masuk ke Dashboard LMS"}
                </Button>

                {mode === "lms" && (
                  <FieldDescription className="text-center text-xs text-[#6B6862]">
                    Belum punya akun member?{" "}
                    <Link href="/register" className="font-bold text-[#B23A2E] hover:underline">
                      Daftar Anggota Baru
                    </Link>
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      </motion.div>
      
      <FieldDescription className="px-6 text-center text-[11px] text-[#6B6862]">
        JPER Community &copy; 2026 — Hak Cipta Dilindungi Undang-Undang.
      </FieldDescription>

      {/* MODAL RESET PASSWORD AKUN PASIF / SSO */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md bg-[#FAF9F6] border-[#E4E1DA] rounded-2xl p-6 shadow-xl no-scrollbar">
          <DialogHeader className="flex flex-col gap-2 pb-2">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-[#B23A2E]/10 border border-[#B23A2E]/20 flex items-center justify-center shrink-0">
                <KeyRound className="size-5 text-[#B23A2E]" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[#1C1B1A]">
                  Reset Password Akun
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6B6862]">
                  Verifikasi identitas terdaftar Anda
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {resetSuccessMessage ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 flex flex-col items-center text-center gap-2.5 text-emerald-800">
                <CheckCircle2 className="size-8 text-emerald-600 shrink-0" />
                <div className="text-xs leading-relaxed font-semibold">
                  {resetSuccessMessage}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="w-full h-10 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 rounded-lg text-xs font-bold shadow-sm"
              >
                Ke Halaman Login &amp; Masuk →
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5 pt-1">
              <FieldGroup className="space-y-3">
                <Field>
                  <FieldLabel htmlFor="resetEmail" className="text-xs font-semibold text-[#1C1B1A]">
                    Email SSO / Akun Terdaftar
                  </FieldLabel>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="nama@shokunin.jper.my.id"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={isResetLoading}
                    className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2.5">
                  <Field>
                    <FieldLabel htmlFor="resetTanggalLahir" className="text-xs font-semibold text-[#1C1B1A]">
                      Tanggal Lahir
                    </FieldLabel>
                    <Input
                      id="resetTanggalLahir"
                      type="date"
                      required
                      value={resetTanggalLahir}
                      onChange={(e) => setResetTanggalLahir(e.target.value)}
                      disabled={isResetLoading}
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="resetNomorTelepon" className="text-xs font-semibold text-[#1C1B1A]">
                      Nomor Telepon
                    </FieldLabel>
                    <Input
                      id="resetNomorTelepon"
                      type="tel"
                      placeholder="081234567890"
                      required
                      value={resetNomorTelepon}
                      onChange={(e) => setResetNomorTelepon(e.target.value)}
                      disabled={isResetLoading}
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="resetNisn" className="text-xs font-semibold text-[#1C1B1A]">
                    NISN <span className="text-[10px] text-[#6B6862] font-normal">(Opsional bagi alumni)</span>
                  </FieldLabel>
                  <Input
                    id="resetNisn"
                    type="text"
                    placeholder="10 digit NISN terdaftar"
                    value={resetNisn}
                    onChange={(e) => setResetNisn(e.target.value.replace(/\D/g, ""))}
                    disabled={isResetLoading}
                    className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A]"
                  />
                </Field>

                <div className="border-t border-[#E4E1DA]/60 pt-3 space-y-3">
                  <Field>
                    <FieldLabel htmlFor="resetNewPassword" className="text-xs font-semibold text-[#1C1B1A]">
                      Password Baru
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        id="resetNewPassword"
                        type={resetShowPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        disabled={isResetLoading}
                        className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A] pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6862] hover:text-[#1C1B1A] transition-colors p-1"
                      >
                        {resetShowPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="resetConfirmPassword" className="text-xs font-semibold text-[#1C1B1A]">
                      Konfirmasi Password Baru
                    </FieldLabel>
                    <div className="relative">
                      <Input
                        id="resetConfirmPassword"
                        type={resetShowPassword ? "text" : "password"}
                        placeholder="Ketik ulang password baru"
                        required
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        disabled={isResetLoading}
                        className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg text-[#1C1B1A] pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6862] hover:text-[#1C1B1A] transition-colors p-1"
                      >
                        {resetShowPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </Field>
                </div>

                {resetErrorMessage && (
                  <FieldError className="text-xs text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 p-2.5 rounded-lg flex items-start gap-2">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>{resetErrorMessage}</span>
                  </FieldError>
                )}

                <Field className="pt-2">
                  <Button
                    type="submit"
                    disabled={isResetLoading}
                    className={cn(
                      "w-full h-10 bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2",
                      isResetLoading && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isResetLoading ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>Memverifikasi &amp; Mereset...</span>
                      </>
                    ) : (
                      "Reset Password Sekarang"
                    )}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
