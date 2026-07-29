import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export async function GET() {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  try {
    const response = await supabaseRestRequest(
      "profiles?select=*,student_academic_info(*)&order=nama_lengkap.asc",
      env,
    )

    if (!response.ok) {
      return Response.json({ message: "Gagal mengambil data direktori." }, { status: 500 })
    }

    const data = await response.json()
    const members = data.map((member: any) => {
      if (member.hide_whatsapp) {
        const { nomor_telepon, ...rest } = member
        return { ...rest, nomor_telepon: null }
      }
      return member
    })
    return Response.json({ members })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}
