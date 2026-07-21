export function GET() {
  const supabaseUrl = process.env.SUPABASE_URL
  const hasPublishableKey = Boolean(process.env.SUPABASE_PUBLISHABLE_KEY)
  const hasSecretKey = Boolean(process.env.SUPABASE_SECRET_KEY)
  const hasJwksUrl = Boolean(process.env.SUPABASE_JWKS_URL)

  return Response.json({
    ok: Boolean(supabaseUrl && hasPublishableKey && hasSecretKey && hasJwksUrl),
    service: "jpercommunity-backend",
    supabase: {
      urlConfigured: Boolean(supabaseUrl),
      publishableKeyConfigured: hasPublishableKey,
      secretKeyConfigured: hasSecretKey,
      jwksUrlConfigured: hasJwksUrl,
    },
  })
}