import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  // Get profile
  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,angkatan,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )
  if (!profileResponse.ok) {
    return Response.json({ message: "Profil tidak ditemukan." }, { status: 404 })
  }

  const profileRows = (await profileResponse.json()) as Array<{
    id: string
    nama_lengkap: string
    angkatan: string | null
    role: string
  }>
  const profile = profileRows[0]
  if (!profile) {
    return Response.json({ message: "Profil tidak ditemukan." }, { status: 404 })
  }

  // Hanya student / alumni yang perlu reminder kas
  // Pengurus tidak dikenai iuran kas
  const NON_KAS_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]
  if (NON_KAS_ROLES.includes(profile.role)) {
    return Response.json({
      isPengurus: true,
      paidWeeks: [],
      unpaidWeeks: [],
      totalUnpaid: 0,
      totalTunggakan: 0,
    })
  }

  try {
    // Ambil semua kas records milik member ini
    const kasResponse = await supabaseRestRequest(
      `kas_records?select=week_number,amount,paid_at&profile_id=eq.${encodeURIComponent(profile.id)}&order=week_number.asc`,
      env,
    )

    const kasRecords = kasResponse.ok
      ? ((await kasResponse.json()) as Array<{ week_number: number; amount: number; paid_at: string }>)
      : []

    // Cari minggu paling tinggi yang tercatat di DB (dari semua user, bukan hanya member ini)
    // untuk tahu sampai minggu berapa kita perlu cek
    const maxWeekResponse = await supabaseRestRequest(
      `kas_records?select=week_number&order=week_number.desc&limit=1`,
      env,
    )
    const maxWeekRows = maxWeekResponse.ok
      ? ((await maxWeekResponse.json()) as Array<{ week_number: number }>)
      : []

    // Jika belum ada sesi kas sama sekali, tidak ada tunggakan
    if (maxWeekRows.length === 0) {
      return Response.json({
        isPengurus: false,
        paidWeeks: [],
        unpaidWeeks: [],
        totalUnpaid: 0,
        totalTunggakan: 0,
        memberName: profile.nama_lengkap,
      })
    }

    const maxWeek = maxWeekRows[0].week_number

    const paidWeeks = kasRecords.map((r) => r.week_number)
    const allWeeks = Array.from({ length: maxWeek }, (_, i) => i + 1)
    const unpaidWeeks = allWeeks.filter((w) => !paidWeeks.includes(w))

    const KAS_PER_WEEK = 2000
    const totalTunggakan = unpaidWeeks.length * KAS_PER_WEEK

    return Response.json({
      isPengurus: false,
      paidWeeks,
      unpaidWeeks,
      totalUnpaid: unpaidWeeks.length,
      totalTunggakan,
      memberName: profile.nama_lengkap,
      kasPerWeek: KAS_PER_WEEK,
    })
  } catch (err: unknown) {
    console.error("Kas status error:", err)
    return Response.json({ message: "Gagal mengambil status kas." }, { status: 500 })
  }
}
