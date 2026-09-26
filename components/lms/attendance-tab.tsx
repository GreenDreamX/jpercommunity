"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { QrCode, ClipboardCheck, AlertCircle, Check, Camera, RefreshCw } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type AttendanceRecord = {
  id: string
  scanned_at: string
  status: string
  attendance_sessions: {
    opened_at: string
    materi_diajarkan: string | null
    course_weeks: {
      week_number: number
      title: string
    }
  }
}

type AttendanceTabProps = {
  firebaseToken: string
}

export function AttendanceTab({ firebaseToken }: AttendanceTabProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // QR Scan states
  const [isScanOpen, setIsScanOpen] = useState(false)
  const [manualToken, setManualToken] = useState("")
  const [scanStatus, setScanStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [scanMessage, setScanMessage] = useState("")
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraStarting, setCameraStarting] = useState(false)
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    let active = true
    setTimeout(() => {
      if (active) setLoading(true)
    }, 0)

    fetch("/api/lms/attendance", {
      headers: { Authorization: `Bearer ${firebaseToken}` },
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((payload) => {
            throw new Error(payload?.message ?? "Gagal mengambil data absensi.")
          })
        }
        return res.json()
      })
      .then((data) => {
        if (active) {
          setRecords(data.records ?? [])
          setError(null)
          setLoading(false)
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Terjadi kesalahan.")
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [firebaseToken, refreshTrigger])

  const handleScanSubmit = useCallback(async (token: string) => {
    if (!token.trim()) return
    setScanStatus("loading")
    setScanMessage("")

    try {
      const res = await fetch("/api/lms/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({ qr_token: token.trim() }),
      })

      const payload = await res.json()
      if (!res.ok) {
        throw new Error(payload.message ?? "Gagal merekam absensi.")
      }

      setScanStatus("success")
      setScanMessage(payload.message ?? "Absensi Anda berhasil dicatat!")
      setRefreshTrigger((prev) => prev + 1)
      
      // Auto close dialog after success
      setTimeout(() => {
        setIsScanOpen(false)
      }, 1500)
    } catch (err: unknown) {
      setScanStatus("error")
      setScanMessage(err instanceof Error ? err.message : "Gagal memproses absensi.")
    }
  }, [firebaseToken])

  // Camera start & stop helpers
  const stopCamera = useCallback(async () => {
    if (html5QrcodeRef.current) {
      try {
        if (html5QrcodeRef.current.isScanning) {
          await html5QrcodeRef.current.stop()
        }
      } catch (e) {
        console.error("Error stopping camera", e)
      }
      html5QrcodeRef.current = null
    }
    setIsCameraActive(false)
    setCameraStarting(false)
  }, [])

  const startCamera = useCallback(async () => {
    setCameraError(null)
    setCameraStarting(true)
    setIsCameraActive(false)

    await stopCamera()

    // Wait for Dialog DOM to be ready
    await new Promise((resolve) => setTimeout(resolve, 350))

    const readerEl = document.getElementById("qr-camera-reader")
    if (!readerEl) {
      setCameraStarting(false)
      return
    }

    try {
      const scanner = new Html5Qrcode("qr-camera-reader")
      html5QrcodeRef.current = scanner

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        async (decodedText) => {
          // Successfully scanned!
          await stopCamera()
          await handleScanSubmit(decodedText)
        },
        () => {
          // Frame missed, keep scanning
        }
      )

      setIsCameraActive(true)
    } catch (err: unknown) {
      console.error("Failed to start camera", err)
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("notallowed")) {
        setCameraError("Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser Anda, atau gunakan token manual di bawah.")
      } else if (msg.toLowerCase().includes("notfound") || msg.toLowerCase().includes("devicesnotfound")) {
        setCameraError("Kamera tidak ditemukan pada perangkat Anda. Silakan gunakan token manual di bawah.")
      } else {
        setCameraError("Gagal membuka kamera. Pastikan browser diizinkan mengakses kamera, atau ketik token di bawah secara manual.")
      }
      setIsCameraActive(false)
    } finally {
      setCameraStarting(false)
    }
  }, [stopCamera, handleScanSubmit])

  // Dialog open / close effect
  useEffect(() => {
    if (isScanOpen) {
      void startCamera()
    } else {
      void stopCamera()
    }
    return () => {
      void stopCamera()
    }
  }, [isScanOpen, startCamera, stopCamera])

  return (
    <div className="space-y-6 text-black">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#111]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block bg-[#E60012] text-white px-2 py-0.5 text-[10px] font-mono font-black uppercase tracking-wider -skew-x-6 border border-black shadow-[2px_2px_0px_#FFC700]">
              出席管理 • ATTENDANCE LOG
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-black">
            Kehadiran Kelas & Absensi
          </h2>
          <p className="text-xs font-semibold text-zinc-600 mt-1">
            Pindai QR code pertemuan untuk mencatat kehadiran Anda secara real-time.
          </p>
        </div>

        <Dialog
          open={isScanOpen}
          onOpenChange={(open) => {
            setIsScanOpen(open)
            if (open) {
              setScanStatus("idle")
              setScanMessage("")
              setManualToken("")
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="border-2 border-black bg-[#E60012] text-white font-black uppercase text-xs px-5 py-2.5 h-11 rounded-none shadow-[4px_4px_0px_#111] hover:bg-black hover:text-[#FFC700] hover:shadow-[4px_4px_0px_#E60012] transition-all flex items-center gap-2 shrink-0">
              <QrCode className="size-4" />
              <span>Pindai QR Absensi</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-white border-2 border-black shadow-[8px_8px_0px_#111] rounded-none p-6 text-black">
            <DialogHeader className="border-b-2 border-black pb-3">
              <span className="inline-block w-fit bg-black text-[#FFC700] px-2 py-0.5 text-[10px] font-mono font-black uppercase -skew-x-6 border border-black">
                QR SCANNER • カメラ
              </span>
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-black mt-2">
                Pindai QR Absensi
              </DialogTitle>
              <DialogDescription className="text-xs font-semibold text-zinc-600">
                Arahkan kamera ke QR Code yang ditampilkan pembina/admin di depan kelas.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-3">
              {/* Camera Scanner View */}
              <div className="relative overflow-hidden border-2 border-black bg-black min-h-[260px] flex items-center justify-center shadow-[4px_4px_0px_#111]">
                <div id="qr-camera-reader" className="w-full h-full min-h-[260px]" />

                {/* Overlay loading state */}
                {cameraStarting && !isCameraActive && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-2 text-white p-4">
                    <RefreshCw className="size-6 animate-spin text-[#FFC700]" />
                    <span className="text-xs font-mono font-bold tracking-wider">Mengaktifkan kamera...</span>
                  </div>
                )}

                {/* Error state */}
                {cameraError && !cameraStarting && (
                  <div className="absolute inset-0 bg-zinc-900/95 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
                    <Camera className="size-8 text-[#E60012]" />
                    <div className="text-xs font-medium text-zinc-300 leading-relaxed max-w-xs">{cameraError}</div>
                    <Button
                      size="sm"
                      onClick={() => void startCamera()}
                      className="border-2 border-black bg-[#FFC700] text-black font-black hover:bg-white text-xs rounded-none h-9 px-4 shadow-[2px_2px_0px_#111]"
                    >
                      <RefreshCw className="size-3.5 mr-1" />
                      Coba Buka Kamera Lagi
                    </Button>
                  </div>
                )}
              </div>

              {/* Status messages */}
              {scanStatus === "loading" && (
                <div className="text-center text-xs font-mono font-black text-black bg-[#FFC700] p-2 border-2 border-black animate-pulse">
                  Memproses absensi Anda...
                </div>
              )}
              {scanStatus === "success" && (
                <div className="flex items-center gap-2 border-2 border-black bg-emerald-400 p-3 text-xs font-black text-black shadow-[3px_3px_0px_#111]">
                  <Check className="size-4 stroke-[3]" />
                  {scanMessage}
                </div>
              )}
              {scanStatus === "error" && (
                <div className="flex items-center gap-2 border-2 border-black bg-[#E60012] p-3 text-xs font-black text-white shadow-[3px_3px_0px_#111]">
                  <AlertCircle className="size-4 shrink-0" />
                  {scanMessage}
                </div>
              )}

              {/* Fallback Token Input */}
              <div className="border-t-2 border-black pt-4 mt-2">
                <div className="text-xs font-black uppercase text-black mb-2">Gunakan Token Manual</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ketik token absensi..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="border-2 border-black bg-zinc-50 rounded-none text-xs h-10 font-bold text-black focus:bg-white focus:ring-0 focus:border-[#E60012]"
                    disabled={scanStatus === "loading" || scanStatus === "success"}
                  />
                  <Button 
                    onClick={() => handleScanSubmit(manualToken)}
                    disabled={!manualToken.trim() || scanStatus === "loading" || scanStatus === "success"}
                    className="border-2 border-black bg-black text-white font-black hover:bg-[#E60012] text-xs px-4 h-10 rounded-none shadow-[2px_2px_0px_#111]"
                  >
                    Kirim
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border-2 border-black bg-[#E60012] text-white rounded-none shadow-[4px_4px_0px_#111]">
          <CardContent className="p-4 flex items-center gap-2 text-xs font-bold">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="border-2 border-black bg-white p-8 text-center text-xs font-mono font-bold text-zinc-600 shadow-[4px_4px_0px_#111]">
          Memuat riwayat kehadiran Anda...
        </div>
      ) : records.length === 0 ? (
        <Card className="border-2 border-black bg-white shadow-[4px_4px_0px_#111] rounded-none">
          <CardContent className="p-10 text-center text-xs font-semibold text-zinc-600">
            <ClipboardCheck className="size-10 mx-auto stroke-[1.5] mb-3 text-black" />
            <p className="font-bold text-sm text-black uppercase">Belum Ada Riwayat Kehadiran</p>
            <p className="text-xs text-zinc-500 mt-1">Gunakan tombol "Pindai QR Absensi" di atas saat sesi kelas dibuka.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="border-2 border-black bg-white shadow-[6px_6px_0px_#111] overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b-2 border-black bg-[#FAF9F5] text-black font-mono font-black uppercase tracking-wider text-[11px]">
                <th className="p-4 border-r-2 border-black">PERTEMUAN</th>
                <th className="p-4 border-r-2 border-black">MATERI DIAJARKAN</th>
                <th className="p-4 border-r-2 border-black">WAKTU ABSEN</th>
                <th className="p-4 text-right">STATUS & STAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {records.map((record, index) => {
                const week = record.attendance_sessions?.course_weeks
                const session = record.attendance_sessions
                const status = record.status || "hadir"

                let stampText = "出席" // hadir
                let stampColor = "border-[#E60012] text-[#E60012] bg-[#E60012]/10"
                let label = "Hadir"
                if (status === "izin") {
                  stampText = "公欠"
                  stampColor = "border-blue-600 text-blue-600 bg-blue-50"
                  label = "Izin"
                } else if (status === "sakit") {
                  stampText = "病欠"
                  stampColor = "border-amber-600 text-amber-600 bg-amber-50"
                  label = "Sakit"
                } else if (status === "alpa") {
                  stampText = "欠席"
                  stampColor = "border-red-600 text-red-600 bg-red-50"
                  label = "Alpa"
                } else if (status === "dispen") {
                  stampText = "公欠"
                  stampColor = "border-purple-600 text-purple-600 bg-purple-50"
                  label = "Dispen"
                }

                return (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: index * 0.03 }}
                    className="hover:bg-amber-50/50 transition-colors"
                  >
                    <td className="p-4 border-r-2 border-black font-black text-black">
                      Pertemuan {week?.week_number ?? "-"}
                    </td>
                    <td className="p-4 border-r-2 border-black font-bold text-zinc-800">
                      {session?.materi_diajarkan ?? week?.title ?? "-"}
                    </td>
                    <td className="p-4 border-r-2 border-black font-mono font-bold text-zinc-700">
                      {new Date(record.scanned_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <span className="text-[10px] font-mono font-black uppercase px-2.5 py-1 bg-black text-[#FFC700] border border-black -skew-x-6">
                          {label}
                        </span>
                        {/* Japanese Hanko stamp */}
                        <div className="relative flex items-center justify-center w-10 h-10 border-2 border-dashed border-black rounded-full shrink-0">
                          <div className={`absolute transform -rotate-12 flex items-center justify-center w-8 h-8 border-2 ${stampColor} rounded-full text-[10px] font-black tracking-tighter shadow-[1px_1px_0px_#111]`}>
                            {stampText}
                          </div>
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
