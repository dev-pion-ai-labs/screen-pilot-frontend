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

// Audio Player Component
const AudioPlayer = ({ text, disabled = false }) => {
    const {
        speechStatus,
        isInQueue,
        start,
        pause,
        stop,
    } = useSpeech({ text })

    if (disabled || !text) {
        return (
            <Button variant="outline" size="sm" disabled>
                <Volume2 className="h-4 w-4" />
            </Button>
        )
    }

    return (
        <div className="flex items-center gap-1">
            {speechStatus !== "started" ? (
                <Button variant="outline" size="sm" onClick={start} title="Play Audio">
                    <Volume2 className="h-4 w-4" />
                </Button>
            ) : (
                <Button variant="outline" size="sm" onClick={pause} title="Pause Audio">
                    <Volume2 className="h-4 w-4" />
                </Button>
            )}
            {isInQueue && (
                <Button variant="outline" size="sm" onClick={stop} title="Stop">
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    )
}

// Export Functions
const exportToPDF = (title: string, content: string) => {
    const doc = new jsPDF()

    // Title
    doc.setFontSize(20)
    doc.text(title, 20, 30)

    // Content
    doc.setFontSize(12)
    const splitContent = doc.splitTextToSize(content, 170)
    doc.text(splitContent, 20, 50)

    doc.save(`${title}.pdf`)
}

const exportToDocx = async (title: string, content: string) => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [new TextRun({ text: title, bold: true, size: 32 })],
                    heading: HeadingLevel.TITLE,
                }),
                new Paragraph({ text: "" }), // Empty line
                new Paragraph({
                    children: [new TextRun({ text: content, size: 24 })],
                }),
            ],
        }],
    })

    const blob = await Packer.toBlob(doc)
    saveAs(blob, `${title}.docx`)
}

// Note Viewer Component
const NoteViewer = ({ note, onClose }) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
                    <p className="text-gray-600">{note.topic} • {note.class_name}</p>
                </div>
                <Button variant="outline" onClick={onClose}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Notes
                </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
                <AudioPlayer text={note.content} />
                <Button
                    onClick={() => exportToPDF(note.title, note.content)}
                    variant="outline"
                    size="sm"
                >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                </Button>
                <Button
                    onClick={() => exportToDocx(note.title, note.content)}
                    variant="outline"
                    size="sm"
                >
                    <Download className="h-4 w-4 mr-2" />
                    DOCX
                </Button>
                {note.is_shared && (
                    <Badge variant="default" className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Shared with Students
                    </Badge>
                )}
            </div>

            {/* Content */}
            <Card>
                <CardContent className="pt-6">
                    <div className="prose max-w-none">
                        <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">
                            {note.content}
                        </pre>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Note Editor Component
const NoteEditor = ({ note, onSave, onCancel }) => {
    const [editedContent, setEditedContent] = useState(note.content)
    const [saving, setSaving] = useState(false)
    const { toast } = useToast()

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
                    <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[500px] resize-none text-sm leading-relaxed"
                        placeholder="Edit your note content..."
                    />
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

    // Delete note
    const handleDeleteNote = async (noteId: string) => {
        try {
            // Delete enrollments first
            await supabase
                .from('note_enrollments')
                .delete()
                .eq('note_id', noteId)

            // Delete the note
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', noteId)

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
                description: "Failed to delete note",
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

                                                                <AudioPlayer text={note.content} />

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