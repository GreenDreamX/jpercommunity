import { useState, useEffect, useId } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, Clock, Lock, Unlock, EyeOff, Edit, X, Save, FileText, Video, Paperclip, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { SyllabusWeek, WeekStatus } from '../lms/lmsTypes'

export default function SyllabusControl() {
  const uid = useId()
  const { courseId } = useParams<{ courseId?: string }>()
  const [courses, setCourses] = useState<any[]>([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [weeks, setWeeks] = useState<SyllabusWeek[]>([])
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [editingWeekId, setEditingWeekId] = useState<string | null>(null)

  // Form states for creating a new week
  const [isAddingWeek, setIsAddingWeek] = useState(false)
  const [newWeekData, setNewWeekData] = useState({
    weekNumber: 1,
    title: '',
    status: 'hide' as WeekStatus
  })

  // Drawer state for editing week content
  const editingWeek = weeks.find(w => w.id === editingWeekId)
  const [drawerContent, setDrawerContent] = useState<{
    title: string
    text: string
    videoUrl: string
    fileUrl: string
  }>({
    title: '',
    text: '',
    videoUrl: '',
    fileUrl: ''
  })

  // Load courses for dropdown
  useEffect(() => {
    async function loadCourses() {
      try {
        if (!supabase) {
          console.warn('[supabase] Client uninitialized in SyllabusControl. Loading fallback courses.')
          setCourses([
            { id: 'jepang', title: 'Bahasa Jepang (Offline Mode)' }
          ])
          setSelectedCourse(courseId || 'jepang')
          return
        }

        const { data, error } = await supabase
          .from('courses')
          .select('id, title')
          .order('created_at', { ascending: true })
        
        if (error) throw error
        setCourses(data || [])
        
        // Match navigation parameter courseId or select first
        if (courseId) {
          setSelectedCourse(courseId)
        } else if (data && data.length > 0) {
          setSelectedCourse(data[0].id)
        }
      } catch (err) {
        console.error('Failed to load courses', err)
      }
    }
    loadCourses()
  }, [courseId])

  // Load weeks when course selection changes
  useEffect(() => {
    if (!selectedCourse) return

    async function loadWeeks() {
      try {
        setLoading(true)

        if (!supabase) {
          console.warn('[supabase] Client uninitialized. Loading default offline weeks.')
          setWeeks([
            {
              id: 'w1',
              courseId: selectedCourse,
              weekNumber: 1,
              title: 'Pengenalan Huruf Hiragana (Offline)',
              subtitle: '',
              status: 'unlock',
              dueDate: undefined,
              content: {
                text: 'Selamat belajar Hiragana offline.',
                videoUrl: '',
                fileUrl: ''
              }
            }
          ])
          return
        }

        const { data, error } = await supabase
          .from('meetings')
          .select('*')
          .eq('course_id', selectedCourse)
          .order('week_number', { ascending: true })

        if (error) throw error

        const mapped: SyllabusWeek[] = (data || []).map(m => ({
          id: m.id,
          courseId: m.course_id,
          weekNumber: m.week_number,
          title: m.title,
          subtitle: '',
          status: m.status,
          dueDate: m.due_date || undefined,
          content: {
            text: m.markdown_content || '',
            videoUrl: m.video_url || '',
            fileUrl: m.file_viewer_url || ''
          }
        }))

        setWeeks(mapped)
        
        // Suggest next week number
        const maxWeekNum = mapped.reduce((max, w) => w.weekNumber > max ? w.weekNumber : max, 0)
        setNewWeekData(prev => ({ ...prev, weekNumber: maxWeekNum + 1 }))
      } catch (err) {
        console.error('Failed to load weeks', err)
      } finally {
        setLoading(false)
      }
    }

    loadWeeks()
  }, [selectedCourse])

  function openDrawer(week: SyllabusWeek) {
    setEditingWeekId(week.id)
    setDrawerContent({
      title: week.title,
      text: week.content?.text || '',
      videoUrl: week.content?.videoUrl || '',
      fileUrl: week.content?.fileUrl || ''
    })
  }

  async function handleSaveContent() {
    if (!editingWeekId) return

    if (!supabase) {
      alert('Database connection uninitialized. Cannot update meeting content.')
      return
    }

    try {
      const { error } = await supabase
        .from('meetings')
        .update({
          title: drawerContent.title,
          markdown_content: drawerContent.text,
          video_url: drawerContent.videoUrl,
          file_viewer_url: drawerContent.fileUrl
        })
        .eq('id', editingWeekId)

      if (error) throw error

      setWeeks(weeks.map(w => w.id === editingWeekId ? {
        ...w,
        title: drawerContent.title,
        content: {
          text: drawerContent.text,
          videoUrl: drawerContent.videoUrl,
          fileUrl: drawerContent.fileUrl
        }
      } : w))

      setEditingWeekId(null)
    } catch (err) {
      console.error('Failed to update week content', err)
      alert('Gagal menyimpan konten materi.')
    }
  }

  async function updateStatus(weekId: string, status: WeekStatus) {
    if (!supabase) {
      setWeeks(weeks.map(w => w.id === weekId ? { ...w, status } : w))
      return
    }

    try {
      const { error } = await supabase
        .from('meetings')
        .update({ status })
        .eq('id', weekId)

      if (error) throw error

      setWeeks(weeks.map(w => w.id === weekId ? { ...w, status } : w))
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  async function updateDueDate(weekId: string, dueDate: string | undefined) {
    if (!supabase) {
      setWeeks(weeks.map(w => w.id === weekId ? { ...w, dueDate } : w))
      return
    }

    try {
      const { error } = await supabase
        .from('meetings')
        .update({ due_date: dueDate || null })
        .eq('id', weekId)

      if (error) throw error

      setWeeks(weeks.map(w => w.id === weekId ? { ...w, dueDate } : w))
    } catch (err) {
      console.error('Failed to update due date', err)
    }
  }

  async function handleAddWeek(e: React.FormEvent) {
    e.preventDefault()
    if (!newWeekData.title.trim() || !selectedCourse) return

    if (!supabase) {
      alert('Database connection uninitialized. Cannot add meeting.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase
        .from('meetings')
        .insert({
          course_id: selectedCourse,
          week_number: newWeekData.weekNumber,
          title: newWeekData.title,
          status: newWeekData.status,
        })

      if (error) throw error

      setIsAddingWeek(false)
      setNewWeekData(prev => ({ ...prev, title: '', weekNumber: prev.weekNumber + 1 }))

      // Reload weeks
      const { data, error: reloadError } = await supabase
        .from('meetings')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('week_number', { ascending: true })

      if (reloadError) throw reloadError
      
      setWeeks((data || []).map(m => ({
        id: m.id,
        courseId: m.course_id,
        weekNumber: m.week_number,
        title: m.title,
        subtitle: '',
        status: m.status,
        dueDate: m.due_date || undefined,
        content: {
          text: m.markdown_content || '',
          videoUrl: m.video_url || '',
          fileUrl: m.file_viewer_url || ''
        }
      })))
    } catch (err) {
      console.error('Failed to add week', err)
      alert('Gagal menambah pertemuan baru.')
    } finally {
      setLoading(false)
    }
  }

  async function handleInitialize16Weeks() {
    if (!selectedCourse) return
    if (!supabase) {
      alert('Database connection uninitialized. Cannot initialize weeks.')
      return
    }

    try {
      setInitializing(true)
      const newMeetings = Array.from({ length: 16 }, (_, i) => ({
        course_id: selectedCourse,
        week_number: i + 1,
        title: `Materi Minggu ${i + 1}`,
        status: 'hide',
      }))

      const { error } = await supabase.from('meetings').insert(newMeetings)
      if (error) throw error

      // Reload weeks
      const { data, error: reloadError } = await supabase
        .from('meetings')
        .select('*')
        .eq('course_id', selectedCourse)
        .order('week_number', { ascending: true })

      if (reloadError) throw reloadError

      const mapped: SyllabusWeek[] = (data || []).map(m => ({
        id: m.id,
        courseId: m.course_id,
        weekNumber: m.week_number,
        title: m.title,
        subtitle: '',
        status: m.status,
        dueDate: m.due_date || undefined,
        content: {
          text: m.markdown_content || '',
          videoUrl: m.video_url || '',
          fileUrl: m.file_viewer_url || ''
        }
      }))

      setWeeks(mapped)
    } catch (err) {
      console.error('Failed to initialize 16 weeks', err)
      alert('Gagal menginisialisasi 16 minggu materi.')
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Header */}
      <header className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Syllabus Control</h1>
          <p className="text-xs text-zinc-500 mt-1">Atur akses materi per minggu, tenggat waktu, dan konten dinamis.</p>
        </div>
        <div className="flex items-center gap-3">
          {courses.length > 0 && (
            <button
              onClick={() => setIsAddingWeek(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-md text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Pertemuan
            </button>
          )}
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="appearance-none bg-zinc-900 border border-zinc-800 text-sm font-medium text-zinc-100 rounded-md pl-4 pr-10 py-2 focus:outline-none focus:border-zinc-700"
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-500 absolute right-3 top-2.5 pointer-events-none" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        {loading && weeks.length === 0 ? (
          <div className="max-w-4xl mx-auto space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg h-16 flex items-center justify-between px-4">
                <div className="w-8 h-8 bg-zinc-800 rounded" />
                <div className="h-4 bg-zinc-800 rounded w-1/3" />
                <div className="h-8 bg-zinc-800 rounded w-48" />
              </div>
            ))}
          </div>
        ) : weeks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-12 border border-zinc-800 rounded-xl bg-zinc-900/30 max-w-lg mx-auto mt-12">
            <FileText className="w-8 h-8 text-zinc-700 mb-3" />
            <p className="text-sm font-medium text-zinc-400">
              Belum ada pertemuan terdaftar untuk course ini.
            </p>
            <p className="text-xs text-zinc-600 mt-1 mb-6">
              Silabus ini kosong. Mulai dengan menginisialisasi 16 minggu materi standar sekaligus.
            </p>
            <button
              onClick={handleInitialize16Weeks}
              disabled={initializing}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 rounded-md text-sm font-semibold transition-colors"
            >
              {initializing ? 'Menginisialisasi...' : 'Inisialisasi 16 Minggu Materi'}
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-3">
            {weeks.map(week => (
              <div key={week.id} className="bg-zinc-900 border border-zinc-800 rounded-lg flex flex-col sm:flex-row sm:items-center overflow-hidden group">
                {/* Left Info */}
                <div className="flex-1 p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-zinc-950 border border-zinc-800 flex items-center justify-center text-sm font-bold text-zinc-400 shrink-0">
                    {week.weekNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-zinc-100 truncate">{week.title}</p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {week.content?.text ? 'Materi Terisi' : 'Belum Ada Konten'}
                    </p>
                  </div>
                </div>

                {/* Right Controls */}
                <div className="p-4 bg-zinc-950/40 border-t sm:border-t-0 sm:border-l border-zinc-800/60 flex items-center gap-4 justify-between sm:justify-end flex-wrap sm:flex-nowrap">
                  {/* Date Picker */}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-zinc-600" />
                    <input
                      type="datetime-local"
                      value={week.dueDate ? week.dueDate.slice(0, 16) : ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                        updateDueDate(week.id, date)
                      }}
                      disabled={week.status === 'hide'}
                      className="bg-transparent text-[11px] text-zinc-400 focus:outline-none focus:text-zinc-200 disabled:opacity-30"
                    />
                  </div>

                  {/* Status Segmented Control */}
                  <div className="flex p-1 bg-zinc-950 border border-zinc-800 rounded-md">
                    <button
                      onClick={() => updateStatus(week.id, 'hide')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-medium transition-colors ${
                        week.status === 'hide' ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                    >
                      <EyeOff className="w-3 h-3" /> Hide
                    </button>
                    <button
                      onClick={() => updateStatus(week.id, 'lock')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-medium transition-colors ${
                        week.status === 'lock' ? 'bg-amber-900/30 text-amber-500' : 'text-zinc-600 hover:text-amber-500/50'
                      }`}
                    >
                      <Lock className="w-3 h-3" /> Lock
                    </button>
                    <button
                      onClick={() => updateStatus(week.id, 'unlock')}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-medium transition-colors ${
                        week.status === 'unlock' ? 'bg-emerald-900/30 text-emerald-500' : 'text-zinc-600 hover:text-emerald-500/50'
                      }`}
                    >
                      <Unlock className="w-3 h-3" /> Unlock
                    </button>
                  </div>

                  {/* Edit Button */}
                  <button
                    onClick={() => openDrawer(week)}
                    className="p-1.5 rounded-md bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                    aria-label="Edit Materi"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Week Drawer */}
      {isAddingWeek && (
        <>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20" onClick={() => setIsAddingWeek(false)} />
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-zinc-900 border-l border-zinc-800 z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/50">
              <h2 className="text-sm font-semibold text-zinc-100">Tambah Pertemuan Baru</h2>
              <button onClick={() => setIsAddingWeek(false)} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddWeek} className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label htmlFor={`${uid}-number`} className="block text-xs font-medium text-zinc-400 mb-1.5">Minggu Ke (1-16)</label>
                <input
                  id={`${uid}-number`}
                  type="number"
                  required
                  min={1}
                  max={16}
                  value={newWeekData.weekNumber}
                  onChange={e => setNewWeekData({ ...newWeekData, weekNumber: parseInt(e.target.value, 10) || 1 })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
                />
              </div>

              <div>
                <label htmlFor={`${uid}-title`} className="block text-xs font-medium text-zinc-400 mb-1.5">Topik Pertemuan</label>
                <input
                  id={`${uid}-title`}
                  required
                  value={newWeekData.title}
                  onChange={e => setNewWeekData({ ...newWeekData, title: e.target.value })}
                  placeholder="e.g. Hiragana Bagian 1"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
                />
              </div>

              <div>
                <label htmlFor={`${uid}-status`} className="block text-xs font-medium text-zinc-400 mb-1.5">Status Awal</label>
                <select
                  id={`${uid}-status`}
                  value={newWeekData.status}
                  onChange={e => setNewWeekData({ ...newWeekData, status: e.target.value as WeekStatus })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-sm text-zinc-100 focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700"
                >
                  <option value="hide">Sembunyikan (Hide)</option>
                  <option value="lock">Kunci (Lock)</option>
                  <option value="unlock">Buka (Unlock)</option>
                </select>
              </div>
            </form>

            <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setIsAddingWeek(false)} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Batal</button>
              <button type="button" onClick={handleAddWeek} className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md text-xs font-semibold transition-colors">Tambah Pertemuan</button>
            </div>
          </div>
        </>
      )}

      {/* Content Editor Drawer */}
      {editingWeekId && editingWeek && (
        <>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20" onClick={() => setEditingWeekId(null)} />
          <div className="absolute top-0 right-0 bottom-0 w-full max-w-xl bg-zinc-950 border-l border-zinc-800 z-30 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-zinc-500 tracking-widest uppercase mb-0.5">Edit Materi Minggu {editingWeek.weekNumber}</p>
                <h2 className="text-sm font-bold text-zinc-100">{editingWeek.title}</h2>
              </div>
              <button onClick={() => setEditingWeekId(null)} className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">Topik/Judul Pertemuan</label>
                <input
                  value={drawerContent.title}
                  onChange={e => setDrawerContent({ ...drawerContent, title: e.target.value })}
                  className="w-full bg-zinc-900 p-2.5 rounded-md border border-zinc-800 text-xs text-zinc-100 focus:outline-none"
                />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800">
                  <FileText className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[11px] font-medium text-zinc-400">Teks Materi (Markdown)</span>
                </div>
                <textarea
                  value={drawerContent.text}
                  onChange={e => setDrawerContent({ ...drawerContent, text: e.target.value })}
                  placeholder="## Heading\nTuliskan materi disini..."
                  rows={8}
                  className="w-full bg-transparent p-3 text-xs text-zinc-300 focus:outline-none resize-none font-mono"
                />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800">
                  <Video className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[11px] font-medium text-zinc-400">Video Embed URL</span>
                </div>
                <input
                  value={drawerContent.videoUrl}
                  onChange={e => setDrawerContent({ ...drawerContent, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                />
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-zinc-950 border-b border-zinc-800">
                  <Paperclip className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[11px] font-medium text-zinc-400">File Handout (PDF URL)</span>
                </div>
                <input
                  value={drawerContent.fileUrl}
                  onChange={e => setDrawerContent({ ...drawerContent, fileUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-transparent px-3 py-2.5 text-xs text-zinc-300 focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900 flex items-center justify-end gap-3">
              <button onClick={() => setEditingWeekId(null)} className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors">Batal</button>
              <button onClick={handleSaveContent} className="flex items-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md text-xs font-semibold transition-colors">
                <Save className="w-3.5 h-3.5" />
                Simpan Materi
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
