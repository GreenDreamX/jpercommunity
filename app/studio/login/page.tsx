"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GalleryVerticalEndIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { setSessionCookie } from "@/lib/session-cookie"
import { firebaseAuth } from "@/lib/firebase/client"
import { signInWithEmailAndPassword } from "firebase/auth"

export default function StudioLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("jper_mock_session")
    }
  }, [])

  async function handleEmailLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password)
      const token = await userCredential.user.getIdToken()

      // Verify if the user is actually an admin
      const response = await fetch("/api/studio/overview", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        await firebaseAuth.signOut()
        setError("Akses ditolak. Akun Anda bukan admin.")
        return
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("jper_mock_session")
      }
      setSessionCookie()
      router.push("/studio")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal. Periksa kembali akun admin Anda.")
    } finally {
      setLoading(false)
    }
  }

  async function handleBypassAdminLogin() {
    setLoading(true)
    setError(null)

    if (typeof window !== "undefined") {
      localStorage.setItem("jper_mock_session", "admin")
    }

    try {
      // Sync mock admin profile with database
      await fetch("/api/auth/sync-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock-admin-token",
        },
        body: JSON.stringify({
          registerData: {
            namaLengkap: "Admin Bypass",
            email: "admin@jper.my.id",
            nomorTelepon: "081234567891",
            angkatan: "2023", // classified as alumni, bypass override sets as admin
            alasanIkut: "Bypass login untuk melakukan peninjauan panel admin Studio.",
            password: "bypass-password-123",
          },
        }),
      })
    } catch (err) {
      console.error("Gagal sinkronisasi mock admin profile", err)
    } finally {
      setLoading(false)
    }

    setSessionCookie()
    window.location.href = "/studio"
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-[#FAF9F6] p-6 md:p-10 text-[#1C1B1A]">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-6 items-center justify-center rounded-md bg-[#2B3A55] text-[#FAF9F6]">
            <GalleryVerticalEndIcon className="size-4" />
          </div>
          <span className="font-mono text-sm tracking-wide">JPER Studio</span>
        </div>

        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold tracking-tight text-[#1C1B1A]">Studio Admin</CardTitle>
            <CardDescription className="text-xs text-[#6B6862]">
              Masuk untuk mengelola kelas dan absensi siswa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailLogin} method="POST">
              <FieldGroup className="space-y-4">
                <Field>
                  <FieldLabel htmlFor="email" className="text-xs font-semibold text-[#1C1B1A]">Email Admin</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@jper.my.id"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                  />
                </Field>
                
                <Field>
                  <FieldLabel htmlFor="password" className="text-xs font-semibold text-[#1C1B1A]">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                  />
                </Field>

                {error && <FieldError className="text-xs text-[#B23A2E]">{error}</FieldError>}

                <Field className="pt-2 space-y-2">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 w-full h-9 text-xs font-semibold rounded-lg shadow-none border-none"
                  >
                    {loading ? "Memproses..." : "Masuk ke Studio"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBypassAdminLogin}
                    disabled={loading}
                    className="bg-[#FAF9F6] text-[#2B3A55] border-[#E4E1DA] hover:bg-[#E4E1DA]/20 w-full h-9 text-xs font-semibold rounded-lg"
                  >
                    Bypass Login (Admin)
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
