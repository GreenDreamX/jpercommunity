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

  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const level = searchParams.get("level")
  const query = searchParams.get("q")

  let endpoint = "lms_grammar?select=id,title,romaji,meaning,meaning_id,explanation,jlpt_level,structure,example_ja,example_id,pitch,category,created_at&order=jlpt_level.asc"

  if (category && category !== "all") {
    endpoint += `&category=eq.${encodeURIComponent(category)}`
  }

  if (level && level !== "all") {
    endpoint += `&jlpt_level=eq.${encodeURIComponent(level)}`
  }

  if (query && query.trim()) {
    const q = encodeURIComponent(`*${query.trim()}*`)
    endpoint += `&or=(title.ilike.${q},romaji.ilike.${q},meaning.ilike.${q},meaning_id.ilike.${q},explanation.ilike.${q})`
  }

  const response = await supabaseRestRequest(endpoint, env)
  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil data tata bahasa dari database." }, { status: 500 })
  }

  const items = await response.json()
  return Response.json({ ok: true, items })
}
