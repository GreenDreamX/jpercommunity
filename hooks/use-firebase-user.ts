"use client"

import { useEffect, useState } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"
import { setSessionCookie, clearSessionCookie } from "@/lib/session-cookie"

export function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if there is a mock session first
    const mockSession = typeof window !== "undefined" ? localStorage.getItem("jper_mock_session") : null
    if (mockSession === "student" || mockSession === "admin") {
      setUser({
        uid: mockSession === "student" ? "mock-student-uid" : "mock-admin-uid",
        email: mockSession === "student" ? "student@jper.my.id" : "admin@jper.my.id",
        displayName: mockSession === "student" ? "Siswa Bypass" : "Admin Bypass",
        getIdToken: async () => mockSession === "student" ? "mock-student-token" : "mock-admin-token",
      } as unknown as User)
      setSessionCookie()
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(firebaseAuth, (authUser) => {
      setUser(authUser)
      if (authUser) {
        setSessionCookie()
      } else {
        clearSessionCookie()
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}