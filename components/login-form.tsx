"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FirebaseError } from "firebase/app"
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"

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
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const auth = firebaseAuth
const googleProvider = new GoogleAuthProvider()

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return "Terjadi gangguan saat login. Coba lagi beberapa saat."
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
    case "auth/popup-closed-by-user":
      return "Popup login Google ditutup sebelum proses selesai."
    case "auth/popup-blocked":
      return "Popup login diblokir browser. Izinkan popup lalu coba lagi."
    default:
      return "Login gagal. Periksa kembali data akun Anda."
  }
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
  }, [])

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsEmailLoading(true)
    setErrorMessage(null)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      if (typeof window !== "undefined") {
        localStorage.removeItem("jper_mock_session")
      }
      setSessionCookie()
      router.push("/lms")
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsEmailLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setIsGoogleLoading(true)
    setErrorMessage(null)

    try {
      await signInWithPopup(auth, googleProvider)
      if (typeof window !== "undefined") {
        localStorage.removeItem("jper_mock_session")
      }
      setSessionCookie()
      router.push("/lms")
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  async function handleBypassStudentLogin() {
    setErrorMessage(null)
    setIsEmailLoading(true)
    
    if (typeof window !== "undefined") {
      localStorage.setItem("jper_mock_session", "student")
    }

    try {
      // Sync mock student profile with database
      await fetch("/api/auth/sync-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-student-token",
        },
        body: JSON.stringify({
          registerData: {
            namaLengkap: "Siswa Bypass",
            email: "student@jper.my.id",
            nomorTelepon: "081234567890",
            angkatan: "2025",
            kelas: "XI-A",
            nisn: "0000000000",
            nis: "00000",
            alasanIkut: "Bypass login untuk melakukan peninjauan isi sistem LMS.",
            password: "bypass-password-123",
          },
        }),
      })
    } catch (err) {
      console.error("Gagal sinkronisasi mock student profile", err)
    } finally {
      setIsEmailLoading(false)
    }

    setSessionCookie()
    window.location.href = "/lms"
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Selamat datang kembali</CardTitle>
          <CardDescription>
            Masuk dengan email atau akun Google Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailLogin} method="POST">
            <FieldGroup>
              <Field>
                <Button
                  variant="outline"
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isEmailLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  {isGoogleLoading ? "Memproses..." : "Login dengan Google"}
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                atau lanjut dengan email
              </FieldSeparator>
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isEmailLoading || isGoogleLoading}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Link
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline"
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
                  disabled={isEmailLoading || isGoogleLoading}
                />
              </Field>
              {errorMessage && <FieldError>{errorMessage}</FieldError>}
              <Field>
                <Button type="submit" disabled={isEmailLoading || isGoogleLoading}>
                  {isEmailLoading ? "Memproses..." : "Login"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBypassStudentLogin}
                  disabled={isEmailLoading || isGoogleLoading}
                  className="bg-[#FAF9F6] text-[#2B3A55] border-[#E4E1DA] hover:bg-[#E4E1DA]/20 w-full"
                >
                  Bypass Login (Siswa)
                </Button>
                <FieldDescription className="text-center">
                  Belum punya akun? <Link href="/register">Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        Dengan login, Anda menyetujui <Link href="#">Ketentuan Layanan</Link> dan{" "}
        <Link href="#">Kebijakan Privasi</Link>.
      </FieldDescription>
    </div>
  )
}
