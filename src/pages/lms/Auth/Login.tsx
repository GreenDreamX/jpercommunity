import { useState, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { auth } from '../../../lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

// ─────────────────────────────────────────────
// Inline Google Icon SVG
// ─────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LoginForm {
  email: string
  password: string
}

interface LoginErrors {
  email?: string
  password?: string
  general?: string
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function validateLogin(form: LoginForm): LoginErrors {
  const errors: LoginErrors = {}
  if (!form.email.trim()) {
    errors.email = 'Email tidak boleh kosong.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Format email tidak valid.'
  }
  if (!form.password) {
    errors.password = 'Password tidak boleh kosong.'
  } else if (form.password.length < 8) {
    errors.password = 'Password minimal 8 karakter.'
  }
  return errors
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
export default function Login() {
  const navigate = useNavigate()
  const uid = useId()

  const [emailFormOpen, setEmailFormOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isSSOLoading, setIsSSOLoading] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [errors, setErrors] = useState<LoginErrors>({})

  // ── SSO handler ──────────────────────────────
  async function handleSSO() {
    if (!supabase) {
      setErrors({ general: 'Supabase belum dikonfigurasi. Isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY di .env.local.' })
      return
    }
    setIsSSOLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/lms/dashboard` },
      })
      if (error) setErrors({ general: error.message })
    } catch {
      setErrors({ general: 'Terjadi kesalahan. Coba lagi.' })
    } finally {
      setIsSSOLoading(false)
    }
  }

  // ── Email / password handler ─────────────────
  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    const validation = validateLogin(form)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }
    setErrors({})
    setIsEmailLoading(true)
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password)
      navigate('/lms/dashboard')
    } catch (err: any) {
      console.error('Login failed:', err)
      setErrors({ general: 'Email atau password salah. Periksa kembali.' })
    } finally {
      setIsEmailLoading(false)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof LoginErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      {/* ── Subtle grid background ── */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #a1a1aa 1px, transparent 1px), linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* ── Brand mark ── */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-zinc-50 font-semibold text-sm tracking-wide">
              JPER COMMUNITY
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-widest text-red-400 border border-red-900/50 bg-red-950/30 rounded-sm">
              職人
            </span>
          </div>
          <p className="text-xs text-zinc-600 tracking-wide">
            Learning Management System
          </p>
        </div>

        {/* ── Card ── */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 backdrop-blur-sm">
          <h1 className="text-base font-semibold text-zinc-100 mb-1">Masuk ke LMS</h1>
          <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
            Gunakan akun Google yang terdaftar, atau login dengan email komunitas.
          </p>

          {/* ── Demo shortcut banner ── */}
          <div className="mb-5 px-3 py-3 rounded-md bg-zinc-800/60 border border-zinc-700/60">
            <p className="text-[11px] text-zinc-500 font-medium mb-2">🧪 Mode Demo (tanpa Supabase)</p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-zinc-600 font-mono mb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-700 font-sans font-medium not-italic">Email</span>
                <span className="text-zinc-400">yudhistira@shokunin.jpercommunity.id</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-zinc-700 font-sans font-medium not-italic">Password</span>
                <span className="text-zinc-400">demo1234</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/lms')}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 hover:border-zinc-500 text-xs font-semibold text-zinc-100 transition-all duration-200"
            >
              Masuk Langsung ke LMS (Demo)
            </button>
          </div>

          {/* ── Global error ── */}
          {errors.general && (
            <div className="mb-4 px-3 py-2.5 rounded-md bg-red-950/30 border border-red-900/50">
              <p className="text-xs text-red-400">{errors.general}</p>
            </div>
          )}

          {/* ── SSO Button ── */}
          <button
            id={`${uid}-sso-btn`}
            type="button"
            onClick={handleSSO}
            disabled={isSSOLoading || isEmailLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-md border border-zinc-700 bg-zinc-800 hover:bg-zinc-750 hover:border-zinc-600 text-sm font-medium text-zinc-100 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSSOLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {isSSOLoading ? 'Menghubungkan…' : 'Lanjut dengan Google / SSO'}
          </button>

          {/* ── Divider ── */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-900 px-3 text-[11px] text-zinc-600 tracking-wide">
                atau masuk dengan email
              </span>
            </div>
          </div>

          {/* ── Email accordion toggle ── */}
          <button
            id={`${uid}-email-toggle`}
            type="button"
            onClick={() => setEmailFormOpen(prev => !prev)}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-md border border-zinc-800 bg-zinc-900/50 hover:border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 transition-all duration-200"
            aria-expanded={emailFormOpen}
          >
            <span>Masuk dengan Email</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${emailFormOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* ── Email form (accordion body) ── */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              emailFormOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            <form onSubmit={handleEmailLogin} noValidate className="flex flex-col gap-3">
              {/* Email field */}
              <div>
                <label
                  htmlFor={`${uid}-email`}
                  className="block text-xs font-medium text-zinc-400 mb-1.5"
                >
                  Email Komunitas
                </label>
                <input
                  id={`${uid}-email`}
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="member@shokunin.jpercommunity.id"
                  className={`w-full px-3 py-2.5 rounded-md bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-700 border transition-colors duration-150 outline-none focus:ring-1 focus:ring-zinc-600 ${
                    errors.email
                      ? 'border-red-900 focus:ring-red-900/50'
                      : 'border-zinc-800 focus:border-zinc-600'
                  }`}
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor={`${uid}-password`}
                  className="block text-xs font-medium text-zinc-400 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id={`${uid}-password`}
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-3 py-2.5 pr-10 rounded-md bg-zinc-950 text-sm text-zinc-100 placeholder:text-zinc-700 border transition-colors duration-150 outline-none focus:ring-1 focus:ring-zinc-600 ${
                      errors.password
                        ? 'border-red-900 focus:ring-red-900/50'
                        : 'border-zinc-800 focus:border-zinc-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <button
                id={`${uid}-submit`}
                type="submit"
                disabled={isEmailLoading || isSSOLoading}
                className="w-full flex items-center justify-center gap-2 mt-1 px-4 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEmailLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEmailLoading ? 'Memverifikasi…' : 'Masuk ke LMS'}
              </button>
            </form>
          </div>
        </div>

        {/* ── Register link ── */}
        <p className="text-center text-xs text-zinc-600 mt-6">
          Belum punya identitas JPER?{' '}
          <Link
            to="/lms/register"
            className="text-zinc-400 hover:text-zinc-200 underline underline-offset-2 transition-colors duration-150"
          >
            Daftar di sini
          </Link>
        </p>
        <p className="text-center text-[10px] text-zinc-700 mt-2">
          atau langsung{' '}
          <button
            type="button"
            onClick={() => navigate('/lms')}
            className="text-zinc-600 hover:text-zinc-400 underline underline-offset-2 transition-colors duration-150"
          >
            buka LMS tanpa login
          </button>
        </p>
      </div>
    </div>
  )
}
