import { z } from "zod"

const baseFields = {
  namaLengkap: z.string().min(3, "Nama lengkap minimal 3 karakter."),
  tempatLahir: z.string().min(3, "Tempat lahir wajib diisi."),
  tanggalLahir: z.string().min(5, "Tanggal lahir wajib diisi."),
  nomorTelepon: z.string().min(10, "Nomor telepon minimal 10 digit."),
  email: z.email("Format email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  alasanIkut: z.string().min(25, "Alasan mengikuti ekskul minimal 25 karakter."),
}

const alumni = z.object({
  ...baseFields,
  angkatan: z.enum(["2023", "2022", "2021", "2020", "2019"]),
})

const activeStudent = z.object({
  ...baseFields,
  angkatan: z.enum(["2026", "2025", "2024"]),
  nisn: z.string().regex(/^\d{10}$/, "NISN harus 10 digit angka."),
  nis: z.string().regex(/^\d{9}$/, "NIS harus 9 digit angka."),
  kelas: z.string().min(1, "Kelas wajib diisi."),
  jurusan: z.string().min(1, "Jurusan wajib diisi."),
  asalSekolah: z.string().min(1, "Asal sekolah wajib diisi."),
})

const prospectiveStudent = z.object({
  ...baseFields,
  angkatan: z.enum(["2027", "2028"]),
  asalSmp: z.string().min(3, "Asal SMP wajib diisi."),
  readinessConsent: z.boolean().refine((val) => val === true, {
    message: "Persetujuan kesiapan wajib dicentang.",
  }),
})

export const registerSchema = z.discriminatedUnion("angkatan", [
  alumni,
  activeStudent,
  prospectiveStudent,
])

export type RegisterFormData = z.infer<typeof registerSchema>