"use client"

import React, { useState, useEffect, useCallback } from "react"
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
import { useSpeech } from "react-text-to-speech"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { saveAs } from "file-saver"

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
const exportToPDF = (title: string, content: string, teacherName: string) => {
  const doc = new jsPDF()
  
  // Title
  doc.setFontSize(20)
  doc.text(title, 20, 30)
  
  // Teacher info
  doc.setFontSize(12)
  doc.text(`By: ${teacherName}`, 20, 45)
  
  // Content
  doc.setFontSize(12)
  const splitContent = doc.splitTextToSize(content, 170)
  doc.text(splitContent, 20, 60)
  
  doc.save(`${title}.pdf`)
}

const exportToDocx = async (title: string, content: string, teacherName: string) => {
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          children: [new TextRun({ text: title, bold: true, size: 32 })],
          heading: HeadingLevel.TITLE,
        }),
        new Paragraph({
          children: [new TextRun({ text: `By: ${teacherName}`, italic: true, size: 24 })],
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
          <div className="flex items-center gap-4 mt-2 text-gray-600">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Prof. {note.teacher_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span>{note.topic}</span>
            </div>
            <div className="flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              <span>{note.class_name}</span>
            </div>
          </div>
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
          onClick={() => exportToPDF(note.title, note.content, note.teacher_name)}
          variant="outline"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button
          onClick={() => exportToDocx(note.title, note.content, note.teacher_name)}
          variant="outline"
          size="sm"
        >
          <FileText className="h-4 w-4 mr-2" />
          Download DOCX
        </Button>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Shared {format(new Date(note.enrolled_at), "MMM dd, yyyy")}
        </Badge>
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

                                <AudioPlayer text={note.content} />
                                
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