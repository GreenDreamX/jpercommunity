"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { BadgeCheck, LayoutGrid } from "lucide-react"

import { useFirebaseUser } from "@/hooks/use-firebase-user"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Import Components
import { StudioLayout } from "@/components/studio/studio-layout"
import { MemberManagement } from "@/components/studio/member-management"
import { CourseManagement } from "@/components/studio/course-management"
import { AttendanceManagement } from "@/components/studio/attendance-management"
import { GradesManagement } from "@/components/studio/grades-management"
import { NotulensiTab } from "@/components/studio/notulensi-tab"
import { FileBankTab } from "@/components/studio/file-bank-tab"
import { AnalyticsDashboard } from "@/components/studio/analytics-dashboard"
import { LoggingTab } from "@/components/studio/logging-tab"
import { DictionaryManagement } from "@/components/studio/dictionary-management"
import { GrammarManagement } from "@/components/studio/grammar-management"
import { FinanceManagement } from "@/components/studio/finance-management"
import { QuizManagement } from "@/components/studio/quiz-management"
import { SubmissionsTab } from "@/components/studio/submissions-tab"
import { RaporTab } from "@/components/studio/rapor-tab"
import { SettingsTab } from "@/components/studio/settings-tab"

const STUDIO_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]

type StudioOverview = {
  profile: {
    id: string
    nama_lengkap: string
    role: string
    avatar_url?: string | null
  }
  stats: {
    memberCount: number
    courseCount: number
    sessionCount: number
  }
  agenda: string[]
  modules: string[]
}

export default function StudioPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useFirebaseUser()
  const [token, setToken] = useState<string | null>(null)
  
  const [activeTab, setActiveTab] = useState("dashboard")
  const [overview, setOverview] = useState<StudioOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const handleProfileUpdated = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        const updated = customEvent.detail
        setOverview((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            profile: {
              ...prev.profile,
              ...updated,
            },
          }
        })
      }
    }

    window.addEventListener("jper-profile-updated", handleProfileUpdated)
    return () => {
      window.removeEventListener("jper-profile-updated", handleProfileUpdated)
    }
  }, [])

  useEffect(() => {
    if (authLoading) {
      return
    }

    if (!user) {
      router.replace("/studio/login")
      return
    }

    async function loadOverview() {
      setLoading(true)
      setErrorMessage(null)

      if (!user) return
      try {
        const t = await user.getIdToken()
        setToken(t)
        const response = await fetch("/api/studio/overview", {
          headers: { Authorization: `Bearer ${t}` },
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { message?: string }
            | null
          setErrorMessage(payload?.message ?? "Gagal memuat data Studio.")
          setLoading(false)
          if (response.status === 403) {
            router.replace("/lms")
          } else if (response.status === 401) {
            router.replace("/studio/login")
          }
          return
        }

        const payload = (await response.json()) as StudioOverview & { ok: boolean }
        if (!STUDIO_ROLES.includes(payload.profile.role)) {
          router.replace("/lms")
          return
        }
        setOverview(payload)
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.")
      } finally {
        setLoading(false)
      }
    }

    void loadOverview()
  }, [authLoading, router, user])

  if (authLoading || loading) {
    return (
      <main className="min-h-svh bg-[#FAF9F6] px-6 py-10 text-[#1C1B1A] md:px-8 lg:px-10">
        <div className="mx-auto w-full max-w-6xl text-sm font-mono text-[#6B6862]">
          Memuat dashboard Studio...
        </div>
      </main>
    )
  }

  // Block rendering if not authenticated or not a studio manager role
  if (!overview || !STUDIO_ROLES.includes(overview.profile.role)) {
    return null
  }

  // Render active tab module
  const renderContent = () => {
    if (!token) return null

    switch (activeTab) {
      case "finance":
        return <FinanceManagement token={token} />
      case "courses":
        return <CourseManagement token={token} />
      case "quizzes":
        return <QuizManagement token={token} />
      case "members":
        return <MemberManagement token={token} />
      case "dictionary":
        return <DictionaryManagement token={token} />
      case "grammar":
        return <GrammarManagement token={token} />
      case "notulensi":
        return <NotulensiTab token={token} />
      case "file_bank":
        return <FileBankTab token={token} />
      case "attendance":
        return <AttendanceManagement token={token} />
      case "grades":
        return <GradesManagement token={token} />
      case "submissions":
        return <SubmissionsTab token={token} />
      case "rapor":
        return <RaporTab token={token} />
      case "settings":
        return <SettingsTab token={token} />
      case "logs":
        return <LoggingTab token={token} />
      case "dashboard":
      default:
        return <AnalyticsDashboard token={token} />
    }
  }

  return (
    <StudioLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      adminName={overview?.profile.nama_lengkap}
      avatarUrl={overview?.profile.avatar_url || undefined}
      userRole={overview?.profile.role}
    >
      {renderContent()}
    </StudioLayout>
  )
}