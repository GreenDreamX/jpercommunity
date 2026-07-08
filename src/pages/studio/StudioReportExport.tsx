import { useState, useEffect } from 'react'
import { FileText, Download, Filter, Users, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF with autoTable type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function StudioReportExport() {
  const [selectedBatch, setSelectedBatch] = useState('2025')
  const [selectedClass, setSelectedClass] = useState('Semua Kelas')
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any[]>([])

  const availableBatches = ['2024', '2025', '2026']
  const availableClasses = ['Semua Kelas', 'XI PPLG 1', 'XI PPLG 2', 'XI DKV 1', 'XI DKV 2']

  // Load preview data based on filters
  useEffect(() => {
    async function loadPreview() {
      try {
        setLoading(true)
        let query = supabase!.from('profiles').select('*')
        
        if (selectedBatch) {
          query = query.eq('batch', selectedBatch)
        }
        
        if (selectedClass !== 'Semua Kelas') {
          query = query.eq('kelasJurusan', selectedClass)
        }

        const { data: profiles, error } = await query
        if (error) throw error

        // For real implementation, you would join this with attendance and submissions
        // Here we mock the computed metrics to showcase the UI & PDF export
        const enriched = (profiles || []).map(p => ({
          ...p,
          nisn: '00' + Math.floor(Math.random() * 100000000), // mock NISN
          nisLokal: '10' + Math.floor(Math.random() * 1000),  // mock NIS
          avgScore: Math.floor(Math.random() * 30) + 70,      // 70-100
          attendancePercent: Math.floor(Math.random() * 20) + 80 // 80-100
        }))

        setPreviewData(enriched)
      } catch (err) {
        console.error('Failed to load preview data', err)
      } finally {
        setLoading(false)
      }
    }

    if (supabase) {
      loadPreview()
    } else {
      // Mock data if no supabase connection
      setPreviewData([
        { id: '1', fullName: 'Yudhistira Arya', batch: '2025', kelasJurusan: 'XI PPLG 1', asalSekolah: 'SMKN 1 Majalaya', verifiedBadge: true, nisn: '00321456', nisLokal: '1021', avgScore: 92, attendancePercent: 95 },
        { id: '2', fullName: 'Bima Sena', batch: '2025', kelasJurusan: 'XI PPLG 2', asalSekolah: 'SMKN 1 Majalaya', verifiedBadge: false, nisn: '00321457', nisLokal: '1022', avgScore: 78, attendancePercent: 82 },
      ])
    }
  }, [selectedBatch, selectedClass])

  const generatePDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4')
    
    // Header
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('LAPORAN PERKEMBANGAN KOMPETENSI DIGITAL & BAHASA', doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' })
    doc.text('JPER COMMUNITY SMKN 1 MAJALAYA', doc.internal.pageSize.getWidth() / 2, 60, { align: 'center' })
    
    // Sub-header metadata
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const timestamp = new Date().toLocaleString('id-ID')
    doc.text(`Angkatan (Batch) : ${selectedBatch}`, 40, 100)
    doc.text(`Kelas / Jurusan : ${selectedClass}`, 40, 115)
    doc.text(`Total Anggota     : ${previewData.length} Siswa`, 40, 130)
    doc.text(`Dicetak Pada      : ${timestamp}`, doc.internal.pageSize.getWidth() - 40, 100, { align: 'right' })

    // Table Data
    const tableColumn = ["No", "Nama Lengkap", "NISN", "NIS", "Kelas", "Rata-rata Nilai", "Kehadiran", "Status"]
    const tableRows: any[] = []

    previewData.forEach((student, index) => {
      const rowData = [
        index + 1,
        student.fullName,
        student.nisn || '-',
        student.nisLokal || '-',
        student.kelasJurusan || student.asalSekolah,
        `${student.avgScore}`,
        `${student.attendancePercent}%`,
        student.verifiedBadge ? 'LULUS (Verified)' : 'BELUM LULUS'
      ]
      tableRows.push(rowData)
    })

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 150,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [40, 40, 45], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 250] },
    })

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 60
    
    doc.setFontSize(10)
    doc.text('Mengetahui,', 80, finalY)
    doc.text('Wakasek Kesiswaan', 80, finalY + 15)
    doc.text('(_________________________)', 80, finalY + 80)
    doc.text('NIP. ', 80, finalY + 95)

    doc.text('Majalaya, .................................', doc.internal.pageSize.getWidth() - 250, finalY)
    doc.text('Pembina Ekstrakurikuler JPER', doc.internal.pageSize.getWidth() - 250, finalY + 15)
    doc.text('(_________________________)', doc.internal.pageSize.getWidth() - 250, finalY + 80)
    doc.text('NIP. ', doc.internal.pageSize.getWidth() - 250, finalY + 95)

    doc.save(`Laporan_JPER_${selectedBatch}_${selectedClass.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-500" />
            Laporan & Evaluasi Akademik
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Filter, review, dan export laporan perkembangan siswa JPER Community.
          </p>
        </div>
      </header>

      {/* Controller Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-end justify-between shadow-lg">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-48">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Angkatan (Batch)
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {availableBatches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 md:w-56">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Kelas & Jurusan
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            >
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={generatePDF}
          disabled={loading || previewData.length === 0}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md font-medium text-sm transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Generate Official Report
        </button>
      </div>

      {/* Preview Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <Filter className="w-4 h-4 text-zinc-400" />
            Data Preview ({previewData.length} Siswa)
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-900 text-xs uppercase font-medium text-zinc-500">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Kelas</th>
                <th className="px-6 py-4">Rata-rata Nilai</th>
                <th className="px-6 py-4">Kehadiran</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Memuat data...
                  </td>
                </tr>
              ) : previewData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    Tidak ada data untuk filter yang dipilih.
                  </td>
                </tr>
              ) : (
                previewData.map((student) => (
                  <tr key={student.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-200">
                      {student.fullName}
                      <span className="block text-xs text-zinc-500 font-normal mt-0.5">NISN: {student.nisn}</span>
                    </td>
                    <td className="px-6 py-4">{student.kelasJurusan}</td>
                    <td className="px-6 py-4">
                      <span className={`font-semibold ${student.avgScore >= 75 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {student.avgScore}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {student.attendancePercent}%
                    </td>
                    <td className="px-6 py-4">
                      {student.verifiedBadge ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Verified Member
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          Basic
                        </span>
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
