"use client"

import React, { useEffect, useState } from "react"
import { Save, User, Image, Link2, Quote, Sparkles, RefreshCw, ArrowUpRight, Lock, Trash2, ShieldAlert, BookOpen, Share2, Eye, EyeOff, Heart, Upload, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { firebaseAuth } from "@/lib/firebase/client"
import { updatePassword, updateEmail, deleteUser, updateProfile } from "firebase/auth"

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sakura",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Yuto",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aimi",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Kenji",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Haruka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Takahiro"
]

const PRESET_COVERS = [
  { name: "Sunset Sakura", value: "gradient:sunset_sakura", class: "bg-gradient-to-r from-[#FF7E5F] to-[#FEB47B]" },
  { name: "Fuji Snow", value: "gradient:fuji_snow", class: "bg-gradient-to-r from-[#2F80ED] to-[#56CCF2]" },
  { name: "Kyoto Bamboo", value: "gradient:kyoto_bamboo", class: "bg-gradient-to-r from-[#11998e] to-[#38ef7d]" },
  { name: "Tokyo Neon", value: "gradient:tokyo_neon", class: "bg-gradient-to-r from-[#8A2387] to-[#E94057] to-[#F27121]" },
  { name: "Dark Torii", value: "gradient:dark_torii", class: "bg-gradient-to-r from-[#1F1C2C] to-[#928DAB]" }
]

// Brand Icons
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
)

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
)

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" />
  </svg>
)

const TelegramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
  </svg>
)

const DiscordIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <circle cx="9" cy="12" r="1" /><circle cx="15" cy="12" r="1" />
    <path d="M7.5 5.3A9 9 0 0 1 16.5 5.3L18 3h-2.2l-.8 1.4c-2-.6-4-.6-6 0L8.2 3H6Zm.8 9.5a5.5 5.5 0 0 0 7.4 0l.8 1.2c-2.3 2-6.7 2-9 0Z" />
  </svg>
)

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

interface ProfileTabProps {
  firebaseToken: string
}

