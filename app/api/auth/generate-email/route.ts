import { NextResponse } from "next/server"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"

async function checkEmailExists(
  email: string,
  env: { supabaseUrl: string; supabaseSecret: string }
): Promise<boolean> {
  const response = await supabaseRestRequest(
    `profiles?select=email&email=eq.${encodeURIComponent(email)}&limit=1`,
    env
  )
  if (!response.ok) return false
  const data = await response.json()
  return Array.isArray(data) && data.length > 0
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return NextResponse.json({ message: env.message }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const fullName = searchParams.get("name")

  if (!fullName || !fullName.trim()) {
    return NextResponse.json({ message: "Parameter name wajib disertakan." }, { status: 400 })
  }

  // Clean the name and split into words
  const words = fullName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map(w => w.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean)

  if (words.length === 0) words.push("member")

  const domain = "@shokunin.jper.my.id"
  const candidates: string[] = []

  // Candidate 1: first name only
  candidates.push(`${words[0]}${domain}`)

  // Candidate 2: first + second name
  if (words.length > 1) {
    candidates.push(`${words[0]}.${words[1]}${domain}`)
  }

  // Candidate 3: first + second + third name
  if (words.length > 2) {
    candidates.push(`${words[0]}.${words[1]}.${words[2]}${domain}`)
  }

  // Check candidates in order
  for (const candidate of candidates) {
    const exists = await checkEmailExists(candidate, env)
    if (!exists) {
      return NextResponse.json({ email: candidate })
    }
  }

  // Fallback: append incrementing numbers to first + second name (or first if only one word)
  const base = words.length > 1 ? `${words[0]}.${words[1]}` : words[0]
  let counter = 2
  while (true) {
    const candidate = `${base}${counter}${domain}`
    const exists = await checkEmailExists(candidate, env)
    if (!exists) {
      return NextResponse.json({ email: candidate })
    }
    counter++
    // Circuit breaker to prevent infinite loops
    if (counter > 1000) {
      return NextResponse.json({ email: `${base}.${Date.now()}${domain}` })
    }
  }
}
