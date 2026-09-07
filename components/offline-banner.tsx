"use client"

import { useState, useEffect } from "react"
import { WifiOff, Wifi, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
      setShowReconnected(true)
      const timer = setTimeout(() => setShowReconnected(false), 3500)
      return () => clearTimeout(timer)
    }

    function handleOffline() {
      setIsOffline(true)
      setShowReconnected(false)
    }

    if (typeof window !== "undefined") {
      setIsOffline(!navigator.onLine)
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-[#B23A2E] text-white p-3.5 rounded-2xl shadow-xl border border-white/20 flex items-center justify-between text-xs font-semibold"
        >
          <div className="flex items-center gap-2.5">
            <WifiOff className="size-4 animate-pulse shrink-0" />
            <span>Koneksi terputus. Anda sedang berada dalam mode offline.</span>
          </div>
        </motion.div>
      )}

      {!isOffline && showReconnected && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-emerald-700 text-white p-3.5 rounded-2xl shadow-xl border border-white/20 flex items-center justify-between text-xs font-semibold"
        >
          <div className="flex items-center gap-2.5">
            <Wifi className="size-4 shrink-0" />
            <span>Koneksi internet kembali terhubung!</span>
          </div>
          <button onClick={() => setShowReconnected(false)} className="text-white/80 hover:text-white">
            <X className="size-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
