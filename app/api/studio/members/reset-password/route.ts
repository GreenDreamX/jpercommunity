import { NextResponse } from "next/server"
import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { getFirebaseAdmin } from "@/lib/server/firebase-admin"
import { logActivity } from "@/lib/server/activity-logger"

async function verifyAdmin(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false as const, status: verified.status, message: verified.message }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false as const, status: 404, message: "Profile admin tidak ditemukan." }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; nama_lengkap: string; role: string }>
  const profile = profileRows[0]

  const ALLOWED_STUDIO_ROLES = ["admin", "pembina", "ketua_komunitas", "ketua_angkatan", "bendahara"]
  if (!profile || !ALLOWED_STUDIO_ROLES.includes(profile.role)) {
    return { ok: false as const, status: 403, message: "Akses ditolak. Khusus pengurus." }
  }

  return { ok: true as const, adminProfile: profile }
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return NextResponse.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyAdmin(request, env)
  if (!authCheck.ok) {
    return NextResponse.json({ message: authCheck.message }, { status: authCheck.status })
  }

  type Payload = {
    memberId?: string
    newPassword?: string
  }

  let body: Payload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  const { memberId, newPassword } = body

  if (!memberId) {
    return NextResponse.json({ message: "Parameter memberId wajib disertakan." }, { status: 400 })
  }

  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: "Password baru minimal 6 karakter." }, { status: 400 })
  }

  // Fetch target member profile
  const memberRes = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,email,role,firebase_uid&id=eq.${encodeURIComponent(memberId)}&limit=1`,
    env,
  )

  if (!memberRes.ok) {
    return NextResponse.json({ message: "Gagal mengambil data anggota dari server." }, { status: 500 })
  }

  const members = await memberRes.json()
  if (!Array.isArray(members) || members.length === 0) {
    return NextResponse.json({ message: "Anggota tidak ditemukan." }, { status: 404 })
  }

  const targetMember = members[0]

  // Initialize Firebase Admin
  const firebaseAdmin = getFirebaseAdmin()
  if (!firebaseAdmin.ok || !firebaseAdmin.auth) {
    return NextResponse.json(
      {
        message:
          firebaseAdmin.message ||
          "Firebase Admin SDK belum dikonfigurasi di server. Tidak dapat mereset password pengguna.",
      },
      { status: 503 },
    )
  }

  try {
    await firebaseAdmin.auth.updateUser(targetMember.firebase_uid, {
      password: newPassword,
    })

    void logActivity({
      actorId: authCheck.adminProfile.id,
      actorName: authCheck.adminProfile.nama_lengkap,
      actorRole: authCheck.adminProfile.role,
      action: "RESET_PASSWORD_ADMIN",
      details: `Pengurus ${authCheck.adminProfile.nama_lengkap} mereset kata sandi akun ${targetMember.nama_lengkap} (${targetMember.email}).`,
      category: "MEMBER",
    })

    return NextResponse.json({
      ok: true,
      message: `Password akun ${targetMember.nama_lengkap} berhasil diperbarui.`,
    })
  } catch (error) {
    console.error("Admin reset password error:", error)
    return NextResponse.json(
      { message: "Gagal mereset password di Firebase Auth." },
      { status: 500 },
    )
  }
}
