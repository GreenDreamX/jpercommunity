import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { BarChart, CheckCircle2, FileText, ChevronLeft, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Submission, Attendance, SyllabusWeek } from './lmsTypes'

interface WeeklyRecord {
  week: SyllabusWeek
  submission?: Submission
  attendance?: Attendance
}

export default function MemberProgress() {
  const [loading, setLoading] = useState(true)
  const [weeklyRecords, setWeeklyRecords] = useState<WeeklyRecord[]>([])
  const [metrics, setMetrics] = useState({
    avgScore: 0,
    attendancePercent: 0,
    status: 'Menunggu Data',
    statusVariant: 'neutral'
  })

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true)
        const { data: { session } } = await supabase!.auth.getSession()
        let memberId = session?.user?.id
        
        // For development/demo without auth, try to grab the first profile
        if (!memberId) {
          const { data: profiles } = await supabase!.from('profiles').select('id').limit(1)
          if (profiles && profiles.length > 0) memberId = profiles[0].id
        }

        if (!memberId) throw new Error('Not authenticated')

        // Fetch meetings (Syllabus) for course
        const { data: meetingsData } = await supabase!
          .from('meetings')
          .select('*')
          .neq('status', 'hide')
          .order('week_number', { ascending: true })

        // Fallback to mock meetings if none exist in DB for demo purposes
        const meetings: any[] = meetingsData?.length ? meetingsData : Array.from({ length: 16 }).map((_, i) => ({
          id: `m-mock-${i+1}`,
          course_id: 'jepang',
          week_number: i + 1,
          title: `Pertemuan ${i + 1}`,
          status: i < 5 ? 'unlock' : 'lock'
        }))

        // Fetch submissions and attendance
        const { data: subData } = await supabase!
          .from('submissions')
          .select('*')
          .eq('member_id', memberId)
          
        const { data: attData } = await supabase!
          .from('attendance')
          .select('*')
          .eq('member_id', memberId)

        const submissions: any[] = subData || []
        const attendances: any[] = attData || []

        const records: WeeklyRecord[] = meetings.map((m: any) => ({
          week: {
            id: m.id,
            courseId: m.course_id,
            weekNumber: m.week_number,
            title: m.title,
            subtitle: m.subtitle || '',
            status: m.status
          },
          submission: submissions.find(s => s.meeting_id === m.id) && {
            id: submissions.find(s => s.meeting_id === m.id).id,
            memberId: submissions.find(s => s.meeting_id === m.id).member_id,
            meetingId: submissions.find(s => s.meeting_id === m.id).meeting_id,
            status: submissions.find(s => s.meeting_id === m.id).status,
            grade: submissions.find(s => s.meeting_id === m.id).grade,
            gradedBy: submissions.find(s => s.meeting_id === m.id).graded_by,
            submittedAt: submissions.find(s => s.meeting_id === m.id).submitted_at,
          },
          attendance: attendances.find(a => a.meeting_id === m.id) && {
            id: attendances.find(a => a.meeting_id === m.id).id,
            memberId: attendances.find(a => a.meeting_id === m.id).member_id,
            meetingId: attendances.find(a => a.meeting_id === m.id).meeting_id,
            status: attendances.find(a => a.meeting_id === m.id).status,
            scannedAt: attendances.find(a => a.meeting_id === m.id).scanned_at,
          }
        }))

        setWeeklyRecords(records)

        // Calculate Metrics
        const gradedSubs = records.filter(r => r.submission && r.submission.status === 'graded' && r.submission.grade !== undefined)
        const avgScore = gradedSubs.length > 0 
          ? Math.round(gradedSubs.reduce((acc, curr) => acc + (curr.submission?.grade || 0), 0) / gradedSubs.length) 
          : 0

        const activeMeetings = records.filter(r => r.week.status === 'unlock')
        const attended = records.filter(r => r.attendance && r.attendance.status === 'hadir')
        const attPercent = activeMeetings.length > 0 ? Math.round((attended.length / activeMeetings.length) * 100) : 0

        let stat = 'On Track to Week 16'
        let variant = 'success'
        if (attPercent < 70 || (gradedSubs.length > 0 && avgScore < 75)) {
          stat = 'Action Required'
          variant = 'danger'
        } else if (activeMeetings.length === 0) {
          stat = 'Belum Ada Pertemuan'
          variant = 'neutral'
        }

        setMetrics({
          avgScore,
          attendancePercent: attPercent,
          status: stat,
          statusVariant: variant
        })

      } catch (err) {
        console.error('Failed to load progress', err)
      } finally {
        setLoading(false)
      }
    }

    loadProgress()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 font-sans text-zinc-100">
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/lms" className="text-zinc-400 hover:text-zinc-200 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-sm font-semibold">Progress Akademik & Presensi</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-500">
        {/* Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <BarChart className="w-4 h-4 text-indigo-400" />
              <span className="text-xs uppercase tracking-wider font-semibold">Rata-rata Nilai Tugas</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{metrics.avgScore}</div>
            <p className="text-xs text-zinc-500">Dari total {weeklyRecords.filter(r => r.submission?.status === 'graded').length} tugas dinilai</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs uppercase tracking-wider font-semibold">Total Kehadiran</span>
            </div>
            <div className="text-3xl font-bold text-zinc-100">{metrics.attendancePercent}%</div>
            <p className="text-xs text-zinc-500">Dari {weeklyRecords.filter(r => r.week.status === 'unlock').length} pertemuan aktif</p>
          </div>

          <div className={`border rounded-xl p-5 flex flex-col gap-2 ${metrics.statusVariant === 'success' ? 'bg-emerald-950/20 border-emerald-900/50' : metrics.statusVariant === 'danger' ? 'bg-red-950/20 border-red-900/50' : 'bg-zinc-900 border-zinc-800'}`}>
            <div className={`flex items-center gap-2 ${metrics.statusVariant === 'success' ? 'text-emerald-400' : metrics.statusVariant === 'danger' ? 'text-red-400' : 'text-zinc-400'}`}>
              <Target className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider font-semibold">Status Milestone</span>
            </div>
            <div className="text-xl font-bold mt-1">
              {metrics.status}
            </div>
            <p className="text-xs text-zinc-500 mt-auto">Evaluasi kumulatif JPER</p>
          </div>
        </div>

        {/* Weekly Breakdown Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
            <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-zinc-400" />
              Rincian Mingguan
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-zinc-900 text-xs uppercase font-medium text-zinc-500">
                <tr>
                  <th className="px-6 py-4">Minggu</th>
                  <th className="px-6 py-4">Status Pertemuan</th>
                  <th className="px-6 py-4">Status Tugas</th>
                  <th className="px-6 py-4">Nilai</th>
                  <th className="px-6 py-4">Penilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                      Memuat data akademik...
                    </td>
                  </tr>
                ) : (
                  weeklyRecords.map((record) => (
                    <tr key={record.week.id} className="hover:bg-zinc-800/20 transition-colors">
                      <td className="px-6 py-4 font-medium text-zinc-200">
                        Pertemuan {record.week.weekNumber}
                        <span className="block text-xs text-zinc-500 font-normal mt-0.5">{record.week.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        {record.week.status === 'unlock' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                            Terbuka
                          </span>
                        ) : record.week.status === 'lock' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400">
                            Terkunci
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-500/10 text-zinc-400">
                            Sembunyi
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.submission?.status === 'graded' ? (
                          <span className="text-emerald-400">Dinilai</span>
                        ) : record.submission?.status === 'submitted' ? (
                          <span className="text-indigo-400">Diserahkan</span>
                        ) : record.week.status === 'unlock' ? (
                          <span className="text-red-400">Belum Ada</span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {record.submission?.grade !== undefined ? (
                          <span className="font-semibold text-zinc-200">{record.submission.grade}</span>
                        ) : (
                          <span className="text-zinc-600">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        {record.submission?.gradedBy ? record.submission.gradedBy.substring(0,8) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
