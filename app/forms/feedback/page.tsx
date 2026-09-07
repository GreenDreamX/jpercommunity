"use client"

import React from "react"
import { DynamicFormRenderer } from "@/components/forms/dynamic-form-renderer"

export default function FeedbackFormPage() {
  return (
    <DynamicFormRenderer
      slug="feedback"
      fallbackTitle="Form Evaluasi Presensi & Kelas Mingguan"
      fallbackDescription="Berikan masukan jujur mengenai kualitas penyampaian materi, fasilitas LMS, atau usulan kegiatan ekskul."
    />
  )
}
