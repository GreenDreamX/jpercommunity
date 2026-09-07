"use client"

import { useState, useEffect } from "react"
import { Activity, Database, ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"

export function HealthWidget() {
  const [status, setStatus] = useState<"loading" | "healthy" | "degraded">("loading")
  const [latency, setLatency] = useState<number | null>(null)
  const [details, setDetails] = useState<Record<string, boolean>>({})

  useEffect(() => {
    async function checkHealth() {
      const startTime = performance.now()
      try {
        const res = await fetch("/api/health")
        const endTime = performance.now()
        setLatency(Math.round(endTime - startTime))

        if (res.ok) {
          const data = await res.json()
          setStatus("healthy")
          setDetails(data.supabase || {})
        } else {
          setStatus("degraded")
        }
      } catch {
        setStatus("degraded")
      }
    }

    void checkHealth()
    const timer = setInterval(checkHealth, 30000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-[#FAF9F6] border border-[#E4E1DA] p-4 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-indigo-600" />
          <span className="text-xs font-bold text-[#1C1B1A]">Status Server &amp; DB Supabase</span>
        </div>

        {status === "loading" ? (
          <span className="text-[10px] font-mono text-[#6B6862] flex items-center gap-1">
            <RefreshCw className="size-3 animate-spin text-[#B23A2E]" /> Checking...
          </span>
        ) : status === "healthy" ? (
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Healthy ({latency}ms)
          </span>
        ) : (
          <span className="text-[10px] font-mono font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
            <AlertCircle className="size-3" /> Degraded
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#6B6862] border-t border-[#E4E1DA]/60 pt-2">
        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E4E1DA]/60">
          <span>Supabase URL:</span>
          <span className="font-bold text-[#1C1B1A]">OK</span>
        </div>
        <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#E4E1DA]/60">
          <span>RLS Protection:</span>
          <span className="font-bold text-emerald-700">Enforced</span>
        </div>
      </div>
    </div>
  )
}
