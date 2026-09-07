export async function GET() {
  const securityText = `Contact: mailto:petugasromusha@gmail.com
Expires: 2027-12-31T23:59:59.000Z
Preferred-Languages: id, ja, en
Canonical: https://jper.my.id/.well-known/security.txt
Policy: https://jper.my.id/privacy
`

  return new Response(securityText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  })
}
