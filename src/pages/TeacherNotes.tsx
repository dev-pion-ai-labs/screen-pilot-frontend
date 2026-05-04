"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"
import {
    Search,
    Plus,
    Eye,
    Edit,
    Trash2,
    Download,
    Volume2,
    Share,
    Calendar as CalendarIcon,
    Filter,
    Loader2,
    BookOpen,
    Users,
    CheckCircle,
    X,
    FileText,
    Save,
    ArrowLeft
} from "lucide-react"
import { format, subDays, isAfter, isBefore } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useSpeech } from "react-text-to-speech"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { saveAs } from "file-saver"
import { Link } from "react-router-dom"
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

// Types
interface Note {
    id: string
    title: string
    topic: string
    subtopic: string
    content: string
    ai_generated_content: string
    teacher_id: string
    class_id: string
    semester: number
    is_shared: boolean
    created_at: string
    updated_at: string
    class_name?: string
    student_count?: number
}

interface Class {
    id: string
    name: string
    semester: number
}

type DateFilter = 'all' | '7days' | '30days' | '90days' | 'custom'
type ViewMode = 'table' | 'view' | 'edit'

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

// Helper function to strip HTML tags for audio
const stripHtmlTags = (html: string): string => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Audio Player Component
// Audio Player Component
// const AudioPlayer = ({ text, disabled = false }) => {
//     // Strip HTML tags from text before passing to speech
//     const plainText = stripHtmlTags(text);

//     const {
//         speechStatus,
//         isInQueue,
//         start,
//         pause,
//         stop,
//     } = useSpeech({ text: plainText })

//     if (disabled || !text) {
//         return (
//             <Button variant="outline" size="sm" disabled>
//                 <Volume2 className="h-4 w-4" />
//             </Button>
//         )
//     }

//     return (
//         <div className="flex items-center gap-1">
//             {speechStatus !== "started" ? (
//                 <Button variant="outline" size="sm" onClick={start} title="Play Audio">
//                     <Volume2 className="h-4 w-4" />
//                 </Button>
//             ) : (
//                 <Button variant="outline" size="sm" onClick={pause} title="Pause Audio">
//                     <Volume2 className="h-4 w-4" />
//                 </Button>
//             )}
//             {isInQueue && (
//                 <Button variant="outline" size="sm" onClick={stop} title="Stop">
//                     <X className="h-3 w-3" />
//                 </Button>
//             )}
//         </div>
//     )
// }

import { AudioPlayer } from "./StudentNotes"

// Export Functions
const exportToPDF = (title: string, content: string) => {
    const doc = new jsPDF()

    // Strip HTML and parse structure
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(content, 'text/html')

    let yPosition = 20
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 20
    const maxWidth = pageWidth - (margin * 2)

    // Title
    doc.setFontSize(22)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(124, 58, 237) // Purple color
    const titleLines = doc.splitTextToSize(title, maxWidth)
    doc.text(titleLines, margin, yPosition)
    yPosition += (titleLines.length * 10) + 10

    // Draw line under title
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
                doc.setTextColor(124, 58, 237) // Purple
                const h1Lines = doc.splitTextToSize(text, maxWidth)
                doc.text(h1Lines, margin, yPosition)
                yPosition += (h1Lines.length * 8) + 5
                // Underline
                doc.setDrawColor(124, 58, 237)
                doc.line(margin, yPosition, pageWidth - margin, yPosition)
                yPosition += 10
                break

            case 'h2':
                addNewPageIfNeeded(15)
                doc.setFontSize(14)
                doc.setFont(undefined, 'bold')
                doc.setTextColor(37, 99, 235) // Blue
                const h2Lines = doc.splitTextToSize(text, maxWidth - 10)
                // Left border line
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
                doc.setTextColor(5, 150, 105) // Green
                const h3Lines = doc.splitTextToSize(text, maxWidth)
                doc.text(h3Lines, margin, yPosition)
                yPosition += (h3Lines.length * 6) + 6
                break

            case 'p':
                addNewPageIfNeeded(10)
                doc.setFontSize(10)
                doc.setFont(undefined, 'normal')
                doc.setTextColor(55, 65, 81) // Gray
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

    // Footer on each page
    const totalPages = doc.internal.pages.length - 1
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(156, 163, 175)
        doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' })
    }

    doc.save(`${title}.pdf`)
}

