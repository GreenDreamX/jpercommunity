"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { QrCode, ClipboardCheck, AlertCircle, Check, Camera, RefreshCw } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A]">Kehadiran Kelas</h2>
          <p className="text-xs text-[#6B6862]">Pindai QR code pertemuan untuk mencatat kehadiran Anda.</p>
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
            <Button className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 rounded-lg flex items-center gap-2 text-xs font-semibold px-4 py-2 h-9 shadow-none border-none">
              <QrCode className="size-4" />
              Pindai QR Absensi
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-[#1C1B1A]">Pindai QR Absensi</DialogTitle>
              <DialogDescription className="text-xs text-[#6B6862]">
                Posisikan QR code yang ditampilkan admin di depan kamera Anda.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4 py-2">
              {/* Camera Scanner View */}
              <div className="relative overflow-hidden rounded-xl border border-[#E4E1DA] bg-stone-900 min-h-[260px] flex items-center justify-center">
                <div id="qr-camera-reader" className="w-full h-full min-h-[260px]" />

                {/* Overlay loading state */}
                {cameraStarting && !isCameraActive && (
                  <div className="absolute inset-0 bg-stone-900/90 flex flex-col items-center justify-center gap-2 text-white p-4">
                    <RefreshCw className="size-6 animate-spin text-[#B23A2E]" />
                    <span className="text-xs font-mono">Mengaktifkan kamera...</span>
                  </div>
                )}

                {/* Error state */}
                {cameraError && !cameraStarting && (
                  <div className="absolute inset-0 bg-stone-900/95 flex flex-col items-center justify-center gap-3 p-6 text-center">
                    <Camera className="size-8 text-[#B23A2E]" />
                    <div className="text-xs text-stone-300 leading-relaxed max-w-xs">{cameraError}</div>
                    <Button
                      size="sm"
                      onClick={() => void startCamera()}
                      className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 text-xs font-semibold rounded-lg h-8 px-3 border-none shadow-none"
                    >
                      <RefreshCw className="size-3.5 mr-1" />
                      Coba Buka Kamera Lagi
                    </Button>
                  </div>
                )}
              </div>

              {/* Status messages */}
              {scanStatus === "loading" && (
                <div className="text-center text-xs text-[#6B6862] animate-pulse font-mono">
                  Memproses absensi...
                </div>
              )}
              {scanStatus === "success" && (
                <div className="flex items-center gap-2 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-xs text-green-700 font-medium">
                  <Check className="size-4 stroke-[2.5]" />
                  {scanMessage}
                </div>
              )}
              {scanStatus === "error" && (
                <div className="flex items-center gap-2 rounded-lg bg-[#B23A2E]/10 border border-[#B23A2E]/20 p-3 text-xs text-[#B23A2E] font-medium">
                  <AlertCircle className="size-4" />
                  {scanMessage}
                </div>
              )}

              {/* Fallback Token Input */}
              <div className="border-t border-[#E4E1DA] pt-4 mt-2">
                <div className="text-xs font-semibold text-[#1C1B1A] mb-2">Punya token absensi?</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Masukkan token absensi..."
                    value={manualToken}
                    onChange={(e) => setManualToken(e.target.value)}
                    className="border-[#E4E1DA] bg-[#FAF9F6] rounded-lg text-xs h-9"
                    disabled={scanStatus === "loading" || scanStatus === "success"}
                  />
                  <Button 
                    onClick={() => handleScanSubmit(manualToken)}
                    disabled={!manualToken.trim() || scanStatus === "loading" || scanStatus === "success"}
                    className="bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 text-xs font-semibold px-4 h-9 rounded-lg shadow-none border-none"
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
        <Card className="border-[#B23A2E]/30 bg-[#B23A2E]/5 rounded-lg shadow-none">
          <CardContent className="p-4 flex items-center gap-2 text-xs text-[#B23A2E]">
            <AlertCircle className="size-4" />
            {error}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-xs text-[#6B6862] py-4 font-mono">Memuat riwayat kehadiran...</div>
      ) : records.length === 0 ? (
        <Card className="border border-[#E4E1DA] bg-[#FAF9F6]/50 shadow-none rounded-lg">
          <CardContent className="p-8 text-center text-xs text-[#6B6862]">
            <ClipboardCheck className="size-8 mx-auto stroke-[1.2] mb-2 text-[#6B6862]/60" />
            Belum ada riwayat kehadiran tercatat.
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-hidden border border-[#E4E1DA] rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4E1DA] bg-[#FAF9F6] text-[#6B6862] font-mono tracking-wider">
                <th className="p-3.5 font-medium">PERTEMUAN</th>
                <th className="p-3.5 font-medium">MATERI</th>
                <th className="p-3.5 font-medium">WAKTU ABSEN</th>
                <th className="p-3.5 font-medium text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const week = record.attendance_sessions?.course_weeks
                const session = record.attendance_sessions
                return (
                  <tr key={record.id} className="border-b border-[#E4E1DA] bg-[#FAF9F6]/20 last:border-none">
                    <td className="p-3.5 text-[#1C1B1A] font-semibold">
                      Pertemuan {week?.week_number ?? "-"}
                    </td>
                    <td className="p-3.5 text-[#6B6862]">
                      {session?.materi_diajarkan ?? week?.title ?? "-"}
                    </td>
                    <td className="p-3.5 text-[#6B6862] font-mono">
                      {new Date(record.scanned_at).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="p-3.5 text-right flex justify-end items-center h-12">
                      {/* Hanko stamp: thin circular red border with HADIR inside, slightly tilted */}
                      <div className="relative flex items-center justify-center w-11 h-11 border border-dashed border-[#B23A2E]/25 rounded-full">
                        <div className="absolute transform rotate-[-12deg] flex items-center justify-center w-9 h-9 border border-[#B23A2E] rounded-full text-[9px] font-bold text-[#B23A2E] tracking-tight bg-white/40">
                          出席
                        </div>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
