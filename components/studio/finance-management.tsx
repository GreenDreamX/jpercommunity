"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Wallet, TrendingUp, TrendingDown, PlusCircle, CheckCircle2, ShieldCheck, Search, Calendar, FileText, Sparkles, RefreshCw, AlertCircle, Image, BarChart3, Printer } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"

type Transaction = {
  id: string
  type: "in" | "out"
  category: string
  amount: number
  description: string
  transaction_date: string
  receipt_url?: string | null
  recorded_by_profile?: {
    nama_lengkap: string
  }
}

type KasRecord = {
  id: string
  profile_id: string
  week_number: number
  amount: number
  paid_at: string
  note?: string | null
}

type Member = {
  id: string
  nama_lengkap: string
  angkatan: string | null
  role: string
}

type SummaryStats = {
  currentBalance: number
  totalIncome: number
  totalExpense: number
  monthlyIncome: number
  monthlyExpense: number
  totalTransactions: number
  totalKasRecords: number
}

interface FinanceManagementProps {
  token: string
}

export function FinanceManagement({ token }: FinanceManagementProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  
  const [stats, setStats] = useState<SummaryStats>({
    currentBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    totalTransactions: 0,
    totalKasRecords: 0,
  })

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [kasRecords, setKasRecords] = useState<KasRecord[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  // Sub Tab Selector
  const [activeSubTab, setActiveSubTab] = useState<"kas" | "transactions" | "audit" | "laporan">("kas")

  // Kas Tab States
  const [selectedWeek, setSelectedWeek] = useState<number>(1)
  const [kasSearch, setKasSearch] = useState("")
  const [kasCohort, setKasCohort] = useState("all")
  const [recordingKasId, setRecordingKasId] = useState<string | null>(null)

  // Transaction Form States
  const [txType, setTxType] = useState<"in" | "out">("in")
  const [txCategory, setTxCategory] = useState("Uang Kas")
  const [txAmount, setTxAmount] = useState("")
  const [txDesc, setTxDesc] = useState("")
  const [txDate, setTxDate] = useState("")
  const [txReceipt, setTxReceipt] = useState("")
  const [submittingTx, setSubmittingTx] = useState(false)

  // Transaction Search & Filter
  const [txSearch, setTxSearch] = useState("")
  const [txFilterType, setTxFilterType] = useState("all")

  // Paginations
  const [kasLimit, setKasLimit] = useState(30)
  const [kasPage, setKasPage] = useState(1)

  const [txLimit, setTxLimit] = useState(30)
  const [txPage, setTxPage] = useState(1)

  const [auditLimit, setAuditLimit] = useState(30)
  const [auditPage, setAuditPage] = useState(1)

  const fetchFinanceData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/studio/finance", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Gagal mengambil data keuangan.")
      }
      const data = await res.json()
      setStats(data.stats)
      setTransactions(data.transactions || [])
      setKasRecords(data.kasRecords || [])
      setMembers(data.members || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan koneksi.")
    } finally {
      setLoading(false)
    }
  }, [token])

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/studio/logs?category=KEUANGAN", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.logs || [])
      }
    } catch (e) {
      console.error(e)
    }
  }, [token])

  useEffect(() => {
    void fetchFinanceData()
  }, [fetchFinanceData])

  useEffect(() => {
    if (activeSubTab === "audit") {
      void fetchAuditLogs()
    }
  }, [activeSubTab, fetchAuditLogs])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Handle Recording Kas
  const handleRecordKas = async (member: Member) => {
    setRecordingKasId(member.id)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch("/api/studio/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "RECORD_KAS",
          profile_id: member.id,
          week_number: selectedWeek,
          amount: 2000,
          member_name: member.nama_lengkap,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal mencatat kas.")
      }

      setSuccessMsg(`Kas Minggu Ke-${selectedWeek} untuk ${member.nama_lengkap} berhasil dicatat lunas (Rp 2.000)!`)
      setTimeout(() => setSuccessMsg(null), 3500)
      void fetchFinanceData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mencatat iuran kas.")
    } finally {
      setRecordingKasId(null)
    }
  }

  // Handle Add Transaction
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!txAmount || Number(txAmount) <= 0) {
      setError("Nominal harus diisi dengan angka positif.")
      return
    }
    if (!txDesc.trim()) {
      setError("Deskripsi transaksi (darimana / untuk apa) wajib diisi.")
      return
    }

    setSubmittingTx(true)
    setError(null)
    setSuccessMsg(null)

    try {
      const res = await fetch("/api/studio/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "ADD_TRANSACTION",
          type: txType,
          category: txCategory,
          amount: Number(txAmount),
          description: txDesc.trim(),
          transaction_date: txDate ? new Date(txDate).toISOString() : new Date().toISOString(),
          receipt_url: txReceipt.trim() || null,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal menyimpan transaksi.")
      }

      setSuccessMsg(`Transaksi ${txType === "in" ? "Uang Masuk" : "Uang Keluar"} sebesar ${formatCurrency(Number(txAmount))} berhasil dicatat ke jurnal & audit log!`)
      setTimeout(() => setSuccessMsg(null), 3500)
      
      // Reset form
      setTxAmount("")
      setTxDesc("")
      setTxDate("")
      setTxReceipt("")

      void fetchFinanceData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan transaksi.")
    } finally {
      setSubmittingTx(false)
    }
  }

  // Filtered members for kas grid
  const filteredKasMembers = members.filter((m) => {
    const matchesSearch = m.nama_lengkap.toLowerCase().includes(kasSearch.toLowerCase())
    const matchesCohort = kasCohort === "all" ? true : m.angkatan === kasCohort
    return matchesSearch && matchesCohort
  })

  // Filtered transactions
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(txSearch.toLowerCase()) ||
                          t.category.toLowerCase().includes(txSearch.toLowerCase())
    const matchesType = txFilterType === "all" ? true : t.type === txFilterType
    return matchesSearch && matchesType
  })

  // Sliced arrays for pagination
  const totalKasItems = filteredKasMembers.length
  const totalKasPages = Math.ceil(totalKasItems / kasLimit)
  const paginatedKasMembers = filteredKasMembers.slice((kasPage - 1) * kasLimit, kasPage * kasLimit)
  const kasStartIndex = (kasPage - 1) * kasLimit

  const totalTxItems = filteredTransactions.length
  const totalTxPages = Math.ceil(totalTxItems / txLimit)
  const paginatedTransactions = filteredTransactions.slice((txPage - 1) * txLimit, txPage * txLimit)
  const txStartIndex = (txPage - 1) * txLimit

  const totalAuditItems = auditLogs.length
  const totalAuditPages = Math.ceil(totalAuditItems / auditLimit)
  const paginatedAuditLogs = auditLogs.slice((auditPage - 1) * auditLimit, auditPage * auditLimit)
  const auditStartIndex = (auditPage - 1) * auditLimit

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-mono text-[#6B6862]">
        Memuat modul keuangan & audit kas komunitas...
      </div>
    )
  }

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#E4E1DA] pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <Wallet className="size-5 text-[#B23A2E]" />
            Manajemen Keuangan & Uang Kas Studio
          </h2>
          <p className="text-xs text-[#6B6862]">
            Pencatatan arus kas masuk/keluar & iuran mingguan terintegrasi audit log anti-fraud.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
            <ShieldCheck className="size-3.5" /> AUDIT LOG INTEGRATED
          </span>
          <Button size="sm" variant="outline" onClick={fetchFinanceData} className="h-8 border-[#E4E1DA] text-xs gap-1.5 font-semibold rounded-lg">
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3.5 text-xs text-[#B23A2E] flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* FINANCIAL SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-[#E4E1DA] bg-white shadow-none rounded-xl p-4 space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6862] flex items-center justify-between">
            <span>Saldo Kas Saat Ini</span>
            <Wallet className="size-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-[#1C1B1A]">
            {formatCurrency(stats.currentBalance)}
          </div>
          <div className="text-[10px] font-mono text-[#6B6862]">
            Total Transaksi: {stats.totalTransactions} entri
          </div>
        </Card>

        <Card className="border border-[#E4E1DA] bg-white shadow-none rounded-xl p-4 space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6862] flex items-center justify-between">
            <span>Total Uang Masuk</span>
            <TrendingUp className="size-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-700">
            {formatCurrency(stats.totalIncome)}
          </div>
          <div className="text-[10px] font-mono text-emerald-600 font-semibold">
            Bulan ini: +{formatCurrency(stats.monthlyIncome)}
          </div>
        </Card>

        <Card className="border border-[#E4E1DA] bg-white shadow-none rounded-xl p-4 space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6862] flex items-center justify-between">
            <span>Total Uang Keluar</span>
            <TrendingDown className="size-4 text-[#B23A2E]" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-[#B23A2E]">
            {formatCurrency(stats.totalExpense)}
          </div>
          <div className="text-[10px] font-mono text-[#B23A2E] font-semibold">
            Bulan ini: -{formatCurrency(stats.monthlyExpense)}
          </div>
        </Card>

        <Card className="border border-[#E4E1DA] bg-white shadow-none rounded-xl p-4 space-y-2">
          <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B6862] flex items-center justify-between">
            <span>Total Iuran Kas</span>
            <Sparkles className="size-4 text-amber-500" />
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-[#2B3A55]">
            {stats.totalKasRecords} Pembayaran
          </div>
          <div className="text-[10px] font-mono text-[#6B6862]">
            iuran standar Rp 2.000 / minggu
          </div>
        </Card>
      </div>

      {/* SUB TAB NAVIGATION */}
      <div className="border-b border-[#E4E1DA] flex gap-2 overflow-x-auto pb-px scrollbar-none">
        <button
          onClick={() => setActiveSubTab("kas")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === "kas"
              ? "border-[#B23A2E] text-[#B23A2E] bg-[#B23A2E]/5"
              : "border-transparent text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100"
          }`}
        >
          <Calendar className="size-3.5" />
          Uang Kas Mingguan Siswa
        </button>
        <button
          onClick={() => setActiveSubTab("transactions")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === "transactions"
              ? "border-[#B23A2E] text-[#B23A2E] bg-[#B23A2E]/5"
              : "border-transparent text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100"
          }`}
        >
          <FileText className="size-3.5" />
          Jurnal Uang Masuk & Keluar
        </button>
        <button
          onClick={() => setActiveSubTab("audit")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === "audit"
              ? "border-[#B23A2E] text-[#B23A2E] bg-[#B23A2E]/5"
              : "border-transparent text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100"
          }`}
        >
          <ShieldCheck className="size-3.5 text-emerald-600" />
          Audit Log Keuangan (Anti-Fraud)
        </button>
        <button
          onClick={() => setActiveSubTab("laporan")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
            activeSubTab === "laporan"
              ? "border-[#2B3A55] text-[#2B3A55] bg-[#2B3A55]/5"
              : "border-transparent text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100"
          }`}
        >
          <BarChart3 className="size-3.5" />
          Laporan & Export PDF
        </button>
      </div>

      {/* SUB TAB 1: UANG KAS MINGGUAN */}
      {activeSubTab === "kas" && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
          <CardHeader className="pb-3 border-b border-[#E4E1DA] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[#1C1B1A] flex items-center gap-2">
                <Calendar className="size-4 text-[#B23A2E]" />
                Pencatatan Uang Kas Mingguan per Anggota
              </CardTitle>
              <CardDescription className="text-xs">
                Pilih minggu pertemuan dan tandai pembayaran kas anggota (Rp 2.000/minggu).
              </CardDescription>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-white border border-[#E4E1DA] px-2.5 py-1 rounded-lg text-xs font-mono">
                <span className="text-[#6B6862] font-semibold">Minggu Ke:</span>
                <select
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(Number(e.target.value))}
                  className="bg-transparent font-bold text-[#B23A2E] focus:outline-none"
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      Minggu {w}
                    </option>
                  ))}
                </select>
              </div>

              <select
                value={kasCohort}
                onChange={(e) => {
                  setKasCohort(e.target.value)
                  setKasPage(1)
                }}
                className="border border-[#E4E1DA] bg-white text-xs h-8 px-2.5 rounded-lg text-[#1C1B1A]"
              >
                <option value="all">Semua Angkatan</option>
                <option value="2026">Angkatan 2026</option>
                <option value="2025">Angkatan 2025</option>
                <option value="2024">Angkatan 2024</option>
              </select>

              <div className="relative">
                <Search className="absolute left-2.5 top-2 size-3.5 text-[#6B6862]" />
                <Input
                  placeholder="Cari nama siswa..."
                  value={kasSearch}
                  onChange={(e) => {
                    setKasSearch(e.target.value)
                    setKasPage(1)
                  }}
                  className="pl-8 border-[#E4E1DA] bg-white text-xs h-8 w-40 rounded-lg"
                />
              </div>

              <select
                value={kasLimit}
                onChange={(e) => {
                  setKasLimit(Number(e.target.value))
                  setKasPage(1)
                }}
                className="border border-[#E4E1DA] bg-white text-xs h-8 px-2.5 rounded-lg text-[#1C1B1A] font-semibold focus:outline-none"
              >
                <option value={30}>30 baris</option>
                <option value={50}>50 baris</option>
                <option value={100}>100 baris</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                    <th className="py-2.5 font-medium">Nama Anggota</th>
                    <th className="py-2.5 font-medium">Angkatan</th>
                    <th className="py-2.5 font-medium">Status Minggu Ke-{selectedWeek}</th>
                    <th className="py-2.5 font-medium">Tanggal Bayar</th>
                    <th className="py-2.5 font-medium text-right">Aksi Bendahara</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedKasMembers.map((member) => {
                    const record = kasRecords.find(
                      (r) => r.profile_id === member.id && r.week_number === selectedWeek
                    )
                    const isPaid = !!record

                    return (
                      <tr key={member.id} className="border-b border-[#E4E1DA]/50 hover:bg-stone-50 transition-colors">
                        <td className="py-3 font-semibold text-[#1C1B1A]">
                          {member.nama_lengkap}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-[#6B6862]">
                          {member.angkatan ? `Angkatan ${member.angkatan}` : "-"}
                        </td>
                        <td className="py-3">
                          {isPaid ? (
                            <span className="bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="size-3" /> LUNAS (Rp 2.000)
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-800 border border-amber-500/20 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              Belum Bayar
                            </span>
                          )}
                        </td>
                        <td className="py-3 font-mono text-[10px] text-[#6B6862]">
                          {record ? new Date(record.paid_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                        <td className="py-3 text-right">
                          {isPaid ? (
                            <span className="text-[10px] font-mono text-emerald-600 font-bold">Terverifikasi</span>
                          ) : (
                            <Button
                              size="sm"
                              disabled={recordingKasId === member.id}
                              onClick={() => handleRecordKas(member)}
                              className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-[11px] font-semibold h-7 px-3 rounded-lg border-none shadow-sm"
                            >
                              {recordingKasId === member.id ? "Mencatat..." : "Tandai Lunas Rp 2.000"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DA] mt-4 text-[11px]">
              <div className="text-[#6B6862]">
                Menampilkan {kasStartIndex + 1} - {Math.min(kasStartIndex + kasLimit, totalKasItems)} dari {totalKasItems} anggota
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={kasPage === 1}
                  onClick={() => setKasPage(prev => Math.max(prev - 1, 1))}
                  className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                >
                  Sebelumnya
                </Button>
                <span className="font-mono text-[10px] text-[#1C1B1A]">
                  Halaman {kasPage} dari {totalKasPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={kasPage === totalKasPages || totalKasPages === 0}
                  onClick={() => setKasPage(prev => Math.min(prev + 1, totalKasPages))}
                  className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SUB TAB 2: JURNAL UANG MASUK & KELUAR */}
      {activeSubTab === "transactions" && (
        <div className="space-y-6">
          {/* Form Tambah Transaksi */}
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
            <CardHeader className="pb-3 border-b border-[#E4E1DA]">
              <CardTitle className="text-sm font-bold text-[#1C1B1A] flex items-center gap-2">
                <PlusCircle className="size-4 text-[#B23A2E]" />
                Catat Transaksi Arus Kas Baru
              </CardTitle>
              <CardDescription className="text-xs">
                Masukkan detail uang masuk/keluar. Setiap entri akan tercatat otomatis di Audit Log Keuangan.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Field>
                    <FieldLabel className="text-xs font-semibold">Jenis Transaksi</FieldLabel>
                    <select
                      value={txType}
                      onChange={(e) => setTxType(e.target.value as "in" | "out")}
                      className="w-full border border-[#E4E1DA] bg-white text-xs h-9 px-2.5 rounded-lg text-[#1C1B1A] font-bold"
                    >
                      <option value="in">🟢 Uang Masuk (Income)</option>
                      <option value="out">🔴 Uang Keluar (Expense)</option>
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-semibold">Kategori</FieldLabel>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full border border-[#E4E1DA] bg-white text-xs h-9 px-2.5 rounded-lg text-[#1C1B1A]"
                    >
                      <option value="Uang Kas">Uang Kas Mingguan</option>
                      <option value="Sponsor/Donasi">Sponsor / Donasi</option>
                      <option value="Pengadaan Alat">Pengadaan Alat & Bahan</option>
                      <option value="Konsumsi Acara">Konsumsi Acara/Festival</option>
                      <option value="Transportasi">Transportasi</option>
                      <option value="Operasional">Operasional Komunitas</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-semibold">Nominal (Rp)</FieldLabel>
                    <Input
                      type="number"
                      placeholder="Contoh: 50000"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg font-mono font-bold"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-semibold">Tanggal Transaksi</FieldLabel>
                    <Input
                      type="datetime-local"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg"
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field>
                    <FieldLabel className="text-xs font-semibold">Deskripsi / Peruntukan ("Darimana / Buat Apa")</FieldLabel>
                    <Input
                      placeholder="Contoh: Pembelian 5 pcs modul cetak kanji N5..."
                      value={txDesc}
                      onChange={(e) => setTxDesc(e.target.value)}
                      required
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg"
                    />
                  </Field>

                  <Field>
                    <FieldLabel className="text-xs font-semibold">URL Foto Bukti Transfer / Nota (Opsional)</FieldLabel>
                    <Input
                      placeholder="https://..."
                      value={txReceipt}
                      onChange={(e) => setTxReceipt(e.target.value)}
                      className="border-[#E4E1DA] bg-white text-xs h-9 rounded-lg"
                    />
                  </Field>
                </div>

                <Button
                  type="submit"
                  disabled={submittingTx}
                  className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 h-9 text-xs font-bold rounded-lg border-none w-full md:w-auto px-6 shadow-sm flex items-center justify-center gap-2"
                >
                  <PlusCircle className="size-4" />
                  {submittingTx ? "Simpan Transaksi..." : "Simpan Ke Jurnal & Audit Log"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tabel Riwayat Transaksi */}
          <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
            <CardHeader className="pb-3 border-b border-[#E4E1DA] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-[#1C1B1A]">
                  Jurnal Riwayat Transaksi Arus Kas
                </CardTitle>
                <CardDescription className="text-xs">
                  Semua catatan transaksi uang masuk dan uang keluar yang tercatat resmi.
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={txFilterType}
                  onChange={(e) => setTxFilterType(e.target.value)}
                  className="border border-[#E4E1DA] bg-white text-xs h-8 px-2.5 rounded-lg text-[#1C1B1A]"
                >
                  <option value="all">Semua Transaksi</option>
                  <option value="in">Uang Masuk</option>
                  <option value="out">Uang Keluar</option>
                </select>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 size-3.5 text-[#6B6862]" />
                  <Input
                    placeholder="Cari deskripsi..."
                    value={txSearch}
                    onChange={(e) => setTxSearch(e.target.value)}
                    className="pl-8 border-[#E4E1DA] bg-white text-xs h-8 w-40 rounded-lg"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                      <th className="py-2.5 font-medium">Tanggal</th>
                      <th className="py-2.5 font-medium">Jenis & Kategori</th>
                      <th className="py-2.5 font-medium">Deskripsi Peruntukan</th>
                      <th className="py-2.5 font-medium">Pencatat</th>
                      <th className="py-2.5 font-medium text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTransactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-[#E4E1DA]/50 hover:bg-stone-50 transition-colors">
                        <td className="py-3 font-mono text-[11px] text-[#6B6862]">
                          {new Date(tx.transaction_date).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                              tx.type === "in"
                                ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                : "bg-red-500/10 text-red-700 border border-red-500/20"
                            }`}>
                              {tx.type === "in" ? "MASUK" : "KELUAR"}
                            </span>
                            <span className="font-semibold text-[#1C1B1A] text-[11px]">
                              {tx.category}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-[#1C1B1A]">
                          <div className="font-medium">{tx.description}</div>
                          {tx.receipt_url && (
                            <a
                              href={tx.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                            >
                              <Image className="size-3" /> Lihat Bukti Nota
                            </a>
                          )}
                        </td>
                        <td className="py-3 font-mono text-[10px] text-[#6B6862]">
                          {tx.recorded_by_profile?.nama_lengkap || "Sistem Studio"}
                        </td>
                        <td className={`py-3 text-right font-mono font-bold ${tx.type === "in" ? "text-emerald-700" : "text-[#B23A2E]"}`}>
                          {tx.type === "in" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DA] mt-4 text-[11px]">
                <div className="text-[#6B6862]">
                  Menampilkan {txStartIndex + 1} - {Math.min(txStartIndex + txLimit, totalTxItems)} dari {totalTxItems} transaksi
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txPage === 1}
                    onClick={() => setTxPage(prev => Math.max(prev - 1, 1))}
                    className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                  >
                    Sebelumnya
                  </Button>
                  <span className="font-mono text-[10px] text-[#1C1B1A]">
                    Halaman {txPage} dari {totalTxPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={txPage === totalTxPages || totalTxPages === 0}
                    onClick={() => setTxPage(prev => Math.min(prev + 1, totalTxPages))}
                    className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                  >
                    Berikutnya
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* SUB TAB 3: AUDIT LOG KEUANGAN (ANTI-FRAUD) */}
      {activeSubTab === "audit" && (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
          <CardHeader className="pb-3 border-b border-[#E4E1DA] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-bold text-[#1C1B1A] flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                Audit Log Keuangan Immutable (Anti-Fraud)
              </CardTitle>
              <CardDescription className="text-xs">
                Seluruh riwayat pencatatan uang kas dan arus dana tercatat permanen di audit log dan tidak dapat dimanipulasi.
              </CardDescription>
            </div>
            <div>
              <select
                value={auditLimit}
                onChange={(e) => {
                  setAuditLimit(Number(e.target.value))
                  setAuditPage(1)
                }}
                className="border border-[#E4E1DA] bg-white text-xs h-8 px-2.5 rounded-lg text-[#1C1B1A] font-semibold focus:outline-none"
              >
                <option value={30}>30 baris</option>
                <option value={50}>50 baris</option>
                <option value={100}>100 baris</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                    <th className="py-2.5 font-medium">Waktu Log</th>
                    <th className="py-2.5 font-medium">Operator / Pengurus</th>
                    <th className="py-2.5 font-medium">Jenis Aksi</th>
                    <th className="py-2.5 font-medium">Rincian Audit Log</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAuditLogs.map((log) => (
                    <tr key={log.id} className="border-b border-[#E4E1DA]/50 hover:bg-stone-50 transition-colors">
                      <td className="py-3 font-mono text-[10px] text-[#6B6862]">
                        {new Date(log.created_at).toLocaleString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>
                      <td className="py-3 font-mono">
                        <div className="font-bold text-[#1C1B1A]">{log.actor_name}</div>
                        <div className="text-[9px] text-[#6B6862] uppercase">{log.actor_role}</div>
                      </td>
                      <td className="py-3">
                        <span className="bg-blue-500/10 text-blue-700 border border-blue-500/20 text-[9px] font-mono font-bold px-2 py-0.5 rounded">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 text-[#1C1B1A] font-mono text-[11px]">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#E4E1DA] mt-4 text-[11px]">
              <div className="text-[#6B6862]">
                Menampilkan {auditStartIndex + 1} - {Math.min(auditStartIndex + auditLimit, totalAuditItems)} dari {totalAuditItems} log
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditPage === 1}
                  onClick={() => setAuditPage(prev => Math.max(prev - 1, 1))}
                  className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                >
                  Sebelumnya
                </Button>
                <span className="font-mono text-[10px] text-[#1C1B1A]">
                  Halaman {auditPage} dari {totalAuditPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={auditPage === totalAuditPages || totalAuditPages === 0}
                  onClick={() => setAuditPage(prev => Math.min(prev + 1, totalAuditPages))}
                  className="border-[#E4E1DA] text-[10px] h-7 rounded-md font-semibold"
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* SUB TAB 4: LAPORAN & EXPORT */}
      {activeSubTab === "laporan" && (() => {
        // Compute monthly breakdown from transactions
        const monthlyMap: Record<string, { income: number; expense: number }> = {}
        transactions.forEach((t) => {
          const d = new Date(t.transaction_date)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          if (!monthlyMap[key]) monthlyMap[key] = { income: 0, expense: 0 }
          if (t.type === "in") monthlyMap[key].income += t.amount
          else monthlyMap[key].expense += t.amount
        })
        const monthlyRows = Object.entries(monthlyMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, v]) => ({ key, ...v, balance: v.income - v.expense }))

        // Compute kas weekly progress
        const weekSet = new Set(kasRecords.map((r) => r.week_number))
        const studentMembers = members.filter((m) => ["student", "alumni"].includes(m.role))
        const maxWeek = Math.max(...Array.from(weekSet), 0)
        const kasWeekRows = Array.from({ length: Math.max(maxWeek, 1) }, (_, i) => {
          const w = i + 1
          const paidCount = kasRecords.filter((r) => r.week_number === w).length
          const totalMembers = studentMembers.length
          const unpaidCount = Math.max(totalMembers - paidCount, 0)
          const totalCollected = paidCount * 2000
          return { week: w, paidCount, unpaidCount, totalCollected }
        })

        return (
          <div className="space-y-6" id="finance-laporan-print">
            {/* Print header — visible only when printing */}
            <div className="hidden print:block text-center pb-4 border-b border-gray-200 mb-6">
              <h1 className="text-lg font-bold">Laporan Keuangan JPER Community</h1>
              <p className="text-sm text-gray-600">Dicetak pada {new Date().toLocaleString("id-ID")}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#1C1B1A] flex items-center gap-2">
                  <BarChart3 className="size-4 text-[#2B3A55]" />
                  Laporan Keuangan & Rekap Kas
                </h3>
                <p className="text-[11px] text-[#6B6862] font-mono">
                  Ringkasan bulanan dan progres iuran kas per minggu. Dapat diekspor sebagai PDF.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 h-9 text-xs font-bold rounded-lg border-none shadow-sm flex items-center gap-2 print:hidden"
              >
                <Printer className="size-4" />
                Cetak / Export PDF
              </Button>
            </div>

            {/* Ringkasan Saldo Keseluruhan */}
            <div className="grid grid-cols-3 gap-4 print:grid-cols-3">
              <div className="rounded-xl border border-[#E4E1DA] bg-white p-4 space-y-1">
                <div className="text-[10px] font-mono font-bold text-[#6B6862] uppercase tracking-wider">Total Pemasukan</div>
                <div className="text-base font-extrabold text-emerald-700">{formatCurrency(stats.totalIncome)}</div>
              </div>
              <div className="rounded-xl border border-[#E4E1DA] bg-white p-4 space-y-1">
                <div className="text-[10px] font-mono font-bold text-[#6B6862] uppercase tracking-wider">Total Pengeluaran</div>
                <div className="text-base font-extrabold text-[#B23A2E]">{formatCurrency(stats.totalExpense)}</div>
              </div>
              <div className="rounded-xl border border-[#2B3A55]/20 bg-[#2B3A55]/5 p-4 space-y-1">
                <div className="text-[10px] font-mono font-bold text-[#2B3A55] uppercase tracking-wider">Saldo Saat Ini</div>
                <div className="text-base font-extrabold text-[#2B3A55]">{formatCurrency(stats.currentBalance)}</div>
              </div>
            </div>

            {/* Tabel Ringkasan Bulanan */}
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
              <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                <CardTitle className="text-sm font-bold text-[#1C1B1A]">📅 Rekap Arus Kas Per Bulan</CardTitle>
                <CardDescription className="text-xs">Ringkasan pemasukan, pengeluaran, dan saldo per bulan kalender.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {monthlyRows.length === 0 ? (
                  <div className="text-xs text-[#6B6862] italic text-center py-6">Belum ada transaksi yang tercatat.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                          <th className="py-2.5 font-medium">Bulan</th>
                          <th className="py-2.5 font-medium text-emerald-700">Uang Masuk</th>
                          <th className="py-2.5 font-medium text-[#B23A2E]">Uang Keluar</th>
                          <th className="py-2.5 font-medium text-[#2B3A55]">Saldo Bulan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {monthlyRows.map((row) => {
                          const [year, month] = row.key.split("-")
                          const label = new Date(Number(year), Number(month) - 1).toLocaleString("id-ID", { month: "long", year: "numeric" })
                          return (
                            <tr key={row.key} className="border-b border-[#E4E1DA]/50 hover:bg-stone-50 transition-colors">
                              <td className="py-3 font-semibold text-[#1C1B1A] capitalize">{label}</td>
                              <td className="py-3 font-mono font-bold text-emerald-700">+{formatCurrency(row.income)}</td>
                              <td className="py-3 font-mono font-bold text-[#B23A2E]">-{formatCurrency(row.expense)}</td>
                              <td className={`py-3 font-mono font-extrabold ${row.balance >= 0 ? "text-[#2B3A55]" : "text-[#B23A2E]"}`}>
                                {row.balance >= 0 ? "+" : ""}{formatCurrency(row.balance)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tabel Progres Kas Mingguan */}
            <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-xl">
              <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                <CardTitle className="text-sm font-bold text-[#1C1B1A]">📊 Progres Iuran Kas Per Minggu</CardTitle>
                <CardDescription className="text-xs">
                  Berapa anggota yang sudah/belum bayar per minggu. Standar Rp 2.000 / orang / minggu.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {kasWeekRows.length === 0 || (kasWeekRows.length === 1 && kasWeekRows[0].paidCount === 0) ? (
                  <div className="text-xs text-[#6B6862] italic text-center py-6">Belum ada iuran kas yang tercatat.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-[#E4E1DA] text-[#6B6862] font-mono">
                          <th className="py-2.5 font-medium">Minggu</th>
                          <th className="py-2.5 font-medium text-emerald-700">Sudah Bayar</th>
                          <th className="py-2.5 font-medium text-amber-700">Belum Bayar</th>
                          <th className="py-2.5 font-medium">Progress</th>
                          <th className="py-2.5 font-medium text-right">Total Terkumpul</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kasWeekRows.map((row) => {
                          const total = row.paidCount + row.unpaidCount
                          const pct = total > 0 ? Math.round((row.paidCount / total) * 100) : 0
                          return (
                            <tr key={row.week} className="border-b border-[#E4E1DA]/50 hover:bg-stone-50 transition-colors">
                              <td className="py-3 font-mono font-bold text-[#1C1B1A]">Minggu {row.week}</td>
                              <td className="py-3 font-mono text-emerald-700 font-bold">{row.paidCount} orang</td>
                              <td className="py-3 font-mono text-amber-700 font-semibold">{row.unpaidCount} orang</td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-[#E4E1DA] rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-[#6B6862]">{pct}%</span>
                                </div>
                              </td>
                              <td className="py-3 font-mono font-bold text-[#2B3A55] text-right">{formatCurrency(row.totalCollected)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}
