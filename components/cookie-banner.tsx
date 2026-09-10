"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Cookie, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("jper_cookie_consent")
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem("jper_cookie_consent", "accepted")
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 md:max-w-sm bg-white border border-[#E4E1DA] p-4 rounded-2xl shadow-xl text-xs text-[#1C1B1A] space-y-3"
        >
          <div className="flex items-start gap-3">
            <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Cookie className="size-4 text-amber-600" />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-[#1C1B1A]">Persetujuan Cookie Sesi</div>
              <p className="text-[11px] text-[#6B6862] leading-relaxed">
                Kami menggunakan cookie esensial (`jper_session`) untuk memverifikasi login &amp; keanggotaan Anda di portal LMS. Baca{" "}
                <Link href="https://docs.jper.my.id/privacy" className="text-[#B23A2E] underline font-medium">
                  Kebijakan Privasi
                </Link>.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              onClick={handleAccept}
              className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-[11px] font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs border-none cursor-pointer"
            >
              <Check className="size-3.5" /> Saya Mengerti
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
