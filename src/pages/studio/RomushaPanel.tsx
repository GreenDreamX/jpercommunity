import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../lib/supabaseClient'
import { Users, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react'

// Hardcoded for demo - in production this would come from the database
const MOCK_COURSES = [
  { id: 'jepang', title: 'Bahasa Jepang' },
  { id: 'papercraft', title: 'Papercraft' },
]

const MOCK_MEETINGS = [
  { id: 'meet-1', title: 'Minggu 1' },
  { id: 'meet-2', title: 'Minggu 2' },
]

type ScannedMember = {
  id: string
  fullName: string
  kelasJurusan: string
  scannedAt: string
}

export default function RomushaPanel() {
  const [selectedCourse, setSelectedCourse] = useState(MOCK_COURSES[0].id)
  const [selectedMeeting, setSelectedMeeting] = useState(MOCK_MEETINGS[0].id)
  const [qrToken, setQrToken] = useState<string>('')
  const [countdown, setCountdown] = useState(30)
  const [attendanceList, setAttendanceList] = useState<ScannedMember[]>([])

  // 1. Generate token and handle 30s refresh
  useEffect(() => {
    function generateToken() {
      const validUntil = Date.now() + 30000 // valid for 30s
      const tokenObj = { meeting_id: selectedMeeting, valid_until: validUntil }
      setQrToken(JSON.stringify(tokenObj))
      setCountdown(30)
    }

    generateToken()
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateToken()
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedMeeting])

  // 2. Fetch initial list and subscribe to Realtime
  useEffect(() => {
    // Helper to fetch and append a member profile
    const fetchAndAppendProfile = async (memberId: string, scannedAt: string, attendanceId: string) => {
      if (!supabase) return
      const { data, error } = await supabase
        .from('profiles')
        .select('fullName, kelasJurusan')
        .eq('id', memberId)
        .single()
      
      if (data && !error) {
        setAttendanceList((prev) => [
          {
            id: attendanceId,
            fullName: data.fullName,
            kelasJurusan: data.kelasJurusan,
            scannedAt
          },
          ...prev
        ])
      }
    }

    // Subscribe to INSERTs
    let subscription: any = null
    if (supabase) {
      subscription = supabase
        .channel('attendance_changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'attendance', filter: `meeting_id=eq.${selectedMeeting}` },
          (payload) => {
            fetchAndAppendProfile(payload.new.member_id, payload.new.scanned_at, payload.new.id)
          }
        )
        .subscribe()
    }

    return () => {
      if (subscription) {
        supabase?.removeChannel(subscription)
      }
    }
  }, [selectedMeeting])

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-500" />
            Romusha Panel (QR Generator)
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Generate dynamic QR codes for secure, real-time attendance tracking.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Widget */}
        <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col items-center">
          <div className="w-full space-y-4 mb-8">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Active Course</label>
              <select 
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {MOCK_COURSES.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Current Meeting</label>
              <select 
                value={selectedMeeting}
                onChange={(e) => {
                  setSelectedMeeting(e.target.value)
                  setAttendanceList([]) // clear list on meeting change
                }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {MOCK_MEETINGS.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* QR Display */}
          <div className="relative bg-white p-4 rounded-xl shadow-lg">
            <QRCodeSVG value={qrToken} size={200} level="H" />
            
            {/* Countdown Overlay Line */}
            <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 transition-all duration-1000 ease-linear rounded-b-xl"
                 style={{ width: `${(countdown / 30) * 100}%` }}
            />
          </div>

          <div className="mt-6 flex items-center gap-2 text-zinc-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>Refreshes in <strong className="text-zinc-100">{countdown}s</strong></span>
          </div>
        </div>

        {/* Live Attendance List */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
            <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-zinc-400" />
              Live Attendance
            </h2>
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-emerald-500 font-medium tracking-wide uppercase">Real-time</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {attendanceList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-3 py-12">
                <div className="w-16 h-16 rounded-full border border-dashed border-zinc-700 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm">Waiting for members to scan...</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {attendanceList.map((member) => (
                  <li key={member.id} className="flex items-center justify-between bg-zinc-950 border border-zinc-800/60 p-4 rounded-lg animate-in slide-in-from-top-2 duration-300">
                    <div>
                      <p className="text-zinc-100 font-medium">{member.fullName}</p>
                      <p className="text-xs text-zinc-500">{member.kelasJurusan}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-400 font-mono">
                        {new Date(member.scannedAt).toLocaleTimeString()}
                      </span>
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
