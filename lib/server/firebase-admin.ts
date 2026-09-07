import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

const projectId = process.env.FIREBASE_PROJECT_ID
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const privateKey = process.env.FIREBASE_PRIVATE_KEY

let adminAuth: Auth | null = null
let isInitialized = false

if (projectId && clientEmail && privateKey) {
  try {
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          // Handle newline characters in the private key string (commonly escaped in env vars)
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      })
    }
    adminAuth = getAuth()
    isInitialized = true
  } catch (error) {
    console.error("Gagal menginisialisasi Firebase Admin SDK:", error)
  }
}

export function getFirebaseAdmin() {
  return {
    ok: isInitialized,
    auth: adminAuth,
    message: isInitialized
      ? "Firebase Admin SDK berhasil diinisialisasi."
      : "Firebase Admin SDK belum dikonfigurasi. Pastikan FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, dan FIREBASE_PRIVATE_KEY telah diatur di .env.local.",
  }
}
