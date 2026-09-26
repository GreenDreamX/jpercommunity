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
        <Card className="border-2 border-black bg-white shadow-[8px_8px_0px_#111] overflow-hidden rounded-none">
          {/* LOGO & BRANDING HEADER */}
          <CardHeader className="text-center pb-3 pt-6 flex flex-col items-center gap-3 border-b-2 border-black bg-[#FAF9F5]">
            <img
              src="/image/J-PER.png"
              alt="JPER Community Logo"
              className="h-16 w-auto object-contain transition-transform hover:scale-105"
            />
            <div className="space-y-1">
              <span className="inline-block bg-black text-[#FFC700] px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest -skew-x-6 border border-black shadow-[2px_2px_0px_#E60012]">
                ログイン PORTAL • SSO AUTH
              </span>
              <CardTitle className="font-heading text-2xl font-black uppercase tracking-tight text-black mt-1">
                JPER Community Login
              </CardTitle>
              <CardDescription className="text-xs font-medium text-zinc-700">
                Masuk ke portal pembelajaran &amp; manajemen ekskul
              </CardDescription>
            </div>

            {/* DESTINATION PORTAL TAB SWITCHER */}
            <div className="grid grid-cols-2 gap-2 w-full border-2 border-black bg-white p-1.5 shadow-[3px_3px_0px_#111] mt-2">
              <button
                type="button"
                onClick={() => {
                  setMode("lms")
                  setErrorMessage(null)
                }}
                className={`py-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${
                  mode === "lms"
                    ? "border-black bg-[#E60012] text-white shadow-[2px_2px_0px_#FFC700]"
                    : "border-transparent text-zinc-600 hover:text-black hover:bg-zinc-100"
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
                className={`py-2 px-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 ${
                  mode === "studio"
                    ? "border-black bg-black text-[#FFC700] shadow-[2px_2px_0px_#E60012]"
                    : "border-transparent text-zinc-600 hover:text-black hover:bg-zinc-100"
                }`}
              >
                <Shield className="size-3.5" />
                Studio (Admin)
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-6 pb-6 space-y-4">
            {registered && (
              <div className="border-2 border-black bg-[#FFC700] p-3.5 flex items-start gap-2.5 text-black shadow-[4px_4px_0px_#111]">
                <CheckCircle2 className="size-4 text-black shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed font-black uppercase tracking-tight">
                  Pendaftaran berhasil! Akun Anda langsung aktif. Silakan masuk di bawah.
                </div>
              </div>
            )}

            {successBanner && (
              <div className="border-2 border-black bg-[#FFC700] p-3.5 flex items-start gap-2.5 text-black shadow-[4px_4px_0px_#111]">
                <CheckCircle2 className="size-4 text-black shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed font-black uppercase tracking-tight">
                  {successBanner}
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} method="POST">
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="email" className="text-xs font-black uppercase tracking-wider text-black">
                    Email SSO / Akun Member
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
                    className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0"
                  />
                </Field>
                
                <Field>
                  <div className="flex items-center justify-between">
                    <FieldLabel htmlFor="password" className="text-xs font-black uppercase tracking-wider text-black">
                      Password
                    </FieldLabel>
                    <button
                      type="button"
                      onClick={handleOpenResetModal}
                      className="text-xs text-[#E60012] font-black uppercase hover:underline bg-transparent border-none p-0 cursor-pointer"
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
                      className="border-2 border-black bg-zinc-50 text-xs font-bold h-10 text-black shadow-[2px_2px_0px_#111] focus:bg-white focus:border-[#E60012] focus:ring-0 pr-10"
                      placeholder="Masukkan password akun Anda"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:text-[#E60012] transition-colors p-1"
                      title={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </Field>

                {errorMessage && (
                  <FieldError className="text-xs text-white bg-[#E60012] border-2 border-black p-3 shadow-[3px_3px_0px_#111] font-black uppercase tracking-tight">
                    {errorMessage}
                  </FieldError>
                )}

                <Field className="pt-2 space-y-4">
                  <Button
                    type="submit"
                    disabled={isLoading || cooldown > 0}
                    className={cn(
                      "w-full h-11 text-xs font-black uppercase tracking-wider text-white border-2 border-black transition-all shadow-[4px_4px_0px_#111] active:translate-x-1 active:translate-y-1 active:shadow-none",
                      mode === "studio"
                        ? "bg-black text-[#FFC700] hover:bg-[#E60012] hover:text-white hover:shadow-[5px_5px_0px_#FFC700]"
                        : "bg-[#E60012] hover:bg-[#FFC700] hover:text-black hover:shadow-[5px_5px_0px_#111]"
                    )}
                  >
                    {isLoading
                      ? "Memproses Login..."
                      : cooldown > 0
                      ? `Kunci Keamanan (${cooldown}s)`
                      : mode === "studio"
                      ? "Masuk ke Studio Admin →"
                      : "Masuk ke Dashboard LMS →"}
                  </Button>

                  {mode === "lms" && (
                    <FieldDescription className="text-center text-xs font-bold uppercase tracking-wider text-zinc-700">
                      Belum punya akun member?{" "}
                      <Link href="/register" className="font-black text-[#E60012] hover:underline">
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
      
      <FieldDescription className="px-6 text-center text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-600">
        JPER Community &copy; 2026 — Ekstrakurikuler Bahasa Jepang SMKN 1 Majalaya.
      </FieldDescription>

      {/* MODAL RESET PASSWORD AKUN PASIF / SSO */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent className="max-w-md bg-white border-2 border-black rounded-none p-6 shadow-[8px_8px_0px_#111] no-scrollbar">
          <DialogHeader className="flex flex-col gap-2 pb-2 border-b-2 border-black">
            <div className="flex items-center gap-3">
              <div className="size-10 bg-[#E60012] text-white border-2 border-black -skew-x-6 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#111]">
                <KeyRound className="size-5 skew-x-6" />
              </div>
              <div>
                <DialogTitle className="font-heading text-lg font-black uppercase text-black">
                  Reset Password Akun
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-wider text-zinc-600">
                  Verifikasi identitas terdaftar Anda
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {resetSuccessMessage ? (
            <div className="space-y-4 py-2">
              <div className="border-2 border-black bg-[#FFC700] p-4 flex flex-col items-center text-center gap-2.5 text-black shadow-[4px_4px_0px_#111]">
                <CheckCircle2 className="size-8 text-black shrink-0" />
                <div className="text-xs leading-relaxed font-black uppercase tracking-tight">
                  {resetSuccessMessage}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => setIsResetOpen(false)}
                className="w-full h-10 border-2 border-black bg-[#E60012] text-white hover:bg-black hover:text-[#FFC700] text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#111]"
              >
                Ke Halaman Login &amp; Masuk →
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5 pt-2">
              <FieldGroup className="space-y-3">
                <Field>
                  <FieldLabel htmlFor="resetEmail" className="text-xs font-black uppercase tracking-wider text-black">
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
                    className="border-2 border-black bg-zinc-50 text-xs font-bold h-9 text-black shadow-[2px_2px_0px_#111]"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-2.5">
                  <Field>
                    <FieldLabel htmlFor="resetTanggalLahir" className="text-xs font-black uppercase tracking-wider text-black">
                      Tanggal Lahir
                    </FieldLabel>
                    <Input
                      id="resetTanggalLahir"
                      type="date"
                      required
                      value={resetTanggalLahir}
                      onChange={(e) => setResetTanggalLahir(e.target.value)}
                      disabled={isResetLoading}
                      className="border-2 border-black bg-zinc-50 text-xs font-bold h-9 text-black shadow-[2px_2px_0px_#111]"
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="resetNomorTelepon" className="text-xs font-black uppercase tracking-wider text-black">
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
                      className="border-2 border-black bg-zinc-50 text-xs font-bold h-9 text-black shadow-[2px_2px_0px_#111]"
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="resetNisn" className="text-xs font-black uppercase tracking-wider text-black">
                    NISN <span className="text-[10px] text-zinc-500 font-normal">(Opsional bagi alumni)</span>
                  </FieldLabel>
                  <Input
                    id="resetNisn"
                    type="text"
                    placeholder="10 digit NISN terdaftar"
                    value={resetNisn}
                    onChange={(e) => setResetNisn(e.target.value.replace(/\D/g, ""))}
                    disabled={isResetLoading}
                    className="border-2 border-black bg-zinc-50 text-xs font-bold h-9 text-black shadow-[2px_2px_0px_#111]"
                  />
                </Field>

                <div className="border-t-2 border-black pt-3 space-y-3">
                  <Field>
                    <FieldLabel htmlFor="resetNewPassword" className="text-xs font-black uppercase tracking-wider text-black">
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
                        className="border-2 border-black bg-zinc-50 text-xs font-bold h-9 text-black shadow-[2px_2px_0px_#111] pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-[#E60012] transition-colors p-1"
                      >
                        {resetShowPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="resetConfirmPassword" className="text-xs font-black uppercase tracking-wider text-black">
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
                        className="border-2 border-black bg-zinc-50 text-xs font-bold h-9 text-black shadow-[2px_2px_0px_#111] pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setResetShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-black hover:text-[#E60012] transition-colors p-1"
                      >
                        {resetShowPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </Field>
                </div>

                {resetErrorMessage && (
                  <FieldError className="text-xs text-white bg-[#E60012] border-2 border-black p-2.5 shadow-[3px_3px_0px_#111] font-black uppercase tracking-tight flex items-start gap-2">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <span>{resetErrorMessage}</span>
                  </FieldError>
                )}

                <Field className="pt-2">
                  <Button
                    type="submit"
                    disabled={isResetLoading}
                    className={cn(
                      "w-full h-10 border-2 border-black bg-[#E60012] text-white hover:bg-black hover:text-[#FFC700] text-xs font-black uppercase tracking-wider shadow-[4px_4px_0px_#111] transition-all flex items-center justify-center gap-2",
                      isResetLoading && "opacity-70 cursor-not-allowed"
                    )}
                  >
                    {isResetLoading ? (
                      <>
                        <RefreshCw className="size-3.5 animate-spin" />
                        <span>Memverifikasi &amp; Mereset...</span>
                      </>
                    ) : (
                      "Reset Password Sekarang →"
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