export function ProfileTab({ firebaseToken }: ProfileTabProps) {
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Sub Tab Selector
  const [activeSubTab, setActiveSubTab] = useState("style")

  // Form states (Core & Custom Design)
  const [namaLengkap, setNamaLengkap] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [bio, setBio] = useState("")
  const [quote, setQuote] = useState("")
  const [instagram, setInstagram] = useState("")
  const [github, setGithub] = useState("")
  const [cardBorder, setCardBorder] = useState("default")
  const [avatarBorder, setAvatarBorder] = useState("default")
  const [badgeLabel, setBadgeLabel] = useState("none")

  // Photo Upload Dialog States
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUploadPhoto = async () => {
    if (!selectedFile) return
    setUploadingPhoto(true)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)

      const res = await fetch("/api/lms/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal mengunggah foto.")
      }

      const payload = await res.json()
      if (payload.url) {
        setAvatarUrl(payload.url)
        setIsUploadDialogOpen(false)
        setSelectedFile(null)
        setSelectedFilePreview(null)
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Gagal mengunggah foto.")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const [uploadingCover, setUploadingCover] = useState(false)

  const handleUploadCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/lms/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: formData,
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal mengunggah banner sampul ke Imgur.")
      }

      const payload = await res.json()
      if (payload.url) {
        setCoverUrl(payload.url)
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengunggah banner sampul.")
    } finally {
      setUploadingCover(false)
    }
  }

  // Additional Profile Fields
  const [tempatLahir, setTempatLahir] = useState("")
  const [tanggalLahir, setTanggalLahir] = useState("")
  const [email, setEmail] = useState("")
  const [nomorTelepon, setNomorTelepon] = useState("")
  const [alasanIkut, setAlasanIkut] = useState("")
  const [hideWhatsapp, setHideWhatsapp] = useState(false)
  const [twitter, setTwitter] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [discord, setDiscord] = useState("")
  const [telegram, setTelegram] = useState("")
  const [angkatan, setAngkatan] = useState("2026")

  // New Profile Customization Fields
  const [nickname, setNickname] = useState("")
  const [hobby, setHobby] = useState("")
  const [favoriteAnime, setFavoriteAnime] = useState("")
  const [japaneseLevel, setJapaneseLevel] = useState("Pemula (Beginner)")
  const [learningInterest, setLearningInterest] = useState("Kaiwa (Percakapan)")
  const [dream, setDream] = useState("Hanya Hobi")

  // Academic info fields
  const [nisn, setNisn] = useState("")
  const [nis, setNis] = useState("")
  const [asalSekolah, setAsalSekolah] = useState("")
  const [jurusan, setJurusan] = useState("PPLG")
  const [kelasSelect, setKelasSelect] = useState("1")

  // Change Email/Password states
  const [newEmail, setNewEmail] = useState("")
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null)
  const [pwdError, setPwdError] = useState<string | null>(null)

  // Delete account confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [deleteLoading, setDeleteLoading] = useState(false)

  const isSSO = email.endsWith("@shokunin.jper.my.id")

  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      try {
        const res = await fetch("/api/lms/profile", {
          headers: { Authorization: `Bearer ${firebaseToken}` },
        })
        if (!res.ok) {
          throw new Error("Gagal mengambil data profil.")
        }
        const data = await res.json()
        const prof = data.profile
        setProfile(prof)
        if (prof) {
          setNamaLengkap(prof.nama_lengkap || "")
          setAvatarUrl(prof.avatar_url || "")
          setCoverUrl(prof.cover_url || "")
          setBio(prof.bio || "")
          setQuote(prof.quote || "")
          setInstagram(prof.instagram_username || "")
          setGithub(prof.github_username || "")
          setCardBorder(prof.card_border || "default")
          setAvatarBorder(prof.avatar_border || "default")
          setBadgeLabel(prof.badge_label || "none")

          // Additional profile fields
          setEmail(prof.email || "")
          setNomorTelepon(prof.nomor_telepon || "")
          setTempatLahir(prof.tempat_lahir || "")
          setTanggalLahir(prof.tanggal_lahir || "")
          setAlasanIkut(prof.alasan_ikut || "")
          setHideWhatsapp(prof.hide_whatsapp ?? false)
          setTwitter(prof.twitter_username || "")
          setLinkedin(prof.linkedin_username || "")
          setDiscord(prof.discord_username || "")
          setTelegram(prof.telegram_username || "")
          setAngkatan(prof.angkatan || "2026")

          // New custom fields
          setNickname(prof.nickname || "")
          setHobby(prof.hobby || "")
          setFavoriteAnime(prof.favorite_anime || "")
          setJapaneseLevel(prof.japanese_level || "Pemula (Beginner)")
          setLearningInterest(prof.learning_interest || "Kaiwa (Percakapan)")
          setDream(prof.dream || "Hanya Hobi")

          // Academic fields
          const academic = prof.student_academic_info?.[0]
          if (academic) {
            setNisn(academic.nisn || "")
            setNis(academic.nis || "")
            setAsalSekolah(academic.asal_sekolah || "")
            setJurusan(academic.jurusan || "PPLG")
            if (academic.kelas) {
              const parts = academic.kelas.split(" ")
              const lastPart = parts[parts.length - 1]
              if (!isNaN(Number(lastPart))) {
                setKelasSelect(lastPart)
              }
            }
          }
        }
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Terjadi kesalahan.")
      } finally {
        setLoading(false)
      }
    }
    if (firebaseToken) {
      void loadProfile()
    }
  }, [firebaseToken])

  // Handle saving profile changes
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    // Alasan ikut length validation
    if (alasanIkut && alasanIkut.trim().length < 25) {
      setErrorMsg("Alasan mengikuti ekskul minimal harus 25 karakter.")
      setSubmitting(false)
      return
    }

    // Number validation
    if (nomorTelepon && !/^\d+$/.test(nomorTelepon)) {
      setErrorMsg("Nomor telepon harus diisi dengan angka saja.")
      setSubmitting(false)
      return
    }
    if (nisn && !/^\d+$/.test(nisn)) {
      setErrorMsg("NISN harus diisi dengan angka saja.")
      setSubmitting(false)
      return
    }
    if (nis && !/^\d+$/.test(nis)) {
      setErrorMsg("NIS harus diisi dengan angka saja.")
      setSubmitting(false)
      return
    }

    // Determine kelas string
    let calculatedClass = ""
    if (angkatan === "2026") {
      calculatedClass = `10 ${jurusan} ${kelasSelect}`
    } else if (angkatan === "2025") {
      calculatedClass = `11 ${jurusan} ${kelasSelect}`
    } else if (angkatan === "2024") {
      calculatedClass = `12 ${jurusan} ${kelasSelect}`
    }

    try {
      const res = await fetch("/api/lms/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          nama_lengkap: namaLengkap.trim(),
          avatar_url: avatarUrl.trim() || null,
          cover_url: coverUrl.trim() || null,
          bio: bio.trim() || null,
          quote: quote.trim() || null,
          instagram_username: instagram.trim() || null,
          github_username: github.trim() || null,
          card_border: cardBorder,
          avatar_border: avatarBorder,
          badge_label: badgeLabel === "none" ? null : badgeLabel,
          
          // Additional profile fields
          tempat_lahir: tempatLahir.trim() || null,
          tanggal_lahir: tanggalLahir || null,
          nomor_telepon: nomorTelepon.trim() || null,
          alasan_ikut: alasanIkut.trim() || null,
          hide_whatsapp: hideWhatsapp,
          twitter_username: twitter.trim() || null,
          linkedin_username: linkedin.trim() || null,
          discord_username: discord.trim() || null,
          telegram_username: telegram.trim() || null,
          angkatan,

          // New custom fields
          nickname: nickname.trim() || null,
          hobby: hobby.trim() || null,
          favorite_anime: favoriteAnime.trim() || null,
          japanese_level: japaneseLevel,
          learning_interest: learningInterest,
          dream,

          // Academic fields
          nisn: nisn.trim() || null,
          nis: nis.trim() || null,
          kelas: calculatedClass || null,
          jurusan: jurusan || null,
          asal_sekolah: asalSekolah.trim() || null,
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal menyimpan perubahan.")
      }

      const payload = await res.json()
      setProfile(payload.profile)

      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("jper-profile-updated", { detail: payload.profile }))
      }

      if (firebaseAuth.currentUser) {
        void updateProfile(firebaseAuth.currentUser, {
          displayName: namaLengkap.trim(),
          photoURL: avatarUrl.trim() || null,
        }).catch(() => {})
      }

      // Sync mock local session
      const mock = localStorage.getItem("jper_mock_session")
      if (mock) {
        try {
          const parsed = JSON.parse(mock)
          parsed.name = namaLengkap.trim()
          parsed.avatarUrl = avatarUrl.trim() || null
          localStorage.setItem("jper_mock_session", JSON.stringify(parsed))
        } catch (err) {
          console.error(err)
        }
      }

      setSuccessMsg("Seluruh kustomisasi & data profil Anda berhasil disimpan!")
      setTimeout(() => setSuccessMsg(null), 3500)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memperbarui data.")
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Firebase Update Email
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSSO) return
    if (!newEmail.trim() || newEmail.trim() === email) {
      setEmailError("Silakan masukkan email baru yang berbeda.")
      return
    }

    setEmailLoading(true)
    setEmailSuccess(null)
    setEmailError(null)

    try {
      const user = firebaseAuth.currentUser
      if (!user) {
        throw new Error("Sesi login Firebase kedaluwarsa. Silakan login ulang.")
      }

      // Update in Firebase Auth first
      await updateEmail(user, newEmail.trim()).catch((err) => {
        if (err.code === "auth/requires-recent-login") {
          throw new Error("Sesi Anda sudah terlalu lama (stale). Demi keamanan, silakan Logout (Keluar) terlebih dahulu, lalu login kembali dan coba ganti email lagi.")
        }
        throw err
      })

      // Sync to Supabase
      const res = await fetch("/api/lms/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          nama_lengkap: namaLengkap,
          email: newEmail.trim()
        }),
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Email diperbarui di Firebase, tetapi gagal disinkronkan ke Supabase.")
      }

      const payload = await res.json()
      setProfile(payload.profile)
      setEmail(newEmail.trim())
      setNewEmail("")

      // Update mock session email
      const mock = localStorage.getItem("jper_mock_session")
      if (mock) {
        try {
          const parsed = JSON.parse(mock)
          parsed.email = newEmail.trim()
          localStorage.setItem("jper_mock_session", JSON.stringify(parsed))
        } catch (e) {
          console.error(e)
        }
      }

      setEmailSuccess("Alamat email login berhasil diperbarui!")
      setTimeout(() => setEmailSuccess(null), 3000)
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Gagal memperbarui email.")
    } finally {
      setEmailLoading(false)
    }
  }

  // Handle Firebase Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSSO) return
    if (newPassword !== confirmPassword) {
      setPwdError("Konfirmasi password tidak cocok.")
      return
    }
    if (newPassword.length < 8) {
      setPwdError("Kata sandi baru minimal harus 8 karakter.")
      return
    }

    setPwdLoading(true)
    setPwdSuccess(null)
    setPwdError(null)

    try {
      const user = firebaseAuth.currentUser
      if (!user) {
        throw new Error("Sesi login Firebase kedaluwarsa.")
      }
      await updatePassword(user, newPassword).catch((err) => {
        if (err.code === "auth/requires-recent-login") {
          throw new Error("Sesi Anda sudah terlalu lama (stale). Silakan Logout (Keluar) terlebih dahulu, login kembali, dan ulangi proses penggantian password.")
        }
        throw err
      })
      setPwdSuccess("Kata sandi berhasil diperbarui!")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPwdSuccess(null), 3000)
    } catch (err: unknown) {
      setPwdError(err instanceof Error ? err.message : "Gagal memperbarui kata sandi.")
    } finally {
      setPwdLoading(false)
    }
  }

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "HAPUS AKUN SAYA") {
      alert("Tolong ketik HAPUS AKUN SAYA untuk konfirmasi.")
      return
    }

    setDeleteLoading(true)
    setErrorMsg(null)

    try {
      const user = firebaseAuth.currentUser
      if (!user) {
        throw new Error("Sesi Firebase tidak aktif.")
      }

      // 1. Delete from Supabase profiles (cascade)
      const res = await fetch("/api/lms/profile", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${firebaseToken}` },
      })

      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.message ?? "Gagal menghapus database profil.")
      }

      // 2. Delete from Firebase Auth
      await deleteUser(user).catch((err) => {
        if (err.code === "auth/requires-recent-login") {
          throw new Error("Sesi Anda telah stale. Silakan keluar dan login kembali lalu lakukan penghapusan akun.")
        }
        throw err
      })

      // 3. Clear sessions
      localStorage.removeItem("jper_mock_session")
      document.cookie = "jper_session=; path=/; max-age=0; SameSite=Lax"
      
      alert("Akun Anda telah berhasil dihapus secara permanen. Mengalihkan ke Landing Page...")
      window.location.href = "/"
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal menghapus akun. Silakan coba lagi.")
      setDeleteLoading(false)
    }
  }

  const activeAvatar = avatarUrl || PRESET_AVATARS[0]
  const activeCover = coverUrl || PRESET_COVERS[0].value

  // Render cover element based on premium gradients vs URL
  const renderCoverPreview = (coverVal: string) => {
    const found = PRESET_COVERS.find(c => c.value === coverVal)
    if (found) {
      return <div className={`w-full h-full ${found.class}`} />
    }
    if (coverVal && coverVal.startsWith("gradient:")) {
      // fallback just in case
      return <div className="w-full h-full bg-gradient-to-r from-[#1F1C2C] to-[#928DAB]" />
    }
    return <img src={coverVal || "https://api.dicebear.com/7.x/identicon/svg"} alt="Cover" className="w-full h-full object-cover" />
  }

  // Premium, subtle border mappings
  const getCardBorderClass = () => {
    switch (cardBorder) {
      case "red_flame": return "border-2 border-[#B23A2E]/30 shadow-[0_0_15px_rgba(178,58,46,0.1)] bg-gradient-to-b from-white to-[#B23A2E]/5"
      case "gold_vip": return "border-2 border-[#D4AF37]/50 shadow-[0_0_20px_rgba(212,175,55,0.15)] bg-gradient-to-b from-white to-[#D4AF37]/5"
      case "deep_ocean": return "border-2 border-[#2B3A55]/30 shadow-[0_0_12px_rgba(43,58,85,0.1)] bg-gradient-to-b from-white to-[#2B3A55]/5"
      case "neon_green": return "border-2 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)] bg-gradient-to-b from-white to-emerald-500/5"
      default: return "border border-[#E4E1DA]"
    }
  }

  const getAvatarBorderClass = () => {
    switch (avatarBorder) {
      case "double_gold": return "border-4 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
      case "neon_green": return "border-2 border-emerald-400/80"
      case "soft_red_glow": return "border-4 border-white shadow-[0_0_12px_rgba(178,58,46,0.4)]"
      default: return "border-4 border-white"
    }
  }

  const subTabs = [
    { id: "style", label: "Kustomisasi Kartu", icon: <Sparkles className="size-3.5" /> },
    { id: "personal", label: "Data Diri & Akademik", icon: <BookOpen className="size-3.5" /> },
    { id: "social", label: "Sosial Media & Kontak", icon: <Share2 className="size-3.5" /> },
    { id: "security", label: "Keamanan & Akun", icon: <Lock className="size-3.5" /> },
  ]

  if (loading) {
    return (
      <div className="py-20 text-center text-xs font-mono text-[#6B6862]">
        Memuat data kustomisasi profil Anda...
      </div>
    )
  }

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      {/* Tab Header title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#1C1B1A] flex items-center gap-2">
            <User className="size-5 text-[#B23A2E]" />
            Profil & Pengaturan Akun
          </h2>
          <p className="text-xs text-[#6B6862]">Personalisasi kartu digital Anda dan kelola preferensi data diri secara aman.</p>
        </div>
        <Link href="/direktori" target="_blank">
          <Button size="sm" variant="outline" className="h-8 border-[#E4E1DA] text-xs gap-1.5 font-bold rounded-lg">
            Lihat Direktori Publik
            <ArrowUpRight className="size-3.5" />
          </Button>
        </Link>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="border-b border-[#E4E1DA] flex gap-1 overflow-x-auto pb-px scrollbar-none">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveSubTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
              activeSubTab === t.id
                ? "border-[#B23A2E] text-[#B23A2E] bg-[#B23A2E]/5"
                : "border-transparent text-[#6B6862] hover:text-[#1C1B1A] hover:bg-stone-100"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-[1.15fr_0.85fr]">
        {/* LEFT PANEL: CONFIG EDITOR */}
        <div className="space-y-6">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {successMsg && (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium">
                {successMsg}
              </div>
            )}
            {errorMsg && (
              <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3.5 text-xs text-[#B23A2E]">
                {errorMsg}
              </div>
            )}

            {/* TAB 1: CARD CUSTOMIZATION */}
            {activeSubTab === "style" && (
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-500" />
                    Kustomisasi Visual & Desain Kartu
                  </CardTitle>
                  <CardDescription className="text-xs">Ubah bingkai, cover banner, dan lencana khusus kartu pamer sosial Anda.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <FieldGroup className="space-y-4">
                    {/* Avatar selection (Illustrated vector chibi seeds) */}
                    <Field>
                      <FieldLabel className="text-xs font-semibold">Avatar Chibi Preset (Ilustrasi Vector Premium)</FieldLabel>
                      <div className="flex flex-wrap gap-2.5 mb-2">
                        {PRESET_AVATARS.map((url, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAvatarUrl(url)}
                            className={`size-11 rounded-full border-2 bg-stone-100 overflow-hidden transition-all shrink-0 ${
                              avatarUrl === url ? "border-[#B23A2E] scale-110 shadow-md" : "border-[#E4E1DA] hover:border-[#6B6862]"
                            }`}
                          >
                            <img src={url} alt="Preset Avatar" className="size-full object-contain p-0.5" />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Atau masukkan URL foto profil kustom Anda sendiri..."
                          value={avatarUrl}
                          onChange={(e) => setAvatarUrl(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsUploadDialogOpen(true)
                            setUploadError(null)
                          }}
                          className="h-9 px-3 text-xs font-semibold rounded-lg border-[#E4E1DA] flex items-center gap-1.5 shrink-0 hover:bg-[#E4E1DA]/30"
                        >
                          <Upload className="size-3.5 text-[#B23A2E]" />
                          <span>Unggah Foto</span>
                        </Button>
                      </div>
                    </Field>

                    {/* PHOTO UPLOAD DIALOG */}
                    <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                      <DialogContent className="max-w-md bg-[#FAF9F6] border border-[#E4E1DA] rounded-xl p-6">
                        <DialogHeader>
                          <DialogTitle className="text-base font-bold text-[#1C1B1A]">Unggah Foto Profil</DialogTitle>
                          <DialogDescription className="text-xs text-[#6B6862]">
                            Pilih file foto dari perangkat Anda. Gambar akan otomatis di-convert menjadi tautan cloud gambar publik (tanpa blob database).
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-2">
                          <div className="border-2 border-dashed border-[#E4E1DA] bg-white p-6 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                            {selectedFilePreview ? (
                              <img src={selectedFilePreview} alt="Preview Upload" className="size-28 rounded-full object-cover border border-[#E4E1DA] shadow-sm" />
                            ) : (
                              <div className="size-20 rounded-full bg-stone-100 flex items-center justify-center text-[#6B6862]">
                                <Upload className="size-8 stroke-[1.5]" />
                              </div>
                            )}

                            <label className="cursor-pointer">
                              <span className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/95 text-xs font-semibold px-4 py-2 rounded-lg inline-block shadow-sm">
                                {selectedFile ? "Ganti File Gambar" : "Pilih File Foto"}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    setSelectedFile(file)
                                    setSelectedFilePreview(URL.createObjectURL(file))
                                  }
                                }}
                              />
                            </label>
                            {selectedFile && (
                              <div className="text-[11px] font-mono text-[#6B6862]">
                                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                              </div>
                            )}
                          </div>

                          {uploadError && (
                            <div className="text-xs text-[#B23A2E] bg-red-50 border border-red-200 p-2.5 rounded-lg flex items-center gap-1.5">
                              <AlertCircle className="size-4 shrink-0" />
                              <span>{uploadError}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsUploadDialogOpen(false)} className="h-9 text-xs rounded-lg border-[#E4E1DA]">
                              Batal
                            </Button>
                            <Button
                              onClick={handleUploadPhoto}
                              disabled={!selectedFile || uploadingPhoto}
                              className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 h-9 text-xs font-semibold rounded-lg shadow-none border-none"
                            >
                              {uploadingPhoto ? "Mengunggah..." : "Convert & Jadikan Foto Profil"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Cover selection (CSS gradients) */}
                    <Field>
                      <FieldLabel className="text-xs font-semibold">Gaya Gradien Cover Banner</FieldLabel>
                      <div className="flex gap-2.5 overflow-x-auto pb-1 mb-2 scrollbar-none">
                        {PRESET_COVERS.map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCoverUrl(c.value)}
                            className={`w-20 h-10 rounded-md border-2 overflow-hidden transition-all shrink-0 ${
                              coverUrl === c.value ? "border-[#B23A2E] scale-105 shadow" : "border-[#E4E1DA] hover:border-[#6B6862]"
                            }`}
                            title={c.name}
                          >
                            <div className={`size-full ${c.class}`} />
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Atau masukkan URL gambar banner sampul..."
                          value={coverUrl}
                          onChange={(e) => setCoverUrl(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                        <label className="cursor-pointer shrink-0">
                          <span className="h-9 px-3 text-xs font-semibold rounded-lg border border-[#E4E1DA] bg-white hover:bg-[#E4E1DA]/30 flex items-center gap-1.5 text-[#1C1B1A]">
                            <Upload className="size-3.5 text-[#B23A2E]" />
                            <span>{uploadingCover ? "Mengunggah..." : "Unggah Banner"}</span>
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingCover}
                            onChange={handleUploadCoverFile}
                          />
                        </label>
                      </div>
                    </Field>

                    {/* Custom Design Selector Dropdowns */}
                    <div className="grid grid-cols-3 gap-3">
                      <Field>
                        <FieldLabel htmlFor="c_border" className="text-[10px] font-semibold">Gaya Bingkai Kartu</FieldLabel>
                        <select
                          id="c_border"
                          value={cardBorder}
                          onChange={(e) => setCardBorder(e.target.value)}
                          className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                        >
                          <option value="default">Default Gray</option>
                          <option value="red_flame">Red Flame 🔥</option>
                          <option value="gold_vip">Gold VIP 👑</option>
                          <option value="deep_ocean">Deep Ocean 🌊</option>
                          <option value="neon_green">Neon Green ⚡</option>
                        </select>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="av_border" className="text-[10px] font-semibold">Gaya Border Avatar</FieldLabel>
                        <select
                          id="av_border"
                          value={avatarBorder}
                          onChange={(e) => setAvatarBorder(e.target.value)}
                          className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                        >
                          <option value="default">Default White</option>
                          <option value="double_gold">Double Gold 👑</option>
                          <option value="neon_green">Neon Green ⚡</option>
                          <option value="soft_red_glow">Red Glow 🔴</option>
                        </select>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="badge" className="text-[10px] font-semibold">Pilih Lencana</FieldLabel>
                        <select
                          id="badge"
                          value={badgeLabel}
                          onChange={(e) => setBadgeLabel(e.target.value)}
                          className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                        >
                          <option value="none">Tanpa Lencana</option>
                          <option value="Siswa Teladan">Siswa Teladan 🌟</option>
                          <option value="Kanji Master">Kanji Master 🈴</option>
                          <option value="Wibu Aktif">Wibu Aktif 🍙</option>
                          <option value="JLPT N5 Survivor">N5 Survivor 🛡️</option>
                          <option value="JPER Pengurus">JPER Pengurus ⛩️</option>
                        </select>
                      </Field>
                    </div>

                    <Field>
                      <FieldLabel htmlFor="bio" className="text-xs font-semibold">Bio Singkat</FieldLabel>
                      <Input
                        id="bio"
                        placeholder="Tulis status bio singkat Anda..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        maxLength={100}
                        className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                      />
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="quote" className="text-xs font-semibold">Kutipan Quote Jepang</FieldLabel>
                      <Input
                        id="quote"
                        placeholder="Contoh: 塵も積omれば山となる (Sedikit demi sedikit lama-lama menjadi bukit)"
                        value={quote}
                        onChange={(e) => setQuote(e.target.value)}
                        maxLength={150}
                        className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg font-mono italic"
                      />
                    </Field>
                  </FieldGroup>
                  
                  <Button
                    type="submit"
                    disabled={submitting || !namaLengkap.trim()}
                    className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 w-full h-9 text-xs font-bold rounded-lg border-none mt-2 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Save className="size-4" />
                    {submitting ? "Menyimpan Perubahan..." : "Simpan Perubahan Desain"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: DATA DIRI & AKADEMIK */}
            {activeSubTab === "personal" && (
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <BookOpen className="size-4 text-[#2B3A55]" />
                    Data Diri & Minat Hobi Jepang
                  </CardTitle>
                  <CardDescription className="text-xs">Kelola data keanggotaan formal dan kustomisasi minat/hobi bahasa Jepang Anda.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <FieldGroup className="space-y-4">
                    {/* Basic details */}
                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="nama_lengkap_id" className="text-xs font-semibold">Nama Lengkap</FieldLabel>
                        <Input
                          id="nama_lengkap_id"
                          required
                          value={namaLengkap}
                          onChange={(e) => setNamaLengkap(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="angkatan_id" className="text-xs font-semibold">Angkatan</FieldLabel>
                        <select
                          id="angkatan_id"
                          value={angkatan}
                          onChange={(e) => setAngkatan(e.target.value)}
                          className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                        >
                          <option value="2026">2026 (Siswa Aktif Kelas 10)</option>
                          <option value="2025">2025 (Siswa Aktif Kelas 11)</option>
                          <option value="2024">2024 (Siswa Aktif Kelas 12)</option>
                          <option value="2023">2023 (Alumni)</option>
                          <option value="2022">2022 (Alumni)</option>
                          <option value="2021">2021 (Alumni)</option>
                          <option value="2020">2020 (Alumni)</option>
                          <option value="2019">2019 (Alumni)</option>
                          <option value="2027">2027 (Calon Siswa Baru)</option>
                          <option value="2028">2028 (Calon Siswa Baru)</option>
                        </select>
                      </Field>
                    </div>

                    {/* NEW FIELDS: JAPANESE INTEREST & SOCIAL FIELDS */}
                    <div className="border-t border-[#E4E1DA] pt-4 mt-2 space-y-4">
                      <h4 className="text-xs font-bold text-[#B23A2E] flex items-center gap-1.5 uppercase tracking-wider">
                        <Heart className="size-4 text-[#B23A2E]" />
                        Kustomisasi Minat & Hobi Jepang (Field Baru)
                      </h4>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <Field>
                          <FieldLabel htmlFor="nickname_id" className="text-xs font-semibold">Nama Panggilan</FieldLabel>
                          <Input
                            id="nickname_id"
                            placeholder="Contoh: Yudhis"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="hobby_id" className="text-xs font-semibold">Hobi Utama</FieldLabel>
                          <Input
                            id="hobby_id"
                            placeholder="Contoh: Menggambar"
                            value={hobby}
                            onChange={(e) => setHobby(e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="anime_id" className="text-xs font-semibold">Anime Terfavorit</FieldLabel>
                          <Input
                            id="anime_id"
                            placeholder="Contoh: Naruto"
                            value={favoriteAnime}
                            onChange={(e) => setFavoriteAnime(e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <Field>
                          <FieldLabel htmlFor="jp_level_id" className="text-xs font-semibold">Level Nihongo</FieldLabel>
                          <select
                            id="jp_level_id"
                            value={japaneseLevel}
                            onChange={(e) => setJapaneseLevel(e.target.value)}
                            className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                          >
                            <option value="Pemula (Beginner)">Pemula (Beginner)</option>
                            <option value="JLPT N5 (Dasar)">JLPT N5 (Dasar)</option>
                            <option value="JLPT N4 (Menengah Bawah)">JLPT N4 (Menengah Bawah)</option>
                            <option value="JLPT N3 (Menengah)">JLPT N3 (Menengah)</option>
                          </select>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="interest_id" className="text-xs font-semibold">Fokus Minat Belajar</FieldLabel>
                          <select
                            id="interest_id"
                            value={learningInterest}
                            onChange={(e) => setLearningInterest(e.target.value)}
                            className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                          >
                            <option value="Kaiwa (Percakapan)">Kaiwa (Percakapan)</option>
                            <option value="Kanji (Aksara)">Kanji (Aksara)</option>
                            <option value="Bunpou (Tata Bahasa)">Bunpou (Tata Bahasa)</option>
                            <option value="Kebudayaan Jepang">Kebudayaan Jepang</option>
                          </select>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="dream_id" className="text-xs font-semibold">Impian Masa Depan</FieldLabel>
                          <select
                            id="dream_id"
                            value={dream}
                            onChange={(e) => setDream(e.target.value)}
                            className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                          >
                            <option value="Hanya Hobi">Hanya Hobi</option>
                            <option value="Bekerja di Jepang (SSW)">Bekerja di Jepang (SSW)</option>
                            <option value="Kuliah di Jepang">Kuliah di Jepang</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </Field>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Field>
                        <FieldLabel htmlFor="tempat_lahir_id" className="text-xs font-semibold">Tempat Lahir</FieldLabel>
                        <Input
                          id="tempat_lahir_id"
                          placeholder="Contoh: Bandung"
                          value={tempatLahir}
                          onChange={(e) => setTempatLahir(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor="tanggal_lahir_id" className="text-xs font-semibold">Tanggal Lahir</FieldLabel>
                        <Input
                          id="tanggal_lahir_id"
                          type="date"
                          value={tanggalLahir}
                          onChange={(e) => setTanggalLahir(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg text-[#1C1B1A]"
                        />
                      </Field>
                    </div>

                    {/* CONDITIONAL ACADEMIC FIELDS */}
                    {/* Active Students: 2026, 2025, 2024 */}
                    {(angkatan === "2026" || angkatan === "2025" || angkatan === "2024") && (
                      <div className="space-y-4 border-t border-[#E4E1DA] pt-4 mt-2">
                        <h4 className="text-xs font-bold text-[#2B3A55] uppercase tracking-wider">Detail Akademik Sekolah (Wajib)</h4>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Field>
                            <FieldLabel htmlFor="nisn_id" className="text-xs font-semibold">NISN (10 Digit Angka)</FieldLabel>
                            <Input
                              id="nisn_id"
                              placeholder="Masukkan 10 digit NISN"
                              value={nisn}
                              onChange={(e) => setNisn(e.target.value.replace(/\D/g, ""))}
                              maxLength={10}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor="nis_id" className="text-xs font-semibold">NIS (9 Digit Angka)</FieldLabel>
                            <Input
                              id="nis_id"
                              placeholder="Masukkan 9 digit NIS"
                              value={nis}
                              onChange={(e) => setNis(e.target.value.replace(/\D/g, ""))}
                              maxLength={9}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                            />
                          </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Field>
                            <FieldLabel htmlFor="jurusan_id" className="text-xs font-semibold">Jurusan</FieldLabel>
                            <select
                              id="jurusan_id"
                              value={["TJKT", "TEI", "DKV", "TITL", "TSM", "IPA", "IPS"].includes(jurusan) ? jurusan : "Lainnya"}
                              onChange={(e) => setJurusan(e.target.value)}
                              className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                            >
                              <option value="TJKT">TJKT</option>
                              <option value="TEI">TEI</option>
                              <option value="DKV">DKV</option>
                              <option value="TITL">TITL</option>
                              <option value="TSM">TSM</option>
                              <option value="IPA">IPA</option>
                              <option value="IPS">IPS</option>
                              <option value="Lainnya">Lainnya (Custom)</option>
                            </select>
                          </Field>

                          <Field>
                            <FieldLabel htmlFor="rombel_id" className="text-xs font-semibold">Rombongan Belajar (Rombel)</FieldLabel>
                            <select
                              id="rombel_id"
                              value={kelasSelect}
                              onChange={(e) => setKelasSelect(e.target.value)}
                              className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 px-2 rounded-lg text-[#1C1B1A]"
                            >
                              <option value="1">Rombel 1</option>
                              <option value="2">Rombel 2</option>
                              <option value="3">Rombel 3</option>
                            </select>
                          </Field>
                        </div>

                        {/* Asal Sekolah SMP (Only for Angkatan 2026/Siswa baru) */}
                        {angkatan === "2026" && (
                          <Field>
                            <FieldLabel htmlFor="asal_sekolah_id" className="text-xs font-semibold">Asal Sekolah (SMP/MTs Asal)</FieldLabel>
                            <Input
                              id="asal_sekolah_id"
                              placeholder="Contoh: SMPN 1 Majalaya"
                              value={asalSekolah}
                              onChange={(e) => setAsalSekolah(e.target.value)}
                              className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                            />
                          </Field>
                        )}
                      </div>
                    )}

                    {/* Prospective Students: 2027, 2028 */}
                    {(angkatan === "2027" || angkatan === "2028") && (
                      <div className="space-y-4 border-t border-[#E4E1DA] pt-4 mt-2">
                        <h4 className="text-xs font-bold text-[#2B3A55] uppercase tracking-wider">Detail Calon Anggota Baru</h4>
                        <Field>
                          <FieldLabel htmlFor="asal_smp_id" className="text-xs font-semibold">Asal SMP / MTs</FieldLabel>
                          <Input
                            id="asal_smp_id"
                            placeholder="Contoh: SMPN 2 Majalaya"
                            value={asalSekolah}
                            onChange={(e) => setAsalSekolah(e.target.value)}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>
                      </div>
                    )}

                    {/* Alumni (2019-2023): No fields required, simple divider */}
                    {(angkatan === "2023" || angkatan === "2022" || angkatan === "2021" || angkatan === "2020" || angkatan === "2019") && (
                      <div className="border-t border-[#E4E1DA] pt-3 mt-2 text-[11px] text-[#6B6862] italic">
                        Sebagai alumni, Anda tidak perlu mengisi data akademik sekolah.
                      </div>
                    )}

                    <Field className="border-t border-[#E4E1DA] pt-4 mt-2">
                      <FieldLabel htmlFor="alasan_id" className="text-xs font-semibold flex justify-between">
                        <span>Alasan Mengikuti Ekskul (Min. 25 Karakter)</span>
                        <span className={`text-[10px] font-mono ${alasanIkut.length >= 25 ? "text-green-600" : "text-amber-600"}`}>
                          {alasanIkut.length} / 25 karakter
                        </span>
                      </FieldLabel>
                      <textarea
                        id="alasan_id"
                        placeholder="Contoh: Saya ingin mempelajari kebudayaan Jepang lebih mendalam, belajar percakapan dasar (kaiwa), dan mempersiapkan diri untuk sertifikasi JLPT N5 kelak..."
                        value={alasanIkut}
                        onChange={(e) => setAlasanIkut(e.target.value)}
                        rows={3}
                        className="w-full border border-[#E4E1DA] bg-[#FAF9F6] text-xs p-3 rounded-lg text-[#1C1B1A] focus:outline-none focus:border-[#B23A2E] transition-colors"
                      />
                    </Field>
                  </FieldGroup>

                  <Button
                    type="submit"
                    disabled={submitting || !namaLengkap.trim() || alasanIkut.trim().length < 25}
                    className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 w-full h-9 text-xs font-bold rounded-lg border-none mt-2 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Save className="size-4" />
                    {submitting ? "Menyimpan Data..." : "Simpan Data Diri & Akademik"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* TAB 3: SOCIAL MEDIA */}
            {activeSubTab === "social" && (
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Share2 className="size-4 text-[#2B3A55]" />
                    Pranala Sosial Media & Kontak
                  </CardTitle>
                  <CardDescription className="text-xs">Tautkan akun media sosial Anda. WhatsApp dapat disembunyikan dari direktori publik.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <FieldGroup className="space-y-4">
                    {/* WhatsApp */}
                    <div className="border border-[#E4E1DA] p-3 rounded-lg bg-white space-y-2">
                      <div className="flex justify-between items-center">
                        <FieldLabel htmlFor="phone_id" className="text-xs font-bold text-[#1C1B1A] flex items-center gap-1.5">
                          <WhatsAppIcon className="size-4 text-emerald-600" />
                          WhatsApp (Nomor Telepon)
                        </FieldLabel>
                        <div className="flex items-center gap-2">
                          <input
                            id="hide_wa_id"
                            type="checkbox"
                            checked={hideWhatsapp}
                            onChange={(e) => setHideWhatsapp(e.target.checked)}
                            className="size-3.5 accent-[#B23A2E] rounded border-[#E4E1DA]"
                          />
                          <label htmlFor="hide_wa_id" className="text-[10px] font-semibold text-[#6B6862] cursor-pointer">
                            Sembunyikan dari Publik
                          </label>
                        </div>
                      </div>
                      <Input
                        id="phone_id"
                        placeholder="Contoh: 08123456789"
                        value={nomorTelepon}
                        onChange={(e) => setNomorTelepon(e.target.value.replace(/\D/g, ""))}
                        className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Instagram */}
                      <Field>
                        <FieldLabel htmlFor="ig_id" className="text-xs font-semibold flex items-center gap-1.5">
                          <InstagramIcon className="size-3.5 text-[#B23A2E]" />
                          Instagram
                        </FieldLabel>
                        <Input
                          id="ig_id"
                          placeholder="Username (tanpa @)"
                          value={instagram}
                          onChange={(e) => setInstagram(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>

                      {/* GitHub */}
                      <Field>
                        <FieldLabel htmlFor="git_id" className="text-xs font-semibold flex items-center gap-1.5">
                          <GithubIcon className="size-3.5 text-black" />
                          GitHub
                        </FieldLabel>
                        <Input
                          id="git_id"
                          placeholder="Username"
                          value={github}
                          onChange={(e) => setGithub(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Twitter */}
                      <Field>
                        <FieldLabel htmlFor="twitter_id" className="text-xs font-semibold flex items-center gap-1.5">
                          <TwitterIcon className="size-3.5 text-[#1DA1F2]" />
                          Twitter / X
                        </FieldLabel>
                        <Input
                          id="twitter_id"
                          placeholder="Username"
                          value={twitter}
                          onChange={(e) => setTwitter(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>

                      {/* LinkedIn */}
                      <Field>
                        <FieldLabel htmlFor="linkedin_id" className="text-xs font-semibold flex items-center gap-1.5">
                          <LinkedinIcon className="size-3.5 text-[#0A66C2]" />
                          LinkedIn
                        </FieldLabel>
                        <Input
                          id="linkedin_id"
                          placeholder="Username profil"
                          value={linkedin}
                          onChange={(e) => setLinkedin(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Discord */}
                      <Field>
                        <FieldLabel htmlFor="discord_id" className="text-xs font-semibold flex items-center gap-1.5">
                          <DiscordIcon className="size-3.5 text-[#5865F2]" />
                          Discord
                        </FieldLabel>
                        <Input
                          id="discord_id"
                          placeholder="Username (contoh: yudhis#1234)"
                          value={discord}
                          onChange={(e) => setDiscord(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>

                      {/* Telegram */}
                      <Field>
                        <FieldLabel htmlFor="telegram_id" className="text-xs font-semibold flex items-center gap-1.5">
                          <TelegramIcon className="size-3.5 text-[#0088cc]" />
                          Telegram
                        </FieldLabel>
                        <Input
                          id="telegram_id"
                          placeholder="Username (tanpa @)"
                          value={telegram}
                          onChange={(e) => setTelegram(e.target.value)}
                          className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                        />
                      </Field>
                    </div>
                  </FieldGroup>

                  <Button
                    type="submit"
                    disabled={submitting || !namaLengkap.trim()}
                    className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/90 w-full h-9 text-xs font-bold rounded-lg border-none mt-2 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Save className="size-4" />
                    {submitting ? "Menyimpan Pranala..." : "Simpan Pranala Sosial Media"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </form>

          {/* TAB 4: KEAMANAN & AKUN (Independent forms) */}
          {activeSubTab === "security" && (
            <div className="space-y-6">
              {/* Change Email */}
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <User className="size-4 text-[#2B3A55]" />
                    Perbarui Alamat Email
                  </CardTitle>
                  <CardDescription className="text-xs">Ubah alamat email login utama Anda di platform JPER.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {isSSO ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-3.5 text-xs text-amber-800 font-medium">
                      ⚠️ **Akun Institusi SSO**: Akun email Anda (`{email}`) dikelola otomatis oleh pengurus ekstrakurikuler dan tidak dapat diubah secara mandiri.
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                      {emailSuccess && (
                        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
                          {emailSuccess}
                        </div>
                      )}
                      {emailError && (
                        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E] leading-relaxed">
                          {emailError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel className="text-xs font-semibold text-[#6B6862]">Email Saat Ini</FieldLabel>
                          <Input
                            disabled
                            value={email}
                            className="border-[#E4E1DA] bg-[#FAF9F6]/50 text-xs h-9 rounded-lg text-[#6B6862] cursor-not-allowed"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="new_email_id" className="text-xs font-semibold">Email Baru</FieldLabel>
                          <Input
                            id="new_email_id"
                            type="email"
                            required
                            placeholder="Email baru..."
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            disabled={emailLoading}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>
                      </div>

                      <Button
                        type="submit"
                        disabled={emailLoading || !newEmail.trim() || newEmail === email}
                        className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/95 w-full h-9 text-xs font-bold rounded-lg border-none flex items-center justify-center gap-2 shadow-sm"
                      >
                        {emailLoading ? "Memperbarui Email..." : "Ganti Email Utama"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Change Password */}
              <Card className="border border-[#E4E1DA] bg-[#FAF9F6] shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#E4E1DA]">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Lock className="size-4.5 text-[#2B3A55]" />
                    Ganti Kata Sandi (Password)
                  </CardTitle>
                  <CardDescription className="text-xs">Amankan akun Anda dengan mengganti kata sandi secara rutin.</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {isSSO ? (
                    <div className="rounded-lg border border-amber-300 bg-amber-50/50 p-3.5 text-xs text-amber-800 font-medium">
                      ⚠️ **Akun Institusi SSO**: Kredensial akun diatur secara terpusat oleh instansi. Silakan hubungi Pembina jika Anda lupa atau perlu mereset sandi SSO Anda.
                    </div>
                  ) : (
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      {pwdSuccess && (
                        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-medium">
                          {pwdSuccess}
                        </div>
                      )}
                      {pwdError && (
                        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E] leading-relaxed">
                          {pwdError}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor="pwd_new" className="text-xs font-semibold">Password Baru (Min. 8 Karakter)</FieldLabel>
                          <Input
                            id="pwd_new"
                            type="password"
                            required
                            placeholder="Kata sandi baru..."
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={pwdLoading}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor="pwd_confirm" className="text-xs font-semibold">Konfirmasi Password Baru</FieldLabel>
                          <Input
                            id="pwd_confirm"
                            type="password"
                            required
                            placeholder="Ketik ulang..."
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={pwdLoading}
                            className="border-[#E4E1DA] bg-[#FAF9F6] text-xs h-9 rounded-lg"
                          />
                        </Field>
                      </div>

                      <Button
                        type="submit"
                        disabled={pwdLoading || !newPassword || !confirmPassword}
                        className="bg-[#2B3A55] text-white hover:bg-[#2B3A55]/95 w-full h-9 text-xs font-bold rounded-lg border-none flex items-center justify-center gap-2 shadow-sm"
                      >
                        {pwdLoading ? "Memperbarui Kata Sandi..." : "Perbarui Kata Sandi"}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="border border-[#B23A2E]/20 bg-[#B23A2E]/5 shadow-none rounded-lg">
                <CardHeader className="pb-3 border-b border-[#B23A2E]/10">
                  <CardTitle className="text-sm font-bold text-[#B23A2E] flex items-center gap-2">
                    <ShieldAlert className="size-5 text-[#B23A2E]" />
                    Hapus Akun Permanen
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-xs text-[#6B6862] leading-relaxed">
                    Tindakan ini bersifat **permanen** dan tidak dapat dibatalkan. Menghapus akun Anda akan melenyapkan seluruh profil digital, riwayat absensi, nilai tugas, dan akses Anda ke JPER LMS selamanya.
                  </p>

                  {deleteConfirm ? (
                    <div className="space-y-3">
                      <div className="text-[10px] font-bold text-[#B23A2E]">
                        Ketik kalimat <span className="underline font-mono">HAPUS AKUN SAYA</span> di bawah untuk melanjutkan:
                      </div>
                      <Input
                        placeholder="HAPUS AKUN SAYA"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        disabled={deleteLoading}
                        className="border-[#B23A2E]/30 bg-white text-xs h-9 rounded-lg text-[#B23A2E] font-bold font-mono"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleDeleteAccount}
                          disabled={deleteLoading || deleteConfirmText !== "HAPUS AKUN SAYA"}
                          className="bg-[#B23A2E] text-white hover:bg-[#B23A2E]/90 text-xs font-bold rounded-lg border-none flex-1 shadow"
                        >
                          {deleteLoading ? "Memproses..." : "Ya, Hapus Permanen"}
                        </Button>
                        <Button
                          onClick={() => { setDeleteConfirm(false); setDeleteConfirmText(""); }}
                          disabled={deleteLoading}
                          variant="outline"
                          className="border-[#E4E1DA] text-xs font-semibold rounded-lg flex-1"
                        >
                          Batal
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setDeleteConfirm(true)}
                      className="bg-[#B23A2E] text-[#FAF9F6] hover:bg-[#B23A2E]/90 text-xs font-bold rounded-lg border-none flex items-center justify-center gap-2 shadow-sm"
                    >
                      <Trash2 className="size-4" />
                      Hapus Akun JPER Saya
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: LIVE DIGITAL CARD PREVIEW */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B6862] flex items-center gap-1.5">
            <Eye className="size-4 text-[#B23A2E]" />
            Pratinjau Kartu Digital
          </h3>

          <Card className={`rounded-xl overflow-hidden flex flex-col justify-between transition-all duration-300 ${getCardBorderClass()}`}>
            <div>
              {/* Cover Banner preview */}
              <div className="h-28 relative overflow-hidden bg-[#2B3A55]/10">
                {renderCoverPreview(coverUrl)}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                
                {/* Role & Custom Badges */}
                <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                  <span className={`text-[8px] font-mono font-bold tracking-wider border px-2 py-0.5 rounded-full uppercase shadow ${
                    profile?.role === "admin"
                      ? "bg-[#B23A2E] text-white border-red-400"
                      : profile?.role === "alumni"
                      ? "bg-amber-600 text-white border-amber-400"
                      : "bg-[#2B3A55] text-white border-blue-400"
                  }`}>
                    {profile?.role === "admin" ? "Admin" : profile?.role === "alumni" ? "Alumni" : `Siswa aktif`}
                  </span>
                  
                  {badgeLabel !== "none" && (
                    <span className="text-[8px] font-mono font-bold tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded shadow-sm">
                      {badgeLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Avatar offset preview */}
              <div className="px-5 -mt-10 relative z-10 flex items-end justify-between">
                <div className={`size-20 rounded-full bg-white overflow-hidden shadow flex items-center justify-center ${getAvatarBorderClass()}`}>
                  <img src={activeAvatar} alt="Avatar Preview" className="size-full object-contain p-0.5 bg-stone-50" />
                </div>

                {angkatan && (
                  <div className="text-[10px] font-mono font-bold text-[#6B6862] bg-[#FAF9F6] border border-[#E4E1DA] px-2 py-0.5 rounded shadow-sm">
                    Angkatan {angkatan}
                  </div>
                )}
              </div>

              {/* Information info */}
              <div className="p-5 pt-3 space-y-3">
                <div>
                  <h4 className="font-extrabold text-sm text-[#1C1B1A] leading-tight">
                    {namaLengkap || "Nama Lengkap"}{nickname ? ` (${nickname})` : ""}
                  </h4>
                  
                  {/* Class & Major */}
                  {(angkatan === "2026" || angkatan === "2025" || angkatan === "2024") && (
                    <div className="text-[10px] text-[#2B3A55] font-mono font-bold mt-1.5">
                      Kelas: {angkatan === "2026" ? `10 ${jurusan} ${kelasSelect}` : angkatan === "2025" ? `11 ${jurusan} ${kelasSelect}` : `12 ${jurusan} ${kelasSelect}`} • {jurusan}
                    </div>
                  )}
                  {asalSekolah && (angkatan === "2026" || angkatan === "2027" || angkatan === "2028") && (
                    <div className="text-[9px] text-[#6B6862] font-mono mt-0.5">
                      Asal Sekolah: {asalSekolah}
                    </div>
                  )}
                </div>

                {/* New custom fields metadata tags */}
                {(hobby || favoriteAnime || learningInterest || japaneseLevel) && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {japaneseLevel && (
                      <span className="text-[9px] font-mono bg-blue-500/10 text-blue-700 px-2 py-0.5 rounded border border-blue-500/10" title="Level Jepang">
                        🈴 {japaneseLevel}
                      </span>
                    )}
                    {learningInterest && (
                      <span className="text-[9px] font-mono bg-purple-500/10 text-purple-700 px-2 py-0.5 rounded border border-purple-500/10" title="Minat Belajar">
                        📚 {learningInterest}
                      </span>
                    )}
                    {hobby && (
                      <span className="text-[9px] font-mono bg-emerald-500/10 text-emerald-700 px-2 py-0.5 rounded border border-emerald-500/10" title="Hobi">
                        🎮 {hobby}
                      </span>
                    )}
                    {favoriteAnime && (
                      <span className="text-[9px] font-mono bg-rose-500/10 text-rose-700 px-2 py-0.5 rounded border border-rose-500/10" title="Anime Favorit">
                        🌸 {favoriteAnime}
                      </span>
                    )}
                  </div>
                )}

                {/* Bio text */}
                <p className="text-xs text-[#6B6862] italic leading-relaxed pt-1">
                  {bio || "Status bio belum disesuaikan."}
                </p>

                {/* Quote block */}
                {quote && (
                  <div className="bg-[#FAF9F6] border-l-2 border-[#B23A2E] p-2.5 rounded-r text-[11px] text-[#1C1B1A]/90 font-mono italic leading-relaxed break-all">
                    "{quote}"
                  </div>
                )}
              </div>
            </div>

            {/* Social media footer */}
            <div className="px-5 py-4 border-t border-[#E4E1DA]/50 flex items-center justify-between bg-[#FAF9F6]/50">
              <div className="flex gap-2">
                {/* WA */}
                <span className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center ${
                  nomorTelepon && !hideWhatsapp ? "border-[#E4E1DA] bg-white text-emerald-600" : "border-[#E4E1DA]/30 text-[#E4E1DA] opacity-40"
                }`} title={nomorTelepon && !hideWhatsapp ? "WhatsApp Aktif" : "WhatsApp Tersembunyi"}>
                  <WhatsAppIcon className="size-3.5" />
                </span>

                {/* Instagram */}
                <span className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center ${
                  instagram ? "border-[#E4E1DA] bg-white text-[#B23A2E]" : "border-[#E4E1DA]/30 text-[#E4E1DA] opacity-40"
                }`}>
                  <InstagramIcon className="size-3.5" />
                </span>

                {/* GitHub */}
                <span className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center ${
                  github ? "border-[#E4E1DA] bg-white text-black" : "border-[#E4E1DA]/30 text-[#E4E1DA] opacity-40"
                }`}>
                  <GithubIcon className="size-3.5" />
                </span>

                {/* Twitter */}
                <span className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center ${
                  twitter ? "border-[#E4E1DA] bg-white text-[#1DA1F2]" : "border-[#E4E1DA]/30 text-[#E4E1DA] opacity-40"
                }`}>
                  <TwitterIcon className="size-3.5" />
                </span>

                {/* LinkedIn */}
                <span className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center ${
                  linkedin ? "border-[#E4E1DA] bg-white text-[#0A66C2]" : "border-[#E4E1DA]/30 text-[#E4E1DA] opacity-40"
                }`}>
                  <LinkedinIcon className="size-3.5" />
                </span>

                {/* Telegram */}
                <span className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center ${
                  telegram ? "border-[#E4E1DA] bg-white text-[#0088cc]" : "border-[#E4E1DA]/30 text-[#E4E1DA] opacity-40"
                }`}>
                  <TelegramIcon className="size-3.5" />
                </span>

                {/* Discord */}
                <span className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center ${
                  discord ? "border-[#E4E1DA] bg-white text-[#5865F2]" : "border-[#E4E1DA]/30 text-[#E4E1DA] opacity-40"
                }`}>
                  <DiscordIcon className="size-3.5" />
                </span>
              </div>

              <span className="text-[9px] font-mono text-[#6B6862] italic">
                PREVIEW
              </span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
