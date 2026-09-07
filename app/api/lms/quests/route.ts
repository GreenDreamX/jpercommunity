import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export type DailyQuest = {
  id: string
  title: string
  description: string
  rewardXp: number
  target: number
  progress: number
  isCompleted: boolean
  isClaimed: boolean
  category: "game" | "flashcard" | "listening" | "dictionary" | "grammar" | "login"
  dateStr?: string
}

const DEFAULT_QUEST_POOL: Array<Omit<DailyQuest, "progress" | "isCompleted" | "isClaimed">> = [
  { id: "quest_login", title: "Presensi Harian JPER", description: "Login ke portal LMS JPER hari ini", rewardXp: 30, target: 1, category: "login" },
  { id: "quest_game", title: "Pahlawan Arcade", description: "Mainkan 1 game interaktif di Arcade Push Rank", rewardXp: 40, target: 1, category: "game" },
  { id: "quest_flashcards", title: "Pelajar Kana Saku", description: "Buka & pelajari 5 kartu di Flashcards Kana", rewardXp: 35, target: 5, category: "flashcard" },
  { id: "quest_listening", title: "Kiprah Pendengaran", description: "Selesaikan 1 sesi Listening Rush (聴解)", rewardXp: 45, target: 1, category: "listening" },
  { id: "quest_dictionary", title: "Pencari Kosakata", description: "Cari kata atau dengar audio TTS di Kamus JPER", rewardXp: 25, target: 1, category: "dictionary" },
  { id: "quest_grammar", title: "Pembaca Bunpou", description: "Pelajari 1 pola kalimat di Tata Bahasa", rewardXp: 30, target: 1, category: "grammar" },
]

