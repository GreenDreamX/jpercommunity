import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

export type ShortlinkItem = {
  id?: string
  slug: string
  target_url: string
  title: string | null
  click_count: number
  created_at?: string
}

export async function GET() {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ ok: true, shortlinks: [], source: "supabase" })
  }

  try {
    const res = await supabaseRestRequest("shortlinks?select=*&order=created_at.desc", env)
    if (res.ok) {
      const rows = (await res.json()) as ShortlinkItem[]
      return Response.json({ ok: true, shortlinks: Array.isArray(rows) ? rows : [], source: "supabase" })
    }
    return Response.json({ ok: true, shortlinks: [], source: "supabase" })
  } catch (err: unknown) {
    return Response.json({ ok: true, shortlinks: [], source: "supabase", error: err instanceof Error ? err.message : "Error" })
  }
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  try {
    const body = (await request.json()) as {
      slug: string
      targetUrl: string
      title?: string
    }

    const { slug, targetUrl, title } = body
    if (!slug || !targetUrl) {
      return Response.json({ message: "Slug dan URL target wajib diisi." }, { status: 400 })
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9_-]/g, "")
    if (!cleanSlug) {
      return Response.json({ message: "Slug tidak valid. Gunakan huruf, angka, minus, atau underscore." }, { status: 400 })
    }

    // Insert directly into Supabase shortlinks table
    const insertRes = await supabaseRestRequest("shortlinks", env, {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: {
        slug: cleanSlug,
        target_url: targetUrl,
        title: title || `Custom Link /${cleanSlug}`,
        click_count: 0,
      },
    })

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      if (errText.includes("duplicate") || errText.includes("unique")) {
        return Response.json({ message: `Slug "/${cleanSlug}" sudah digunakan. Gunakan slug lain.` }, { status: 409 })
      }
      if (errText.includes("PGRST205") || errText.includes("schema cache")) {
        return Response.json({ message: "Tabel shortlinks belum dibuat di Supabase. Silakan jalankan file SQL migration 012_shortlinks.sql di Supabase SQL Editor." }, { status: 500 })
      }
      return Response.json({ message: "Gagal menyimpan shortlink ke Supabase." }, { status: 500 })
    }

    const createdRows = (await insertRes.json()) as ShortlinkItem[]
    const createdItem = createdRows[0]

    // Log Activity in Supabase
    void supabaseRestRequest("activity_logs", env, {
      method: "POST",
      body: {
        actor_name: "Public User / Admin",
        actor_role: "student",
        action: "CREATE_SHORTLINK",
        details: `Membuat shortlink s.jper.my.id/${cleanSlug} -> ${targetUrl}`,
        category: "SHORTLINK",
      },
    })

    return Response.json({
      ok: true,
      shortlink: createdItem,
      message: `Shortlink s.jper.my.id/${cleanSlug} berhasil disimpan di Supabase!`,
    })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Internal Server Error" }, { status: 500 })
  }
}
