"use client"

import { ArrowRight, UserPlus, Star } from "lucide-react"
import { motion } from "framer-motion"

export function StickyMobileCta() {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, duration: 0.3 }}
      className="fixed bottom-3 left-3 right-3 z-40 md:hidden bg-white border-2 border-black p-3 shadow-[5px_5px_0px_#111] flex items-center justify-between gap-3 text-black"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-9 bg-[#E60012] border-2 border-black flex items-center justify-center shrink-0 text-white shadow-[2px_2px_0px_#FFC700] -skew-x-6">
          <UserPlus className="size-4 skew-x-6" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-tight flex items-center gap-1">
            <span>JPER COMMUNITY</span>
            <span className="text-[#E60012]">★</span>
          </div>
          <div className="text-[10px] font-bold text-zinc-600 truncate">SMKN 1 Majalaya</div>
        </div>
      </div>

      <a
        href="https://forms.jper.my.id/register"
        target="_blank"
        rel="noreferrer"
        className="bg-[#E60012] text-white hover:bg-[#C0000F] text-xs font-black uppercase tracking-wider px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#FFC700] shrink-0 flex items-center gap-1.5 cursor-pointer active:translate-y-0.5 active:shadow-none"
      >
        Daftar <ArrowRight className="size-3.5 text-[#FFC700]" />
      </a>
    </motion.div>
  )
}

