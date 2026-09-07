import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return Response.json({ message: env.message }, { status: 500 })

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) return Response.json({ message: verified.message }, { status: verified.status })

  try {
    const body = (await request.json()) as {
      activity:
        | "game"
        | "speed_match"
        | "kotoba_tower"
        | "kanji_puzzle"
        | "listening_rush"
        | "listening"
        | "shiritori"
        | "shiritori_battle"
        | "daily_login"
        | "daily_quest"
        | "flashcard"
        | "dictionary"
        | "grammar"
        | "quiz"
        | "assignment"
      amount?: number
      streak?: number
    }

    const { activity, amount, streak } = body

    let xpToAdd = 10
    if (activity === "flashcard") xpToAdd = 15
    if (activity === "dictionary") xpToAdd = 10
    if (activity === "grammar") xpToAdd = 10
    if (activity === "quiz") xpToAdd = 50
    if (activity === "assignment") xpToAdd = 50
    if (
      activity === "game" ||
      activity === "speed_match" ||
      activity === "kotoba_tower" ||
      activity === "kanji_puzzle" ||
      activity === "listening_rush" ||
      activity === "shiritori" ||
      activity === "shiritori_battle"
    ) {
      xpToAdd = 30
    }
    if (activity === "daily_login") xpToAdd = 25
    if (activity === "daily_quest") xpToAdd = 40

    if (typeof amount === "number" && amount > 0 && amount <= 1000) {
      xpToAdd = amount
    }

    // Get current profile
    const profileRes = await supabaseRestRequest(
      `profiles?select=id,xp,streak_count,daily_quests_data,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
      env,
    )
    if (!profileRes.ok) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

    const profiles = (await profileRes.json()) as Array<{
      id: string
      xp: number
      streak_count: number
      daily_quests_data: any[] | null
      nama_lengkap: string
      role: string
    }>

    const profile = profiles[0]
    if (!profile) return Response.json({ message: "Profile tidak ditemukan." }, { status: 404 })

    const newXp = (profile.xp || 0) + xpToAdd
    let newStreak = profile.streak_count || 1
    if (typeof streak === "number" && streak > 0) {
      newStreak = Math.max(newStreak, streak)
    }

    // Check if activity updates any active quest in daily_quests_data
    let quests = profile.daily_quests_data || []
    let questUpdated = false

    const isGame =
      activity === "game" ||
      activity === "speed_match" ||
      activity === "kotoba_tower" ||
      activity === "kanji_puzzle" ||
      activity === "listening_rush" ||
      activity === "shiritori" ||
      activity === "shiritori_battle"

    quests = quests.map((q) => {
      let isMatch = false
      if (isGame && (q.category === "game" || q.id === "quest_game")) isMatch = true
      if (activity === "flashcard" && q.category === "flashcard") isMatch = true
      if ((activity === "listening_rush" || activity === "listening") && q.category === "listening") isMatch = true
      if (activity === "dictionary" && q.category === "dictionary") isMatch = true
      if (activity === "grammar" && q.category === "grammar") isMatch = true

      if (isMatch && !q.isClaimed) {
        const nextProgress = Math.min(q.target, (q.progress || 0) + 1)
        questUpdated = true
        return {
          ...q,
          progress: nextProgress,
          isCompleted: nextProgress >= q.target,
        }
      }
      return q
    })

    // Patch profile in Supabase
    const patchData: Record<string, any> = { xp: newXp }
    if (typeof streak === "number" && streak > 0) {
      patchData.streak_count = newStreak
    }
    if (questUpdated) {
      patchData.daily_quests_data = quests
    }

    const updateRes = await supabaseRestRequest(
      `profiles?id=eq.${encodeURIComponent(profile.id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: patchData,
      },
    )

    if (!updateRes.ok) {
      return Response.json({ message: "Gagal memperbarui XP di Supabase." }, { status: 500 })
    }

    // Insert Activity Log in Supabase
    void supabaseRestRequest("activity_logs", env, {
      method: "POST",
      body: {
        actor_id: profile.id,
        actor_name: profile.nama_lengkap,
        actor_role: profile.role || "student",
        action: "EARN_XP",
        details: `Mendapatkan +${xpToAdd} EXP dari aktivitas ${activity.toUpperCase()}. Total XP: ${newXp}`,
        category: "GAMIFICATION",
      },
    })

    // Record game score in Supabase game_scores table
    if (isGame) {
      void supabaseRestRequest("game_scores", env, {
        method: "POST",
        body: {
          profile_id: profile.id,
          game_type: activity,
          score: amount || xpToAdd * 10,
          xp_earned: xpToAdd,
        },
      })
    }

    let levelTitle = "初心者 (Shoshinsha)"
    if (newXp >= 1000) levelTitle = "名人 (Meijin)"
    else if (newXp >= 600) levelTitle = "達人 (Tatsujin)"
    else if (newXp >= 300) levelTitle = "職人 (Shokunin)"
    else if (newXp >= 100) levelTitle = "弟子 (Deshi)"

    return Response.json({
      ok: true,
      addedXp: xpToAdd,
      newXp,
      newStreak,
      levelTitle,
      quests,
      message: `Selamat! +${xpToAdd} EXP berhasil ditambahkan ke akun Anda! (${levelTitle})`,
    })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan server." }, { status: 500 })
  }
}
