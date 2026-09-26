"use client"

import { useEffect, useState, useCallback } from "react"
import { AlertTriangle, CheckCircle2, Coins, RefreshCw, ChevronDown, ChevronUp } from "lucide-react"

type KasStatus = {
  isPengurus: boolean
  paidWeeks: number[]
  unpaidWeeks: number[]
  totalUnpaid: number
  totalTunggakan: number
  memberName?: string
  kasPerWeek?: number
}

interface KasReminderProps {
  token: string
}

export function KasReminder({ token }: KasReminderProps) {
  const [status, setStatus] = useState<KasStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/lms/kas-status", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (e) {
      console.error("Gagal fetch kas status:", e)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void fetchStatus()
  }, [fetchStatus])

  if (loading) {
    return (
      <div className="border-2 border-black bg-white px-4 py-3 flex items-center gap-2 text-xs font-mono font-bold text-zinc-600 shadow-[3px_3px_0px_#111] animate-pulse">
        <Coins className="size-4 shrink-0 text-black" />
        <span>Mengecek status iuran kas anggota...</span>
      </div>
    )
  }

  // Pengurus tidak dikenai iuran
  if (!status || status.isPengurus) return null

  // Semua lunas
  if (status.unpaidWeeks.length === 0) {
    return (
      <div className="border-2 border-black bg-emerald-400 p-4 flex items-center justify-between gap-3 shadow-[4px_4px_0px_#111] text-black">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="size-6 text-black shrink-0 stroke-[2.5]" />
          <div>
            <div className="text-sm font-black uppercase tracking-tight">Iuran Kas Lunas 🎉</div>
            <div className="text-xs font-mono font-bold text-zinc-900 mt-0.5">
              Semua {status.paidWeeks.length} iuran mingguan telah terbayar lunas. Terima kasih atas partisipasinya!
            </div>
          </div>
        </div>
        <span className="hidden sm:inline-block bg-black text-[#FFC700] text-[10px] font-mono font-black uppercase px-2 py-0.5 border border-black -skew-x-6 shrink-0">
          STATUS: LUNAS
        </span>
      </div>
    )
  }

  // Ada tunggakan
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="border-2 border-black bg-[#FFC700] text-black shadow-[4px_4px_0px_#111] overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-4 py-3.5 flex items-center justify-between gap-3 hover:bg-[#FFC700]/90 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="size-8 border-2 border-black bg-black text-[#FFC700] flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#fff]">
            <AlertTriangle className="size-4 text-[#FFC700]" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black uppercase tracking-tight flex items-center gap-2">
              <span>Tunggakan Iuran Kas Ekskul</span>
              <span className="bg-[#E60012] text-white text-[10px] font-mono font-black px-2 py-0.5 border border-black -skew-x-6">
                {status.totalUnpaid} MINGGU
              </span>
            </div>
            <div className="text-xs font-mono font-bold text-zinc-900 mt-0.5">
              Total Tunggakan: <span className="font-black text-[#E60012] underline">{formatCurrency(status.totalTunggakan)}</span>
              {" "}• Rp {(status.kasPerWeek ?? 2000).toLocaleString("id-ID")} / minggu
            </div>
          </div>
        </div>
        <div className="shrink-0 text-black border-2 border-black bg-white p-1 shadow-[1px_1px_0px_#111]">
          {expanded ? <ChevronUp className="size-4 stroke-[3]" /> : <ChevronDown className="size-4 stroke-[3]" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t-2 border-black bg-white p-4 space-y-3">
          <div className="text-[11px] font-mono font-black text-black uppercase tracking-wider">
            Minggu yang Belum Dibayar:
          </div>
          <div className="flex flex-wrap gap-2">
            {status.unpaidWeeks.map((w) => (
              <span
                key={w}
                className="bg-[#E60012] text-white text-xs font-mono font-black px-2.5 py-1 border border-black -skew-x-6 shadow-[2px_2px_0px_#111]"
              >
                Minggu {w}
              </span>
            ))}
          </div>

          {status.paidWeeks.length > 0 && (
            <>
              <div className="text-[11px] font-mono font-black text-black uppercase tracking-wider pt-2 border-t-2 border-black/10">
                Minggu yang Sudah Dibayar:
              </div>
              <div className="flex flex-wrap gap-2">
                {status.paidWeeks.map((w) => (
                  <span
                    key={w}
                    className="bg-emerald-400 text-black text-xs font-mono font-black px-2.5 py-1 border border-black -skew-x-6 flex items-center gap-1 shadow-[2px_2px_0px_#111]"
                  >
                    <CheckCircle2 className="size-3 stroke-[3]" /> Minggu {w}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="pt-2 text-xs font-bold text-zinc-700 font-mono border-t-2 border-black/10">
            💡 Pembayaran iuran kas dapat diserahkan ke Bendahara Ekskul. Setiap transaksi akan langsung di-update oleh pengurus di panel Studio.
          </div>

          <button
            onClick={fetchStatus}
            className="flex items-center gap-1.5 text-xs font-mono font-black text-black hover:text-[#E60012] transition-colors pt-1"
          >
            <RefreshCw className="size-3.5" /> Refresh Status Kas
          </button>
        </div>
      )}
    </div>
  )
}
