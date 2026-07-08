import { useState, useEffect, useId } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, BookOpen, Clock, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { Course } from '../lms/lmsTypes'

// Helper for UI styling mapping
const ACCENT_STYLES: Record<string, { border: string; badge: string; btn: string; dot: string; text: string; bg: string }> = {
  red: {
    border: 'hover:border-red-900/50 border-zinc-800',
    badge: 'text-red-400 border-red-900/50 bg-red-950/30',
    btn: 'bg-red-900/20 hover:bg-red-900/30 border-red-900/40 text-red-300',
    dot: 'bg-red-500',
    text: 'text-red-400',
    bg: 'bg-red-950/30 border-red-900/50'
  },
  blue: {
    border: 'hover:border-blue-900/50 border-zinc-800',
    badge: 'text-blue-400 border-blue-900/50 bg-blue-950/30',
    btn: 'bg-blue-900/20 hover:bg-blue-900/30 border-blue-900/40 text-blue-300',
    dot: 'bg-blue-500',
    text: 'text-blue-400',
    bg: 'bg-blue-950/30 border-blue-900/50'
  },
  purple: {
    border: 'hover:border-purple-900/50 border-zinc-800',
    badge: 'text-purple-400 border-purple-900/50 bg-purple-950/30',
    btn: 'bg-purple-900/20 hover:bg-purple-900/30 border-purple-900/40 text-purple-300',
    dot: 'bg-purple-500',
    text: 'text-purple-400',
    bg: 'bg-purple-950/30 border-purple-900/50'
  },
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

interface CourseWithEnrollmentCount extends Course {
  membersCount: number
}

export default function CourseManager() {
  const navigate = useNavigate()
  const uid = useId()
  const [courses, setCourses] = useState<CourseWithEnrollmentCount[]>([])
  const [loading, setLoading] = useState(true)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [errorText, setErrorText] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    track: '1',
    description: '',
    coverUrl: '',
  })

  async function loadCourses() {
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error('[supabase] Client is uninitialized.')
        setCourses([])
        return
      }

      // 1. Fetch courses from DB
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true })
      
      if (coursesError) throw coursesError

      // 2. Fetch enrollments to compute counts
      const { data: enrollmentsData } = await supabase
        .from('enrollments')
        .select('course_id')

      const enrollmentCounts: Record<string, number> = {}
      if (enrollmentsData) {
        enrollmentsData.forEach(e => {
          enrollmentCounts[e.course_id] = (enrollmentCounts[e.course_id] || 0) + 1
        })
      }

      const mapped: CourseWithEnrollmentCount[] = (coursesData || []).map(c => {
        const slug = c.slug || ''
        return {
          id: c.id,
          slug: slug,
          title: c.title,
          titleJa: slug.includes('jepang') ? '日本語' : slug.includes('paper') ? 'ペーパークラフト' : 'イラスト',
          badge: slug.includes('jepang') ? '職人' : slug.includes('paper') ? '紙' : 'アート',
          description: c.description || '',
          detail: c.description || '',
          track: getCourseTrack(slug),
          totalWeeks: 16,
          accentColor: getCourseAccent(slug),
          membersCount: enrollmentCounts[c.id] || 0
        }
      })

      setCourses(mapped)
    } catch (err) {
      console.error('Failed to load courses', err)
      setCourses([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCourses()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim()) return

    if (!supabase) {
      console.error('Client uninitialized')
      setErrorText('Database connection not established. Cannot save course.')
      return
    }

    try {
      setLoading(true)
      setErrorText(null)

      // Strict Slug Generation
      const generatedSlug = formData.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')

      const { error } = await supabase
        .from('courses')
        .insert({
          title: formData.title,
          slug: generatedSlug,
          description: formData.description,
          cover_url: formData.coverUrl.trim() || null
        })

      if (error) throw error

      setIsDrawerOpen(false)
      setFormData({ title: '', track: '1', description: '', coverUrl: '' })
      await loadCourses()
    } catch (err: any) {
      console.error('Failed to create course', err)
      setErrorText(err.message || 'Gagal membuat track baru. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Header */}
      <header className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Course & Track Creator</h1>
          <p className="text-xs text-zinc-500 mt-1">Kelola kelas, kategori track, dan pengaturan umum LMS.</p>
        </div>
        <button
          onClick={() => {
            setErrorText(null)
            setIsDrawerOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Course Baru
        </button>
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {loading && courses.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 h-44 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-8 h-8 bg-zinc-800 rounded" />
                  <div className="h-4 bg-zinc-800 rounded w-2/3" />
                  <div className="h-3 bg-zinc-800 rounded w-5/6" />
                </div>
                <div className="h-8 bg-zinc-800 rounded-md w-full" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/30 max-w-lg mx-auto mt-12">
            <BookOpen className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-400">
              Belum ada track peminatan yang terdaftar di database.
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Gunakan tombol "Buat Course Baru" di kanan atas untuk mulai membuat kurikulum.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => {
              const styles = ACCENT_STYLES[course.accentColor] ?? ACCENT_STYLES.red
              return (
                <div
                  key={course.id}
                  className={`bg-zinc-900 border rounded-lg p-5 hover:border-zinc-700 transition-colors flex flex-col group ${styles.border}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-2 rounded-md ${styles.bg}`}>
                      <BookOpen className={`w-5 h-5 ${styles.text}`} />
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider uppercase ${styles.bg} ${styles.text}`}>
                      Track {course.track}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-100 mb-1 group-hover:text-zinc-50 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-4 flex-1">{course.description}</p>

                  <div className="flex items-center gap-4 py-3 border-t border-zinc-800/60">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="text-xs font-medium text-zinc-300">
                        {course.membersCount} <span className="text-zinc-600 font-normal">Siswa</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="text-xs font-medium text-zinc-300">
                        {course.totalWeeks} <span className="text-zinc-600 font-normal">Minggu</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/studio/syllabus/${course.id}`)}
                    className="mt-2 w-full flex items-center justify-between px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-colors"
                  >
                    Kelola Kelas
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Drawer */}
      {isDrawerOpen && (
        <>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
              <h2 className="text-sm font-semibold text-zinc-100">Buat Course Baru</h2>
              <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label htmlFor={`${uid}-title`} className="block text-xs font-medium text-zinc-400 mb-1.5">Judul Course</label>
                <input
                  id={`${uid}-title`}
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Bahasa Jepang Dasar N5"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
                />
              </div>

              <div>
                <label htmlFor={`${uid}-track`} className="block text-xs font-medium text-zinc-400 mb-1.5">Track Category</label>
                <select
                  id={`${uid}-track`}
                  value={formData.track}
                  onChange={e => setFormData({ ...formData, track: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
                >
                  <option value="1">Track 1: Bahasa Jepang</option>
                  <option value="2">Track 2: Papercraft</option>
                  <option value="3">Track 3: Gambar / Ilustrasi</option>
                </select>
              </div>

              <div>
                <label htmlFor={`${uid}-desc`} className="block text-xs font-medium text-zinc-400 mb-1.5">Deskripsi / Detail Kurikulum</label>
                <textarea
                  id={`${uid}-desc`}
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tulis detail materi dan tujuan pembelajaran track ini..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 resize-none"
                />
              </div>

              <div>
                <label htmlFor={`${uid}-cover`} className="block text-xs font-medium text-zinc-400 mb-1.5">Cover Image URL (Opsional)</label>
                <input
                  id={`${uid}-cover`}
                  value={formData.coverUrl}
                  onChange={e => setFormData({ ...formData, coverUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
                />
              </div>

              {errorText && (
                <div className="text-xs text-red-500 font-semibold pt-1">
                  {errorText}
                </div>
              )}
            </form>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Batal</button>
              <button type="button" onClick={handleCreate} className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md text-xs font-semibold transition-colors">Simpan Course</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
