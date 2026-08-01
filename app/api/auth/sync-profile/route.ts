import { registerSchema } from "@/lib/validators/register"
import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

type SyncPayload = {
  registerData: unknown
}

function getRoleByCohort(angkatan: string) {
  return ["2023", "2022", "2021", "2020", "2019"].includes(angkatan)
    ? "alumni"
    : "student"
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  let payload: SyncPayload
  try {
    payload = (await request.json()) as SyncPayload
  } catch {
    return Response.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  if (!payload.registerData) {
    return Response.json(
      { message: "Payload register tidak lengkap." },
      { status: 400 },
    )
  }

  const parsed = registerSchema.safeParse(payload.registerData)
  if (!parsed.success) {
    return Response.json(
      {
        message: "Data register tidak valid.",
        issues: parsed.error.issues.map((issue) => issue.message),
      },
      { status: 400 },
    )
  }

  const data = parsed.data
  const isMockAdmin = verified.user.uid === "mock-admin-uid"

  const profilePayload = {
    firebase_uid: verified.user.uid,
    nama_lengkap: data.namaLengkap,
    email: verified.user.email ?? data.email,
    nomor_telepon: data.nomorTelepon,
    role: isMockAdmin ? "admin" : getRoleByCohort(data.angkatan),
    angkatan: data.angkatan,
    alasan_ikut: data.alasanIkut,
    tempat_lahir: data.tempatLahir,
    tanggal_lahir: data.tanggalLahir,
  }

  const profileResponse = await supabaseRestRequest(
    "profiles?on_conflict=firebase_uid",
    env,
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: [profilePayload],
    },
  )

  if (!profileResponse.ok) {
    const details = await profileResponse.text()
    return Response.json(
      {
        message: "Gagal sinkronisasi profile ke Supabase.",
        details,
      },
      { status: 500 },
    )
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string }>
  const profileId = profileRows[0]?.id

  if (profileId) {
    const academicPayload: Record<string, string> = { profile_id: profileId }

    if ("nisn" in data) {
      academicPayload.nisn = data.nisn
      academicPayload.nis = data.nis
    }
    if ("kelas" in data) {
      academicPayload.kelas = data.kelas
    }
    if ("asalSekolah" in data) {
      academicPayload.asal_sekolah = data.asalSekolah
    }
    if ("asalSmp" in data) {
      academicPayload.asal_sekolah = data.asalSmp
    }

    if (Object.keys(academicPayload).length > 1) {
      await fetch(
        `${env.supabaseUrl}/rest/v1/student_academic_info?on_conflict=profile_id`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: env.supabaseSecret,
            Authorization: `Bearer ${env.supabaseSecret}`,
            Prefer: "resolution=merge-duplicates",
          },
          body: JSON.stringify([academicPayload]),
        },
      )
    }

    void logActivity({
      actorId: profileId,
      actorName: data.namaLengkap,
      actorRole: profilePayload.role,
      action: "MEMBUAT_AKUN",
      details: `Pengguna ${data.namaLengkap} mendaftar akun baru sebagai ${profilePayload.role} angkatan ${data.angkatan} (${profilePayload.email}).`,
      category: "MEMBER",
    })
  }

  return Response.json({
    ok: true,
    message: "Profile berhasil disinkronkan ke Supabase.",
  })
}