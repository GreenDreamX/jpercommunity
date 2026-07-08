import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  CalendarDays,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
  ShieldCheck,
  FileText
} from 'lucide-react'

// ─────────────────────────────────────────────
// Mock Authentication Guard
// ─────────────────────────────────────────────
// In a real app, you'd check Supabase auth state + roles here.
const MOCK_ADMIN = {
  name: 'Studio Admin',
  role: 'admin' // or 'romusha'
}

export default function StudioLayout() {
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Basic mock guard
  if (!MOCK_ADMIN || (MOCK_ADMIN.role !== 'admin' && MOCK_ADMIN.role !== 'romusha')) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-2">Akses Ditolak</h1>
          <p className="text-zinc-500 text-sm">Anda tidak memiliki izin untuk masuk ke JPER Studio.</p>
          <button onClick={() => navigate('/lms')} className="mt-4 px-4 py-2 bg-zinc-800 rounded-md text-sm hover:bg-zinc-700 transition">Kembali ke LMS</button>
        </div>
      </div>
    )
  }

  const navItems = [
    { to: '/studio', end: true, icon: <BookOpen className="w-4 h-4" />, label: 'Course Manager' },
    { to: '/studio/syllabus', icon: <CalendarDays className="w-4 h-4" />, label: 'Syllabus Control' },
    { to: '/studio/members', icon: <Users className="w-4 h-4" />, label: 'Member Management' },
    { to: '/studio/romusha', icon: <ShieldCheck className="w-4 h-4" />, label: 'QR Generator' },
    { to: '/studio/reports', icon: <FileText className="w-4 h-4" />, label: 'Report Export' },
  ]

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col md:flex-row font-sans overflow-hidden">
      {/* ── Mobile Header ── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-zinc-400" />
          <span className="font-semibold text-zinc-100">JPER Studio</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-zinc-400 hover:text-zinc-100">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ── Sidebar ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col transition-transform duration-300 ease-in-out md:static md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="hidden md:flex items-center gap-3 px-6 py-5 border-b border-zinc-800">
          <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center border border-zinc-700">
            <Settings className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-zinc-100 leading-tight">JPER Studio</h1>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin Control</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-zinc-600 uppercase">Modules</p>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'}
              `}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-300 border border-zinc-700">
              {MOCK_ADMIN.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-100 truncate">{MOCK_ADMIN.name}</p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{MOCK_ADMIN.role}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/lms')}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md border border-zinc-800 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Studio
          </button>
        </div>
      </aside>

      {/* ── Overlay for mobile ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto bg-zinc-950 flex flex-col relative h-[calc(100vh-53px)] md:h-screen">
        <Outlet />
      </main>
    </div>
  )
}
