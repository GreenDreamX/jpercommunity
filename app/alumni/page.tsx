import { ArrowLeft, BadgeCheck, BookOpenText, Users } from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function AlumniPage() {
  return (
    <main className="min-h-svh bg-background px-6 py-10 text-foreground md:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-fit rounded-lg")}>
          <ArrowLeft />
          Kembali ke landing
        </Link>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <Card className="bg-background">
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <BadgeCheck className="size-4 text-primary" />
                Alumni
              </CardDescription>
              <CardTitle className="text-3xl tracking-[-0.04em]">Jejak angkatan dan capaian yang bisa ditelusuri.</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-7 text-stone">
              <p>
                Halaman alumni menjadi ruang untuk dokumentasi angkatan, pencapaian belajar,
                dan rute lanjut setelah aktif di ekstrakurikuler.
              </p>
              <p>
                Kontennya nanti dapat memuat daftar alumni, sertifikat, dan arsip kegiatan yang
                tetap terasa formal dan mudah dibaca.
              </p>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardHeader>
              <CardDescription className="text-destructive">Status</CardDescription>
              <CardTitle className="text-2xl tracking-[-0.03em]">Dalam penataan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-7 text-foreground">
              <div className="flex items-center gap-2"><Users className="size-4 text-destructive" />Daftar angkatan</div>
              <div className="flex items-center gap-2"><BookOpenText className="size-4 text-destructive" />Arsip sertifikat</div>
              <div className="flex items-center gap-2"><BadgeCheck className="size-4 text-destructive" />Highlight pencapaian</div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  )
}