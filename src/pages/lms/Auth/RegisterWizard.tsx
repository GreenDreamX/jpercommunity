import { useState, useId } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  ChevronRight,
  Copy,
  Loader2,
  ShieldCheck,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { auth } from '../../../lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import type {
  Step1Data,
  Step2Data,
  Step3Data,
  FieldErrors,
  ProfileInsert,
} from './types'

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const EMAIL_DOMAIN = '@shokunin.jpercommunity.id'

// ─── Angkatan category helpers ───────────────
const ALUMNI_YEARS = ['2020', '2021', '2022', '2023']    // graduated, no class/school
const ACTIVE_YEARS = ['2024', '2025']                     // current students — need kelas
const FRESHMEN_YEAR = '2026'                              // incoming — need asal SMP

type AngkatanMode = 'alumni' | 'active' | 'freshmen' | 'unknown'

function getAngkatanMode(angkatan: string): AngkatanMode {
  if (ALUMNI_YEARS.includes(angkatan)) return 'alumni'
  if (ACTIVE_YEARS.includes(angkatan)) return 'active'
  if (angkatan === FRESHMEN_YEAR) return 'freshmen'
  return 'unknown'
}

// Mock existing usernames to simulate collision check.
// ─── Replace this with a real Supabase RPC call: ───
//   const { data } = await supabase.rpc('check_username_exists', { p_username: candidate })
const MOCK_EXISTING_USERNAMES = ['budi', 'sari', 'andi', 'dewi', 'reza']

// ─────────────────────────────────────────────
// Initial state factories
// ─────────────────────────────────────────────
const initialStep1: Step1Data = {
  namaLengkap: '',
  nisn: '',
  nisSekolah: '',
  kelasJurusan: '',
  asalSekolah: '',
  nomorWA: '',
  angkatan: '2026',
  emailGmail: '',
  alasanBergabung: '',
}

const initialStep2: Step2Data = {
  generatedUsername: '',
  generatedEmail: '',
  collisionResolved: false,
}

const initialStep3: Step3Data = {
  password: '',
  confirmPassword: '',
}

// ─────────────────────────────────────────────
// Validators
// ─────────────────────────────────────────────
/**
 * Dynamic Step 1 validator — only validates fields that are
 * actually visible for the selected angkatan / batch.
 */
function validateStep1(data: Step1Data): FieldErrors<Step1Data> {
  const e: FieldErrors<Step1Data> = {}
  const mode = getAngkatanMode(data.angkatan)

  // Always required
  if (!data.namaLengkap.trim())
    e.namaLengkap = 'Nama lengkap wajib diisi.'
  if (!/^\d{10}$/.test(data.nisn))
    e.nisn = 'NISN harus tepat 10 digit angka.'
  if (!/^(\+62|0)[0-9]{8,13}$/.test(data.nomorWA.replace(/\s/g, '')))
    e.nomorWA = 'Format nomor WA tidak valid (08xx / +62xx).'
  if (!data.angkatan)
    e.angkatan = 'Angkatan wajib dipilih.'
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(data.emailGmail))
    e.emailGmail = 'Email tidak valid.'
  if (data.alasanBergabung.trim().length < 20)
    e.alasanBergabung = 'Alasan bergabung minimal 20 karakter.'

  // NIS Sekolah — optional, but max 9 digits if provided
  if (data.nisSekolah && !/^\d{1,9}$/.test(data.nisSekolah))
    e.nisSekolah = 'NIS maksimal 9 digit angka.'

  // Conditional — Kelas & Jurusan (active students only)
  if (mode === 'active' && !data.kelasJurusan.trim())
    e.kelasJurusan = 'Kelas & jurusan wajib diisi untuk angkatan aktif.'

  // Conditional — Asal Sekolah SMP (freshmen only)
  if (mode === 'freshmen' && !data.asalSekolah.trim())
    e.asalSekolah = 'Asal sekolah SMP wajib diisi untuk angkatan baru.'

  return e
}

