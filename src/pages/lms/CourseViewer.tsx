import { useState, useRef, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Lock,
  ChevronDown,
  ChevronRight,
  Play,
  FileText,
  Upload,
  X,
  CheckCircle2,
  Star,
  MessageSquare,
  Send,
  User,
  Clock,
  AlertCircle,
  LayoutList,
  BookOpen,
  ArrowLeft,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { SyllabusWeek, SubmissionStatus } from './lmsTypes'

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(iso: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

function parseVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`
  const vim = url.match(/vimeo\.com\/(\d+)/)
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`
  return null
}

// ─────────────────────────────────────────────
// Material Sub-components
// ─────────────────────────────────────────────

function ContentSection({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-800/60 bg-zinc-900/80">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-xs font-semibold text-zinc-400 tracking-wide uppercase">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function TextSection({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
      {lines.map((line, i) => {
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="text-base font-bold text-zinc-100 mt-4 first:mt-0">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('**') && line.endsWith('**'))
          return (
            <p key={i} className="font-semibold text-zinc-200">
              {line.slice(2, -2)}
            </p>
          )
        if (line.startsWith('> '))
          return (
            <div key={i} className="flex gap-2 pl-3 border-l-2 border-zinc-700 text-zinc-400 italic text-xs">
              {line.slice(2)}
            </div>
          )
        if (line.startsWith('- '))
          return (
            <li key={i} className="ml-4 list-disc text-zinc-400 text-xs">
              {line.slice(2)}
            </li>
          )
        if (/^\d+\./.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-zinc-400 text-xs">
              {line.replace(/^\d+\.\s/, '')}
            </li>
          )
        if (line.trim() === '') return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-zinc-400 text-xs leading-relaxed">
            {line}
          </p>
        )
      })}
    </div>
  )
}

function VideoPlayer({ videoUrl }: { videoUrl: string }) {
  const embedUrl = parseVideoEmbed(videoUrl)
  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ paddingBottom: '56.25%' }}>
      {embedUrl ? (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Course Video"
        />
      ) : (
        <video src={videoUrl} controls className="absolute inset-0 w-full h-full object-contain" />
      )}
    </div>
  )
}

function FileViewer({ fileUrl }: { fileUrl: string }) {
  return (
    <div className="space-y-3">
      <div className="h-[420px] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
        <iframe src={fileUrl} className="w-full h-full" title="Handout PDF" />
      </div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors duration-150"
      >
        <FileText className="w-3.5 h-3.5" />
        Buka PDF di tab baru
      </a>
    </div>
  )
}

const STATUS_CONFIG: Record<
  SubmissionStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  none: {
    label: 'Belum Mengumpulkan',
    cls: 'text-red-400 border-red-900/40 bg-red-950/20',
    icon: <AlertCircle className="w-3.5 h-3.5" />,
  },
  submitted: {
    label: 'Selesai Dikumpulkan',
    cls: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20',
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  graded: {
    label: 'Sudah Dinilai',
    cls: 'text-amber-400 border-amber-900/40 bg-amber-950/20',
    icon: <Star className="w-3.5 h-3.5" />,
  },
}

interface SubmissionContainerProps {
  meetingId: string
  memberId: string
  onSubmissionComplete: () => void
}

