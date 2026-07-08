// ─────────────────────────────────────────────
// Shared Auth Types — JPER Community LMS
// ─────────────────────────────────────────────

/** Raw data collected in Step 1 of the register wizard */
export interface Step1Data {
  namaLengkap: string
  nisn: string            // 10 digit numeric string
  nisSekolah: string      // 4–5 digit numeric string
  kelasJurusan: string    // e.g. "XI TKJ 1"
  asalSekolah: string
  nomorWA: string         // e.g. 08xx / +62xx
  angkatan: string        // e.g. "2026"
  emailGmail: string      // personal Gmail for forwarding
  alasanBergabung: string // min 20 chars
}

/** Computed / generated in Step 2 */
export interface Step2Data {
  generatedUsername: string               // e.g. "yudhistira"
  generatedEmail: string                  // e.g. "yudhistira@shokunin.jpercommunity.id"
  collisionResolved: boolean              // true if name was de-duped
}

/** Credentials entered in Step 3 */
export interface Step3Data {
  password: string
  confirmPassword: string
}

/** Full wizard state */
export interface WizardState {
  currentStep: 1 | 2 | 3
  step1: Step1Data
  step2: Step2Data
  step3: Step3Data
  isSubmitting: boolean
  submitError: string | null
  submitSuccess: boolean
}

/** Validation error map — keyed by field name */
export type FieldErrors<T> = Partial<Record<keyof T, string>>

/** Supabase profiles table row shape */
export interface ProfileInsert {
  username: string
  email: string           // generated community email
  gmail: string           // personal Gmail
  full_name: string
  nisn: string
  nis_sekolah: string
  kelas_jurusan: string
  asal_sekolah: string
  nomor_wa: string
  angkatan: number
  alasan_bergabung: string
}