function validateStep3(data: Step3Data): FieldErrors<Step3Data> {
  const e: FieldErrors<Step3Data> = {}
  if (data.password.length < 8) e.password = 'Password minimal 8 karakter.'
  if (!data.confirmPassword) {
    e.confirmPassword = 'Konfirmasi password wajib diisi.'
  } else if (data.password !== data.confirmPassword) {
    e.confirmPassword = 'Password tidak cocok.'
  }
  return e
}

// ─────────────────────────────────────────────
// Username generator with collision resolution
// ─────────────────────────────────────────────
function generateUsername(namaLengkap: string): { username: string; collisionResolved: boolean } {
  const base = namaLengkap.trim().toLowerCase().split(/\s+/)[0]
  let candidate = base
  let resolved = false
  // Iteratively append the last char until unique
  while (MOCK_EXISTING_USERNAMES.includes(candidate)) {
    candidate = candidate + candidate[candidate.length - 1]
    resolved = true
  }
  return { username: candidate, collisionResolved: resolved }
}

// ─────────────────────────────────────────────
// Step Indicator
// ─────────────────────────────────────────────
interface StepIndicatorProps {
  current: 1 | 2 | 3
}

function StepIndicator({ current }: StepIndicatorProps) {
  const steps = [
    { id: 1, label: 'Data Diri' },
    { id: 2, label: 'Identitas' },
    { id: 3, label: 'Keamanan' },
  ]
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((step, i) => {
        const done = step.id < current
        const active = step.id === current
        return (
          <div key={step.id} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border text-xs font-semibold transition-all duration-300 ${
                  done
                    ? 'bg-red-950/40 border-red-900/60 text-red-400'
                    : active
                    ? 'bg-zinc-100 border-zinc-100 text-zinc-950'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600'
                }`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  active ? 'text-zinc-300' : 'text-zinc-600'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-px mb-5 mx-1 transition-colors duration-300 ${
                  step.id < current ? 'bg-red-900/40' : 'bg-zinc-800'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Shared Input components
// ─────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  id: string
}

function Field({ label, error, id, className = '', ...rest }: InputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
      </label>
      <input
        id={id}
        className={`w-full px-3 py-2.5 rounded-md bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-700 border outline-none focus:ring-1 transition-colors duration-150 ${
          error
            ? 'border-red-900 focus:ring-red-900/50'
            : 'border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700'
        } ${className}`}
        {...rest}
      />
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  id: string
  children: React.ReactNode
}

function SelectField({ label, error, id, children, ...rest }: SelectFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-zinc-400 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        className={`w-full px-3 py-2.5 rounded-md bg-zinc-950 text-sm text-zinc-100 border outline-none focus:ring-1 transition-colors duration-150 appearance-none cursor-pointer ${
          error
            ? 'border-red-900 focus:ring-red-900/50'
            : 'border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700'
        }`}
        {...rest}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 1 — Data Personal & Akademik
// ─────────────────────────────────────────────
interface Step1Props {
  data: Step1Data
  onChange: (field: keyof Step1Data, value: string) => void
  errors: FieldErrors<Step1Data>
  onNext: () => void
}

function Step1Form({ data, onChange, errors, onNext }: Step1Props) {
  const uid = useId()
  const mode = getAngkatanMode(data.angkatan)

  // Label & badge for angkatan context
  const modeBadge: Record<AngkatanMode, { label: string; cls: string } | null> = {
    active: { label: 'Siswa Aktif', cls: 'text-blue-400 border-blue-900/40 bg-blue-950/20' },
    freshmen: { label: 'Peserta Didik Baru', cls: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20' },
    alumni: { label: 'Alumni', cls: 'text-amber-400 border-amber-900/40 bg-amber-950/20' },
    unknown: null,
  }
  const badge = modeBadge[mode]

  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-100 mb-1">Data Personal & Akademik</h2>
      <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
        Isi seluruh data berikut dengan benar. Informasi ini akan tersimpan di profil komunitasmu.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Nama Lengkap — full width */}
        <div className="md:col-span-2">
          <Field
            id={`${uid}-nama`}
            label="Nama Lengkap"
            placeholder="Yudhistira Arya Pratama"
            value={data.namaLengkap}
            onChange={e => onChange('namaLengkap', e.target.value)}
            error={errors.namaLengkap}
            autoComplete="name"
          />
        </div>

        {/* NISN */}
        <Field
          id={`${uid}-nisn`}
          label="NISN (10 digit)"
          placeholder="0012345678"
          value={data.nisn}
          onChange={e => onChange('nisn', e.target.value.replace(/\D/g, '').slice(0, 10))}
          error={errors.nisn}
          inputMode="numeric"
          maxLength={10}
        />

        {/* NIS Sekolah — optional, max 9 digits */}
        <div>
          <label htmlFor={`${uid}-nis`} className="block text-xs font-medium text-zinc-400 mb-1.5">
            NIS Sekolah
            <span className="ml-1.5 text-zinc-600 font-normal">(opsional, maks. 9 digit)</span>
          </label>
          <input
            id={`${uid}-nis`}
            inputMode="numeric"
            maxLength={9}
            placeholder="123456789"
            value={data.nisSekolah}
            onChange={e => onChange('nisSekolah', e.target.value.replace(/\D/g, '').slice(0, 9))}
            className={`w-full px-3 py-2.5 rounded-md bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-700 border outline-none focus:ring-1 transition-colors duration-150 ${
              errors.nisSekolah
                ? 'border-red-900 focus:ring-red-900/50'
                : 'border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700'
            }`}
          />
          {errors.nisSekolah && (
            <p className="mt-1.5 text-xs text-red-500">{errors.nisSekolah}</p>
          )}
        </div>

        {/* Angkatan — always shown; drives conditional fields */}
        <SelectField
          id={`${uid}-angkatan`}
          label="Angkatan / Batch"
          value={data.angkatan}
          onChange={e => onChange('angkatan', e.target.value)}
          error={errors.angkatan}
        >
          <optgroup label="Alumni (2020 – 2023)">
            {['2020', '2021', '2022', '2023'].map(y => (
              <option key={y} value={y}>Angkatan {y}</option>
            ))}
          </optgroup>
          <optgroup label="Siswa Aktif">
            {['2024', '2025'].map(y => (
              <option key={y} value={y}>Angkatan {y}</option>
            ))}
          </optgroup>
          <optgroup label="Peserta Didik Baru">
            <option value="2026">Angkatan 2026</option>
          </optgroup>
          <optgroup label="Lainnya">
            <option value="2027">Angkatan 2027</option>
          </optgroup>
        </SelectField>

        {/* Angkatan mode badge — spans full width */}
        {badge && (
          <div className="md:col-span-2">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-medium ${badge.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
              {badge.label}
              {mode === 'alumni' && (
                <span className="ml-1 text-zinc-600 font-normal">— Kelas & asal sekolah tidak diperlukan</span>
              )}
              {mode === 'active' && (
                <span className="ml-1 text-zinc-600 font-normal">— Isi kelas & jurusan aktifmu</span>
              )}
              {mode === 'freshmen' && (
                <span className="ml-1 text-zinc-600 font-normal">— Isi asal sekolah SMP-mu</span>
              )}
            </div>
          </div>
        )}

        {/* Kelas & Jurusan — ACTIVE students only (2024, 2025) */}
        {mode === 'active' && (
          <Field
            id={`${uid}-kelas`}
            label="Kelas & Jurusan"
            placeholder="XI PPLG 1"
            value={data.kelasJurusan}
            onChange={e => onChange('kelasJurusan', e.target.value)}
            error={errors.kelasJurusan}
          />
        )}

        {/* Asal Sekolah SMP — FRESHMEN only (2026) */}
        {mode === 'freshmen' && (
          <Field
            id={`${uid}-sekolah`}
            label="Asal Sekolah SMP"
            placeholder="SMP Negeri 1 Contoh"
            value={data.asalSekolah}
            onChange={e => onChange('asalSekolah', e.target.value)}
            error={errors.asalSekolah}
          />
        )}

        {/* Nomor WhatsApp */}
        <Field
          id={`${uid}-wa`}
          label="Nomor WhatsApp Aktif"
          placeholder="08123456789"
          value={data.nomorWA}
          onChange={e => onChange('nomorWA', e.target.value)}
          error={errors.nomorWA}
          inputMode="tel"
          autoComplete="tel"
        />

        {/* Email Pribadi */}
        <Field
          id={`${uid}-gmail`}
          label="Email Pribadi"
          placeholder="namaanda@gmail.com atau email resmi"
          value={data.emailGmail}
          onChange={e => onChange('emailGmail', e.target.value)}
          error={errors.emailGmail}
          type="email"
          autoComplete="email"
        />

        {/* Alasan — full width */}
        <div className="md:col-span-2">
          <label
            htmlFor={`${uid}-alasan`}
            className="block text-xs font-medium text-zinc-400 mb-1.5"
          >
            Alasan Bergabung JPER Community
          </label>
          <textarea
            id={`${uid}-alasan`}
            value={data.alasanBergabung}
            onChange={e => onChange('alasanBergabung', e.target.value)}
            placeholder="Ceritakan motivasimu bergabung ke komunitas ini… (min. 20 karakter)"
            rows={4}
            className={`w-full px-3 py-2.5 rounded-md bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-700 border outline-none focus:ring-1 transition-colors duration-150 resize-none ${
              errors.alasanBergabung
                ? 'border-red-900 focus:ring-red-900/50'
                : 'border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700'
            }`}
          />
          <div className="flex items-start justify-between mt-1.5">
            {errors.alasanBergabung ? (
              <p className="text-xs text-red-500">{errors.alasanBergabung}</p>
            ) : (
              <span />
            )}
            <span className="text-[10px] text-zinc-700 shrink-0 ml-2">
              {data.alasanBergabung.length}/20
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 flex justify-end">
        <button
          id={`${uid}-next`}
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold transition-all duration-200"
        >
          Lanjut
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 2 — Digital Identity Card
// ─────────────────────────────────────────────
interface Step2Props {
  step1: Step1Data
  data: Step2Data
  onBack: () => void
  onNext: () => void
}

function Step2Identity({ step1, data, onBack, onNext }: Step2Props) {
  const uid = useId()
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(data.generatedEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-100 mb-1">Identitas Digital Dibuat</h2>
      <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
        Sistem telah memeriksa ketersediaan username dan menghasilkan identitas digital resmimu.
      </p>

      {/* Identity Card */}
      <div className="bg-zinc-900/80 border border-emerald-900/40 rounded-xl p-5 mb-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 rounded-md bg-emerald-950/50 border border-emerald-900/40">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-emerald-400">Identity Secured</p>
            <p className="text-[10px] text-zinc-600">
              {data.collisionResolved ? 'Username telah disesuaikan (collision resolved)' : 'Username tersedia'}
            </p>
          </div>
          {data.collisionResolved && (
            <span className="ml-auto inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-900/40 bg-amber-950/20 rounded-sm">
              Auto-adjusted
            </span>
          )}
        </div>

        {/* Generated email */}
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg px-4 py-3 mb-3">
          <p className="text-[10px] text-zinc-600 mb-1.5 tracking-wider uppercase font-medium">
            Email Komunitas Resmimu
          </p>
          <div className="flex items-center justify-between gap-2">
            <code className="text-sm sm:text-base font-mono font-semibold text-zinc-100 break-all">
              {data.generatedEmail}
            </code>
            <button
              id={`${uid}-copy`}
              type="button"
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-md border border-zinc-800 hover:border-zinc-600 text-zinc-500 hover:text-zinc-300 transition-all duration-150"
              aria-label="Salin email"
            >
              {copied ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Forwarding note */}
        <div className="flex items-start gap-2 p-3 rounded-md bg-zinc-900/60 border border-zinc-800/60">
          <Mail className="w-3.5 h-3.5 text-zinc-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-zinc-500 leading-relaxed">
            Seluruh email yang dikirim ke alamat ini akan secara otomatis diteruskan ke{' '}
            <span className="text-zinc-300 font-medium">{step1.emailGmail}</span> melalui
            Cloudflare Email Routing.
          </p>
        </div>
      </div>

      {/* Username breakdown */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <div className="p-3 rounded-md bg-zinc-900/40 border border-zinc-800">
          <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider font-medium">Username</p>
          <p className="text-sm font-mono text-zinc-200">{data.generatedUsername}</p>
        </div>
        <div className="p-3 rounded-md bg-zinc-900/40 border border-zinc-800">
          <p className="text-[10px] text-zinc-600 mb-1 uppercase tracking-wider font-medium">Angkatan</p>
          <p className="text-sm font-mono text-zinc-200">{step1.angkatan}</p>
        </div>
      </div>

      {/* CTA row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-sm transition-all duration-200"
        >
          Kembali
        </button>
        <button
          id={`${uid}-confirm`}
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold transition-all duration-200"
        >
          Konfirmasi & Lanjut
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// STEP 3 — Credential Setup
// ─────────────────────────────────────────────
interface Step3Props {
  step1: Step1Data
  step2: Step2Data
  data: Step3Data
  onChange: (field: keyof Step3Data, value: string) => void
  errors: FieldErrors<Step3Data>
  generalError: string | null
  isSubmitting: boolean
  onBack: () => void
  onSubmit: () => void
}

function Step3Credentials({
  step2,
  data,
  onChange,
  errors,
  generalError,
  isSubmitting,
  onBack,
  onSubmit,
}: Step3Props) {
  const uid = useId()
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div>
      <h2 className="text-base font-semibold text-zinc-100 mb-1">Keamanan Akun</h2>
      <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
        Buat password untuk akun JPER Community-mu. Password ini digunakan untuk masuk ke LMS.
      </p>

      <div className="flex flex-col gap-4">
        {/* Read-only generated email */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Email Komunitas (tidak dapat diubah)
          </label>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-md bg-zinc-900/40 border border-zinc-800 text-sm text-zinc-500 font-mono select-all cursor-default">
            {step2.generatedEmail}
          </div>
        </div>

        {/* Global error */}
        {generalError && (
          <div className="px-3 py-2.5 rounded-md bg-red-950/30 border border-red-900/50">
            <p className="text-xs text-red-400">{generalError}</p>
          </div>
        )}

        {/* Password */}
        <div>
          <label htmlFor={`${uid}-pwd`} className="block text-xs font-medium text-zinc-400 mb-1.5">
            Buat Password Akun JPER
          </label>
          <div className="relative">
            <input
              id={`${uid}-pwd`}
              type={showPwd ? 'text' : 'password'}
              value={data.password}
              onChange={e => onChange('password', e.target.value)}
              placeholder="Minimal 8 karakter"
              autoComplete="new-password"
              className={`w-full px-3 py-2.5 pr-10 rounded-md bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-700 border outline-none focus:ring-1 transition-colors duration-150 ${
                errors.password
                  ? 'border-red-900 focus:ring-red-900/50'
                  : 'border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label={showPwd ? 'Sembunyikan' : 'Tampilkan'}
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {/* Strength bar */}
          <div className="flex gap-1 mt-2">
            {[8, 12, 16].map(threshold => (
              <div
                key={threshold}
                className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                  data.password.length >= threshold ? 'bg-emerald-600' : 'bg-zinc-800'
                }`}
              />
            ))}
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor={`${uid}-confirm`} className="block text-xs font-medium text-zinc-400 mb-1.5">
            Konfirmasi Password
          </label>
          <div className="relative">
            <input
              id={`${uid}-confirm`}
              type={showConfirm ? 'text' : 'password'}
              value={data.confirmPassword}
              onChange={e => onChange('confirmPassword', e.target.value)}
              placeholder="Ulangi password di atas"
              autoComplete="new-password"
              className={`w-full px-3 py-2.5 pr-10 rounded-md bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-700 border outline-none focus:ring-1 transition-colors duration-150 ${
                errors.confirmPassword
                  ? 'border-red-900 focus:ring-red-900/50'
                  : 'border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(p => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              aria-label={showConfirm ? 'Sembunyikan' : 'Tampilkan'}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {data.password && data.confirmPassword && data.password === data.confirmPassword && (
            <p className="mt-1.5 text-xs text-emerald-500 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Password cocok
            </p>
          )}
          {errors.confirmPassword && (
            <p className="mt-1.5 text-xs text-red-500">{errors.confirmPassword}</p>
          )}
        </div>
      </div>

      {/* CTA row */}
      <div className="flex items-center justify-between gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="px-4 py-2.5 rounded-md border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 text-sm transition-all duration-200 disabled:opacity-40"
        >
          Kembali
        </button>
        <button
          id={`${uid}-submit`}
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Mendaftarkan…' : 'Submit Pendaftaran'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────
function SuccessScreen({ email }: { email: string }) {
  return (
    <div className="text-center py-6">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-950/40 border border-emerald-900/40 mb-5">
        <CheckCircle2 className="w-7 h-7 text-emerald-400" />
      </div>
      <h2 className="text-base font-semibold text-zinc-100 mb-2">Pendaftaran Berhasil!</h2>
      <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto mb-5">
        Akun komunitasmu telah dibuat. Cek email konfirmasi di{' '}
        <span className="text-zinc-300 font-medium font-mono text-[11px]">{email}</span>{' '}
        (atau Gmail-mu) untuk mengaktifkan akun.
      </p>
      <Link
        to="/lms/login"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold transition-all duration-200"
      >
        Masuk ke LMS
      </Link>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Wizard Component
// ─────────────────────────────────────────────
export default function RegisterWizard() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [step1, setStep1] = useState<Step1Data>(initialStep1)
  const [step2, setStep2] = useState<Step2Data>(initialStep2)
  const [step3, setStep3] = useState<Step3Data>(initialStep3)
  const [step1Errors, setStep1Errors] = useState<FieldErrors<Step1Data>>({})
  const [step3Errors, setStep3Errors] = useState<FieldErrors<Step3Data>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // ── Step 1 change handler ────────────────────
  function handleStep1Change(field: keyof Step1Data, value: string) {
    setStep1(prev => ({ ...prev, [field]: value }))
    if (step1Errors[field]) {
      setStep1Errors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // ── Step 1 → Step 2 ─────────────────────────
  function handleStep1Next() {
    const mode = getAngkatanMode(step1.angkatan)

    // Auto-populate hidden fields based on angkatan mode before validating
    let resolvedStep1 = { ...step1 }
    if (mode === 'alumni') {
      // Alumni: class metadata forced; asal sekolah not relevant
      resolvedStep1 = { ...resolvedStep1, kelasJurusan: 'Alumni', asalSekolah: '' }
    } else if (mode === 'active') {
      // Active students: asal sekolah not applicable
      resolvedStep1 = { ...resolvedStep1, asalSekolah: '' }
    } else if (mode === 'freshmen') {
      // Freshmen: kelas not applicable yet
      resolvedStep1 = { ...resolvedStep1, kelasJurusan: '' }
    }

    const errs = validateStep1(resolvedStep1)
    if (Object.keys(errs).length > 0) {
      setStep1Errors(errs)
      return
    }
    setStep1Errors({})

    // Persist the resolved (auto-populated) state before advancing
    setStep1(resolvedStep1)

    // Generate username + handle collision
    const { username, collisionResolved } = generateUsername(resolvedStep1.namaLengkap)
    setStep2({
      generatedUsername: username,
      generatedEmail: `${username}${EMAIL_DOMAIN}`,
      collisionResolved,
    })
    setCurrentStep(2)
  }

  // ── Step 3 change handler ────────────────────
  function handleStep3Change(field: keyof Step3Data, value: string) {
    setStep3(prev => ({ ...prev, [field]: value }))
    if (step3Errors[field]) {
      setStep3Errors(prev => ({ ...prev, [field]: undefined }))
    }
    if (generalError) setGeneralError(null)
  }

  // ── Final submit ─────────────────────────────
  async function handleSubmit() {
    const errs = validateStep3(step3)
    if (Object.keys(errs).length > 0) {
      setStep3Errors(errs)
      return
    }
    setStep3Errors({})
    setGeneralError(null)

    if (!supabase) {
      setGeneralError('Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di .env.local.')
      return
    }

    setIsSubmitting(true)

    try {
      // 1. Create auth user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        step2.generatedEmail,
        step3.password
      )

      const firebaseUser = userCredential.user

      // 2. Insert profile metadata into Supabase
      const profileRow: ProfileInsert = {
        username: step2.generatedUsername,
        email: step2.generatedEmail,
        gmail: step1.emailGmail,
        full_name: step1.namaLengkap,
        nisn: step1.nisn,
        nis_sekolah: step1.nisSekolah,
        kelas_jurusan: step1.kelasJurusan,
        asal_sekolah: step1.asalSekolah,
        nomor_wa: step1.nomorWA,
        angkatan: parseInt(step1.angkatan, 10),
        alasan_bergabung: step1.alasanBergabung,
      }

      if (firebaseUser?.uid) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({ id: firebaseUser.uid, ...profileRow })

        if (profileError) {
          console.error('[profiles] insert error:', profileError)
          // Non-blocking — auth succeeded, profile can be retried
        }
      }

      setSubmitSuccess(true)
    } catch (err: any) {
      console.error('Registration failed:', err)
      setGeneralError(err.message || 'Terjadi kesalahan tidak terduga. Coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #a1a1aa 1px, transparent 1px), linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-xl">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-1">
            <span className="text-zinc-50 font-semibold text-sm tracking-wide">JPER COMMUNITY</span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-widest text-red-400 border border-red-900/50 bg-red-950/30 rounded-sm">
              職人
            </span>
          </div>
          <p className="text-xs text-zinc-600 tracking-wide">Daftar Identitas Digital</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 sm:p-8 backdrop-blur-sm">
          {submitSuccess ? (
            <SuccessScreen email={step2.generatedEmail} />
          ) : (
            <>
              <StepIndicator current={currentStep} />

              {currentStep === 1 && (
                <Step1Form
                  data={step1}
                  onChange={handleStep1Change}
                  errors={step1Errors}
                  onNext={handleStep1Next}
                />
              )}

              {currentStep === 2 && (
                <Step2Identity
                  step1={step1}
                  data={step2}
                  onBack={() => setCurrentStep(1)}
                  onNext={() => setCurrentStep(3)}
                />
              )}

              {currentStep === 3 && (
                <Step3Credentials
                  step1={step1}
                  step2={step2}
                  data={step3}
                  onChange={handleStep3Change}
                  errors={step3Errors}
                  generalError={generalError}
                  isSubmitting={isSubmitting}
                  onBack={() => setCurrentStep(2)}
                  onSubmit={handleSubmit}
                />
              )}
            </>
          )}
        </div>

        {/* Login link */}
        {!submitSuccess && (
          <p className="text-center text-xs text-zinc-600 mt-6">
            Sudah punya akun?{' '}
            <Link
              to="/lms/login"
              className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors duration-150"
            >
              Masuk ke LMS
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
