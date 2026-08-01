import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=*,student_academic_info(*)&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return Response.json({ message: "Gagal mengambil profil siswa." }, { status: 500 })
  }

  const profileRows = await profileResponse.json()
  const profile = profileRows[0]

  if (!profile) {
    return Response.json({ message: "Profil tidak ditemukan." }, { status: 404 })
  }

  return Response.json({ ok: true, profile })
}

export async function PATCH(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  try {
    const body = await request.json()
    const { 
      nama_lengkap, 
      avatar_url, 
      cover_url, 
      bio, 
      quote, 
      instagram_username, 
      github_username,
      card_border,
      avatar_border,
      badge_label,
      // New profile fields
      email,
      nomor_telepon,
      tempat_lahir,
      tanggal_lahir,
      alasan_ikut,
      hide_whatsapp,
      twitter_username,
      linkedin_username,
      discord_username,
      telegram_username,
      angkatan,
      // Academic info fields
      nisn,
      nis,
      kelas,
      jurusan,
      asal_sekolah,
      // New social/interest fields
      nickname,
      hobby,
      favorite_anime,
      japanese_level,
      learning_interest,
      dream,
    } = body

    // Validate alasan_ikut length if provided
    if (alasan_ikut !== undefined && alasan_ikut !== null) {
      if (alasan_ikut.trim().length < 25) {
        return Response.json({ message: "Alasan mengikuti ekskul minimal 25 karakter." }, { status: 400 })
      }
    }

    // 1. Get current profile to get ID and current email
    const profileResponse = await supabaseRestRequest(
      `profiles?select=id,email,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
      env,
    )

    if (!profileResponse.ok) {
      return Response.json({ message: "Gagal mengambil profil." }, { status: 500 })
    }

    const profileRows = await profileResponse.json()
    const profile = profileRows[0]

    if (!profile) {
      return Response.json({ message: "Profil tidak ditemukan." }, { status: 404 })
    }

    // Check email change rules if email is updated
    if (email && email !== profile.email) {
      // Check email uniqueness in Supabase
      const emailCheck = await supabaseRestRequest(
        `profiles?select=id&email=eq.${encodeURIComponent(email)}&id=neq.${encodeURIComponent(profile.id)}&limit=1`,
        env,
      )
      if (emailCheck.ok) {
        const emailCheckRows = await emailCheck.json()
        if (emailCheckRows.length > 0) {
          return Response.json({ message: "Email sudah digunakan oleh anggota lain." }, { status: 400 })
        }
      }
    }

    // 2. Perform profile update
    const updateFields: any = {
      nama_lengkap,
      avatar_url: avatar_url?.trim() || null,
      cover_url: cover_url?.trim() || null,
      bio: bio?.trim() || null,
      quote: quote?.trim() || null,
      instagram_username: instagram_username?.trim() || null,
      github_username: github_username?.trim() || null,
      card_border,
      avatar_border,
      badge_label: badge_label === "none" ? null : badge_label,
      nomor_telepon: nomor_telepon?.trim() || null,
      tempat_lahir: tempat_lahir?.trim() || null,
      tanggal_lahir: tanggal_lahir?.trim() || null,
      alasan_ikut: alasan_ikut?.trim() || null,
      hide_whatsapp: hide_whatsapp ?? false,
      twitter_username: twitter_username?.trim() || null,
      linkedin_username: linkedin_username?.trim() || null,
      discord_username: discord_username?.trim() || null,
      telegram_username: telegram_username?.trim() || null,
      angkatan,
      nickname: nickname?.trim() || null,
      hobby: hobby?.trim() || null,
      favorite_anime: favorite_anime?.trim() || null,
      japanese_level: japanese_level || null,
      learning_interest: learning_interest || null,
      dream: dream || null,
      updated_at: new Date().toISOString(),
    }

    if (email) {
      updateFields.email = email.trim()
    }

    const updateResponse = await supabaseRestRequest(
      `profiles?id=eq.${encodeURIComponent(profile.id)}`,
      env,
      {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: updateFields,
      },
    )

    if (!updateResponse.ok) {
      const details = await updateResponse.text()
      return Response.json({ message: "Gagal memperbarui profil.", details }, { status: 500 })
    }

    // 3. Perform academic info update/upsert if any field is provided
    if (
      nisn !== undefined || 
      nis !== undefined || 
      kelas !== undefined || 
      jurusan !== undefined || 
      asal_sekolah !== undefined
    ) {
      const academicCheck = await supabaseRestRequest(
        `student_academic_info?select=id&profile_id=eq.${encodeURIComponent(profile.id)}&limit=1`,
        env,
      )

      if (academicCheck.ok) {
        const academicRows = await academicCheck.json()
        const academicPayload = {
          nisn: nisn?.trim() || null,
          nis: nis?.trim() || null,
          kelas: kelas?.trim() || null,
          jurusan: jurusan?.trim() || null,
          asal_sekolah: asal_sekolah?.trim() || null,
        }

        if (academicRows.length > 0) {
          // PATCH
          await supabaseRestRequest(
            `student_academic_info?profile_id=eq.${encodeURIComponent(profile.id)}`,
            env,
            {
              method: "PATCH",
              body: academicPayload,
            },
          )
        } else {
          // POST
          await supabaseRestRequest(
            `student_academic_info`,
            env,
            {
              method: "POST",
              body: {
                profile_id: profile.id,
                ...academicPayload,
              },
            },
          )
        }
      }
    }

    // 4. Fetch and return full updated profile with student_academic_info
    const finalProfileResponse = await supabaseRestRequest(
      `profiles?select=*,student_academic_info(*)&id=eq.${encodeURIComponent(profile.id)}&limit=1`,
      env,
    )

    if (!finalProfileResponse.ok) {
      return Response.json({ message: "Gagal memuat profil terupdate." }, { status: 500 })
    }

    const finalRows = await finalProfileResponse.json()
    const updatedProfile = finalRows[0]

    if (updatedProfile) {
      void logActivity({
        actorId: updatedProfile.id,
        actorName: updatedProfile.nama_lengkap || "Pengguna",
        actorRole: updatedProfile.role || "student",
        action: "UPDATE_PROFIL",
        details: `${updatedProfile.nama_lengkap || "Pengguna"} memperbarui informasi foto dan data profil.`,
        category: "PROFIL",
      })
    }

    return Response.json({ ok: true, profile: updatedProfile })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return Response.json({ message: verified.message }, { status: verified.status })
  }

  try {
    // 1. Get current profile to get ID
    const profileResponse = await supabaseRestRequest(
      `profiles?select=id&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
      env,
    )

    if (!profileResponse.ok) {
      return Response.json({ message: "Gagal mengambil profil." }, { status: 500 })
    }

    const profileRows = await profileResponse.json()
    const profile = profileRows[0]

    if (!profile) {
      return Response.json({ message: "Profil tidak ditemukan." }, { status: 404 })
    }

    // 2. Delete academic info first (due to foreign key relation)
    await supabaseRestRequest(
      `student_academic_info?profile_id=eq.${encodeURIComponent(profile.id)}`,
      env,
      { method: "DELETE" }
    )

    // 3. Delete user's submissions
    await supabaseRestRequest(
      `submissions?profile_id=eq.${encodeURIComponent(profile.id)}`,
      env,
      { method: "DELETE" }
    )

    // 4. Delete user's quiz answers
    await supabaseRestRequest(
      `quiz_answers?profile_id=eq.${encodeURIComponent(profile.id)}`,
      env,
      { method: "DELETE" }
    )

    // 5. Delete user's attendance records
    await supabaseRestRequest(
      `attendance_records?profile_id=eq.${encodeURIComponent(profile.id)}`,
      env,
      { method: "DELETE" }
    )

    // 6. Delete grades
    await supabaseRestRequest(
      `grades?profile_id=eq.${encodeURIComponent(profile.id)}`,
      env,
      { method: "DELETE" }
    )

    // 7. Delete the profile itself
    const deleteResponse = await supabaseRestRequest(
      `profiles?id=eq.${encodeURIComponent(profile.id)}`,
      env,
      {
        method: "DELETE",
      },
    )

    if (!deleteResponse.ok) {
      return Response.json({ message: "Gagal menghapus profil dari basis data." }, { status: 500 })
    }

    return Response.json({ ok: true })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}
