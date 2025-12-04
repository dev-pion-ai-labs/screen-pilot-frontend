"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Compass, Eye, Frame, Scissors, Lightbulb, PenTool, ArrowRight, ArrowLeft, Target, Upload, History, Save, X, FileText, Image, Video, File, Users, Clock, Globe, Film, Layers, BookMarked, Music, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"
import { getTopicTitle, getExerciseTitle } from "@/lib/exploreBeyondSyllabusData"
import { semester1Topics, semester2Topics } from "@/lib/exploreBeyondSyllabusData";
// File type configuration
const FILE_TYPE_CONFIG: Record<string, { type: string; icon: any; accept: boolean }> = {
  'image/jpeg': { type: 'image', icon: Image, accept: true },
  'image/png': { type: 'image', icon: Image, accept: true },
  'image/svg+xml': { type: 'image', icon: Image, accept: true },
  'video/mp4': { type: 'video', icon: Video, accept: true },
  'video/webm': { type: 'video', icon: Video, accept: true },
  'audio/mpeg': { type: 'audio', icon: Music, accept: true },
  'audio/wav': { type: 'audio', icon: Music, accept: true },
  'audio/mp3': { type: 'audio', icon: Music, accept: true },
  'application/pdf': { type: 'document', icon: FileText, accept: true },
  'application/vnd.ms-powerpoint': { type: 'document', icon: File, accept: true },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { type: 'document', icon: File, accept: true },
  'application/msword': { type: 'document', icon: File, accept: true },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'document', icon: File, accept: true },
};

const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.svg,.mp4,.webm,.mp3,.wav,.pdf,.ppt,.pptx,.doc,.docx';

// Helper function to get file type from mime type
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

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