function SubmissionContainer({ meetingId, memberId, onSubmissionComplete }: SubmissionContainerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [submission, setSubmission] = useState<any | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchSubmission = useCallback(async () => {
    if (!memberId || !meetingId) return
    const { data } = await supabase!
      .from('submissions')
      .select('*')
      .eq('meeting_id', meetingId)
      .eq('member_id', memberId)
      .maybeSingle()
    setSubmission(data)
  }, [meetingId, memberId])

  useEffect(() => {
    fetchSubmission()
  }, [fetchSubmission])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) setSelectedFile(file)
  }, [])

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  async function handleSubmitFile() {
    if (!selectedFile || !memberId || !meetingId) return
    setLoading(true)
    try {
      // Simulate file upload or use filename as reference
      const { error } = await supabase!
        .from('submissions')
        .insert({
          meeting_id: meetingId,
          member_id: memberId,
          file_url: selectedFile.name
        })

      if (error) throw error
      setSelectedFile(null)
      await fetchSubmission()
      onSubmissionComplete()
    } catch (err) {
      console.error('Failed to submit assignment', err)
      alert('Gagal mengumpulkan tugas.')
    } finally {
      setLoading(false)
    }
  }

  // Compute status
  let status: SubmissionStatus = 'none'
  if (submission) {
    status = submission.score !== null ? 'graded' : 'submitted'
  }
  const statusCfg = STATUS_CONFIG[status]

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-lg bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-400 leading-relaxed">
        Kumpulkan hasil pengerjaan tugas/praktik pertemuan ini sesuai instruksi pada materi di atas.
      </div>

      <div className="flex items-center gap-2">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold ${statusCfg.cls}`}>
          {statusCfg.icon}
          {statusCfg.label}
        </div>
        {submission?.file_url && (
          <span className="text-[11px] text-zinc-600 font-mono truncate max-w-xs">
            {submission.file_url}
          </span>
        )}
      </div>

      {status === 'graded' && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-950/10 border border-amber-900/30">
          <Star className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-amber-300 mb-0.5">Nilai: {submission.score}/100</p>
          </div>
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept=".pdf,.jpg,.jpeg,.png,.mp4,.mov,.zip"
        />
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 py-8 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-zinc-500 bg-zinc-800/30'
              : 'border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-800/20'
          }`}
        >
          <Upload className={`w-5 h-5 transition-colors duration-200 ${isDragging ? 'text-zinc-300' : 'text-zinc-600'}`} />
          {selectedFile ? (
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              {selectedFile.name}
            </div>
          ) : (
            <>
              <p className="text-xs text-zinc-500">Drag & drop file, atau klik untuk browse</p>
              <p className="text-[10px] text-zinc-700">PDF, JPG, PNG, MP4, MOV, ZIP · Maks. 100 MB</p>
            </>
          )}
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleSubmitFile}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-all duration-200 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              {loading ? 'Mengirim...' : 'Kumpulkan Tugas'}
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-2 rounded-md text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800 transition-all duration-150"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface WeeklyForumProps {
  meetingId: string
  memberId: string
}

