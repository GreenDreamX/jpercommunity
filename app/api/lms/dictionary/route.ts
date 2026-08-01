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
  const query = searchParams.get("q")

  let endpoint = "lms_dictionary?select=id,term,reading,romaji,pos,meaning,meaning_id,pitch,pitch_position,example_ja,example_id,category,frequency,created_at&order=term.asc&limit=2000"

  if (category && category !== "all") {
    endpoint += `&category=ilike.*${encodeURIComponent(category.trim())}*`
  }

  if (query && query.trim()) {
    const q = encodeURIComponent(`*${query.trim()}*`)
    endpoint += `&or=(term.ilike.${q},reading.ilike.${q},romaji.ilike.${q},meaning.ilike.${q},meaning_id.ilike.${q})`
  }

  const response = await supabaseRestRequest(endpoint, env)
  if (!response.ok) {
    return Response.json({ message: "Gagal mengambil data kamus dari database." }, { status: 500 })
  }

  const items = await response.json()
  return Response.json({ ok: true, items })
}
