import { verifyFirebaseIdToken } from "@/lib/server/firebase-auth"
import { getSupabaseServerEnv, supabaseRestRequest } from "@/lib/server/supabase-rest"
import { logActivity } from "@/lib/server/activity-logger"

const ALLOWED_ROLES = ["admin", "pembina", "ketua_komunitas", "bendahara"]

async function verifyFinanceAccess(request: Request, env: { supabaseUrl: string; supabaseSecret: string }) {
  const verified = await verifyFirebaseIdToken(request.headers.get("authorization"))
  if (!verified.ok) {
    return { ok: false as const, status: verified.status, message: verified.message, profile: null }
  }

  const profileResponse = await supabaseRestRequest(
    `profiles?select=id,nama_lengkap,role&firebase_uid=eq.${encodeURIComponent(verified.user.uid)}&limit=1`,
    env,
  )

  if (!profileResponse.ok) {
    return { ok: false as const, status: 404, message: "Profile pengurus tidak ditemukan.", profile: null }
  }

  const profileRows = (await profileResponse.json()) as Array<{ id: string; nama_lengkap: string; role: string }>
  const profile = profileRows[0]

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { ok: false as const, status: 403, message: "Akses khusus pengurus keuangan / bendahara.", profile: null }
  }

  return { ok: true as const, profile }
}

