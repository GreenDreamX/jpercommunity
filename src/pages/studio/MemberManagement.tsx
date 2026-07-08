import { useState, useRef, useEffect } from 'react'
import { BadgeCheck, MoreVertical, ShieldAlert, CheckCircle2, UserX, BarChart2, Search } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

type AdminMemberProfile = {
  id: string
  fullName: string
  communityEmail: string
  gmail: string
  batch: string
  kelasJurusan: string
  asalSekolah: string
  verifiedBadge: boolean
  status: 'active' | 'suspended'
  nisn: string
  nisSekolah: string
}

export default function MemberManagement() {
  const [members, setMembers] = useState<AdminMemberProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  async function loadMembers() {
    try {
      setLoading(true)

      if (!supabase) {
        console.warn('[supabase] Client uninitialized in MemberManagement. Loading fallback profiles.')
        setMembers([
          {
            id: 'u-1',
            fullName: 'Yudhistira Arya Pratama (Offline)',
            communityEmail: 'yudhistira@shokunin.jpercommunity.id',
            gmail: 'yudhistira@gmail.com',
            batch: '2025',
            kelasJurusan: 'XI PPLG 1',
            asalSekolah: 'SMKN 1 Majalaya',
            verifiedBadge: true,
            status: 'active',
            nisn: '0012345678',
            nisSekolah: '12345'
          },
          {
            id: 'u-2',
            fullName: 'Reza Ardian (Offline)',
            communityEmail: 'reza@shokunin.jpercommunity.id',
            gmail: 'reza.a@gmail.com',
            batch: '2026',
            kelasJurusan: '',
            asalSekolah: 'SMPN 1 Paseh',
            verifiedBadge: false,
            status: 'active',
            nisn: '0012345679',
            nisSekolah: ''
          },
          {
            id: 'u-3',
            fullName: 'Dewi Shinta (Offline)',
            communityEmail: 'dewi@shokunin.jpercommunity.id',
            gmail: 'dewi.s@gmail.com',
            batch: '2022',
            kelasJurusan: '',
            asalSekolah: '',
            verifiedBadge: true,
            status: 'active',
            nisn: '0012345680',
            nisSekolah: ''
          }
        ])
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped: AdminMemberProfile[] = (data || []).map(p => ({
        id: p.id,
        fullName: p.nama_lengkap || 'Anggota JPER',
        communityEmail: p.email_jper || '',
        gmail: p.email_pribadi || '',
        batch: String(p.angkatan || ''),
        kelasJurusan: p.kelas_jurusan || '',
        asalSekolah: p.asal_sekolah || '',
        verifiedBadge: !!p.is_verified_member,
        status: p.is_suspended ? 'suspended' : 'active',
        nisn: p.nisn || '-',
        nisSekolah: p.nis_sekolah || '-'
      }))

      setMembers(mapped)
    } catch (err) {
      console.error('Failed to load members', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMembers()
  }, [])

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredMembers = members.filter(m => 
    m.fullName.toLowerCase().includes(search.toLowerCase()) || 
    m.communityEmail.toLowerCase().includes(search.toLowerCase()) ||
    m.nisn.includes(search)
  )

  async function toggleStatus(id: string, currentStatus: 'active' | 'suspended') {
    const targetSuspended = currentStatus === 'active'
    
    if (!supabase) {
      setMembers(members.map(m => m.id === id ? { ...m, status: targetSuspended ? 'suspended' : 'active' } : m))
      setActiveMenuId(null)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_suspended: targetSuspended })
        .eq('id', id)

      if (error) throw error

      setMembers(members.map(m => m.id === id ? { ...m, status: targetSuspended ? 'suspended' : 'active' } : m))
      setActiveMenuId(null)
    } catch (err) {
      console.error('Failed to update member status', err)
      alert('Gagal mengubah status penangguhan akun.')
    }
  }

  async function toggleBadge(id: string, currentBadge: boolean) {
    if (!supabase) {
      setMembers(members.map(m => m.id === id ? { ...m, verifiedBadge: !currentBadge } : m))
      setActiveMenuId(null)
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_verified_member: !currentBadge })
        .eq('id', id)

      if (error) throw error

      setMembers(members.map(m => m.id === id ? { ...m, verifiedBadge: !currentBadge } : m))
      setActiveMenuId(null)
    } catch (err) {
      console.error('Failed to update member badge', err)
      alert('Gagal mengubah status verifikasi anggota.')
    }
  }

  // SMKN 1 Majalaya Conditional Rendering Logic
  function renderClassInfo(m: AdminMemberProfile) {
    const batchYear = parseInt(m.batch, 10)
    if (batchYear >= 2020 && batchYear <= 2023) {
      return <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-950/40 text-amber-500 border border-amber-900/40 font-semibold uppercase tracking-wider">Alumni</span>
    }
    if (batchYear === 2024 || batchYear === 2025) {
      return <span className="text-zinc-300 font-medium">{m.kelasJurusan || '-'}</span>
    }
    if (batchYear === 2026) {
      return <span className="text-zinc-400">SMP: {m.asalSekolah || '-'}</span>
    }
    return <span className="text-zinc-500">-</span>
  }

  return (
    <div className="flex-1 flex flex-col relative h-full">
      {/* Header */}
      <header className="px-6 py-5 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-100">Anggota & Kesiswaan</h1>
          <p className="text-xs text-zinc-500 mt-1">Kelola profil anggota, status verifikasi, dan pantau rapor belajar.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, email, NISN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-zinc-900 border border-zinc-800 rounded-md text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
          />
        </div>
      </header>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80">
                <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-64">Profil Anggota</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-32">NISN / NIS</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-40">Angkatan & Kelas</th>
                <th className="px-4 py-3 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider w-32">Status</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-xs">
              {loading && members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Memuat data anggota...
                  </td>
                </tr>
              ) : filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                    Tidak ada anggota yang terdaftar atau cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/30 transition-colors">
                    {/* Profil */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-400 shrink-0">
                          {m.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <p className="font-semibold text-zinc-100 truncate max-w-[160px]">{m.fullName}</p>
                            {m.verifiedBadge && <BadgeCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                          </div>
                          <p className="text-[10px] font-mono text-zinc-500 truncate max-w-[180px]">{m.communityEmail}</p>
                        </div>
                      </div>
                    </td>

                    {/* NISN/NIS */}
                    <td className="px-4 py-3 text-zinc-400 font-mono">
                      <p>{m.nisn}</p>
                      {m.nisSekolah && <p className="text-[10px] text-zinc-600 mt-0.5">{m.nisSekolah}</p>}
                    </td>

                    {/* Angkatan & Kelas */}
                    <td className="px-4 py-3">
                      <p className="text-zinc-100 mb-0.5">
                        <span className="text-zinc-500 font-mono mr-2">'{m.batch.slice(2)}</span>
                        {renderClassInfo(m)}
                      </p>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3">
                      {m.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 text-[10px] font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-red-950/30 text-red-400 border border-red-900/40 text-[10px] font-medium">
                          <ShieldAlert className="w-3 h-3" /> Suspended
                        </span>
                      )}
                    </td>

                    {/* Actions Dropdown */}
                    <td className="px-4 py-3 text-right relative">
                      <button 
                        onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                        className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Menu */}
                      {activeMenuId === m.id && (
                        <div ref={menuRef} className="absolute right-8 top-10 mt-1 w-48 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg py-1 z-20">
                          <button className="w-full text-left px-3 py-2 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 flex items-center gap-2">
                            <BarChart2 className="w-3.5 h-3.5" /> Lihat Rapor Belajar
                          </button>
                          <button 
                            onClick={() => toggleBadge(m.id, m.verifiedBadge)}
                            className="w-full text-left px-3 py-2 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 flex items-center gap-2"
                          >
                            <BadgeCheck className={`w-3.5 h-3.5 ${m.verifiedBadge ? 'text-zinc-500' : 'text-emerald-400'}`} /> 
                            {m.verifiedBadge ? 'Cabut Verified Badge' : 'Beri Verified Badge'}
                          </button>
                          <div className="h-px bg-zinc-800 my-1" />
                          <button 
                            onClick={() => toggleStatus(m.id, m.status)}
                            className={`w-full text-left px-3 py-2 text-[11px] flex items-center gap-2 hover:bg-zinc-800 ${m.status === 'active' ? 'text-red-400' : 'text-emerald-400'}`}
                          >
                            {m.status === 'active' ? (
                              <><UserX className="w-3.5 h-3.5" /> Suspend Akun</>
                            ) : (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> Re-activate Akun</>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
