"use client"

import React, { use } from "react"
import { DynamicFormRenderer } from "@/components/forms/dynamic-form-renderer"

export default function DynamicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  return <DynamicFormRenderer slug={resolvedParams.slug} />
}
