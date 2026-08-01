"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FirebaseError } from "firebase/app"
import { signInWithEmailAndPassword } from "firebase/auth"
import { CheckCircle2, Shield, User } from "lucide-react"

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
  }, [])

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      if (mode === "studio") {
        const token = await userCredential.user.getIdToken()
        const response = await fetch("/api/studio/overview", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          await auth.signOut()
          setErrorMessage("Akses ditolak. Akun Anda bukan admin/pengurus Studio.")
          setIsLoading(false)
          return
        }
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("jper_mock_session")
      }
      setSessionCookie()
      router.push(mode === "studio" ? "/studio" : "/lms")
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
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
                  <Link
                    href="#"
                    className="text-xs text-[#B23A2E] hover:underline"
                  >
                    Lupa password?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isLoading}
                  className="border-[#E4E1DA] bg-white text-xs h-10 rounded-lg text-[#1C1B1A]"
                  placeholder="Masukkan password akun Anda"
                />
              </Field>

              {errorMessage && (
                <FieldError className="text-xs text-[#B23A2E] bg-[#B23A2E]/5 border border-[#B23A2E]/20 p-2.5 rounded-lg">
                  {errorMessage}
                </FieldError>
              )}

              <Field className="pt-2 space-y-3">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full h-10 text-xs font-bold rounded-lg text-white border-none shadow-sm transition-all",
                    mode === "studio"
                      ? "bg-[#2B3A55] hover:bg-[#2B3A55]/90"
                      : "bg-[#B23A2E] hover:bg-[#B23A2E]/90"
                  )}
                >
                  {isLoading ? "Memproses Login..." : mode === "studio" ? "Masuk ke Studio Admin" : "Masuk ke Dashboard LMS"}
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
      
      <FieldDescription className="px-6 text-center text-[11px] text-[#6B6862]">
        JPER Community &copy; 2026 — Hak Cipta Dilindungi Undang-Undang.
      </FieldDescription>
    </div>
  )
}
