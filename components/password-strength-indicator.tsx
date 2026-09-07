"use client"

import { Check, X } from "lucide-react"

interface PasswordStrengthIndicatorProps {
  password?: string
}

export function PasswordStrengthIndicator({ password = "" }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)

  const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecial].filter(Boolean).length

  let strengthLabel = "Sangat Lemah"
  let barColor = "bg-red-500"
  let textColor = "text-red-600"

  if (score >= 5) {
    strengthLabel = "Sangat Kuat"
    barColor = "bg-emerald-600"
    textColor = "text-emerald-700"
  } else if (score >= 4) {
    strengthLabel = "Kuat"
    barColor = "bg-emerald-500"
    textColor = "text-emerald-600"
  } else if (score >= 3) {
    strengthLabel = "Sedang"
    barColor = "bg-amber-500"
    textColor = "text-amber-700"
  } else if (score >= 2) {
    strengthLabel = "Lemah"
    barColor = "bg-orange-500"
    textColor = "text-orange-600"
  }

  return (
    <div className="space-y-2 pt-1 text-xs">
      <div className="flex items-center justify-between font-mono text-[10px]">
        <span className="text-[#6B6862]">Kekuatan Password:</span>
        <span className={`font-bold ${textColor}`}>{strengthLabel}</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#E4E1DA]/60 h-1.5 rounded-full overflow-hidden flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-full flex-1 transition-all duration-300 ${
              level <= score ? barColor : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Checklist */}
      <div className="grid grid-cols-2 gap-1 text-[10px] text-[#6B6862] font-mono pt-1">
        <div className="flex items-center gap-1">
          {hasMinLength ? <Check className="size-3 text-emerald-600" /> : <X className="size-3 text-stone-400" />}
          <span className={hasMinLength ? "text-[#1C1B1A]" : ""}>Min. 8 Karakter</span>
        </div>
        <div className="flex items-center gap-1">
          {hasUppercase ? <Check className="size-3 text-emerald-600" /> : <X className="size-3 text-stone-400" />}
          <span className={hasUppercase ? "text-[#1C1B1A]" : ""}>Huruf Besar (A-Z)</span>
        </div>
        <div className="flex items-center gap-1">
          {hasNumber ? <Check className="size-3 text-emerald-600" /> : <X className="size-3 text-stone-400" />}
          <span className={hasNumber ? "text-[#1C1B1A]" : ""}>Angka (0-9)</span>
        </div>
        <div className="flex items-center gap-1">
          {hasSpecial ? <Check className="size-3 text-emerald-600" /> : <X className="size-3 text-stone-400" />}
          <span className={hasSpecial ? "text-[#1C1B1A]" : ""}>Simbol (!@#$)</span>
        </div>
      </div>
    </div>
  )
}
