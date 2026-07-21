import { z } from "zod"

const baseFields = {
  namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter."),
  nomorTelepon: z.string().min(10, "Nomor telepon minimal 10 digit."),
  email: z.email("Format email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  alasanIkut: z.string().min(25, "Alasan mengikuti ekskul minimal 25 karakter."),
}

const cohort2026 = z.object({
  ...baseFields,
  angkatan: z.literal("2026"),
  nisn: z.string().min(5, "NISN wajib diisi."),
  nis: z.string().min(3, "NIS wajib diisi."),
  asalSekolah: z.string().min(3, "Asal sekolah wajib diisi."),
})

const cohort2025Or2024 = z.object({
  ...baseFields,
  angkatan: z.union([z.literal("2025"), z.literal("2024")]),
  nisn: z.string().min(5, "NISN wajib diisi."),
  nis: z.string().min(3, "NIS wajib diisi."),
  kelas: z.string().min(1, "Kelas wajib diisi."),
})

const alumni = z.object({
  ...baseFields,
  angkatan: z.enum(["2023", "2022", "2021", "2020", "2019"]),
})

export const registerSchema = z.discriminatedUnion("angkatan", [
  cohort2026,
  cohort2025Or2024,
  alumni,
])

export type RegisterFormData = z.infer<typeof registerSchema>