export default function ExploreBeyondSyllabus() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Get student's semester from profile
  const semester = profile?.semester || 1

  // Wait for profile to load
  useEffect(() => {
    if (profile) {
      setIsLoading(false)
    }
  }, [profile])

  // Load history when history sidebar opens
  useEffect(() => {
    if (historyOpen && user) {
      loadHistory()
    }
  }, [historyOpen, user, semester])

  // Sync state with URL params
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    const exerciseParam = searchParams.get('exercise')

    if (topicParam) setSelectedTopic(topicParam)
    if (exerciseParam) setSelectedExerciseId(exerciseParam)
  }, [searchParams])

  // Function to load history from Supabase
  const loadHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      let query = supabase
        .from('student_notes')
        .select(`
          *,
          attachments:student_note_attachments(*)
        `)
        .eq('student_id', user.id)
        .eq('semester', semester)
        .order('created_at', { ascending: false })

      // Filter by exercise if selected
      if (selectedExerciseId) {
        query = query.eq('exercise_id', selectedExerciseId)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to match the display format
      const transformedData = data.map((note: any) => ({
        id: note.id,
        semester: note.semester,
        topicId: note.topic_id,
        topicTitle: getTopicTitle(note.topic_id, semester),
        exerciseId: note.exercise_id,
        exerciseTitle: getExerciseTitle(note.topic_id, note.exercise_id, semester),
        notes: note.content,
        files: note.attachments.map((att: any) => ({
          id: att.id,
          name: att.file_name,
          type: att.file_type,
          path: att.file_path,
          size: att.file_size,
          mimeType: att.mime_type
        })),
        savedAt: note.created_at
      }))

      setHistoryData(transformedData)
    } catch (error) {
      console.error('Error loading history:', error)
      toast({
        title: "Error loading history",
        description: "Failed to load your saved notes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Function to get topic title from topic ID
  const getTopicTitle = (topicId: string, sem: number) => {
    const topics = sem === 1 ? semester1Topics : semester2Topics
    return topics.find(t => t.id === topicId)?.title || topicId
  }

  // Function to get exercise title from exercise ID
  const getExerciseTitle = (topicId: string, exerciseId: string, sem: number) => {
    const topics = sem === 1 ? semester1Topics : semester2Topics
    const topic = topics.find(t => t.id === topicId)
    return topic?.exercises.find((ex: any) => ex.id === exerciseId)?.title || exerciseId
  }

  // Function to validate note before saving
  const validateNote = (content: string, files: File[]): { valid: boolean; error?: string } => {
    // Must have either content or files
    if (!content.trim() && files.length === 0) {
      return { valid: false, error: "Please add notes or upload at least one file" }
    }

    // Validate each file
    for (const file of files) {
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        return { valid: false, error: `File ${file.name} exceeds 50MB limit` }
      }

      // Check file type
      if (!FILE_TYPE_CONFIG[file.type]?.accept) {
        return { valid: false, error: `File type ${file.type} is not supported` }
      }
    }

    return { valid: true }
  }

  // Function to save note with files to Supabase
  const handleSave = async () => {
    if (!user || !selectedTopic || !selectedExerciseId) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive"
      })
      return
    }

    // Validate
    const validation = validateNote(notes, uploadedFiles)
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Step 1: Create note record
      const { data: note, error: noteError } = await supabase
        .from('student_notes')
        .insert({
          student_id: user.id,
          topic_id: selectedTopic,
          exercise_id: selectedExerciseId,
          semester: semester,
          content: notes
        })
        .select()
        .single()

      if (noteError) throw noteError

      // Step 2: Upload files and create attachment records
      for (const file of uploadedFiles) {
        // Upload to storage
        const fileName = `${user.id}/${note.id}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-notes')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Determine file type
        const fileType = getFileType(file.type)

        // Create attachment record
        const { error: attachmentError } = await supabase
          .from('student_note_attachments')
          .insert({
            note_id: note.id,
            file_name: file.name,
            file_path: uploadData.path,
            file_type: fileType,
            file_size: file.size,
            mime_type: file.type
          })

        if (attachmentError) throw attachmentError
      }

      // Success!
      toast({
        title: "Success!",
        description: "Your work has been saved successfully.",
      })

      // Clear form
      setNotes("")
      setUploadedFiles([])

      // Reload history if open
      if (historyOpen) {
        await loadHistory()
      }

    } catch (error) {
      console.error('Error saving note:', error)
      toast({
        title: "Error saving work",
        description: "Failed to save your work. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to download/view file
  const handleFileClick = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-notes')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error) throw error

      // Open in new tab
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Error getting file URL:', error)
      toast({
        title: "Error",
        description: "Failed to open file. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Validate file types
      const invalidFiles = newFiles.filter(file => !FILE_TYPE_CONFIG[file.type]?.accept)
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: `Some files are not supported: ${invalidFiles.map(f => f.name).join(', ')}`,
          variant: "destructive"
        })
        return
      }

      setUploadedFiles([...uploadedFiles, ...newFiles])
    }
  }

  const updateURL = (topic: string | null, exercise: string | null) => {
    const params = new URLSearchParams()
    if (topic) params.set('topic', topic)
    if (exercise) params.set('exercise', exercise)

    const queryString = params.toString()
    navigate(queryString ? `?${queryString}` : '/student/explore-beyond-syllabus', { replace: true })
  }

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId)
    updateURL(topicId, null)
  }

  const handleExerciseClick = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId)
    updateURL(selectedTopic, exerciseId)
  }

  const handleBack = () => {
    if (selectedExerciseId !== null) {
      setSelectedExerciseId(null)
      setNotes("")
      setUploadedFiles([])
      updateURL(selectedTopic, null)
    } else {
      setSelectedTopic(null)
      updateURL(null, null)
    }
  }

  // Filter history based on selected exercise
  const filteredHistory = selectedExerciseId
    ? historyData.filter(item => item.exerciseId === selectedExerciseId)
    : historyData

  // Semester 1 Topics


  const topics = semester === 1 ? semester1Topics : semester2Topics
  const selectedTopicData = topics.find(t => t.id === selectedTopic)
  const selectedExerciseData = selectedTopicData?.exercises.find((ex: any) => ex.id === selectedExerciseId)

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Compass className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Explore Beyond Syllabus
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Discover additional learning resources to enhance your filmmaking journey
                  </p>
                </div>
              </div>
              {selectedTopic && (
                <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              )}
            </div>
          </div>

          {/* Show topic list or exercises based on selection */}
          {!selectedTopic ? (
            <>
              {isLoading ? (
                /* Skeleton Loader */
                <>
                  <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="h-7 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="border-2">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6 mb-4 animate-pulse"></div>
                          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {/* Introduction Card */}
                  <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="pt-6">
                      <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        Choose your path for today:
                      </h2>
                      <p className="text-gray-600">
                        Each path leads to 3-5 interactive exercises: self-paced, creative, and feedback-ready.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Topics Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map((topic) => {
                      const Icon = topic.icon
                      return (
                        <Card
                          key={topic.id}
                          className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-purple-300"
                          onClick={() => handleTopicClick(topic.id)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between mb-3">
                              <div className={cn(
                                "p-3 rounded-lg bg-gradient-to-br",
                                topic.color
                              )}>
                                <Icon className="h-6 w-6 text-white" />
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400" />
                            </div>
                            <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
                            <CardDescription className="text-xs font-semibold text-purple-600 mb-2">
                              {topic.subtitle}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600">
                              {topic.description}
                            </p>
                            <Button
                              className={cn(
                                "w-full mt-4 bg-gradient-to-r",
                                topic.color,
                                "text-white hover:opacity-90"
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTopicClick(topic.id)
                              }}
                            >
                              Explore Exercises
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </>
              )}
            </>
          ) : (
            /* Exercises View */
            selectedTopicData && (
              <div>
                {/* Back Button */}
                <Button
                  variant="outline"
                  className="mb-6"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {selectedExerciseId !== null ? "Back to Exercises" : "Back to Topics"}
                </Button>

                {selectedExerciseId === null ? (
                  <>
                    {/* Topic Header */}
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedTopicData.title}
                      </h2>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-4">
                      {selectedTopicData.exercises.map((exercise: any, idx: number) => (
                        <Card
                          key={exercise.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleExerciseClick(exercise.id)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className={cn(
                                  "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold",
                                  selectedTopicData.color
                                )}>
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                  {exercise.title}
                                </h3>
                                <p className="text-gray-600 mb-3">
                                  {exercise.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                  <Target className="h-4 w-4 text-purple-600" />
                                  <span className="text-purple-600 font-medium">
                                    Purpose: {exercise.purpose}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Exercise Work Area */
                  selectedExerciseData && (
                    <div className="space-y-6">
                      {/* Exercise Header */}
                      <Card className={cn(
                        "bg-gradient-to-br border-2",
                        selectedTopicData.color.replace('500', '100')
                      )}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg",
                              selectedTopicData.color
                            )}>
                              {selectedTopicData.exercises.findIndex((ex: any) => ex.id === selectedExerciseId) + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {selectedExerciseData.title}
                              </h3>
                              <p className="text-gray-700 mb-2">
                                {selectedExerciseData.description}
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <Target className="h-4 w-4 text-purple-600" />
                                <span className="text-purple-600 font-medium">
                                  Purpose: {selectedExerciseData.purpose}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                    {/* Notes Section */}
                    <Card>
                      <CardContent className="pt-6">
                        <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                          Your Notes & Work
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Write your thoughts, ideas, observations, or complete the exercise here..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={10}
                          className="mb-4"
                          disabled={isSaving}
                        />

                        {/* Upload Section */}
                        <div className="space-y-4">
                          <Label className="text-base font-semibold">Upload Files</Label>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              type="button"
                              disabled={isSaving}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Files
                            </Button>
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              accept={ACCEPTED_FILE_TYPES}
                              onChange={handleFileUpload}
                              className="hidden"
                              disabled={isSaving}
                            />

                            {/* Uploaded Files in Row */}
                            {uploadedFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full">
                                <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                  {file.name}
                                </span>
                                <button
                                  onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                                  className="text-gray-500 hover:text-red-600 transition-colors"
                                  disabled={isSaving}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Supported: Images (PNG, JPG, SVG), Videos (MP4, WEBM), Audio (MP3, WAV), Documents (PDF, PPT, DOC)
                          </p>
                        </div>

                        {/* Save Button */}
                        <div className="mt-6">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={cn(
                              "w-full bg-gradient-to-r text-white",
                              selectedTopicData.color
                            )}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Work
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  )
                )}
              </div>
            )
          )}

          {/* History Sidebar */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetContent side="right" className="w-full sm:w-[50vw] sm:max-w-none overflow-y-auto">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-bold">Work History</SheetTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHistoryOpen(false)
                      setSelectedHistoryItem(null)
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>

              <div className="mt-6">
                {isLoadingHistory ? (
                  /* Loading State */
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : !selectedHistoryItem ? (
                  /* History List */
                  <div className="space-y-4">
                    {/* Show exercise context if filtered */}
                    {selectedExerciseId && selectedExerciseData && (
                      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 mb-4">
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm text-gray-600">
                            Showing history for:
                          </p>
                          <h3 className="font-semibold text-gray-900">
                            {selectedExerciseData.title}
                          </h3>
                        </CardContent>
                      </Card>
                    )}

                    {filteredHistory.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedHistoryItem(item)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {item.exerciseTitle}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {item.topicTitle}
                              </p>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {item.notes}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                          </div>

                          {/* Files Preview */}
                          {item.files.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {item.files.map((file: any, idx: number) => {
                                const FileIcon = getFileIcon(file.type)
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                                  >
                                    <FileIcon className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-3">
                            {new Date(item.savedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredHistory.length === 0 && (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">
                          {selectedExerciseId ? 'No saved work for this exercise yet' : 'No saved work yet'}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Complete exercises and save your work to see it here
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* History Detail View */
                  <div className="space-y-6">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedHistoryItem(null)}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to History
                    </Button>

                    {/* Exercise Info */}
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                      <CardContent className="pt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {selectedHistoryItem.exerciseTitle}
                        </h3>
                        <p className="text-sm font-semibold text-purple-600 mb-3">
                          {selectedHistoryItem.topicTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          Saved on {new Date(selectedHistoryItem.savedAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Your Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedHistoryItem.notes}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Attached Files */}
                    {selectedHistoryItem.files.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Attached Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedHistoryItem.files.map((file: any, idx: number) => {
                              const FileIcon = getFileIcon(file.type)
                              return (
                                <button
                                  key={idx}
                                  onClick={() => handleFileClick(file.path)}
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                                >
                                  <div className="p-2 bg-purple-100 rounded">
                                    <FileIcon className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {file.type} • {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                    </p>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </button>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}