export async function GET(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyFinanceAccess(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  try {
    const [txResponse, kasResponse, membersResponse] = await Promise.all([
      supabaseRestRequest("finance_transactions?select=*,recorded_by_profile:profiles!recorded_by(nama_lengkap)&order=transaction_date.desc", env),
      supabaseRestRequest("kas_records?select=*,profile:profiles(id,nama_lengkap,angkatan)&order=week_number.asc", env),
      supabaseRestRequest("profiles?select=id,nama_lengkap,angkatan,role&order=nama_lengkap.asc", env),
    ])

    const transactions = txResponse.ok ? await txResponse.json() : []
    const kasRecords = kasResponse.ok ? await kasResponse.json() : []
    const allMembers = membersResponse.ok ? await membersResponse.json() : []

    // Calculate Summary Stats
    const totalIncome = transactions
      .filter((t: any) => t.type === "in")
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)

    const totalExpense = transactions
      .filter((t: any) => t.type === "out")
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)

    const currentBalance = totalIncome - totalExpense

    // Filter current month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    const monthlyIncome = transactions
      .filter((t: any) => {
        const d = new Date(t.transaction_date)
        return t.type === "in" && d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)

    const monthlyExpense = transactions
      .filter((t: any) => {
        const d = new Date(t.transaction_date)
        return t.type === "out" && d.getMonth() === currentMonth && d.getFullYear() === currentYear
      })
      .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0)

    return Response.json({
      ok: true,
      stats: {
        currentBalance,
        totalIncome,
        totalExpense,
        monthlyIncome,
        monthlyExpense,
        totalTransactions: transactions.length,
        totalKasRecords: kasRecords.length,
      },
      transactions,
      kasRecords,
      members: allMembers.filter((m: any) => m.role === "student" || m.role === "admin" || m.role === "bendahara" || m.role === "ketua_komunitas" || m.role === "pembina" || m.role === "ketua_angkatan"),
    })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const env = getSupabaseServerEnv()
  if (!env.ok) {
    return Response.json({ message: env.message }, { status: 500 })
  }

  const authCheck = await verifyFinanceAccess(request, env)
  if (!authCheck.ok) {
    return Response.json({ message: authCheck.message }, { status: authCheck.status })
  }

  const currentAdmin = authCheck.profile

  try {
    const body = await request.json()
    const { action } = body

    if (action === "ADD_TRANSACTION") {
      const { type, category, amount, description, transaction_date, receipt_url } = body

      if (!type || !["in", "out"].includes(type)) {
        return Response.json({ message: "Jenis transaksi harus 'in' (uang masuk) atau 'out' (uang keluar)." }, { status: 400 })
      }
      if (!category || category.trim() === "") {
        return Response.json({ message: "Kategori transaksi wajib diisi." }, { status: 400 })
      }
      const numAmount = Number(amount)
      if (isNaN(numAmount) || numAmount <= 0) {
        return Response.json({ message: "Nominal transaksi harus lebih dari 0." }, { status: 400 })
      }
      if (!description || description.trim().length < 3) {
        return Response.json({ message: "Deskripsi transaksi (darimana / untuk apa) minimal 3 karakter." }, { status: 400 })
      }

      const txPayload = {
        type,
        category: category.trim(),
        amount: numAmount,
        description: description.trim(),
        transaction_date: transaction_date || new Date().toISOString(),
        receipt_url: receipt_url?.trim() || null,
        recorded_by: currentAdmin.id,
      }

      const txRes = await supabaseRestRequest("finance_transactions", env, {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: [txPayload],
      })

      if (!txRes.ok) {
        const details = await txRes.text()
        return Response.json({ message: "Gagal menyimpan transaksi ke database.", details }, { status: 500 })
      }

      const newTx = (await txRes.json())[0]

      // Audit Log for Anti-Fraud
      const formattedAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(numAmount)
      void logActivity({
        actorId: currentAdmin.id,
        actorName: currentAdmin.nama_lengkap,
        actorRole: currentAdmin.role,
        action: type === "in" ? "CATAT_UANG_MASUK" : "CATAT_UANG_KELUAR",
        details: `Mencatat ${type === "in" ? "Uang Masuk" : "Uang Keluar"} sebesar ${formattedAmount} (${category.trim()} - ${description.trim()}).`,
        category: "KEUANGAN",
      })

      return Response.json({ ok: true, transaction: newTx })
    }

    if (action === "RECORD_KAS") {
      const { profile_id, week_number, amount, note, member_name } = body

      if (!profile_id) {
        return Response.json({ message: "ID anggota wajib dipilih." }, { status: 400 })
      }
      const week = Number(week_number)
      if (isNaN(week) || week <= 0) {
        return Response.json({ message: "Minggu ke- harus angka positif." }, { status: 400 })
      }
      const kasAmount = Number(amount) || 2000 // Default kas Rp 2.000

      const kasPayload = {
        profile_id,
        week_number: week,
        amount: kasAmount,
        paid_at: new Date().toISOString(),
        note: note?.trim() || `Pembayaran Kas Minggu Ke-${week}`,
        recorded_by: currentAdmin.id,
      }

      const kasRes = await supabaseRestRequest(
        "kas_records?on_conflict=profile_id,week_number",
        env,
        {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=representation" },
          body: [kasPayload],
        },
      )

      if (!kasRes.ok) {
        const details = await kasRes.text()
        return Response.json({ message: "Gagal menyimpan entri kas mingguan.", details }, { status: 500 })
      }

      const newKas = (await kasRes.json())[0]

      // Also create a financial transaction entry automatically for accounting
      const formattedKasAmount = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(kasAmount)
      const descText = `Uang Kas Minggu Ke-${week} dari ${member_name || "Anggota"}`

      await supabaseRestRequest("finance_transactions", env, {
        method: "POST",
        body: [
          {
            type: "in",
            category: "Uang Kas Mingguan",
            amount: kasAmount,
            description: descText,
            transaction_date: new Date().toISOString(),
            recorded_by: currentAdmin.id,
          },
        ],
      })

      // Audit Log for Anti-Fraud
      void logActivity({
        actorId: currentAdmin.id,
        actorName: currentAdmin.nama_lengkap,
        actorRole: currentAdmin.role,
        action: "BAYAR_UANG_KAS",
        details: `Mencatat pembayaran Uang Kas Minggu Ke-${week} sebesar ${formattedKasAmount} untuk ${member_name || "Anggota"}.`,
        category: "KEUANGAN",
      })

      return Response.json({ ok: true, kasRecord: newKas })
    }

    return Response.json({ message: "Action tidak dikenali." }, { status: 400 })
  } catch (err: unknown) {
    return Response.json({ message: err instanceof Error ? err.message : "Terjadi kesalahan internal." }, { status: 500 })
  }
}