function generateTodayQuests(todayStr: string, hasLoggedInToday: boolean, hasClaimedLoginToday: boolean): DailyQuest[] {
  const loginQuest = DEFAULT_QUEST_POOL.find((q) => q.id === "quest_login")!
  const otherPool = DEFAULT_QUEST_POOL.filter((q) => q.id !== "quest_login")
  
  // Pick 2 random unique quests
  const shuffled = [...otherPool].sort(() => 0.5 - Math.random()).slice(0, 2)

  return [
    {
      ...loginQuest,
      progress: hasLoggedInToday ? 1 : 0,
      isCompleted: hasLoggedInToday,
      isClaimed: hasClaimedLoginToday,
      dateStr: todayStr,
    },
    ...shuffled.map((q) => ({
      ...q,
      progress: 0,
      isCompleted: false,
      isClaimed: false,
      dateStr: todayStr,
    })),
  ]
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return Response.json({ message: verified.message }, { status: verified.status })

  try {
    const profileRes = await supabaseRestRequest(
      `profiles?select=id,xp,streak_count,last_login_date,daily_quests_data,daily_login_claimed_date,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
      env,
    )

    if (!profileRes.ok) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

    const profiles = (await profileRes.json()) as Array<{
      id: string
      xp: number
      streak_count: number
      last_login_date: string | null
      daily_quests_data: DailyQuest[] | null
      daily_login_claimed_date: string | null
      nama_lengkap: string
      role: string
    }>

    const profile = profiles[0]
    if (!profile) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

    const todayStr = new Date().toISOString().split("T")[0]
    const lastLoginStr = profile.last_login_date ? String(profile.last_login_date).split("T")[0] : null
    const claimedLoginStr = profile.daily_login_claimed_date ? String(profile.daily_login_claimed_date).split("T")[0] : null

    const hasLoggedInToday = lastLoginStr === todayStr
    const hasClaimedLoginToday = claimedLoginStr === todayStr

    let quests = profile.daily_quests_data || []
    const firstQuestDate = quests[0]?.dateStr

    // If no quests or quests are from a previous date, re-generate fresh quests for today
    if (quests.length === 0 || firstQuestDate !== todayStr) {
      quests = generateTodayQuests(todayStr, hasLoggedInToday, hasClaimedLoginToday)
      
      // Update Supabase
      await supabaseRestRequest(
        `profiles?id=eq.${encodeURIComponent(profile.id)}`,
        env,
        {
          method: "PATCH",
          body: { daily_quests_data: quests },
        },
      )
    }

    return Response.json({
      ok: true,
      quests,
      streakCount: profile.streak_count || 1,
      hasClaimedLoginToday,
      totalXp: profile.xp || 0,
      dateStr: todayStr,
    })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return Response.json({ message: verified.message }, { status: verified.status })

  try {
    const body = (await request.json()) as {
      action: "claim_quest" | "claim_login" | "update_progress"
      questId?: string
      category?: "game" | "flashcard" | "listening" | "dictionary" | "grammar"
      count?: number
    }

    const profileRes = await supabaseRestRequest(
      `profiles?select=id,xp,streak_count,last_login_date,daily_quests_data,daily_login_claimed_date,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
      env,
    )

    if (!profileRes.ok) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

    const profiles = (await profileRes.json()) as Array<{
      id: string
      xp: number
      streak_count: number
      last_login_date: string | null
      daily_quests_data: DailyQuest[] | null
      daily_login_claimed_date: string | null
      nama_lengkap: string
      role: string
    }>

    const profile = profiles[0]
    if (!profile) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

    const todayStr = new Date().toISOString().split("T")[0]
    const lastLoginStr = profile.last_login_date ? String(profile.last_login_date).split("T")[0] : null
    const claimedLoginStr = profile.daily_login_claimed_date ? String(profile.daily_login_claimed_date).split("T")[0] : null

    let quests = profile.daily_quests_data || []
    if (quests.length === 0 || quests[0]?.dateStr !== todayStr) {
      quests = generateTodayQuests(todayStr, lastLoginStr === todayStr, claimedLoginStr === todayStr)
    }

    let addedXp = 0
    let message = ""

    if (body.action === "claim_login") {
      if (claimedLoginStr === todayStr) {
        return Response.json({ message: "Bonus login harian sudah diklaim hari ini." }, { status: 400 })
      }

      const streakCount = profile.streak_count || 1
      addedXp = Math.min(100, streakCount * 15 + 20)
      const newXp = (profile.xp || 0) + addedXp

      // Update quests array: set login quest claimed
      quests = quests.map((q) => (q.category === "login" ? { ...q, isCompleted: true, isClaimed: true } : q))

      await supabaseRestRequest(
        `profiles?id=eq.${encodeURIComponent(profile.id)}`,
        env,
        {
          method: "PATCH",
          body: {
            xp: newXp,
            daily_login_claimed_date: todayStr,
            daily_quests_data: quests,
          },
        },
      )

      // Insert Activity Log in Supabase
      await supabaseRestRequest("activity_logs", env, {
        method: "POST",
        body: {
          actor_id: profile.id,
          actor_name: profile.nama_lengkap,
          actor_role: profile.role || "student",
          action: "CLAIM_DAILY_LOGIN",
          details: `Mengklaim bonus login harian (+${addedXp} EXP). Streak: ${streakCount} hari.`,
          category: "GAMIFICATION",
        },
      })

      return Response.json({
        ok: true,
        addedXp,
        newXp,
        newStreak: streakCount,
        hasClaimedLoginToday: true,
        quests,
        message: `🔥 Bonus Presensi Harian Diklaim! +${addedXp} EXP tersimpan di Supabase.`,
      })
    }

    if (body.action === "claim_quest" && body.questId) {
      const targetQuest = quests.find((q) => q.id === body.questId)
      if (!targetQuest) {
        return Response.json({ message: "Misi harian tidak ditemukan." }, { status: 404 })
      }
      if (targetQuest.isClaimed) {
        return Response.json({ message: "Misi ini sudah diklaim sebelumnya." }, { status: 400 })
      }
      if (!targetQuest.isCompleted) {
        return Response.json({ message: "Misi ini belum selesai dikerjakan." }, { status: 400 })
      }

      addedXp = targetQuest.rewardXp
      const newXp = (profile.xp || 0) + addedXp

      quests = quests.map((q) => (q.id === body.questId ? { ...q, isClaimed: true } : q))

      await supabaseRestRequest(
        `profiles?id=eq.${encodeURIComponent(profile.id)}`,
        env,
        {
          method: "PATCH",
          body: {
            xp: newXp,
            daily_quests_data: quests,
          },
        },
      )

      // Insert Activity Log
      await supabaseRestRequest("activity_logs", env, {
        method: "POST",
        body: {
          actor_id: profile.id,
          actor_name: profile.nama_lengkap,
          actor_role: profile.role || "student",
          action: "CLAIM_DAILY_QUEST",
          details: `Menyelesaikan misi harian "${targetQuest.title}" (+${addedXp} EXP).`,
          category: "GAMIFICATION",
        },
      })

      return Response.json({
        ok: true,
        addedXp,
        newXp,
        quests,
        message: `🎉 Misi "${targetQuest.title}" Berhasil Diklaim! +${addedXp} EXP tersimpan di Supabase.`,
      })
    }

    if (body.action === "update_progress" && body.category) {
      const incCount = body.count || 1
      let updatedAny = false

      quests = quests.map((q) => {
        let isMatch = false
        if (body.category === "game" && (q.category === "game" || q.id === "quest_game")) isMatch = true
        if (body.category === "flashcard" && q.category === "flashcard") isMatch = true
        if (body.category === "listening" && q.category === "listening") isMatch = true
        if (body.category === "dictionary" && q.category === "dictionary") isMatch = true
        if (body.category === "grammar" && q.category === "grammar") isMatch = true

        if (isMatch && !q.isClaimed) {
          const nextProgress = Math.min(q.target, q.progress + incCount)
          updatedAny = true
          return {
            ...q,
            progress: nextProgress,
            isCompleted: nextProgress >= q.target,
          }
        }
        return q
      })

      if (updatedAny) {
        await supabaseRestRequest(
          `profiles?id=eq.${encodeURIComponent(profile.id)}`,
          env,
          {
            method: "PATCH",
            body: { daily_quests_data: quests },
          },
        )
      }

      return Response.json({
        ok: true,
        quests,
      })
    }

    return Response.json({ message: "Aksi tidak valid." }, { status: 400 })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 })
  }
}
