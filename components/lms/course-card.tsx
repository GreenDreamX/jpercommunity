"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Lock, BookOpen, ChevronRight, Layers } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CourseCardProps = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  isLocked: boolean
  weekCount?: number
}

export function CourseCard({ id, title, description, imageUrl, isLocked, weekCount }: CourseCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.15 }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden border-2 border-black bg-white shadow-[5px_5px_0px_#111] transition-all duration-200 hover:shadow-[7px_7px_0px_#E60012] rounded-none flex flex-col justify-between">
        <div>
          <div className="relative aspect-video w-full bg-zinc-100 border-b-2 border-black overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={title}
                className={cn(
                  "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
                  isLocked && "blur-[2px] opacity-75"
                )}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-black transition-transform duration-500 group-hover:scale-105">
                <BookOpen className="size-10 stroke-[2] text-black" />
              </div>
            )}

            {/* Locked vs Week Count Badge */}
            {isLocked ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
                <div className="flex items-center gap-1.5 border-2 border-black bg-[#E60012] text-white px-3 py-1 text-xs font-black uppercase tracking-wider -skew-x-6 shadow-[3px_3px_0px_#FFC700]">
                  <Lock className="size-3.5 text-white skew-x-6" />
                  TERKUNCI
                </div>
              </div>
            ) : (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1.5 border border-black bg-black text-[#FFC700] px-2.5 py-0.5 text-[10px] font-mono font-black uppercase tracking-widest -skew-x-6 shadow-[2px_2px_0px_#E60012]">
                  <Layers className="size-3 text-[#FFC700] skew-x-6" />
                  {weekCount ? `${weekCount} PERTEMUAN` : "EKUSKUL SESI"}
                </span>
              </div>
            )}
          </div>

          <CardHeader className="p-4 pb-2">
            <CardTitle className="font-heading text-lg font-black uppercase tracking-tight text-black line-clamp-1 group-hover:text-[#E60012] transition-colors">
              {title}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-3 pt-0">
            <p className="text-xs font-medium text-zinc-700 line-clamp-2 leading-relaxed h-8">
              {description ?? "Materi pembelajaran ekskul Bahasa Jepang JPER Community."}
            </p>
          </CardContent>
        </div>

        <CardFooter className="p-4 pt-3 border-t-2 border-black bg-[#FAF9F5] flex justify-end">
          {isLocked ? (
            <button
              disabled
              className="w-full border-2 border-black bg-zinc-200 text-zinc-600 font-black uppercase tracking-wider text-xs py-2.5 cursor-not-allowed opacity-80"
            >
              AKSES DIBATASI
            </button>
          ) : (
            <Link
              href={`/lms/course/${id}`}
              className="w-full flex items-center justify-center gap-1.5 border-2 border-black bg-[#E60012] text-white py-2.5 text-xs font-black uppercase tracking-wider shadow-[3px_3px_0px_#FFC700] hover:bg-[#FFC700] hover:text-black hover:shadow-[4px_4px_0px_#111] transition-all duration-150 active:translate-x-1 active:translate-y-1 active:shadow-none"
            >
              <span>BUKA KELAS</span>
              <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  )
}
