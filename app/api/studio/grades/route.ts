import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; nama_lengkap: string; role: string }>
  const profile = profileRows[0]

  if (!profile || profile.role !== "admin") {
    return { ok: false, status: 403, message: "Akses ditolak. Khusus admin." }
  }

  return { ok: true, profile }
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  const { searchParams } = new URL(request.url)
  const courseWeekId = searchParams.get("course_week_id")

  if (!courseWeekId) {
    return Response.json({ message: "Parameter course_week_id wajib disertakan." }, { status: 400 })
  }

  // Fetch all grades for a specific course week
  const response = await supabaseRestRequest(
    `grades?select=*&course_week_id=eq.${encodeURIComponent(courseWeekId)}`,
    env,
  )

  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil data nilai." }, { status: 500 })
  }

  const data = await response.json()
  return Response.json({ grades: data })
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const body = await request.json()
    const { profile_id, course_week_id, score, note } = body

    if (!profile_id || !course_week_id || score === undefined) {
      return Response.json({ message: "Parameter profile_id, course_week_id, dan score wajib disertakan." }, { status: 400 })
    }

    // Check if grade already exists for this student on this week to determine update or insert
    const checkResponse = await supabaseRestRequest(
      `grades?select=id&profile_id=eq.${encodeURIComponent(profile_id)}&course_week_id=eq.${encodeURIComponent(course_week_id)}&limit=1`,
      env,
    )

    if (!checkResponse.ok) {
      return Response.json({ message: "Gagal memverifikasi duplikasi nilai." }, { status: 500 })
    }

    const checkRows = await checkResponse.json()
    const existingId = checkRows[0]?.id

    let upsertResponse
    if (existingId) {
      // Update
      upsertResponse = await supabaseRestRequest(
        `grades?id=eq.${existingId}`,
        env,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: {
            score: parseInt(score.toString()),
            note: note || "",
          },
        },
      )
    } else {
      // Insert
      upsertResponse = await supabaseRestRequest(
        "grades",
        env,
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: [{
            profile_id,
            course_week_id,
            score: parseInt(score.toString()),
            note: note || "",
          }],
        },
      )
    }

    if (!upsertResponse.ok) {
      const details = await upsertResponse.text()
      return Response.json({ message: "Gagal menyimpan data nilai.", details }, { status: 500 })
    }

    const data = await upsertResponse.json()
    if (authCheck.profile) {
      void logActivity({
        actorId: authCheck.profile.id,
        actorName: authCheck.profile.nama_lengkap,
        actorRole: "admin",
        action: "UPDATE_NILAI",
        details: `Admin ${authCheck.profile.nama_lengkap} menginput/merubah nilai siswa menjadi ${score} (catatan: "${note || '-'}").`,
        category: "NILAI",
      })
    }
    return Response.json({ ok: true, grade: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}
