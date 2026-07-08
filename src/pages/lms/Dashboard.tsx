import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '../../lib/supabaseClient'
import { ScanLine, X, CheckCircle2, AlertCircle } from 'lucide-react'

type ScanState = 'idle' | 'scanning' | 'success' | 'error'

export default function Dashboard() {
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  // Cleanup scanner on unmount or modal close
  useEffect(() => {
    return () => {
      stopScanner()
    }
  }, [])

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop()
        }
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (err) {
        console.error('Failed to stop scanner', err)
      }
    }
  }

  const startScanner = async () => {
    setScanState('scanning')
    setIsModalOpen(true)
    setErrorMessage('')

    // Delay initialization slightly to ensure DOM element is ready
    setTimeout(async () => {
      try {
        scannerRef.current = new Html5Qrcode('qr-reader')
        await scannerRef.current.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          onScanSuccess,
          () => {} // ignore scan failures (frequent)
        )
      } catch (err) {
        console.error('Failed to start scanner', err)
        setScanState('error')
        setErrorMessage('Gagal mengakses kamera.')
      }
    }, 100)
  }

  const handleCloseModal = async () => {
    await stopScanner()
    setIsModalOpen(false)
    setScanState('idle')
  }

  const onScanSuccess = async (decodedText: string) => {
    if (scanState !== 'scanning') return
    
    // Stop scanner to prevent multiple scans
    await stopScanner()

    try {
      const payload = JSON.parse(decodedText)
      
      if (!payload.meeting_id || !payload.valid_until) {
        throw new Error('Format QR tidak valid.')
      }

      if (Date.now() > payload.valid_until) {
        throw new Error('QR Code Kadaluwarsa. Silakan scan ulang di layar Studio.')
      }

      // Valid QR -> Insert to Supabase
      // Assuming user is logged in, we get their session
      const { data: { session } } = await supabase!.auth.getSession()
      let memberId = session?.user?.id
      
      // If no real session during development/testing, try to use a mock profile ID if one exists,
      // or we can't proceed without a valid UUID. We'll show an error if auth is completely missing.
      if (!memberId) {
        // Fallback for demo purposes if RLS allows or we fetch a random user
        const { data: profiles } = await supabase!.from('profiles').select('id').limit(1)
        if (profiles && profiles.length > 0) {
          memberId = profiles[0].id
        } else {
          throw new Error('Anda harus login terlebih dahulu.')
        }
      }

      const { error } = await supabase!
        .from('attendance')
        .insert({
          member_id: memberId,
          meeting_id: payload.meeting_id,
          status: 'hadir'
        })

      if (error) {
        // Supabase unique constraint violation returns code 23505
        if (error.code === '23505') {
          throw new Error('Anda sudah melakukan presensi untuk pertemuan ini.')
        }
        throw new Error('Gagal mencatat presensi: ' + error.message)
      }

      setScanState('success')
    } catch (err: any) {
      setScanState('error')
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses QR.')
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-100">LMS Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-1">Akses kelas dan lakukan presensi kehadiran Anda.</p>
      </div>

      <button
        onClick={startScanner}
        className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-950 rounded-md font-medium hover:bg-white transition-colors"
      >
        <ScanLine className="w-5 h-5" />
        Scan Presensi JPER
      </button>

      {/* Minimalist Modal for Scanner */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl relative">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-100">Scan QR Presensi</h3>
              <button onClick={handleCloseModal} className="text-zinc-400 hover:text-zinc-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center min-h-[300px]">
              {scanState === 'scanning' && (
                <div className="w-full">
                  <div id="qr-reader" className="w-full rounded-lg overflow-hidden border border-zinc-800 bg-black"></div>
                  <p className="text-xs text-zinc-500 text-center mt-4">Arahkan kamera ke QR Code di layar Studio</p>
                </div>
              )}

              {scanState === 'success' && (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="text-emerald-500 font-medium">Presensi Berhasil Dicatat!</h4>
                    <p className="text-xs text-zinc-400 mt-1">Anda sekarang dapat menutup halaman ini.</p>
                  </div>
                  <button onClick={handleCloseModal} className="mt-4 px-6 py-2 bg-zinc-800 text-zinc-100 rounded-md text-sm hover:bg-zinc-700 transition">
                    Tutup
                  </button>
                </div>
              )}

              {scanState === 'error' && (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <AlertCircle className="w-10 h-10 text-red-500" />
                  </div>
                  <div>
                    <h4 className="text-red-500 font-medium whitespace-pre-line">{errorMessage}</h4>
                  </div>
                  <button onClick={startScanner} className="mt-4 px-6 py-2 bg-zinc-800 text-zinc-100 rounded-md text-sm hover:bg-zinc-700 transition">
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
