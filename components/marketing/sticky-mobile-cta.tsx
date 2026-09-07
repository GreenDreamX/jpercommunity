"use client"

import Link from "next/link"
import { ArrowRight, UserPlus } from "lucide-react"
import { motion } from "framer-motion"

export function StickyMobileCta() {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
      className="fixed bottom-3 left-3 right-3 z-40 md:hidden bg-[#1C1B1A]/95 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 text-white"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-9 rounded-xl bg-[#B23A2E] flex items-center justify-center shrink-0">
          <UserPlus className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-bold truncate">Ekstrakurikuler JPER</div>
          <div className="text-[10px] text-stone-300 truncate">SMKN 1 Majalaya</div>
        </div>
      </div>

      <Link
        href="/register"
        className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold px-4 py-2 rounded-xl shadow-xs shrink-0 flex items-center gap-1 border-none cursor-pointer"
      >
        Daftar <ArrowRight className="size-3.5" />
      </Link>
    </motion.div>
  )
}