const exportToDocx = async (title: string, content: string) => {
    // Parse HTML content
    const parser = new DOMParser()
    const htmlDoc = parser.parseFromString(content, 'text/html')
    const elements = htmlDoc.body.children

    const docChildren = []

    // Add title
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: title,
                    bold: true,
                    size: 32, // 16pt
                    color: "7C3AED", // Purple
                })
            ],
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
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

    // Add empty line
    docChildren.push(new Paragraph({ text: "" }))

    // Process HTML elements
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
                                size: 28, // 14pt
                                color: "7C3AED", // Purple
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
                                size: 24, // 12pt
                                color: "2563EB", // Blue
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
                                size: 22, // 11pt
                                color: "059669", // Green
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
                                size: 22, // 11pt
                                color: "374151", // Gray
                            })
                        ],
                        spacing: { after: 200 },
                        alignment: "both" // Justified text
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
                            bullet: {
                                level: 0
                            },
                            spacing: { after: 100 }
                        })
                    )
                })
                docChildren.push(new Paragraph({ text: "" })) // Space after list
                break

            case 'ol':
                const olItems = element.querySelectorAll('li')
                olItems.forEach((li, index) => {
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

            case 'strong':
            case 'b':
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: text,
                                bold: true,
                                size: 22,
                                color: "1F2937",
                            })
                        ],
                        spacing: { after: 100 }
                    })
                )
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
                        top: 1440,    // 1 inch
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
    // Function to render HTML content with enhanced styling
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
            {/* Header Section */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                            {note.title}
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        <Badge variant="outline" className="text-sm py-1 px-3">
                            📚 {note.topic}
                        </Badge>
                        {note.subtopic && (
                            <Badge variant="outline" className="text-sm py-1 px-3">
                                📖 {note.subtopic}
                            </Badge>
                        )}
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
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="pt-4 pb-4">
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-purple-600" />
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium">
                                {format(new Date(note.created_at), "MMM dd, yyyy 'at' h:mm a")}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-blue-600" />
                            <span className="text-gray-600">Updated:</span>
                            <span className="font-medium">
                                {format(new Date(note.updated_at), "MMM dd, yyyy 'at' h:mm a")}
                            </span>
                        </div>
                        {note.student_count > 0 && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-green-600" />
                                <span className="text-gray-600">Students:</span>
                                <span className="font-medium">{note.student_count}</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
            <AudioPlayer text={note.content} skipSelectors={["h1", "h2", "blockquote"]} />
                <Button onClick={() => exportToPDF(note.title, note.content)} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                </Button>
                <Button onClick={() => exportToDocx(note.title, note.content)} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export DOCX
                </Button>
                {note.is_shared && (
                    <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Shared
                    </Badge>
                )}
            </div>

            {/* Main Content Card with CSS Styling */}
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
                        💡 <strong>Tip:</strong> Use the export buttons to download this note or click audio to listen
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

// Note Editor Component
// Note Editor Component with ReactQuill
const NoteEditor = ({ note, onSave, onCancel }) => {
    const [editedContent, setEditedContent] = useState(note.content)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

    // ReactQuill modules configuration
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
        ],
    }

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet',
        'color', 'background',
        'align',
        'link'
    ]

    const handleSave = async () => {
        try {
            setSaving(true)
            const { error } = await supabase
                .from('notes')
                .update({
                    content: editedContent,
                    updated_at: new Date().toISOString()
                })
                .eq('id', note.id)

            if (error) throw error

            toast({
                title: "Note Updated",
                description: "Your note has been saved successfully",
            })

            onSave({ ...note, content: editedContent })
        } catch (error) {
            console.error('Error updating note:', error)
            toast({
                title: "Save Failed",
                description: "Failed to update the note",
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Edit: {note.title}</h1>
                    <p className="text-gray-600">{note.topic} • {note.class_name}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Editor */}
            <Card>
                <CardContent className="pt-6">
                    <style>{`
                        .quill-editor {
                            height: 500px;
                        }
                        .quill-editor .ql-container {
                            height: calc(100% - 42px);
                            font-size: 16px;
                        }
                        .quill-editor .ql-editor {
                            min-height: 450px;
                        }
                        .quill-editor .ql-editor h1 {
                            font-size: 2rem;
                            font-weight: 700;
                            color: #1a1a1a;
                            margin-top: 1.5rem;
                            margin-bottom: 0.75rem;
                        }
                        .quill-editor .ql-editor h2 {
                            font-size: 1.5rem;
                            font-weight: 600;
                            color: #2563eb;
                            margin-top: 1.25rem;
                            margin-bottom: 0.5rem;
                        }
                        .quill-editor .ql-editor h3 {
                            font-size: 1.25rem;
                            font-weight: 600;
                            color: #059669;
                            margin-top: 1rem;
                            margin-bottom: 0.5rem;
                        }
                        .quill-editor .ql-editor p {
                            line-height: 1.8;
                            margin-bottom: 0.75rem;
                        }
                    `}</style>

                    <ReactQuill
                        theme="snow"
                        value={editedContent}
                        onChange={setEditedContent}
                        modules={modules}
                        formats={formats}
                        className="quill-editor"
                        placeholder="Edit your note content..."
                    />
                </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4 pb-4">
                    <p className="text-sm text-blue-800">
                        <strong>Editing Tips:</strong> Use the toolbar to format your text.
                        Headers (H1, H2, H3) will automatically be styled with colors when viewed.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}

// Main Component
export default function TeacherNotes() {
    const { profile } = useAuth()
    const { toast } = useToast()

    // State
    const [viewMode, setViewMode] = useState<ViewMode>('table')
    const [loading, setLoading] = useState(true)
    const [notes, setNotes] = useState<Note[]>([])
    const [classes, setClasses] = useState<Class[]>([])
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([])
    const [selectedNote, setSelectedNote] = useState<Note | null>(null)
    const [shareModal, setShareModal] = useState({ isOpen: false, note: null, studentCount: 0 })
    const [sharing, setSharing] = useState(false)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [customDateRange, setCustomDateRange] = useState<any>({ from: null, to: null })

    // Fetch teacher's classes
    const fetchClasses = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('class_teachers')
                .select(`
          class_id,
          classes:class_id (
            id,
            name,
            semester
          )
        `)
                .eq('teacher_id', profile?.id)

            if (error) throw error
            setClasses(data?.map(item => item.classes) || [])
        } catch (error) {
            console.error('Error fetching classes:', error)
        }
    }, [profile])

    // Fetch teacher's notes
    const fetchNotes = useCallback(async () => {
        try {
            setLoading(true)

            const { data: notesData, error: notesError } = await supabase
                .from('notes')
                .select(`
          *,
          classes:class_id (
            name
          )
        `)
                .eq('teacher_id', profile?.id)
                .order('created_at', { ascending: false })

            if (notesError) throw notesError

            // Get student counts for each class
            const notesWithCounts = await Promise.all(
                notesData.map(async (note) => {
                    const { count: studentCount } = await supabase
                        .from('class_students')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', note.class_id)

                    return {
                        ...note,
                        class_name: note.classes?.name,
                        student_count: studentCount || 0
                    }
                })
            )

            setNotes(notesWithCounts)
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
                note.subtopic.toLowerCase().includes(searchTerm.toLowerCase())
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

    // Share note with students
    // Open share confirmation modal
    const openShareModal = async (note: Note) => {
        try {
            // Get student count for confirmation
            const { count, error } = await supabase
                .from('class_students')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', note.class_id)

            if (error) throw error

            setShareModal({
                isOpen: true,
                note,
                studentCount: count || 0
            })
        } catch (error) {
            console.error('Error getting student count:', error)
            toast({
                title: "Error",
                description: "Failed to get student count",
                variant: "destructive"
            })
        }
    }

    // Actual share function
    const handleShareNote = async () => {
        try {
            setSharing(true)
            const { note } = shareModal

            // Get all students in the class
            const { data: students, error: studentsError } = await supabase
                .from('class_students')
                .select('student_id')
                .eq('class_id', note.class_id)

            if (studentsError) throw studentsError

            if (students && students.length > 0) {
                // Create enrollments for all students
                const enrollments = students.map(student => ({
                    note_id: note.id,
                    student_id: student.student_id,
                    enrolled_at: new Date().toISOString()
                }))

                const { error: enrollmentError } = await supabase
                    .from('note_enrollments')
                    .insert(enrollments)

                if (enrollmentError) throw enrollmentError

                // Update note as shared
                const { error: updateError } = await supabase
                    .from('notes')
                    .update({ is_shared: true })
                    .eq('id', note.id)

                if (updateError) throw updateError

                toast({
                    title: "Note Shared Successfully",
                    description: `Shared with ${students.length} students in ${note.class_name}`,
                })

                // Refresh notes
                fetchNotes()
                setShareModal({ isOpen: false, note: null, studentCount: 0 })
            }
        } catch (error) {
            console.error('Error sharing note:', error)
            toast({
                title: "Share Failed",
                description: "Failed to share note with students",
                variant: "destructive"
            })
        } finally {
            setSharing(false)
        }
    }

    // Delete note. Verifies ownership before any cascade and scopes the
    // final delete by teacher_id so a teacher can never wipe another
    // teacher's note even if RLS is mis-configured.
    const handleDeleteNote = async (noteId: string) => {
        try {
            const teacherId = (profile as any)?.id
            if (!teacherId) throw new Error('Not authenticated')

            const { data: ownerRow, error: ownerErr } = await supabase
                .from('notes')
                .select('id, teacher_id')
                .eq('id', noteId)
                .maybeSingle()
            if (ownerErr) throw ownerErr
            if (!ownerRow) throw new Error('Note not found')
            if ((ownerRow as any).teacher_id !== teacherId) {
                throw new Error('You do not own this note')
            }

            const { error: enrollErr } = await supabase
                .from('note_enrollments')
                .delete()
                .eq('note_id', noteId)
            if (enrollErr) throw enrollErr

            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', noteId)
                .eq('teacher_id', teacherId)

            if (error) throw error

            toast({
                title: "Note Deleted",
                description: "Note and all related data have been deleted",
            })

            fetchNotes()

            // If viewing the deleted note, go back to table
            if (selectedNote?.id === noteId) {
                setViewMode('table')
                setSelectedNote(null)
            }
        } catch (error) {
            console.error('Error deleting note:', error)
            toast({
                title: "Delete Failed",
                description: error instanceof Error ? error.message : "Failed to delete note",
                variant: "destructive"
            })
        }
    }

    // View note
    const handleViewNote = (note: Note) => {
        setSelectedNote(note)
        setViewMode('view')
    }

    // Edit note
    const handleEditNote = (note: Note) => {
        setSelectedNote(note)
        setViewMode('edit')
    }

    // Handle note save from editor
    const handleNoteSave = (updatedNote: Note) => {
        setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n))
        setSelectedNote(updatedNote)
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
            <AuthGuard allowedRoles={["teacher"]}>
                <ModernDashboardLayout>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                            <p className="text-gray-600">Loading notes...</p>
                        </div>
                    </div>
                </ModernDashboardLayout>
            </AuthGuard>
        )
    }

    return (
        <AuthGuard allowedRoles={["teacher"]}>
            <ModernDashboardLayout>
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Table View */}
                    {viewMode === 'table' && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
                                    <p className="text-gray-600 mt-1">Manage and share your teaching notes</p>
                                </div>
                                <Link to={'/teacher/create-notes'}>
                                    <Button

                                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create New Note
                                    </Button>
                                </Link>
                            </div>

                            {/* Filters */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search notes..."
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
                                        Your Notes ({filteredNotes.length})
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
                                                    <TableHead>Updated</TableHead>
                                                    <TableHead>Status</TableHead>
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
                                                            {format(new Date(note.updated_at), "MMM dd, yyyy")}
                                                        </TableCell>
                                                        <TableCell>

                                                            {note.is_shared ? (
                                                                <Badge variant="outline" className="text-xs">
                                                                    Already Shared
                                                                </Badge>
                                                            ) : (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openShareModal(note)}
                                                                    title="Share with Students"
                                                                    className="text-green-600 hover:text-green-700"
                                                                >
                                                                    <Share className="h-4 w-4" />
                                                                </Button>
                                                            )}
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
                                                                    onClick={() => handleEditNote(note)}
                                                                    title="Edit Note"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>

                                                              

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => exportToPDF(note.title, note.content)}
                                                                    title="Export PDF"
                                                                >
                                                                    <Download className="h-4 w-4" />
                                                                </Button>

                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => exportToDocx(note.title, note.content)}
                                                                    title="Export DOCX"
                                                                >
                                                                    <FileText className="h-4 w-4" />
                                                                </Button>


                                                                {note.is_shared ? (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Already Shared
                                                                    </Badge>
                                                                ) : (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => openShareModal(note)}
                                                                        title="Share with Students"
                                                                        className="text-green-600 hover:text-green-700"
                                                                    >
                                                                        <Share className="h-4 w-4" />
                                                                    </Button>
                                                                )}

                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="text-red-600 hover:text-red-700"
                                                                            title="Delete Note"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This will permanently delete "{note.title}" and remove it from all students who have access.
                                                                                This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteNote(note.id)}
                                                                                className="bg-red-600 hover:bg-red-700"
                                                                            >
                                                                                Delete Note
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
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
                                                        : 'Create your first note to get started'
                                                    }
                                                </p>
                                                <Link to={'/teacher/create-notes'}>
                                                    <Button

                                                        variant="outline"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create Note
                                                    </Button>
                                                </Link>
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

                    {/* Edit Mode */}
                    {viewMode === 'edit' && selectedNote && (
                        <NoteEditor
                            note={selectedNote}
                            onSave={handleNoteSave}
                            onCancel={() => setViewMode('view')}
                        />
                    )}

                    {/* Share Confirmation Modal */}
                    <Dialog open={shareModal.isOpen} onOpenChange={(open) => !sharing && setShareModal({ isOpen: open, note: null, studentCount: 0 })}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Share Note with Students</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <p className="text-gray-600">
                                    Do you want to share "<strong>{shareModal.note?.title}</strong>" with{' '}
                                    <strong>{shareModal.studentCount} students</strong> in{' '}
                                    <strong>{shareModal.note?.class_name}</strong>?
                                </p>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                            <p className="font-medium mb-1">What happens when you share:</p>
                                            <ul className="space-y-1 text-blue-700">
                                                <li>• All students in the class will receive access to this note</li>
                                                <li>• Students can view, download (PDF/DOCX), and listen to the note</li>
                                                <li>• You can track which students have accessed the note</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShareModal({ isOpen: false, note: null, studentCount: 0 })}
                                    disabled={sharing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleShareNote}
                                    disabled={sharing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {sharing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Sharing...
                                        </>
                                    ) : (
                                        <>
                                            <Share className="h-4 w-4 mr-2" />
                                            Share with {shareModal.studentCount} Students
                                        </>
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </ModernDashboardLayout>
        </AuthGuard>
    )
}