function WeeklyForum({ meetingId, memberId }: WeeklyForumProps) {
  const [comments, setComments] = useState<any[]>([])
  const [text, setText] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchComments = useCallback(async () => {
    if (!meetingId) return
    const { data } = await supabase!
      .from('forum_comments')
      .select('*, profiles(nama_lengkap, email_jper)')
      .eq('meeting_id', meetingId)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }, [meetingId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [comments])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !memberId || !meetingId) return
    try {
      const { error } = await supabase!
        .from('forum_comments')
        .insert({
          meeting_id: meetingId,
          member_id: memberId,
          comment: text.trim(),
          is_anonymous: isAnonymous
        })

      if (error) throw error
      setText('')
      fetchComments()
    } catch (err) {
      console.error('Failed to post comment', err)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={scrollRef}
        className="flex flex-col gap-3 max-h-72 overflow-y-auto pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#3f3f46 transparent' }}
      >
        {comments.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-6">
            Belum ada diskusi. Jadilah yang pertama berkomentar!
          </p>
        )}
        {comments.map(c => {
          const authorName = c.is_anonymous ? 'Anonim' : (c.profiles?.nama_lengkap || 'Anggota')
          const initials = authorName.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase()
          return (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                {c.is_anonymous ? (
                  <User className="w-3.5 h-3.5 text-zinc-600" />
                ) : (
                  <span className="text-[9px] font-bold text-zinc-400">{initials}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-zinc-300">{authorName}</span>
                  <span className="text-[10px] text-zinc-700">{formatRelative(c.created_at)}</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{c.comment}</p>
              </div>
            </div>
          )
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <div className="relative">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e)
            }}
            placeholder="Tulis komentar atau pertanyaan… (Ctrl+Enter untuk kirim)"
            rows={3}
            className="w-full px-3 py-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700 resize-none transition-colors duration-150"
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="w-3.5 h-3.5 rounded border border-zinc-700 bg-zinc-900 accent-zinc-500"
            />
            <span className="text-[11px] text-zinc-600">Kirim sebagai Anonim</span>
          </label>
          <button
            type="submit"
            disabled={!text.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-xs font-medium text-zinc-100 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            Kirim
          </button>
        </div>
      </form>
    </div>
  )
}

interface WeekItemProps {
  week: SyllabusWeek
  isActive: boolean
  onClick: () => void
  submission: any
}

function WeekItem({ week, isActive, onClick, submission }: WeekItemProps) {
  const isLocked = week.status === 'lock'
  const isUnlocked = week.status === 'unlock'

  // Determine submission status
  let submissionStatus: SubmissionStatus = 'none'
  if (submission) {
    submissionStatus = submission.score !== null ? 'graded' : 'submitted'
  }

  return (
    <button
      onClick={isUnlocked ? onClick : undefined}
      disabled={isLocked}
      className={`w-full text-left px-4 py-3.5 border-b border-zinc-800/60 last:border-b-0 transition-all duration-150 flex items-start gap-3 ${
        isActive
          ? 'bg-zinc-800/60 border-l-2 border-l-zinc-400 pl-[14px]'
          : isUnlocked
          ? 'hover:bg-zinc-800/30 border-l-2 border-l-transparent cursor-pointer'
          : 'opacity-50 cursor-not-allowed border-l-2 border-l-transparent'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
          isActive ? 'bg-zinc-100 text-zinc-950' : isUnlocked ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-900 text-zinc-700'
        }`}
      >
        {isLocked ? <Lock className="w-3 h-3" /> : week.weekNumber}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-xs font-semibold leading-snug mb-0.5 ${isActive ? 'text-zinc-100' : 'text-zinc-300'}`}>
          {week.title}
        </p>

        {isLocked && week.dueDate && (
          <div className="flex items-center gap-1 mt-1.5">
            <Clock className="w-2.5 h-2.5 text-zinc-700 shrink-0" />
            <span className="text-[10px] text-zinc-700">Dibuka: {formatDate(week.dueDate)}</span>
          </div>
        )}

        {isUnlocked && submissionStatus !== 'none' && (
          <div
            className={`inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
              submissionStatus === 'graded' ? 'bg-amber-950/30 text-amber-400' : 'bg-emerald-950/30 text-emerald-400'
            }`}
          >
            {submissionStatus === 'graded' ? <Star className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
            {submissionStatus === 'graded' ? 'Dinilai' : 'Terkumpul'}
          </div>
        )}
      </div>

      {isUnlocked && !isActive && <ChevronRight className="w-3.5 h-3.5 text-zinc-700 shrink-0 mt-1" />}
    </button>
  )
}

export default function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<any | null>(null)
  const [weeks, setWeeks] = useState<SyllabusWeek[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [activeWeekId, setActiveWeekId] = useState<string | null>(null)
  const [mobileSyllabusOpen, setMobileSyllabusOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [memberId, setMemberId] = useState<string>('')

  const fetchCourseAndSyllabus = useCallback(async () => {
    if (!courseId) return
    try {
      setLoading(true)

      // 1. Fetch Course details
      const { data: courseData } = await supabase!
        .from('courses')
        .select('*')
        .or(`id.eq.${courseId},slug.eq.${courseId}`)
        .maybeSingle()

      if (!courseData) {
        setCourse(null)
        setLoading(false)
        return
      }

      setCourse(courseData)

      // 2. Get Member ID
      const { data: { session } } = await supabase!.auth.getSession()
      let currentMemberId = session?.user?.id
      if (!currentMemberId) {
        const { data: profiles } = await supabase!.from('profiles').select('id').limit(1)
        if (profiles && profiles.length > 0) {
          currentMemberId = profiles[0].id
        }
      }
      if (currentMemberId) setMemberId(currentMemberId)

      // 3. Fetch Meetings (weeks)
      const { data: meetingsData } = await supabase!
        .from('meetings')
        .select('*')
        .eq('course_id', courseData.id)
        .neq('status', 'hide')
        .order('week_number', { ascending: true })

      if (meetingsData) {
        const mappedWeeks: SyllabusWeek[] = meetingsData.map(m => ({
          id: m.id,
          courseId: m.course_id,
          weekNumber: m.week_number,
          title: m.title,
          subtitle: '',
          status: m.status,
          dueDate: m.due_date,
          content: {
            text: m.markdown_content || undefined,
            videoUrl: m.video_url || undefined,
            fileUrl: m.file_viewer_url || undefined,
            assignment: {
              instructions: 'Kumpulkan hasil pengerjaan tugas pertemuan ini.',
              submissionStatus: 'none'
            }
          }
        }))
        setWeeks(mappedWeeks)

        // Set active week
        const firstUnlocked = mappedWeeks.find(w => w.status === 'unlock')
        if (firstUnlocked) {
          setActiveWeekId(firstUnlocked.id)
        }
      }

      // 4. Fetch user submissions
      if (currentMemberId) {
        const { data: subsData } = await supabase!
          .from('submissions')
          .select('*')
          .eq('member_id', currentMemberId)
        if (subsData) setSubmissions(subsData)
      }
    } catch (err) {
      console.error('Failed to load course content', err)
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    fetchCourseAndSyllabus()
  }, [fetchCourseAndSyllabus])

  const refreshSubmissions = useCallback(async () => {
    if (!memberId) return
    const { data } = await supabase!
      .from('submissions')
      .select('*')
      .eq('member_id', memberId)
    if (data) setSubmissions(data)
  }, [memberId])

  if (loading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-sm text-zinc-500">Memuat materi kelas...</p>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4 text-center p-6">
        <BookOpen className="w-10 h-10 text-zinc-700" />
        <h2 className="text-sm font-semibold text-zinc-300">Kelas Tidak Ditemukan</h2>
        <Link to="/lms" className="text-xs text-indigo-400 hover:underline flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke LMS Home
        </Link>
      </div>
    )
  }

  const activeWeek = weeks.find(w => w.id === activeWeekId) ?? null

  return (
    <div className="h-screen bg-zinc-950 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 sm:px-6 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm z-30">
        <Link
          to="/lms"
          className="p-1.5 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 transition-all duration-150"
          aria-label="Kembali ke LMS Home"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-px h-4 bg-zinc-800" />
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-zinc-600 shrink-0" />
          <span className="text-sm font-semibold text-zinc-100 truncate">{course.title}</span>
        </div>

        {/* Mobile syllabus toggle */}
        <button
          onClick={() => setMobileSyllabusOpen(p => !p)}
          className="ml-auto lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 transition-all duration-150"
        >
          <LayoutList className="w-3.5 h-3.5" />
          Silabus
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${mobileSyllabusOpen ? 'rotate-180' : ''}`} />
        </button>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Sidebar — Syllabus */}
        <aside
          className={`
          lg:w-72 xl:w-80 shrink-0 border-b lg:border-b-0 lg:border-r border-zinc-800/60
          bg-zinc-950 overflow-y-auto
          ${mobileSyllabusOpen ? 'block' : 'hidden'} lg:block
        `}
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
        >
          <div className="sticky top-0 z-10 px-4 py-3 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm">
            <p className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase mb-0.5">Silabus</p>
            <p className="text-xs font-semibold text-zinc-300">
              {weeks.filter(w => w.status === 'unlock').length} dari {weeks.length} Minggu Terbuka
            </p>
          </div>

          <div>
            {weeks.map(week => (
              <WeekItem
                key={week.id}
                week={week}
                isActive={week.id === activeWeekId}
                submission={submissions.find(s => s.meeting_id === week.id)}
                onClick={() => {
                  setActiveWeekId(week.id)
                  setMobileSyllabusOpen(false)
                }}
              />
            ))}
          </div>
        </aside>

        {/* Main content area */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#27272a transparent' }}
        >
          {weeks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400 max-w-sm">
                Materi belajar belum di-input oleh Pengurus untuk track ini.
              </p>
            </div>
          ) : !activeWeek ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5 text-zinc-600" />
              </div>
              <p className="text-sm font-medium text-zinc-400 mb-1">Pilih minggu dari silabus</p>
              <p className="text-xs text-zinc-700 max-w-xs">
                Klik salah satu minggu yang terbuka di panel sebelah kiri untuk mulai belajar.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">
              <div className="pb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] text-zinc-600 font-medium tracking-widest uppercase">
                    Minggu {activeWeek.weekNumber}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-zinc-100">{activeWeek.title}</h2>
              </div>

              {/* 1. Text / Material Description */}
              {activeWeek.content?.text && (
                <ContentSection icon={<BookOpen className="w-3.5 h-3.5" />} title="Materi Minggu Ini">
                  <TextSection text={activeWeek.content.text} />
                </ContentSection>
              )}

              {/* 2. Video Player */}
              {activeWeek.content?.videoUrl && (
                <ContentSection icon={<Play className="w-3.5 h-3.5" />} title="Video Pembelajaran">
                  <VideoPlayer videoUrl={activeWeek.content.videoUrl} />
                </ContentSection>
              )}

              {/* 3. File / PDF Viewer */}
              {activeWeek.content?.fileUrl && (
                <ContentSection icon={<FileText className="w-3.5 h-3.5" />} title="Handout & Referensi">
                  <FileViewer fileUrl={activeWeek.content.fileUrl} />
                </ContentSection>
              )}

              {/* 4. Submission Container */}
              {memberId && (
                <ContentSection icon={<Upload className="w-3.5 h-3.5" />} title="Pengumpulan Tugas">
                  <SubmissionContainer
                    key={activeWeek.id}
                    meetingId={activeWeek.id}
                    memberId={memberId}
                    onSubmissionComplete={refreshSubmissions}
                  />
                </ContentSection>
              )}

              {/* 5. Weekly Forum */}
              {memberId && (
                <ContentSection
                  icon={<MessageSquare className="w-3.5 h-3.5" />}
                  title={`Diskusi Minggu ${activeWeek.weekNumber}`}
                >
                  <WeeklyForum key={activeWeek.id} meetingId={activeWeek.id} memberId={memberId} />
                </ContentSection>
              )}

              <div className="h-8" />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
