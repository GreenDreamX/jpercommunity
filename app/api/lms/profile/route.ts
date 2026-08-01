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

    // Validate alasan_ikut length if non-empty string provided
    if (typeof alasan_ikut === "string" && alasan_ikut.trim() !== "") {
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

    // 2. Perform profile update safely
    const updateFields: Record<string, any> = {}

    if (nama_lengkap && nama_lengkap.trim() !== "") updateFields.nama_lengkap = nama_lengkap.trim()
    if (avatar_url !== undefined) updateFields.avatar_url = avatar_url?.trim() || null
    if (cover_url !== undefined) updateFields.cover_url = cover_url?.trim() || null
    if (bio !== undefined) updateFields.bio = bio?.trim() || null
    if (quote !== undefined) updateFields.quote = quote?.trim() || null
    if (instagram_username !== undefined) updateFields.instagram_username = instagram_username?.trim() || null
    if (github_username !== undefined) updateFields.github_username = github_username?.trim() || null
    if (card_border !== undefined) updateFields.card_border = card_border || "default"
    if (avatar_border !== undefined) updateFields.avatar_border = avatar_border || "default"
    if (badge_label !== undefined) updateFields.badge_label = badge_label === "none" ? null : badge_label
    if (nomor_telepon !== undefined) updateFields.nomor_telepon = nomor_telepon?.trim() || null
    if (tempat_lahir !== undefined) updateFields.tempat_lahir = tempat_lahir?.trim() || null
    if (tanggal_lahir !== undefined) updateFields.tanggal_lahir = tanggal_lahir?.trim() || null
    if (alasan_ikut !== undefined) updateFields.alasan_ikut = alasan_ikut?.trim() || null
    if (hide_whatsapp !== undefined) updateFields.hide_whatsapp = hide_whatsapp ?? false
    if (twitter_username !== undefined) updateFields.twitter_username = twitter_username?.trim() || null
    if (linkedin_username !== undefined) updateFields.linkedin_username = linkedin_username?.trim() || null
    if (discord_username !== undefined) updateFields.discord_username = discord_username?.trim() || null
    if (telegram_username !== undefined) updateFields.telegram_username = telegram_username?.trim() || null
    if (angkatan !== undefined) updateFields.angkatan = angkatan || "2026"
    if (nickname !== undefined) updateFields.nickname = nickname?.trim() || null
    if (hobby !== undefined) updateFields.hobby = hobby?.trim() || null
    if (favorite_anime !== undefined) updateFields.favorite_anime = favorite_anime?.trim() || null
    if (japanese_level !== undefined) updateFields.japanese_level = japanese_level || null
    if (learning_interest !== undefined) updateFields.learning_interest = learning_interest || null
    if (dream !== undefined) updateFields.dream = dream || null

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
