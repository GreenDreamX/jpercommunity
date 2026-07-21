type VerifiedFirebaseUser = {
  uid: string
  email: string | null
  displayName: string | null
}

type VerifyResult =
  | { ok: true; user: VerifiedFirebaseUser }
  | { ok: false; status: number; message: string }

export async function verifyFirebaseIdToken(
  authorizationHeader: string | null,
): Promise<VerifyResult> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    return {
      ok: false,
      status: 401,
      message: "Authorization Bearer token diperlukan.",
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      message: "Firebase API key belum dikonfigurasi di server.",
    }
  }

  const idToken = authorizationHeader.replace("Bearer ", "").trim()
  if (!idToken) {
    return {
      ok: false,
      status: 401,
      message: "ID token Firebase kosong.",
    }
  }

  const lookupResponse = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    },
  )

  if (!lookupResponse.ok) {
    return {
      ok: false,
      status: 401,
      message: "ID token Firebase tidak valid atau kedaluwarsa.",
    }
  }

  const lookupPayload = (await lookupResponse.json()) as {
    users?: Array<{ localId?: string; email?: string; displayName?: string }>
  }

  const user = lookupPayload.users?.[0]
  if (!user?.localId) {
    return {
      ok: false,
      status: 401,
      message: "Token valid tetapi user Firebase tidak ditemukan.",
    }
  }

  return {
    ok: true,
    user: {
      uid: user.localId,
      email: user.email ?? null,
      displayName: user.displayName ?? null,
    },
  }
}