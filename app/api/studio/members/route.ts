import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; role: string }>
  const profile = profileRows[0]

  const ALLOWED_STUDIO_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]
  if (!profile || !ALLOWED_STUDIO_ROLES.includes(profile.role)) {
    return { ok: false, status: 403, message: "Akses ditolak. Khusus pengurus." }
  }

  return { ok: true }
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
  const search = searchParams.get("search")
  const limit = parseInt(searchParams.get("limit") ?? "200")

  let query: string
  if (search && search.trim()) {
    // Simple search by name or email using ilike
    const s = encodeURIComponent(`%${search.trim()}%`)
    query = `profiles?select=id,nama_lengkap,email,angkatan&or=(nama_lengkap.ilike.${s},email.ilike.${s})&order=nama_lengkap.asc&limit=${limit}`
  } else {
    // Full fetch with academic info when no search
    query = `profiles?select=*,student_academic_info(*)&order=nama_lengkap.asc&limit=${limit}`
  }

  // Fetch all profiles along with academic info if available
  const response = await supabaseRestRequest(query, env)

  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil daftar anggota." }, { status: 500 })
  }

  const data = await response.json()
  return Response.json({ members: data })
}

export async function PATCH(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })
    }

    const body = await request.json()
    const { role, angkatan, nama_lengkap, nomor_telepon } = body

    const updateResponse = await supabaseRestRequest(
      `profiles?id=eq.${encodeURIComponent(id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: {
          role,
          angkatan,
          nama_lengkap,
          nomor_telepon,
        },
      },
    )

    if (!updateResponse.ok) {
      const details = await updateResponse.text()
      return Response.json({ message: "Gagal memperbarui profil anggota.", details }, { status: 500 })
    }

    const data = await updateResponse.json()
    return Response.json({ ok: true, profile: data[0] })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return Response.json({ message: "Parameter id wajib disertakan." }, { status: 400 })
  }

  // Delete profile record (cascade will handle child tables if foreign keys are configured, otherwise handle manually)
  const deleteResponse = await supabaseRestRequest(
    `profiles?id=eq.${encodeURIComponent(id)}`,
    env,
    {
      method: "DELETE",
    },
  )

  if (!deleteResponse.ok) {
    return Response.json({ message: "Gagal mengeluarkan anggota dari sistem." }, { status: 500 })
  }

  return Response.json({ ok: true })
}
