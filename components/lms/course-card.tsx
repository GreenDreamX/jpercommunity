import Link from "next/link"
import { Lock, BookOpen, ChevronRight, Layers } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

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
    <Card className="group overflow-hidden border border-[#E4E1DA] bg-[#FAF9F6] shadow-none transition-all duration-300 hover:border-[#2B3A55]/50 hover:-translate-y-0.5 hover:shadow-md rounded-xl flex flex-col justify-between">
      <div>
        <div className="relative aspect-video w-full bg-[#E4E1DA]/30 overflow-hidden">
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
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2B3A55]/10 to-[#2B3A55]/5 text-[#2B3A55]/40 transition-transform duration-500 group-hover:scale-105">
              <BookOpen className="size-10 stroke-[1.5]" />
            </div>
          )}

          {/* Locked Badge Overlay */}
          {isLocked ? (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1C1B1A]/40 backdrop-blur-[2px]">
              <div className="flex items-center gap-1.5 rounded-full bg-[#FAF9F6] px-3 py-1 text-xs font-semibold text-[#1C1B1A] border border-[#E4E1DA] shadow-sm">
                <Lock className="size-3.5 text-[#B23A2E]" />
                Terkunci
              </div>
            </div>
          ) : (
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FAF9F6]/90 backdrop-blur-sm border border-[#E4E1DA] px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#2B3A55] shadow-xs">
                <Layers className="size-3 text-[#2B3A55]" />
                {weekCount ? `${weekCount} Pertemuan` : "Ekskul Sesi"}
              </span>
            </div>
          )}
        </div>

        <CardHeader className="p-4 pb-1">
          <CardTitle className="text-base font-bold tracking-tight text-[#1C1B1A] line-clamp-1 group-hover:text-[#2B3A55] transition-colors">
            {title}
          </CardTitle>
        </CardHeader>

        <CardContent className="px-4 pb-3 pt-0">
          <p className="text-xs text-[#6B6862] line-clamp-2 leading-relaxed h-8">
            {description ?? "Materi ekskul Bahasa Jepang JPER Community."}
          </p>
        </CardContent>
      </div>

      <CardFooter className="p-4 pt-3 border-t border-[#E4E1DA]/60 flex justify-end">
        {isLocked ? (
          <button
            disabled
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full cursor-not-allowed opacity-50 bg-[#E4E1DA]/50 text-[#6B6862] border-[#E4E1DA]"
            )}
          >
            Akses Dibatasi
          </button>
        ) : (
          <Link
            href={`/lms/course/${id}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 transition-all font-semibold shadow-none border-none flex items-center justify-center gap-1 rounded-lg"
            )}
          >
            Buka Pelajaran <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
