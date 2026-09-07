import { NextResponse } from "next/server"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

const FALLBACK_SLUGS: Record<string, string> = {
  reg: "https://forms.jper.my.id/register",
  register: "https://forms.jper.my.id/register",
  lms: "https://lms.jper.my.id",
  studio: "https://studio.jper.my.id",
  docs: "https://docs.jper.my.id",
  privacy: "https://docs.jper.my.id/privacy",
  terms: "https://docs.jper.my.id/terms",
  kurikulum: "https://docs.jper.my.id/kurikulum",
  wa: "https://wa.me/6283850967918",
  faq: "https://docs.jper.my.id",
  form: "https://forms.jper.my.id",
  forms: "https://forms.jper.my.id",
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const cleanSlug = slug.toLowerCase().trim()

  const env = getSupabaseServerEnv()

  if (env.ok) {
    try {
      const res = await supabaseRestRequest(
        `shortlinks?select=id,target_url,click_count&slug=eq.${encodeURIComponent(cleanSlug)}&limit=1`,
        env,
      )
      if (res.ok) {
        const rows = (await res.json()) as Array<{ id: string; target_url: string; click_count: number }>
        if (rows.length > 0 && rows[0].target_url) {
          const item = rows[0]
          // Increment click count in Supabase
          void supabaseRestRequest(`shortlinks?id=eq.${encodeURIComponent(item.id)}`, env, {
            method: "PATCH",
            body: { click_count: (item.click_count || 0) + 1 },
          })

          return NextResponse.redirect(item.target_url, 307)
        }
      }
    } catch {
      // Fallback below
    }
  }

  // Fallback slug mapping if Supabase is offline
  if (FALLBACK_SLUGS[cleanSlug]) {
    return NextResponse.redirect(FALLBACK_SLUGS[cleanSlug], 307)
  }

  // If slug is unknown, redirect to main homepage
  return NextResponse.redirect("https://jper.my.id", 307)
}
