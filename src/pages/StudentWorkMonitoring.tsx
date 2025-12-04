"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"
import { 
  BookMarked, 
  Users, 
  Filter, 
  Eye, 
  FileText, 
  Image, 
  Video, 
  Music, 
  File,
  Download,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { getTopicTitle, getExerciseTitle } from "@/lib/exploreBeyondSyllabusData"

// Helper function to get file icon
function getFileIcon(type: string) {
  switch(type) {
    case 'image': return Image;
    case 'video': return Video;
    case 'audio': return Music;
    case 'document': return FileText;
    default: return File;
  }
}

interface Class {
  id: string
  name: string
  semester: number
}

interface Student {
  id: string
  full_name: string
  email: string
}

interface StudentNote {
  id: string
  student_id: string
  student_name: string
  student_email: string
  topic_id: string
  topic_title: string
  exercise_id: string
  exercise_title: string
  semester: number
  content: string
  created_at: string
  updated_at: string
  class_name: string
  attachments: Array<{
    id: string
    file_name: string
    file_path: string
    file_type: string
    file_size: number
    mime_type: string
  }>
}

export default function StudentWorkMonitoring() {
  const { user, profile } = useAuth()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>("all")
  const [notes, setNotes] = useState<StudentNote[]>([])
  const [filteredNotes, setFilteredNotes] = useState<StudentNote[]>([])
  const [selectedNote, setSelectedNote] = useState<StudentNote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopic, setSelectedTopic] = useState<string>("all")
  const [selectedExercise, setSelectedExercise] = useState<string>("all")


  // Load teacher's classes
  useEffect(() => {
    if (user) {
      loadTeacherClasses()
    }
  }, [user])

  // Load students when class is selected
  useEffect(() => {
    if (selectedClass) {
      loadClassStudents()
      loadStudentNotes()
    }
  }, [selectedClass])

  // Filter notes based on selections
  useEffect(() => {
    let filtered = [...notes]

    // Filter by student
    if (selectedStudent !== "all") {
      filtered = filtered.filter(note => note.student_id === selectedStudent)
    }

    // Filter by topic
    if (selectedTopic !== "all") {
      filtered = filtered.filter(note => note.topic_id === selectedTopic)
    }

    // Filter by exercise
    if (selectedExercise !== "all") {
      filtered = filtered.filter(note => note.exercise_id === selectedExercise)
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(note => 
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.exercise_title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredNotes(filtered)
  }, [notes, selectedStudent, selectedTopic, selectedExercise, searchQuery])

  const loadTeacherClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('class_teachers')
        .select(`
          class_id,
          classes (
            id,
            name,
            semester
          )
        `)
        .eq('teacher_id', user!.id)

      if (error) throw error

      const classList = data.map(item => item.classes).filter(Boolean) as Class[]
      setClasses(classList)
      
      if (classList.length > 0) {
        setSelectedClass(classList[0].id)
      }
    } catch (error) {
      console.error('Error loading classes:', error)
      toast({
        title: "Error",
        description: "Failed to load your classes",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadClassStudents = async () => {
    if (!selectedClass) return

    try {
      const { data, error } = await supabase
        .from('class_students')
        .select(`
          student_id,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('class_id', selectedClass)

      if (error) throw error

      const studentList = data
        .map(item => item.profiles)
        .filter(Boolean) as Student[]
      
      setStudents(studentList)
    } catch (error) {
      console.error('Error loading students:', error)
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      })
    }
  }

  const loadStudentNotes = async () => {
    if (!selectedClass) return

    setIsLoadingNotes(true)
    try {
      // Get class info first
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('semester')
        .eq('id', selectedClass)
        .single()

      if (classError) throw classError

      // Get all students in this class
      const { data: classStudents, error: studentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', selectedClass)

      if (studentsError) throw studentsError

      const studentIds = classStudents.map(cs => cs.student_id)

      if (studentIds.length === 0) {
        setNotes([])
        setIsLoadingNotes(false)
        return
      }

      // Get notes for these students
      const { data: notesData, error: notesError } = await supabase
        .from('student_notes')
        .select(`
          *,
          profiles!student_notes_student_id_fkey (
            full_name,
            email
          ),
          attachments:student_note_attachments (*)
        `)
        .in('student_id', studentIds)
        .eq('semester', classData.semester)
        .order('created_at', { ascending: false })

      if (notesError) throw notesError

      // Get class name
      const { data: classInfo } = await supabase
        .from('classes')
        .select('name')
        .eq('id', selectedClass)
        .single()

      // Transform data
      const transformedNotes: StudentNote[] = notesData.map((note: any) => ({
        id: note.id,
        student_id: note.student_id,
        student_name: note.profiles.full_name,
        student_email: note.profiles.email,
        topic_id: note.topic_id,
        topic_title: getTopicTitle(note.topic_id, note.semester),
        exercise_id: note.exercise_id,
        exercise_title: getExerciseTitle(note.topic_id, note.exercise_id, note.semester),
        semester: note.semester,
        content: note.content,
        created_at: note.created_at,
        updated_at: note.updated_at,
        class_name: classInfo?.name || '',
        attachments: note.attachments || []
      }))

      setNotes(transformedNotes)
    } catch (error) {
      console.error('Error loading notes:', error)
      toast({
        title: "Error",
        description: "Failed to load student work",
        variant: "destructive"
      })
    } finally {
      setIsLoadingNotes(false)
    }
  }

  const handleViewNote = (note: StudentNote) => {
    setSelectedNote(note)
    setDetailOpen(true)
  }

  const handleFileClick = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-notes')
        .createSignedUrl(filePath, 3600)

      if (error) throw error

      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Error getting file URL:', error)
      toast({
        title: "Error",
        description: "Failed to open file",
        variant: "destructive"
      })
    }
  }

  // Get unique topics and exercises for filters
  const uniqueTopics = Array.from(new Set(notes.map(n => n.topic_id)))
  const uniqueExercises = Array.from(new Set(notes.map(n => n.exercise_id)))

  // Calculate stats
  const totalSubmissions = notes.length
  const activeStudents = new Set(notes.map(n => n.student_id)).size
  const totalStudents = students.length

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                <BookMarked className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  Student Work Monitoring
                </h1>
                <p className="text-gray-600 mt-1">
                  View and track student progress in Explore Beyond Syllabus
                </p>
              </div>
            </div>
          </div>

          {/* Class Selection & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Select Class</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} (Semester {cls.semester})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Students</p>
                    <p className="text-2xl font-bold">{activeStudents}/{totalStudents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Submissions</p>
                    <p className="text-2xl font-bold">{totalSubmissions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search notes or students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Student Filter */}
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Topic Filter */}
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Topics</SelectItem>
                    {uniqueTopics.map(topic => (
                      <SelectItem key={topic} value={topic}>
                        {getTopicTitle(topic, classes.find(c => c.id === selectedClass)?.semester || 1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Exercise Filter */}
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Exercises" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Exercises</SelectItem>
                    {uniqueExercises.map(exercise => (
                      <SelectItem key={exercise} value={exercise}>
                        {exercise}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notes List */}
          {isLoadingNotes ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookMarked className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No student work found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Students haven't submitted any work yet or no matches for your filters
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            {note.student_name}
                          </h3>
                          <p className="text-sm text-gray-600">{note.student_email}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewNote(note)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {note.topic_title}
                        </Badge>
                        <h4 className="font-medium text-gray-900">
                          {note.exercise_title}
                        </h4>
                      </div>

                      <p className="text-gray-700 line-clamp-2">
                        {note.content}
                      </p>

                      {note.attachments.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          {note.attachments.map((file, idx) => {
                            const FileIcon = getFileIcon(file.file_type)
                            return (
                              <div
                                key={idx}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                              >
                                <FileIcon className="h-3 w-3" />
                                <span className="truncate max-w-[100px]">{file.file_name}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(note.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Detail Sheet */}
          <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
            <SheetContent side="right" className="w-full sm:w-[50vw] sm:max-w-none overflow-y-auto">
              {selectedNote && (
                <>
                  <SheetHeader>
                    <SheetTitle className="text-2xl">Work Details</SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Student Info */}
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 bg-purple-500 rounded-full">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {selectedNote.student_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {selectedNote.student_email}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{selectedNote.topic_title}</Badge>
                          </div>
                          <p className="font-medium">{selectedNote.exercise_title}</p>
                          <p className="text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(selectedNote.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Notes Content */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Student Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedNote.content}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Attachments */}
                    {selectedNote.attachments.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Attached Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedNote.attachments.map((file, idx) => {
                              const FileIcon = getFileIcon(file.file_type)
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleFileClick(file.file_path)}
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                                >
                                  <div className="p-2 bg-purple-100 rounded">
                                    <FileIcon className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {file.file_name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {file.file_type} • {(file.file_size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                  </div>
                                  <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </button>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}