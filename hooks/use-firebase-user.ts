"use client"

import { useEffect, useState } from "react"
import { type User, onAuthStateChanged } from "firebase/auth"

import { firebaseAuth } from "@/lib/firebase/client"

export function useFirebaseUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (authUser) => {
      setUser(authUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  return { user, loading }
}