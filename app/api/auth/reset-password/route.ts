import { NextResponse } from "next/server"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { checkRateLimit } from "@/lib/server/rate-limiter"
import { getFirebaseAdmin } from "@/lib/server/firebase-admin"
import { logActivity } from "@/lib/server/activity-logger"

type ResetPasswordPayload = {
  email?: string
  tanggalLahir?: string
  nomorTelepon?: string
  nisn?: string
  newPassword?: string
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "")
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return NextResponse.json({ message: env.message }, { status: 500 })
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1"

  let body: ResetPasswordPayload
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: "Payload tidak valid." }, { status: 400 })
  }

  const { email, tanggalLahir, nomorTelepon, nisn, newPassword } = body

  if (!email || !email.trim()) {
    return NextResponse.json({ message: "Email SSO wajib diisi." }, { status: 400 })
  }
  if (!tanggalLahir || !tanggalLahir.trim()) {
    return NextResponse.json({ message: "Tanggal lahir wajib diisi." }, { status: 400 })
  }
  if (!nomorTelepon || !nomorTelepon.trim()) {
    return NextResponse.json({ message: "Nomor telepon wajib diisi." }, { status: 400 })
  }
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json({ message: "Password baru minimal 6 karakter." }, { status: 400 })
  }

  // Rate Limiting: max 3 attempts per 5 minutes per IP + email
  const cleanEmail = email.trim().toLowerCase()
  const rateLimitKey = `reset_password:${ip}:${cleanEmail}`
  const rateCheck = checkRateLimit(rateLimitKey, 3, 5 * 60 * 1000)

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        message: `Terlalu banyak percobaan reset password. Silakan tunggu ${rateCheck.reset} detik sebelum mencoba lagi.`,
      },
      { status: 429 },
    )
  }

  // Query Supabase for profile matching email
  const profileRes = await supabaseRestRequest(
    `profiles?select=*,student_academic_info(*)&email=eq.${encodeURIComponent(cleanEmail)}&limit=1`,
    env,
  )

  if (!profileRes.ok) {
    return NextResponse.json(
      { message: "Gagal memverifikasi data pengguna ke server database." },
      { status: 500 },
    )
  }

  const profiles = await profileRes.json()
  if (!Array.isArray(profiles) || profiles.length === 0) {
    return NextResponse.json(
      { message: "Data verifikasi akun tidak cocok. Periksa kembali email, tanggal lahir, dan nomor telepon Anda." },
      { status: 400 },
    )
  }

  const profile = profiles[0]

  // Verify Tanggal Lahir
  if (!profile.tanggal_lahir || profile.tanggal_lahir.trim() !== tanggalLahir.trim()) {
    return NextResponse.json(
      { message: "Data verifikasi akun tidak cocok. Periksa kembali email, tanggal lahir, dan nomor telepon Anda." },
      { status: 400 },
    )
  }

  // Verify Nomor Telepon
  const dbPhoneNorm = normalizePhone(profile.nomor_telepon || "")
  const inputPhoneNorm = normalizePhone(nomorTelepon)

  if (!dbPhoneNorm || !inputPhoneNorm || !dbPhoneNorm.endsWith(inputPhoneNorm.slice(-8))) {
    return NextResponse.json(
      { message: "Data verifikasi akun tidak cocok. Periksa kembali email, tanggal lahir, dan nomor telepon Anda." },
      { status: 400 },
    )
  }

  // Verify NISN if profile has academic info containing NISN
  const academicList = profile.student_academic_info
  const academic = Array.isArray(academicList) && academicList.length > 0 ? academicList[0] : null
  const cleanInputNisn = (nisn || "").trim()
  const cleanDbNisn = academic?.nisn ? academic.nisn.trim() : ""

  if (cleanDbNisn) {
    if (cleanInputNisn) {
      if (cleanDbNisn !== cleanInputNisn) {
        return NextResponse.json(
          { message: "Data verifikasi NISN tidak cocok. Masukkan NISN 10 digit yang terdaftar di akun Anda." },
          { status: 400 },
        )
      }
    } else if (profile.role !== "alumni") {
      return NextResponse.json(
        { message: "NISN wajib diisi untuk verifikasi akun siswa terdaftar." },
        { status: 400 },
      )
    }
  }

  // Initialize Firebase Admin
  const firebaseAdmin = getFirebaseAdmin()
  if (!firebaseAdmin.ok || !firebaseAdmin.auth) {
    return NextResponse.json(
      {
        message:
          firebaseAdmin.message ||
          "Fitur reset password belum diaktifkan oleh pengurus. Hubungi Pembina/Admin untuk reset akun Anda.",
      },
      { status: 503 },
    )
  }

  try {
    let targetUid = profile.firebase_uid
    try {
      await firebaseAdmin.auth.updateUser(targetUid, {
        password: newPassword,
      })
    } catch (uidError) {
      // Fallback: If updateUser by profile.firebase_uid fails, attempt lookup by email
      const userByEmail = await firebaseAdmin.auth.getUserByEmail(cleanEmail)
      if (userByEmail?.uid) {
        targetUid = userByEmail.uid
        await firebaseAdmin.auth.updateUser(targetUid, {
          password: newPassword,
        })
      } else {
        throw uidError
      }
    }

    void logActivity({
      actorId: profile.id,
      actorName: profile.nama_lengkap,
      actorRole: profile.role,
      action: "CHANGE_PASSWORD",
      details: `Pengguna ${profile.nama_lengkap} (${profile.email}) berhasil mereset password secara mandiri via verifikasi identitas (IP: ${ip}).`,
      category: "PROFIL",
    })

    return NextResponse.json({
      ok: true,
      message: "Password berhasil diperbarui! Silakan login menggunakan password baru Anda.",
    })
  } catch (error) {
    console.error("Firebase Admin reset password error:", error)
    return NextResponse.json(
      { message: "Gagal memperbarui password di Firebase Auth. Coba beberapa saat lagi atau hubungi admin." },
      { status: 500 },
    )
  }
}
