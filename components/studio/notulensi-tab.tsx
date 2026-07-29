"use client"

import React, { useEffect, useState, useRef, useCallback } from "react"
import { Plus, Trash2, Heading1, Heading2, Heading3, Bold, Italic, List, ListOrdered, CheckSquare, Quote, Table, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"

type NoteItem = {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

interface NotulensiTabProps {
  token: string
}

export function NotulensiTab({ token }: NotulensiTabProps) {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Editor States
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [previewMode, setPreviewMode] = useState<"edit" | "split" | "preview">("split")
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Fetch all notes
  const fetchNotes = useCallback(async () => {
    setTimeout(() => {
      setLoading(true)
    }, 0)
    try {
      const res = await fetch("/api/studio/notulensi", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        throw new Error("Gagal memuat daftar catatan.")
      }
      const data = await res.json()
      const list = data.list ?? []
      setNotes(list)
      if (list.length > 0 && !activeNoteId) {
        setTimeout(() => {
          setActiveNoteId(list[0].id)
          setTitle(list[0].title)
          setContent(list[0].content)
        }, 0)
      }
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengambil data.")
    } finally {
      setTimeout(() => {
        setLoading(false)
      }, 0)
    }
  }, [token, activeNoteId])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchNotes()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchNotes])

  // Handle active note change
  const handleSelectNote = (note: NoteItem) => {
    // Clear any pending autosave first
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    setActiveNoteId(note.id)
    setTitle(note.title)
    setContent(note.content)
    setSaveStatus("idle")
  }

  // Trigger Autosave
  const triggerAutosave = (newTitle: string, newContent: string) => {
    if (!activeNoteId) return

    setSaveStatus("saving")
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/studio/notulensi?id=${activeNoteId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ title: newTitle, content: newContent }),
        })

        if (!res.ok) {
          throw new Error("Gagal autosave.")
        }

        const data = await res.json()
        
        // Update notes list inline
        setNotes((prev) =>
          prev.map((n) => (n.id === activeNoteId ? data.notulensi : n))
        )
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 1500)
      } catch {
        setSaveStatus("error")
      }
    }, 1000)
  }

  // Create Note
  const handleCreateNote = async () => {
    try {
      const res = await fetch("/api/studio/notulensi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: "Notula Baru", content: "" }),
      })

      if (!res.ok) {
        throw new Error("Gagal membuat catatan baru.")
      }

      const data = await res.json()
      setNotes((prev) => [data.notulensi, ...prev])
      setActiveNoteId(data.notulensi.id)
      setTitle(data.notulensi.title)
      setContent(data.notulensi.content)
      setSaveStatus("idle")
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal membuat catatan.")
    }
  }

  // Delete Note
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Hapus catatan notulen ini?")) return

    try {
      const res = await fetch(`/api/studio/notulensi?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error("Gagal menghapus catatan.")
      }

      const remaining = notes.filter((n) => n.id !== id)
      setNotes(remaining)
      
      if (activeNoteId === id) {
        if (remaining.length > 0) {
          setActiveNoteId(remaining[0].id)
          setTitle(remaining[0].title)
          setContent(remaining[0].content)
        } else {
          setActiveNoteId(null)
          setTitle("")
          setContent("")
        }
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus catatan.")
    }
  }

  // Insert markdown helpers
  const insertMarkdown = (syntax: string, placeholder = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = textarea.value
    const selected = text.substring(start, end)

    let replacement = ""
    let selectionOffset = 0

    if (syntax === "h1") {
      replacement = `\n# ${selected || placeholder}\n`
    } else if (syntax === "h2") {
      replacement = `\n## ${selected || placeholder}\n`
    } else if (syntax === "h3") {
      replacement = `\n### ${selected || placeholder}\n`
    } else if (syntax === "bold") {
      replacement = `**${selected || placeholder || "tebal"}**`
      selectionOffset = selected ? 0 : 2
    } else if (syntax === "italic") {
      replacement = `*${selected || placeholder || "miring"}*`
      selectionOffset = selected ? 0 : 1
    } else if (syntax === "quote") {
      replacement = `\n> ${selected || placeholder}\n`
    } else if (syntax === "bullet") {
      replacement = `\n- ${selected || placeholder || "item"}`
    } else if (syntax === "ordered") {
      replacement = `\n1. ${selected || placeholder || "item"}`
    } else if (syntax === "todo") {
      replacement = `\n- [ ] ${selected || placeholder || "tugas"}`
    } else if (syntax === "table") {
      replacement = `\n| Header 1 | Header 2 |\n| --- | --- |\n| Kolom 1 | Kolom 2 |\n`
    } else if (syntax === "divider") {
      replacement = `\n---\n`
    }

    const newContent = text.substring(0, start) + replacement + text.substring(end)
    setContent(newContent)
    triggerAutosave(title, newContent)

    // Set cursor focus back
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + replacement.length - selectionOffset
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 50)
  }

  // Handle Tab key in textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault()
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const text = textarea.value

      const newContent = text.substring(0, start) + "  " + text.substring(end)
      setContent(newContent)
      triggerAutosave(title, newContent)

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + 2, start + 2)
      }, 50)
    }
  }

  // Simple Markdown Parser & Renderer to HTML React nodes
  const renderMarkdown = (md: string) => {
    if (!md.trim()) {
      return <p className="text-[#6B6862] text-xs font-mono">Belum ada konten notulensi.</p>
    }

    const lines = md.split("\n")
    let inTable = false
    let tableHeaders: string[] = []
    let tableRows: string[][] = []

    const renderedNodes: React.ReactNode[] = []

    const processText = (text: string) => {
      // Inline Code `code`
      const codeRegex = /`([^`]+)`/g
      // Bold regex
      const boldRegex = /\*\*([^*]+)\*\*/g
      // Italic regex
      const italicRegex = /\*([^*]+)\*/g

      // A simple tokenizer for inline styles
      const htmlText = text
        .replace(boldRegex, "<strong>$1</strong>")
        .replace(italicRegex, "<em>$1</em>")
        .replace(codeRegex, "<code class='bg-[#E4E1DA]/50 px-1 py-0.5 rounded text-xs font-mono'>$1</code>")

      return <span dangerouslySetInnerHTML={{ __html: htmlText }} />
    }

    lines.forEach((line, index) => {
      // Handle Tables
      if (line.startsWith("|")) {
        inTable = true
        const cols = line.split("|").map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1)
        if (line.includes("---")) {
          // Divider row, skip
          return
        }
        if (tableHeaders.length === 0) {
          tableHeaders = cols
        } else {
          tableRows.push(cols)
        }
        return
      } else if (inTable) {
        // Table ended
        renderedNodes.push(
          <div key={`table-${index}`} className="my-4 overflow-x-auto">
            <table className="min-w-full text-left text-xs border border-[#E4E1DA] border-collapse">
              <thead>
                <tr className="bg-[#E4E1DA]/30 border-b border-[#E4E1DA]">
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-3 py-2 font-mono font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#E4E1DA]/50">
                    {row.map((col, ci) => (
                      <td key={ci} className="px-3 py-1.5 font-mono">{processText(col)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        inTable = false
        tableHeaders = []
        tableRows = []
      }

      // Headers
      if (line.startsWith("# ")) {
        renderedNodes.push(<h1 key={index} className="text-xl font-bold tracking-tight text-[#1C1B1A] mt-4 mb-2">{processText(line.substring(2))}</h1>)
      } else if (line.startsWith("## ")) {
        renderedNodes.push(<h2 key={index} className="text-lg font-bold tracking-tight text-[#1C1B1A] mt-3 mb-1.5">{processText(line.substring(3))}</h2>)
      } else if (line.startsWith("### ")) {
        renderedNodes.push(<h3 key={index} className="text-sm font-bold tracking-tight text-[#1C1B1A] mt-2 mb-1">{processText(line.substring(4))}</h3>)
      }
      // Blockquotes
      else if (line.startsWith("> ")) {
        renderedNodes.push(
          <blockquote key={index} className="border-l-2 border-[#2B3A55] pl-3 italic text-[#6B6862] text-xs my-2">
            {processText(line.substring(2))}
          </blockquote>
        )
      }
      // Dividers
      else if (line.trim() === "---") {
        renderedNodes.push(<hr key={index} className="border-t border-[#E4E1DA] my-4" />)
      }
      // Todo Lists
      else if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
        const checked = line.startsWith("- [x] ")
        renderedNodes.push(
          <div key={index} className="flex items-start gap-2 text-xs font-mono my-1">
            <input type="checkbox" checked={checked} readOnly className="mt-0.5" />
            <span className={checked ? "line-through text-[#6B6862]" : ""}>{processText(line.substring(6))}</span>
          </div>
        )
      }
      // Unordered Lists
      else if (line.startsWith("- ")) {
        renderedNodes.push(
          <ul key={index} className="list-disc list-inside text-xs my-0.5 pl-2 text-[#1C1B1A]">
            <li>{processText(line.substring(2))}</li>
          </ul>
        )
      }
      // Ordered Lists
      else if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, "")
        renderedNodes.push(
          <ol key={index} className="list-decimal list-inside text-xs my-0.5 pl-2 text-[#1C1B1A]">
            <li>{processText(content)}</li>
          </ol>
        )
      }
      // Empty line
      else if (!line.trim()) {
        renderedNodes.push(<div key={index} className="h-2" />)
      }
      // Regular Paragraph
      else {
        renderedNodes.push(<p key={index} className="text-xs text-[#1C1B1A] leading-relaxed my-1 font-mono">{processText(line)}</p>)
      }
    })

    // If file ended with table still uncommitted
    if (inTable && tableHeaders.length > 0) {
      renderedNodes.push(
        <div key="table-end" className="my-4 overflow-x-auto">
          <table className="min-w-full text-left text-xs border border-[#E4E1DA] border-collapse">
            <thead>
              <tr className="bg-[#E4E1DA]/30 border-b border-[#E4E1DA]">
                {tableHeaders.map((h, i) => (
                  <th key={i} className="px-3 py-2 font-mono font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className="border-b border-[#E4E1DA]/50">
                  {row.map((col, ci) => (
                    <td key={ci} className="px-3 py-1.5 font-mono">{processText(col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }

    return <div className="space-y-1 font-sans">{renderedNodes}</div>
  }

  return (
    <div className="space-y-6 text-[#1C1B1A]">
      {error && (
        <div className="rounded-lg border border-[#B23A2E]/30 bg-[#B23A2E]/5 p-3 text-xs text-[#B23A2E]">
          {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-6 h-[75svh]">
        {/* LEFT COLUMN: LIST OF NOTES */}
        <div className="w-full md:w-64 flex flex-col border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg">
          <div className="p-3 border-b border-[#E4E1DA] flex items-center justify-between">
            <span className="text-xs font-bold font-mono text-[#6B6862]">Notulensi Rapat</span>
            <Button
              size="sm"
              onClick={handleCreateNote}
              className="h-7 px-2 bg-[#2B3A55] text-[#FAF9F6] hover:bg-[#2B3A55]/95 text-xs rounded-lg border-none"
            >
              <Plus className="size-3 mr-1" />
              Notula
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="text-center py-6 text-xs text-[#6B6862] font-mono">Memuat catatan...</div>
            ) : notes.length === 0 ? (
              <div className="text-center py-6 text-[10px] text-[#6B6862]">Belum ada catatan.</div>
            ) : (
              notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                    activeNoteId === note.id
                      ? "bg-[#2B3A55]/10 text-[#2B3A55] font-semibold"
                      : "hover:bg-[#E4E1DA]/20 text-[#1C1B1A]"
                  }`}
                >
                  <span className="truncate pr-2 font-mono">{note.title}</span>
                  <Trash2
                    className="size-3 text-[#B23A2E] opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    onClick={(e) => handleDeleteNote(note.id, e)}
                  />
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: EDITOR & PREVIEW WORKSPACE */}
        <div className="flex-1 flex flex-col border border-[#E4E1DA] bg-[#FAF9F6] rounded-lg overflow-hidden">
          {activeNoteId ? (
            <>
              {/* Toolbar */}
              <div className="p-2 border-b border-[#E4E1DA] bg-[#FAF9F6] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {/* Markdown syntax insertion shortcuts */}
                  <button onClick={() => insertMarkdown("h1", "Header 1")} title="H1" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Heading1 className="size-4" /></button>
                  <button onClick={() => insertMarkdown("h2", "Header 2")} title="H2" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Heading2 className="size-4" /></button>
                  <button onClick={() => insertMarkdown("h3", "Header 3")} title="H3" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Heading3 className="size-4" /></button>
                  <div className="h-4 w-px bg-[#E4E1DA] mx-1" />
                  <button onClick={() => insertMarkdown("bold")} title="Tebal" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Bold className="size-4" /></button>
                  <button onClick={() => insertMarkdown("italic")} title="Miring" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Italic className="size-4" /></button>
                  <button onClick={() => insertMarkdown("quote", "Kutipan")} title="Kutipan" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Quote className="size-4" /></button>
                  <div className="h-4 w-px bg-[#E4E1DA] mx-1" />
                  <button onClick={() => insertMarkdown("bullet")} title="Bullet List" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><List className="size-4" /></button>
                  <button onClick={() => insertMarkdown("ordered")} title="Ordered List" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><ListOrdered className="size-4" /></button>
                  <button onClick={() => insertMarkdown("todo")} title="Todo List" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><CheckSquare className="size-4" /></button>
                  <div className="h-4 w-px bg-[#E4E1DA] mx-1" />
                  <button onClick={() => insertMarkdown("table")} title="Tabel" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Table className="size-4" /></button>
                  <button onClick={() => insertMarkdown("divider")} title="Garis Pemisah" className="p-1 hover:bg-[#E4E1DA]/50 rounded text-[#1C1B1A]"><Minus className="size-4" /></button>
                </div>

                {/* View Modes */}
                <div className="flex items-center gap-1.5 border border-[#E4E1DA] rounded-lg p-0.5 bg-[#FAF9F6]">
                  <button
                    onClick={() => setPreviewMode("edit")}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${previewMode === "edit" ? "bg-[#2B3A55] text-[#FAF9F6]" : "text-[#6B6862] hover:bg-[#E4E1DA]/20"}`}
                  >
                    Editor
                  </button>
                  <button
                    onClick={() => setPreviewMode("split")}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${previewMode === "split" ? "bg-[#2B3A55] text-[#FAF9F6]" : "text-[#6B6862] hover:bg-[#E4E1DA]/20"}`}
                  >
                    Split
                  </button>
                  <button
                    onClick={() => setPreviewMode("preview")}
                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${previewMode === "preview" ? "bg-[#2B3A55] text-[#FAF9F6]" : "text-[#6B6862] hover:bg-[#E4E1DA]/20"}`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Title Input & Save Status */}
              <div className="px-4 py-2 border-b border-[#E4E1DA]/50 flex items-center justify-between gap-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    triggerAutosave(e.target.value, content)
                  }}
                  placeholder="Judul Catatan..."
                  className="font-bold text-sm text-[#1C1B1A] bg-transparent border-none outline-none focus:ring-0 flex-1 placeholder-[#6B6862]"
                />
                
                {/* Autosave Indicator */}
                <div className="text-[10px] font-mono select-none">
                  {saveStatus === "saving" && <span className="text-[#6B6862] animate-pulse">Menyimpan...</span>}
                  {saveStatus === "saved" && <span className="text-emerald-600 font-semibold">Tersimpan</span>}
                  {saveStatus === "error" && <span className="text-[#B23A2E]">Gagal Menyimpan</span>}
                </div>
              </div>

              {/* Workspace Content Panels */}
              <div className="flex-1 flex overflow-hidden">
                {/* Editor textarea */}
                {(previewMode === "edit" || previewMode === "split") && (
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value)
                      triggerAutosave(title, e.target.value)
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Tulis notulensi Anda di sini (mendukung pintasan toolbar Markdown)..."
                    className="flex-1 p-4 bg-[#FAF9F6] border-none outline-none focus:ring-0 text-xs font-mono leading-relaxed resize-none overflow-y-auto text-[#1C1B1A]"
                  />
                )}

                {/* Vertical Divider for Split Screen */}
                {previewMode === "split" && <div className="w-px bg-[#E4E1DA]" />}

                {/* Live Preview Panel */}
                {(previewMode === "preview" || previewMode === "split") && (
                  <div className="flex-1 p-6 bg-[#FAF9F6] overflow-y-auto prose max-w-none prose-sm">
                    <h1 className="text-xl font-bold tracking-tight text-[#1C1B1A] mb-4 border-b border-[#E4E1DA] pb-2">
                      {title || "Tanpa Judul"}
                    </h1>
                    {renderMarkdown(content)}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[#6B6862] font-mono">
              Silakan buat atau pilih catatan notulensi di sebelah kiri.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
