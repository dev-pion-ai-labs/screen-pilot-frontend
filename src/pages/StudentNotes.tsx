"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"
import {
  Search,
  Eye,
  Download,
  Volume2,
  Calendar as CalendarIcon,
  Loader2,
  BookOpen,
  Users,
  X,
  FileText,
  ArrowLeft,
  GraduationCap,
  User
} from "lucide-react"
import { format, subDays, isAfter, isBefore } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useSpeech, useVoices } from "react-text-to-speech"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { saveAs } from "file-saver"
import { Slider } from "@/components/ui/slider"



// Types
interface StudentNote {
  id: string
  title: string
  topic: string
  subtopic: string
  content: string
  teacher_id: string
  class_id: string
  semester: number
  created_at: string
  updated_at: string
  class_name?: string
  teacher_name?: string
  enrolled_at?: string
}

interface Class {
  id: string
  name: string
  semester: number
}

type DateFilter = 'all' | '7days' | '30days' | '90days' | 'custom'
type ViewMode = 'table' | 'view'

// Date Filter Component
const DateFilterSelect = ({ value, onChange, customRange, onCustomRangeChange }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Date filter" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="7days">Last 7 days</SelectItem>
          <SelectItem value="30days">Last 30 days</SelectItem>
          <SelectItem value="90days">Last 90 days</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      {value === 'custom' && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-64 justify-start">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange.from && customRange.to
                ? `${format(customRange.from, "MMM dd")} - ${format(customRange.to, "MMM dd")}`
                : "Pick date range"
              }
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={onCustomRangeChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}







// Natural + Voice-Selectable Audio Player
// - Skips <h2>, citation tokens like , and the whole "Reference Materials" section
// - Slower, warmer defaults; inserts pauses between paragraphs with directives
// - Lets user pick language/voice via useVoices(); persists settings locally

type AudioPlayerProps = {
  text: string
  disabled?: boolean
  skipSelectors?: string[] // optional extra selectors to skip
}

const LS_KEY = "ssp_tts_prefs"

function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}")
  } catch {
    return {}
  }
}
function savePrefs(p: any) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p))
  } catch { }
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  disabled = false,
  skipSelectors = ["h2"],
}) => {
  const { languages, voices } = useVoices()

  // sensible defaults for India; user can override
  const AUTO_LANG = "auto"
  const DEFAULT_VOICE = "defaultVoice"
  const prefs = useMemo(loadPrefs, [])
  const [lang, setLang] = useState<string>(prefs.lang ? String(prefs.lang) : AUTO_LANG)
  const [voiceURI, setVoiceURI] = useState<string>(prefs.voiceURI ? String(prefs.voiceURI) : DEFAULT_VOICE)

  const [rate, setRate] = useState<number>(prefs.rate ?? 0.85);
  const [pitch, setPitch] = useState<number>(prefs.pitch ?? 0.92);

  const [volume, setVolume] = useState<number>(prefs.volume ?? 1)
  // add sentinels at top of component file



  useEffect(() => {
    savePrefs({ lang, voiceURI, rate, pitch, volume })
  }, [lang, voiceURI, rate, pitch, volume])

  // try to auto-pick a good Indian English voice on first mount if none saved
  useEffect(() => {
    if (voiceURI === DEFAULT_VOICE && voices.length) {
      const preferred =
        voices.find(v => v.lang === "en-IN") ||
        voices.find(v => /India|Heera|Neural|Google.*English.*India/i.test(v.voiceURI)) ||
        voices.find(v => v.lang?.startsWith("en-"))
      if (preferred) setVoiceURI(preferred.voiceURI)
    }
  }, [voices.length]) // eslint-disable-line react-hooks/exhaustive-deps


  const prepareSpeechText = (html: string): string => {
    if (!html) return ""
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const body = doc.body || doc

    // remove scripts/styles + requested tags
    body.querySelectorAll("script, style").forEach(n => n.remove())
    if (skipSelectors?.length) body.querySelectorAll(skipSelectors.join(",")).forEach(n => n.remove())

    // drop "Reference Materials" heading and its following nodes up to next heading
    const refHeading = Array.from(body.querySelectorAll("h1,h2,h3,h4,h5,h6")).find(h =>
      /reference\s*materials?/i.test(h.textContent || "")
    )
    if (refHeading) {
      let n: ChildNode | null = refHeading
      // remove heading and siblings until next heading
      while (n) {
        const next = n.nextSibling
        n.remove()
        if (next && next.nodeType === Node.ELEMENT_NODE) {
          const tag = (next as Element).tagName.toLowerCase()
          if (/^h[1-6]$/.test(tag)) break
        }
        n = next
      }
    }

    // gather block text with bullets for <li>
    const blocks: string[] = []
    const blockTags = new Set(["p", "li", "h1", "h2", "h3", "h4", "h5", "h6"])
    let current = ""

    const flush = () => {
      const cleaned = current
        .replace(/【[^】]+】/g, "") // strip citation boxes
        .replace(/\s+/g, " ")
        .trim()
      if (cleaned) blocks.push(cleaned)
      current = ""
    }

    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT)
    let node: Node | null = walker.nextNode()
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element
        const tag = el.tagName.toLowerCase()
        if (blockTags.has(tag)) flush()
        if (tag === "li") current += " • "
      } else if (node.nodeType === Node.TEXT_NODE) {
        const t = (node.nodeValue || "").replace(/\s+/g, " ").trim()
        if (t) current += (current ? " " : "") + t
      }
      node = walker.nextNode()
    }
    flush()

    // Insert short pauses between paragraphs using directives.
    // The library processes directives only if enableDirectives=true in useSpeech().
    return blocks.join(" [[delay=350]]\n\n")
  }

  const speechText = useMemo(() => prepareSpeechText(text), [text])

  // If text is full of long sentences, slow a touch more
  const longest = useMemo(
    () => speechText.split(/[.!?]\s/).reduce((m, s) => Math.max(m, s.length), 0),
    [speechText]
  )
  const chosenRate = longest > 220 ? Math.min(rate, 0.85) : rate

  const langForSpeech = lang === AUTO_LANG ? undefined : lang
  const voiceForSpeech = voiceURI === DEFAULT_VOICE ? undefined : voiceURI


  const {
    speechStatus,
    isInQueue,
    start,
    pause,
    stop,
  } = useSpeech({
    text: speechText,
    rate: chosenRate,
    pitch,
    volume,
    lang: langForSpeech,        // <-- use translated value
    voiceURI: voiceForSpeech,   // <-- use translated value
    maxChunkSize: 180,        // tighter chunks = clearer articulation + natural breathing
    highlightText: false,
    highlightMode: "sentence",
    preserveUtteranceQueue: false,
    enableDirectives: true,   // enables [[delay=...]] we embedded
  })

  if (disabled || !speechText) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Volume2 className="h-4 w-4" />
      </Button>
    )
  }


  const filteredVoices = lang === AUTO_LANG ? voices : voices.filter(v => v.lang === lang);


  return (
    <div className="flex flex-col gap-2">
      {/* Controls row */}
      <div className="flex items-center gap-1">
        {speechStatus !== "started" ? (
          <Button variant="outline" size="sm" onClick={start} title="Play">
            <Volume2 className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={pause} title="Pause">
            <Volume2 className="h-4 w-4" />
          </Button>
        )}
        {isInQueue && (
          <Button variant="outline" size="sm" onClick={stop} title="Stop">
            <X className="h-3 w-3" />
          </Button>
        )}

        {/* Language */}
        <Select
          value={lang}
          onValueChange={(val) => {
            setLang(val)
            setVoiceURI(DEFAULT_VOICE) // reset to default for new language
          }}
        >
          <SelectTrigger className="h-8 w-40">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value={AUTO_LANG}>Auto (system default)</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>


        {/* Voice */}

        <Select value={voiceURI} onValueChange={setVoiceURI}>
          <SelectTrigger className="h-8 w-56">
            <SelectValue placeholder="Voice" />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            <SelectItem value={DEFAULT_VOICE}>Default voice</SelectItem>
            {filteredVoices.map((v) => (
              <SelectItem key={v.voiceURI} value={v.voiceURI}>
                {v.voiceURI}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

      </div>

      {/* Sliders row (Rate / Pitch / Volume) */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        <div className="flex items-center gap-3">
          <span className="text-xs w-10">Rate</span>
          <Slider
            value={[rate]}
            min={0.5}
            max={1.3}
            step={0.01}
            onValueChange={([v]) => setRate(v)}
            className="w-40"
          />
          <span className="text-xs w-8">{rate.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs w-10">Pitch</span>
          <Slider
            value={[pitch]}
            min={0.7}
            max={1.3}
            step={0.01}
            onValueChange={([v]) => setPitch(v)}
            className="w-40"
          />
          <span className="text-xs w-8">{pitch.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs w-10">Vol</span>
          <Slider
            value={[volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={([v]) => setVolume(v)}
            className="w-40"
          />
          <span className="text-xs w-8">{volume.toFixed(2)}</span>
        </div>
      </div> */}
    </div>
  )
}







// Export Functions
// Enhanced PDF Export with HTML parsing
const exportToPDF = (title: string, htmlContent: string, teacherName: string) => {
  const doc = new jsPDF()

  // Parse HTML content
  const parser = new DOMParser()
  const htmlDoc = parser.parseFromString(htmlContent, 'text/html')

  let yPosition = 20
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const maxWidth = pageWidth - (margin * 2)

  // Title
  doc.setFontSize(22)
  doc.setFont(undefined, 'bold')
  doc.setTextColor(124, 58, 237) // Purple
  const titleLines = doc.splitTextToSize(title, maxWidth)
  doc.text(titleLines, margin, yPosition)
  yPosition += (titleLines.length * 10) + 5

  // Teacher info
  doc.setFontSize(11)
  doc.setFont(undefined, 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text(`By: Prof. ${teacherName}`, margin, yPosition)
  yPosition += 10

  // Draw line
  doc.setDrawColor(124, 58, 237)
  doc.setLineWidth(0.5)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 15

  // Process HTML content
  const elements = htmlDoc.body.children

  const addNewPageIfNeeded = (requiredSpace) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = margin
    }
  }

  for (let element of elements) {
    const tagName = element.tagName.toLowerCase()
    const text = element.textContent.trim()

    if (!text) continue

    switch (tagName) {
      case 'h1':
        addNewPageIfNeeded(20)
        doc.setFontSize(18)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(124, 58, 237)
        const h1Lines = doc.splitTextToSize(text, maxWidth)
        doc.text(h1Lines, margin, yPosition)
        yPosition += (h1Lines.length * 8) + 5
        doc.setDrawColor(124, 58, 237)
        doc.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 10
        break

      case 'h2':
        addNewPageIfNeeded(15)
        doc.setFontSize(14)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(37, 99, 235)
        const h2Lines = doc.splitTextToSize(text, maxWidth - 10)
        doc.setDrawColor(59, 130, 246)
        doc.setLineWidth(1)
        doc.line(margin, yPosition - 2, margin, yPosition + (h2Lines.length * 6) + 2)
        doc.text(h2Lines, margin + 5, yPosition)
        yPosition += (h2Lines.length * 7) + 8
        break

      case 'h3':
        addNewPageIfNeeded(12)
        doc.setFontSize(12)
        doc.setFont(undefined, 'bold')
        doc.setTextColor(5, 150, 105)
        const h3Lines = doc.splitTextToSize(text, maxWidth)
        doc.text(h3Lines, margin, yPosition)
        yPosition += (h3Lines.length * 6) + 6
        break

      case 'p':
        addNewPageIfNeeded(10)
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.setTextColor(55, 65, 81)
        const pLines = doc.splitTextToSize(text, maxWidth)
        doc.text(pLines, margin, yPosition)
        yPosition += (pLines.length * 5) + 8
        break

      case 'ul':
      case 'ol':
        addNewPageIfNeeded(10)
        doc.setFontSize(10)
        doc.setFont(undefined, 'normal')
        doc.setTextColor(55, 65, 81)
        const listItems = element.querySelectorAll('li')
        listItems.forEach((li, index) => {
          addNewPageIfNeeded(6)
          const bullet = tagName === 'ul' ? '•' : `${index + 1}.`
          const liText = li.textContent.trim()
          const liLines = doc.splitTextToSize(liText, maxWidth - 10)
          doc.text(bullet, margin + 5, yPosition)
          doc.text(liLines, margin + 15, yPosition)
          yPosition += (liLines.length * 5) + 4
        })
        yPosition += 5
        break
    }
  }

  // Footer
  const totalPages = doc.internal.pages.length - 1
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(156, 163, 175)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
  }

  doc.save(`${title}.pdf`)
}

// Enhanced DOCX Export with HTML parsing
const exportToDocx = async (title: string, htmlContent: string, teacherName: string) => {
  const parser = new DOMParser()
  const htmlDoc = parser.parseFromString(htmlContent, 'text/html')
  const elements = htmlDoc.body.children

  const docChildren = []

  // Title
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: 32,
          color: "7C3AED",
        })
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 200 },
      border: {
        bottom: {
          color: "7C3AED",
          space: 1,
          value: "single",
          size: 6,
        }
      }
    })
  )

  // Teacher info
  docChildren.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `By: Prof. ${teacherName}`,
          italic: true,
          size: 22,
          color: "666666",
        })
      ],
      spacing: { after: 400 }
    })
  )

  // Process HTML
  for (let element of elements) {
    const tagName = element.tagName.toLowerCase()
    const text = element.textContent.trim()

    if (!text) continue

    switch (tagName) {
      case 'h1':
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 28,
                color: "7C3AED",
              })
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
            border: {
              bottom: {
                color: "7C3AED",
                space: 1,
                value: "single",
                size: 6,
              }
            }
          })
        )
        break

      case 'h2':
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 24,
                color: "2563EB",
              })
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 150 },
            border: {
              left: {
                color: "3B82F6",
                space: 1,
                value: "single",
                size: 12,
              }
            },
            indent: { left: 200 }
          })
        )
        break

      case 'h3':
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                bold: true,
                size: 22,
                color: "059669",
              })
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 250, after: 100 }
          })
        )
        break

      case 'p':
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: text,
                size: 22,
                color: "374151",
              })
            ],
            spacing: { after: 200 },
            alignment: "both"
          })
        )
        break

      case 'ul':
        const ulItems = element.querySelectorAll('li')
        ulItems.forEach((li) => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: li.textContent.trim(),
                  size: 22,
                  color: "374151",
                })
              ],
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          )
        })
        docChildren.push(new Paragraph({ text: "" }))
        break

      case 'ol':
        const olItems = element.querySelectorAll('li')
        olItems.forEach((li) => {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: li.textContent.trim(),
                  size: 22,
                  color: "374151",
                })
              ],
              numbering: {
                reference: "my-numbering",
                level: 0
              },
              spacing: { after: 100 }
            })
          )
        })
        docChildren.push(new Paragraph({ text: "" }))
        break
    }
  }

  const doc = new Document({
    numbering: {
      config: [{
        reference: "my-numbering",
        levels: [{
          level: 0,
          format: "decimal",
          text: "%1.",
          alignment: "left"
        }]
      }]
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          }
        }
      },
      children: docChildren
    }]
  })

  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${title}.docx`)
}

// Note Viewer Component
// Enhanced Note Viewer Component
const NoteViewer = ({ note, onClose }) => {
  // Render HTML content
  const renderNoteContent = (content) => {
    return (
      <div
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3">
            <Badge variant="outline" className="text-sm py-1 px-3">
              👨‍🏫 Prof. {note.teacher_name}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              📚 {note.topic}
            </Badge>
            <Badge variant="outline" className="text-sm py-1 px-3">
              🏫 {note.class_name}
            </Badge>
          </div>
        </div>

        <Button variant="outline" onClick={onClose}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Metadata Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Created:</span>
              <span className="font-medium">{format(new Date(note.created_at), "MMM dd, yyyy 'at' h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Shared:</span>
              <span className="font-medium">{format(new Date(note.enrolled_at), "MMM dd, yyyy")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <AudioPlayer text={note.content} skipSelectors={["h1", "h2", "blockquote"]} />

        <Button
          onClick={() => exportToPDF(note.title, note.content, note.teacher_name)}
          variant="outline"
          size="sm"
          className="hover:bg-red-50"
        >
          <Download className="h-4 w-4 mr-2" />
          Export PDF
        </Button>
        <Button
          onClick={() => exportToDocx(note.title, note.content, note.teacher_name)}
          variant="outline"
          size="sm"
          className="hover:bg-blue-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Export DOCX
        </Button>
      </div>

      {/* Content with Enhanced Styling */}
      <Card className="shadow-lg">
        <CardContent className="pt-8 pb-8 px-8">
          <style>{`
            .prose h1 {
              font-size: 2rem;
              font-weight: 700;
              color: #1a1a1a;
              margin-top: 2rem;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 3px solid #7c3aed;
            }
            .prose h2 {
              font-size: 1.5rem;
              font-weight: 600;
              color: #2563eb;
              margin-top: 1.75rem;
              margin-bottom: 0.75rem;
              padding-left: 0.75rem;
              border-left: 4px solid #3b82f6;
            }
            .prose h3 {
              font-size: 1.25rem;
              font-weight: 600;
              color: #059669;
              margin-top: 1.5rem;
              margin-bottom: 0.5rem;
            }
            .prose p {
              font-size: 1.0625rem;
              line-height: 1.8;
              color: #374151;
              margin-bottom: 1rem;
              text-align: justify;
            }
            .prose strong {
              font-weight: 600;
              color: #1f2937;
            }
            .prose ul, .prose ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
            }
            .prose li {
              margin-bottom: 0.5rem;
              line-height: 1.75;
            }
          `}</style>

          {renderNoteContent(note.content)}
        </CardContent>
      </Card>

      {/* Footer Tip */}
      <Card className="bg-gray-50">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-gray-600 text-center">
            💡 <strong>Study Tip:</strong> Use the export buttons to save notes for offline study or print them for your reference
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Component
export default function StudentNotes() {
  const { profile } = useAuth()
  const { toast } = useToast()

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [filteredNotes, setFilteredNotes] = useState<StudentNote[]>([])
  const [selectedNote, setSelectedNote] = useState<StudentNote | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customDateRange, setCustomDateRange] = useState<any>({ from: null, to: null })

  // Fetch student's classes
  const fetchClasses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select(`
          class_id,
          classes:class_id (
            id,
            name,
            semester
          )
        `)
        .eq('student_id', profile?.id)

      if (error) throw error
      setClasses(data?.map(item => item.classes) || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    }
  }, [profile])

  // Fetch student's shared notes
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true)

      // Get note enrollments for this student with full note details
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('note_enrollments')
        .select(`
          enrolled_at,
          notes:note_id (
            id,
            title,
            topic,
            subtopic,
            content,
            teacher_id,
            class_id,
            semester,
            created_at,
            updated_at,
            classes:class_id (
              name
            ),
            profiles:teacher_id (
              full_name
            )
          )
        `)
        .eq('student_id', profile?.id)

      if (enrollmentsError) throw enrollmentsError

      // Transform the data to flat structure
      const notesWithDetails = enrollmentsData?.map(enrollment => ({
        ...enrollment.notes,
        class_name: enrollment.notes.classes?.name,
        teacher_name: enrollment.notes.profiles?.full_name,
        enrolled_at: enrollment.enrolled_at
      })) || []

      // Sort by created_at desc (recent first)
      notesWithDetails.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setNotes(notesWithDetails)
    } catch (error) {
      console.error('Error fetching notes:', error)
      toast({
        title: "Error",
        description: "Failed to load notes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [profile, toast])

  // Apply filters
  useEffect(() => {
    let filtered = [...notes]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.subtopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Class filter
    if (selectedClass !== 'all') {
      filtered = filtered.filter(note => note.class_id === selectedClass)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      let startDate: Date

      switch (dateFilter) {
        case '7days':
          startDate = subDays(now, 7)
          break
        case '30days':
          startDate = subDays(now, 30)
          break
        case '90days':
          startDate = subDays(now, 90)
          break
        case 'custom':
          if (customDateRange.from && customDateRange.to) {
            filtered = filtered.filter(note => {
              const createdDate = new Date(note.created_at)
              return isAfter(createdDate, customDateRange.from) && isBefore(createdDate, customDateRange.to)
            })
          }
          break
      }

      if (dateFilter !== 'custom' && startDate) {
        filtered = filtered.filter(note => isAfter(new Date(note.created_at), startDate))
      }
    }

    setFilteredNotes(filtered)
  }, [notes, searchTerm, selectedClass, dateFilter, customDateRange])

  // View note
  const handleViewNote = (note: StudentNote) => {
    setSelectedNote(note)
    setViewMode('view')
  }

  useEffect(() => {
    if (profile) {
      fetchClasses()
      fetchNotes()
    }
  }, [profile, fetchClasses, fetchNotes])

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">Loading your notes...</p>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Table View */}
          {viewMode === 'table' && (
            <>
              {/* Header */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">My Study Notes</h1>
                <p className="text-gray-600">Access notes shared by your teachers</p>
              </div>

              {/* Stats Card */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{notes.length}</div>
                      <div className="text-sm text-blue-700">Total Notes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {new Set(notes.map(n => n.teacher_id)).size}
                      </div>
                      <div className="text-sm text-green-700">Teachers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">
                        {new Set(notes.map(n => n.topic)).size}
                      </div>
                      <div className="text-sm text-purple-700">Topics</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search notes, topics, or teachers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classes.map(cls => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <DateFilterSelect
                      value={dateFilter}
                      onChange={setDateFilter}
                      customRange={customDateRange}
                      onCustomRangeChange={setCustomDateRange}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Notes Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Shared Notes ({filteredNotes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Note Title</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Teacher</TableHead>
                          <TableHead>Updated</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNotes.map((note) => (
                          <TableRow key={note.id}>
                            <TableCell>
                              <div>
                                <div className="font-semibold">{note.title}</div>
                                <div className="text-sm text-gray-500">{note.topic}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{note.class_name}</Badge>
                            </TableCell>
                            <TableCell>
                              {format(new Date(note.created_at), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">Prof. {note.teacher_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(note.updated_at), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewNote(note)}
                                  title="View Note"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>



                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportToPDF(note.title, note.content, note.teacher_name)}
                                  title="Download PDF"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => exportToDocx(note.title, note.content, note.teacher_name)}
                                  title="Download DOCX"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {filteredNotes.length === 0 && (
                      <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Notes Found</h3>
                        <p className="text-gray-500 mb-4">
                          {searchTerm || selectedClass !== 'all' || dateFilter !== 'all'
                            ? 'Try adjusting your filters or search terms'
                            : 'Your teachers haven\'t shared any notes with you yet'
                          }
                        </p>
                        {notes.length === 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                            <div className="text-sm text-blue-800">
                              <p className="font-medium mb-1">Notes will appear here when:</p>
                              <ul className="text-left space-y-1 text-blue-700">
                                <li>• Your teachers create and share notes</li>
                                <li>• You're enrolled in classes with shared content</li>
                                <li>• Teachers publish study materials for your semester</li>
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* View Mode */}
          {viewMode === 'view' && selectedNote && (
            <NoteViewer
              note={selectedNote}
              onClose={() => setViewMode('table')}
            />
          )}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}