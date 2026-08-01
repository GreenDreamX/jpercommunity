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
      <div className="rounded-xl border border-[#E4E1DA] bg-[#FAF9F6] px-4 py-3 flex items-center gap-2 text-[11px] font-mono text-[#6B6862] animate-pulse">
        <Coins className="size-4 shrink-0" />
        <span>Mengecek status iuran kas...</span>
      </div>
    )
  }

  // Pengurus tidak dikenai iuran
  if (!status || status.isPengurus) return null

  // Semua lunas
  if (status.unpaidWeeks.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          <div>
            <div className="text-xs font-bold text-emerald-800">Iuran Kas Lunas 🎉</div>
            <div className="text-[10px] text-emerald-700 font-mono">
              Semua {status.paidWeeks.length} iuran mingguan sudah terbayar. Terima kasih!
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Ada tunggakan
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount)

  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 overflow-hidden">
      {/* Main row */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="size-5 text-amber-600 shrink-0" />
          <div className="text-left">
            <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <Coins className="size-3.5" />
              Iuran Kas Belum Lunas
              <span className="bg-amber-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ml-1">
                {status.totalUnpaid} minggu
              </span>
            </div>
            <div className="text-[10px] text-amber-800 font-mono mt-0.5">
              Total tunggakan:{" "}
              <span className="font-bold">{formatCurrency(status.totalTunggakan)}</span>
              {" "}· Rp {(status.kasPerWeek ?? 2000).toLocaleString("id-ID")} / minggu
            </div>
          </div>
        </div>
        <div className="shrink-0 text-amber-600">
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-amber-200 bg-amber-50/70 px-4 py-3 space-y-2.5">
          <div className="text-[10px] font-mono font-bold text-amber-800 uppercase tracking-wider">
            Minggu yang Belum Dibayar:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {status.unpaidWeeks.map((w) => (
              <span
                key={w}
                className="bg-amber-600/15 border border-amber-400/40 text-amber-900 text-[11px] font-mono font-bold px-2 py-0.5 rounded"
              >
                Minggu {w}
              </span>
            ))}
          </div>

          {status.paidWeeks.length > 0 && (
            <>
              <div className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider pt-1">
                Minggu yang Sudah Dibayar:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {status.paidWeeks.map((w) => (
                  <span
                    key={w}
                    className="bg-emerald-500/10 border border-emerald-400/30 text-emerald-800 text-[11px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1"
                  >
                    <CheckCircle2 className="size-3" /> Minggu {w}
                  </span>
                ))}
              </div>
            </>
          )}

          <div className="pt-1 text-[10px] text-amber-700 font-mono border-t border-amber-200">
            💡 Hubungi bendahara atau ketua untuk melunasi iuran. Setiap pembayaran dicatat di sistem Studio.
          </div>

          <button
            onClick={fetchStatus}
            className="flex items-center gap-1 text-[10px] font-mono text-amber-700 hover:text-amber-900 transition-colors"
          >
            <RefreshCw className="size-3" /> Refresh status
          </button>
        </div>
      )}
    </div>
  )
}
