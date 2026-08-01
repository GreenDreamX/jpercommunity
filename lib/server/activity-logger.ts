import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export type LogActivityParams = {
  actorId?: string | null
  actorName: string
  actorRole?: string
  action: string
  details: string
  category?: "ABSENSI" | "NILAI" | "MEMBER" | "PROFIL" | "SILABUS" | "SISTEM" | "UMUM" | "KEUANGAN"
}

export async function logActivity(params: LogActivityParams) {
  const env = getSupabaseServerEnv()
  if (!env.ok) return

  try {
    await supabaseRestRequest("activity_logs", env, {
      method: "POST",
      body: [
        {
          actor_id: params.actorId || null,
          actor_name: params.actorName,
          actor_role: params.actorRole || "student",
          action: params.action,
          details: params.details,
          category: params.category || "UMUM",
        },
      ],
    })
  } catch (err) {
    console.error("Gagal mencatat log aktivitas:", err)
  }
}
