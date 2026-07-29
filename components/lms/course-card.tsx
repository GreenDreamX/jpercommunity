import Link from "next/link"
import { Lock, BookOpen } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

type CourseCardProps = {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  isLocked: boolean
}

export function CourseCard({ id, title, description, imageUrl, isLocked }: CourseCardProps) {
  return (
    <Card className="overflow-hidden border border-[#E4E1DA] bg-[#FAF9F6] shadow-none transition-colors hover:border-[#6B6862] rounded-lg">
      <div className="relative aspect-video w-full bg-[#E4E1DA]/40">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title}
            className={cn(
              "h-full w-full object-cover grayscale contrast-125 brightness-95",
              isLocked && "blur-[2px]"
            )}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#E4E1DA]/20 text-[#6B6862]">
            <BookOpen className="size-8 stroke-[1.5]" />
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1C1B1A]/40 backdrop-blur-[1px]">
            <div className="flex items-center gap-1.5 rounded bg-[#FAF9F6] px-2.5 py-1 text-xs font-medium text-[#1C1B1A] border border-[#E4E1DA]">
              <Lock className="size-3.5 stroke-[2]" />
              Terkunci
            </div>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight text-[#1C1B1A] line-clamp-1">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <p className="text-xs text-[#6B6862] line-clamp-2 leading-relaxed h-8">
          {description ?? "Belum ada deskripsi untuk kelas ini."}
        </p>
      </CardContent>

      <CardFooter className="p-4 pt-0 border-t border-[#E4E1DA] flex justify-end">
        {isLocked ? (
          <button
            disabled
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-full cursor-not-allowed opacity-50 bg-[#E4E1DA] text-[#6B6862]"
            )}
          >
            Hubungi Pembina
          </button>
        ) : (
          <Link
            href={`/lms/course/${id}`}
            className={cn(
              buttonVariants({ size: "sm" }),
              "w-full bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 transition-colors font-medium shadow-none border-none"
            )}
          >
            Buka Kelas
          </Link>
        )}
      </CardFooter>
    </Card>
  )
}
