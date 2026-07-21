export function getSupabaseServerEnv() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecret) {
    return {
      ok: false as const,
      message: "Supabase env belum lengkap di server.",
    }
  }

  return {
    ok: true as const,
    supabaseUrl,
    supabaseSecret,
  }
}

type SupabaseRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE"
  body?: unknown
  headers?: Record<string, string>
}

export async function supabaseRestRequest(
  path: string,
  env: { supabaseUrl: string; supabaseSecret: string },
  options: SupabaseRequestOptions = {},
) {
  const { method = "GET", body, headers = {} } = options

  return fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: env.supabaseSecret,
      Authorization: `Bearer ${env.supabaseSecret}`,
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}