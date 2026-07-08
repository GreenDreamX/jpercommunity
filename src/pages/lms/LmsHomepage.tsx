import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  BookOpen,
  Layers,
  Paintbrush,
  ChevronRight,
  BadgeCheck,
  LogOut,
  GraduationCap,
  Users,
  Clock,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { Course, UserProfile } from './lmsTypes'

// ────────────────────────────────────────────────────────
// Dynamic Helpers to enrich courses with JPER styling
// ────────────────────────────────────────────────────────
const ACCENT_STYLES: Record<string, { border: string; badge: string; btn: string; dot: string }> = {
  red: {
    border: 'hover:border-red-900/50',
    badge: 'text-red-400 border-red-900/50 bg-red-950/30',
    btn: 'bg-red-900/20 hover:bg-red-900/30 border-red-900/40 text-red-300',
    dot: 'bg-red-500',
  },
  blue: {
    border: 'hover:border-blue-900/50',
    badge: 'text-blue-400 border-blue-900/50 bg-blue-950/30',
    btn: 'bg-blue-900/20 hover:bg-blue-900/30 border-blue-900/40 text-blue-300',
    dot: 'bg-blue-500',
  },
  purple: {
    border: 'hover:border-purple-900/50',
    badge: 'text-purple-400 border-purple-900/50 bg-purple-950/30',
    btn: 'bg-purple-900/20 hover:bg-purple-900/30 border-purple-900/40 text-purple-300',
    dot: 'bg-purple-500',
  },
}

const TRACK_ICONS: Record<number, React.ReactNode> = {
  1: <BookOpen className="w-5 h-5" strokeWidth={1.5} />,
  2: <Layers className="w-5 h-5" strokeWidth={1.5} />,
  3: <Paintbrush className="w-5 h-5" strokeWidth={1.5} />,
}

function getCourseAccent(slug: string) {
  if (slug.includes('jepang')) return 'red'
  if (slug.includes('paper')) return 'blue'
  if (slug.includes('gambar') || slug.includes('ilustrasi')) return 'purple'
  return 'red'
}

function getCourseTrack(slug: string) {
  if (slug.includes('jepang')) return 1
  if (slug.includes('paper')) return 2
  if (slug.includes('gambar') || slug.includes('ilustrasi')) return 3
  return 1
}

function getCourseJapaneseTitle(slug: string) {
  if (slug.includes('jepang')) return '日本語コース'
  if (slug.includes('paper')) return 'ペーパークラフト'
  if (slug.includes('gambar') || slug.includes('ilustrasi')) return 'イラストレーション'
  return '新規コース'
}

function getCourseBadge(slug: string) {
  if (slug.includes('jepang')) return '職人'
  if (slug.includes('paper')) return '紙'
  if (slug.includes('gambar') || slug.includes('ilustrasi')) return 'アート'
  return '新'
}

interface CourseCardProps {
  course: Course
  enrolled: boolean
  onEnroll: () => void
}

function CourseCard({ course, enrolled, onEnroll }: CourseCardProps) {
  const navigate = useNavigate()
  const accent = ACCENT_STYLES[course.accentColor] ?? ACCENT_STYLES.red

  return (
    <div
      className={`relative flex flex-col bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 transition-all duration-200 ${accent.border}`}
    >
      {/* Track badge */}
      <div className="flex items-start justify-between mb-5">
        <div className={`p-2 rounded-md border ${accent.badge} transition-colors duration-200`}>
          {TRACK_ICONS[course.track]}
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold tracking-widest border rounded-sm ${accent.badge}`}>
          {course.badge}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-zinc-100 mb-0.5">{course.title}</h3>
      <p className="text-[11px] text-zinc-600 font-medium tracking-wide mb-3">
        {course.titleJa}
      </p>

      {/* Description */}
      <p className="text-xs font-medium text-zinc-400 mb-2">{course.description}</p>
      <p className="text-xs text-zinc-500 leading-relaxed flex-1 mb-5">{course.detail}</p>

      {/* Meta row */}
      <div className="flex items-center gap-4 mb-5 text-[10px] text-zinc-700 font-medium">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {course.totalWeeks} Minggu
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          Komunitas
        </span>
      </div>

      {/* Bottom indicator line */}
      <div className={`absolute bottom-0 left-0 right-0 h-px rounded-b-xl ${enrolled ? `${accent.dot} opacity-40` : 'bg-zinc-800'}`} />

      {/* CTA */}
      {enrolled ? (
        <button
          onClick={() => navigate(`/lms/course/${course.id}`)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-sm font-semibold transition-all duration-200"
        >
          Masuk Kelas
          <ChevronRight className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={onEnroll}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border text-sm font-semibold transition-all duration-200 ${accent.btn}`}
        >
          <GraduationCap className="w-4 h-4" />
          Enroll Sekarang
        </button>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-6 h-64 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-10 h-10 bg-zinc-800 rounded-md" />
            <div className="h-4 bg-zinc-800 rounded w-2/3" />
            <div className="h-3 bg-zinc-800 rounded w-1/2" />
            <div className="h-3 bg-zinc-800 rounded w-5/6" />
          </div>
          <div className="h-10 bg-zinc-800 rounded-md w-full" />
        </div>
      ))}
    </div>
  )
}

export default function LmsHomepage() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set())
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [completedTasksCount, setCompletedTasksCount] = useState(0)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        
        // 1. Get authenticated user
        const { data: { session } } = await supabase!.auth.getSession()
        let memberId = session?.user?.id

        // Fallback for development if no session exists: use the first profile in DB
        if (!memberId) {
          const { data: profiles } = await supabase!.from('profiles').select('id').limit(1)
          if (profiles && profiles.length > 0) {
            memberId = profiles[0].id
          }
        }

        if (memberId) {
          // 2. Fetch User Profile
          const { data: profile } = await supabase!
            .from('profiles')
            .select('*')
            .eq('id', memberId)
            .single()

          if (profile) {
            setUserProfile({
              id: profile.id,
              fullName: profile.nama_lengkap || 'Anggota JPER',
              username: profile.email_jper ? profile.email_jper.split('@')[0] : 'user',
              communityEmail: profile.email_jper || '',
              gmail: profile.email_pribadi || '',
              batch: String(profile.angkatan || ''),
              kelasJurusan: profile.kelas_jurusan || '',
              asalSekolah: profile.asal_sekolah || '',
              verifiedBadge: !!profile.is_verified_member
            })
          }

          // 3. Fetch User Enrollments
          const { data: enrollments } = await supabase!
            .from('enrollments')
            .select('course_id')
            .eq('member_id', memberId)

          if (enrollments) {
            setEnrolledIds(new Set(enrollments.map(e => e.course_id)))
          }

          // 4. Fetch Graded Submissions Count
          const { data: submissions } = await supabase!
            .from('submissions')
            .select('id')
            .eq('member_id', memberId)
          if (submissions) {
            setCompletedTasksCount(submissions.length)
          }
        }

        // 5. Fetch all courses
        const { data: coursesData } = await supabase!
          .from('courses')
          .select('*')
          .order('created_at', { ascending: true })

        if (coursesData) {
          const mappedCourses: Course[] = coursesData.map(c => {
            const slug = c.slug || ''
            return {
              id: c.id,
              slug: slug,
              title: c.title,
              titleJa: getCourseJapaneseTitle(slug),
              badge: getCourseBadge(slug),
              description: c.description || 'Tidak ada deskripsi singkat.',
              detail: c.description || 'Tidak ada detail track.',
              track: getCourseTrack(slug),
              totalWeeks: 16,
              accentColor: getCourseAccent(slug)
            }
          })
          setCourses(mappedCourses)
        }
      } catch (err) {
        console.error('Failed to load courses', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  async function handleEnroll(courseId: string) {
    if (!userProfile) {
      alert('Silakan login terlebih dahulu untuk mendaftar track.')
      return
    }
    try {
      const { error } = await supabase!
        .from('enrollments')
        .insert({
          member_id: userProfile.id,
          course_id: courseId
        })
      
      if (error) throw error
      setEnrolledIds(prev => new Set([...prev, courseId]))
    } catch (err) {
      console.error('Enrollment failed', err)
      alert('Gagal mendaftar ke kelas ini.')
    }
  }

  // Avatar initials
  const initials = userProfile?.fullName
    ? userProfile.fullName
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : 'JP'

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Subtle grid */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #a1a1aa 1px, transparent 1px), linear-gradient(to bottom, #a1a1aa 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="text-zinc-400 text-sm font-medium group-hover:text-zinc-200 transition-colors duration-150">
                JPER
              </span>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-100 text-sm font-semibold">LMS</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/lms/progress')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-md text-xs font-medium hover:bg-zinc-800 transition-colors duration-150"
            >
              Lihat Progress
            </button>
            <button
              onClick={() => navigate('/lms/dashboard')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-zinc-200 rounded-md text-xs font-medium hover:bg-zinc-700 transition-colors duration-150"
            >
              Scan Presensi
            </button>
            <button
              onClick={() => navigate('/lms/login')}
              className="flex items-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors duration-150"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Profile Header Card */}
        {userProfile && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 mb-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold text-zinc-300 shrink-0 select-none">
                {initials}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-zinc-100">{userProfile.fullName}</span>
                  {userProfile.verifiedBadge && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-900/40 bg-emerald-950/20 rounded-sm">
                      <BadgeCheck className="w-2.5 h-2.5" />
                      Verified
                    </span>
                  )}
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-widest text-red-400 border border-red-900/50 bg-red-950/30 rounded-sm">
                    職人
                  </span>
                </div>
                <p className="text-xs font-mono text-zinc-500 truncate mb-1">
                  {userProfile.communityEmail}
                </p>
                <div className="flex flex-wrap gap-3 text-[10px] text-zinc-700 font-medium">
                  <span>{userProfile.kelasJurusan}</span>
                  <span className="text-zinc-800">·</span>
                  <span>Angkatan {userProfile.batch}</span>
                  <span className="text-zinc-800">·</span>
                  <span>{userProfile.asalSekolah}</span>
                </div>
              </div>

              <div className="flex items-center gap-5 shrink-0">
                <div className="text-center">
                  <p className="text-lg font-bold text-zinc-100">{enrolledIds.size}</p>
                  <p className="text-[10px] text-zinc-600">Kelas Aktif</p>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-center">
                  <p className="text-lg font-bold text-zinc-100">{completedTasksCount}</p>
                  <p className="text-[10px] text-zinc-600">Tugas Terkirim</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Header */}
        <div className="mb-8">
          <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-2">
            Program Belajar
          </p>
          <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
            Pilih Track Pembelajaran
          </h1>
          <p className="mt-2 text-xs text-zinc-500 max-w-lg leading-relaxed">
            Tiga jalur spesialisasi tersedia. Kamu dapat enroll ke lebih dari satu track secara bersamaan.
          </p>
        </div>

        {/* Course Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/30">
            <BookOpen className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-400">
              Belum ada track peminatan yang dibuat oleh pengurus.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {courses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                enrolled={enrolledIds.has(course.id)}
                onEnroll={() => handleEnroll(course.id)}
              />
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-[11px] text-zinc-700 mt-12">
          JPER Community LMS · {new Date().getFullYear()} · Semua materi dilindungi hak cipta komunitas.
        </p>
      </main>
    </div>
  )
}
