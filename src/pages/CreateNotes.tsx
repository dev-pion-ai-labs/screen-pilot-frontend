"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import {
  Users,
  Sparkles,
  Target,
  GraduationCap,
  Loader2,
  CheckCircle,
  BookOpen,
  ArrowRight,
  FileText,
  Save,
  Brain,
  Settings,
  Award,
  Download,
  Volume2,
  Edit3,
  Eye,
  Plus
} from "lucide-react"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useSpeech } from "react-text-to-speech"
import { jsPDF } from "jspdf"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { saveAs } from "file-saver"

// Semester syllabus (reusing from CreateQuiz)
const semester1Syllabus = {
  introductionToDirection: {
    topic: "Introduction to Direction",
    subtopics: [
      "Film Analysis",
      "Different approaches to Shoot and types of film",
      "Case studies of Filmmakers and their approach",
      "Case studies of Filmmakers in historical perspective",
      "Writing Actuality Report",
      "Film Diary (Analysis of films, director and scripts, thoughts, ideas/stories,scenes, photographs)"
    ]
  },
  visualStorytellingAndCollaboration: {
    topic: "Visual Storytelling and Collaboration",
    subtopics: [
      "Introduction to visual storytelling (Composition, Cutting, Closeup, Continuity, Camera Angle)",
      "Recreating a Painting",
      "Collaboration with Camera, Edit and Sound",
      "Turning Actualities into stories (Writing on observation)",
      "Trip to closed public space (e.g. Library, Museum)",
      "Trip to an open public space (e.g. Park, Market place, Bus stop)"
    ]
  },
  principlesOfContinuity: {
    topic: "Principles of Continuity",
    subtopics: [
      "Decoupage (cutting scripts and planning visual for cinematic connection) and Continuity",
      "Aspects of continuity",
      "Time and Space in films",
      "Scene analysis of Classical Hollywood films and contemporary films"
    ]
  },
  conceptIdeationAndResearch: {
    topic: "Concept, Ideation & Research",
    subtopics: [
      "Types of stories",
      "Developing a concept",
      "Usage of VFX elements",
      "Oral narrative skills",
      "Creative Writing (Personal Memoir, Descriptive Writing)",
      "Reading and Analysis of short stories"
    ]
  },
  theoriesAndFormatsOfScriptwriting: {
    topic: "Theories and Formats of Scriptwriting",
    subtopics: [
      "History of Storytelling",
      "Screenplay writing - Overview and Process",
      "Elements of a screenplay",
      "Premise, Plot, Treatment, Characters, Conflict",
      "Screenwriting Softwares",
      "Introductions to Story structures  - I (Three-Act Structure, 5 Act Structure)",
      "Creating simple screenplays using 3 act structure"
    ]
  }
}

const semester2Syllabus = {
  stagingAndBlocking: {
    topic: "Staging and Blocking",
    subtopics: [
      "Understanding the concept of staging and blocking",
      "Types of staging and blocking",
      "Usage of props and space",
      "I, A, L, C, S patterns",
      "Blocking for VFX"
    ]
  },
  workingWithActors: {
    topic: "Working with Actors",
    subtopics: [
      "Staging a scene with actors",
      "Exercise on Improvisation",
      "Styles of acting",
      "Difference between stage and film acting",
      "Working with Virtual/Digital Actors : Possibilities & Limitations"
    ]
  },
  sceneAnalysis: {
    topic: "Scene Analysis",
    subtopics: [
      "Dialogue – Acting - Composition-Staging and Blocking along with use of Visualization tools like",
      "Traditional/Digital Storyboards & AI tools for mood boards"
    ]
  },
  dialogueWritingAndStoryStructures: {
    topic: "Dialogue Writing & Story Structures",
    subtopics: [
      "Dialogue, monologue and conversation",
      "Types of dialogue",
      "Writing effective dialogue",
      "Dialogue through observation",
      "Dialogue in a situation",
      "Story Structures II (Hero's Journey, Dan Harmon Story Circle)",
      "Creating effective story conflicts"
    ]
  },
  rhythmAndPace: {
    topic: "Rhythm and Pace",
    subtopics: [
      "Usage of Edit, Sound and BGM from Director's Point of View",
      "Tonalities of Dialogue",
      "Space and Action Dynamics"
    ]
  }
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  semester?: number;
  created_at: string;
  updated_at: string;
}

interface Class {
  id: string;
  name: string;
  semester: number;
  created_at: string;
  updated_at: string;
}

interface TeacherClass extends Class {
  student_count?: number;
}

interface GeneratedNote {
  title: string;
  topic: string;
  subtopic: string;
  content: string;
  aiGeneratedContent: string;
}

type WorkflowState = 'form' | 'generating' | 'editing' | 'saved'

// Class Card Component
const ClassCard = ({ classItem, isSelected, onSelect, studentCount }) => (
  <Card
    className={cn(
      "cursor-pointer transition-all duration-300 hover:shadow-xl group relative overflow-hidden border-2",
      isSelected
        ? "ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-xl transform scale-[1.02] border-purple-300"
        : "hover:ring-2 hover:ring-purple-200 bg-white border-gray-200 hover:border-purple-200"
    )}
    onClick={() => onSelect(classItem)}
  >
    {isSelected && (
      <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2 shadow-lg">
        <CheckCircle className="h-4 w-4 text-white" />
      </div>
    )}

    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={cn(
            "text-lg font-bold mb-3 transition-colors",
            isSelected ? "text-purple-700" : "text-gray-900 group-hover:text-purple-600"
          )}>
            {classItem.name}
          </h3>
          <div className="flex items-center gap-3 mb-3">
            <Badge
              variant={isSelected ? "default" : "secondary"}
              className={cn(
                "font-semibold px-3 py-1",
                isSelected && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              )}
            >
              <GraduationCap className="h-3 w-3 mr-1" />
              Semester {classItem.semester}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span className="font-medium">{studentCount || 0} Students</span>
          </div>
        </div>
      </div>

      <div className="text-xs text-gray-500 border-t pt-3">
        Created {new Date(classItem.created_at).toLocaleDateString()}
      </div>

      {isSelected && (
        <div className="mt-4 flex items-center gap-2 text-sm text-purple-600 font-semibold bg-white/70 rounded-lg p-2">
          <CheckCircle className="h-4 w-4" />
          Selected for note creation
        </div>
      )}
    </CardContent>
  </Card>
);

// Note Content Editor Component
const NoteEditor = ({ content, onChange, readOnly = false }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-semibold">Note Content</Label>
        {!readOnly && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Edit3 className="h-4 w-4" />
            <span>Click to edit content</span>
          </div>
        )}
      </div>
      <Textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className="min-h-[400px] resize-none text-sm leading-relaxed"
        placeholder="AI-generated content will appear here..."
      />
    </div>
  )
}

// Audio Player Component
const AudioPlayer = ({ text, disabled = false }) => {
  const {
    Text,
    speechStatus,
    isInQueue,
    start,
    pause,
    stop,
  } = useSpeech({ text })

  if (disabled || !text) {
    return (
      <Button variant="outline" disabled>
        <Volume2 className="h-4 w-4 mr-2" />
        Audio
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {speechStatus !== "started" ? (
        <Button variant="outline" onClick={start}>
          <Volume2 className="h-4 w-4 mr-2" />
          Play Audio
        </Button>
      ) : (
        <Button variant="outline" onClick={pause}>
          <Volume2 className="h-4 w-4 mr-2" />
          Pause
        </Button>
      )}
      {isInQueue && (
        <Button variant="outline" onClick={stop} size="sm">
          Stop
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

export default function CreateNotes() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [workflowState, setWorkflowState] = useState<WorkflowState>('form')

  // Form state
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null)
  const [noteTitle, setNoteTitle] = useState<string>("")
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("")
  const [availableTopics, setAvailableTopics] = useState<any>({})
  const [availableSubtopics, setAvailableSubtopics] = useState<string[]>([])

  // Note workflow state
  const [currentNote, setCurrentNote] = useState<GeneratedNote | null>(null)
  const [finalNoteId, setFinalNoteId] = useState<string | null>(null)

  useEffect(() => {
    fetchTeacherClasses()
  }, [])

  // Update available topics when class is selected
  useEffect(() => {
    if (selectedClass) {
      const syllabus = selectedClass.semester === 1 ? semester1Syllabus : semester2Syllabus
      setAvailableTopics(syllabus)
      setSelectedTopic("")
      setSelectedSubtopic("")
      setAvailableSubtopics([])
    }
  }, [selectedClass])

  // Update available subtopics when topic is selected
  useEffect(() => {
    if (selectedTopic && availableTopics[selectedTopic]) {
      setAvailableSubtopics(availableTopics[selectedTopic].subtopics)
      setSelectedSubtopic("")
    }
  }, [selectedTopic, availableTopics])

  const fetchTeacherClasses = async () => {
    try {
      const { data: classesData, error } = await supabase
        .from('class_teachers')
        .select(`
          class_id,
          classes:class_id (
            id,
            name,
            semester,
            created_at,
            updated_at
          )
        `)
        .eq('teacher_id', (profile as Profile)?.id)

      if (error) throw error

      const classesWithCount = await Promise.all(
        classesData.map(async (item) => {
          const { count } = await supabase
            .from('class_students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', item.class_id)

          return {
            ...item.classes,
            student_count: count
          }
        })
      )

      setClasses(classesWithCount)
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast({
        title: "Error",
        description: "Failed to load classes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const callNotesAgent = async (subtopic: string) => {
    const response = await fetch(
      "https://vijiteshnaik.app.n8n.cloud/webhook/6be3ecf4-01c6-4263-935b-7397bd968349",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtopic: subtopic.toLowerCase() }),
      }
    );

    if (!response.ok) {
      throw new Error("Note generation failed: " + (await response.text()));
    }

    const result = await response.json();

    try {
      // Handle different response formats
      let content = ""
      if (result.output) {
        content = result.output
      } else if (result.content) {
        content = result.content
      } else if (result.notes) {
        content = result.notes
      } else {
        content = JSON.stringify(result)
      }

      return content
    } catch (parseError) {
      console.error("Failed to parse API response:", result)
      throw new Error("Invalid response format from notes generation API")
    }
  };

  const generateNotes = async () => {
    try {
      setWorkflowState('generating')

      const generatedContent = await callNotesAgent(selectedSubtopic)

      const newNote = {
        title: noteTitle,
        topic: availableTopics[selectedTopic]?.topic || selectedTopic,
        subtopic: selectedSubtopic,
        content: generatedContent,
        aiGeneratedContent: generatedContent
      }

      setCurrentNote(newNote)
      setWorkflowState('editing')

      toast({
        title: "Notes Generated Successfully!",
        description: "Review and edit the content before saving",
      })

      return true
    } catch (error) {
      console.error("Notes Generation Error:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
      setWorkflowState('form')
      return false
    }
  }

  const handleInitialGeneration = async () => {
    if (!selectedClass || !noteTitle.trim() || !selectedSubtopic) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    await generateNotes()
  }

  const handleContentChange = (newContent: string) => {
    if (currentNote) {
      setCurrentNote({
        ...currentNote,
        content: newContent
      })
    }
  }

  const saveNotesToDatabase = async (): Promise<string | null> => {
    try {
      console.log("Saving notes to database...")

      const noteData = {
        title: currentNote!.title,
        topic: currentNote!.topic,
        subtopic: currentNote!.subtopic,
        content: currentNote!.content,
        ai_generated_content: currentNote!.aiGeneratedContent,
        teacher_id: (profile as Profile)?.id,
        class_id: selectedClass?.id,
        semester: selectedClass?.semester,
        is_shared: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([noteData])
        .select()
        .single()

      if (error) {
        console.error("Database save error:", error)
        throw error
      }

      console.log("Notes saved successfully:", data)
      return data.id
    } catch (error) {
      console.error("Error saving notes:", error)
      throw error
    }
  }

  const handleSaveNotes = async () => {
    try {
      const noteId = await saveNotesToDatabase()

      if (noteId) {
        setFinalNoteId(noteId)
        setWorkflowState('saved')
        toast({
          title: "Notes Saved Successfully!",
          description: "Your notes have been saved and are ready to use",
        })
      }
    } catch (error) {
      console.error("Save Notes Error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save notes",
        variant: "destructive"
      })
    }
  }

  const resetWorkflow = () => {
    setWorkflowState('form')
    setCurrentNote(null)
    setFinalNoteId(null)
    setSelectedClass(null)
    setNoteTitle("")
    setSelectedTopic("")
    setSelectedSubtopic("")
  }

  const isFormValid = selectedClass && noteTitle.trim() && selectedSubtopic
  const progressSteps = [
    { completed: !!selectedClass, label: "Class" },
    { completed: !!noteTitle.trim(), label: "Title" },
    { completed: !!selectedTopic, label: "Topic" },
    { completed: !!selectedSubtopic, label: "Subtopic" },
  ]

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">Loading classes...</p>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Enhanced Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Smart Notes Creator
              </h1>
            </div>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              {workflowState === 'form' && "Create comprehensive study notes with AI-powered content generation"}
              {workflowState === 'generating' && "Our AI is generating detailed notes based on your curriculum..."}
              {workflowState === 'editing' && "Review and customize your AI-generated notes before saving"}
              {workflowState === 'saved' && "Notes created successfully and ready to share with students!"}
            </p>
          </div>

          {/* Enhanced Workflow Progress Indicator */}
          <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Notes Creation Progress
                </h3>
                <Badge
                  variant={workflowState === 'saved' ? 'default' : 'secondary'}
                  className={cn(
                    "px-4 py-2 font-semibold",
                    workflowState === 'saved'
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                      : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                  )}
                >
                  {workflowState === 'form' && '📝 Configuration'}
                  {workflowState === 'generating' && '🤖 AI Generation'}
                  {workflowState === 'editing' && '✏️ Review & Edit'}
                  {workflowState === 'saved' && '✅ Saved'}
                </Badge>
              </div>

              {workflowState === 'form' && (
                <div className="flex flex-wrap items-center gap-4">
                  {progressSteps.map((step, index) => (
                    <div key={step.label} className="flex items-center">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                        step.completed
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                          : "bg-gray-200 text-gray-500"
                      )}>
                        {step.completed ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className={cn(
                        "ml-3 text-sm font-semibold",
                        step.completed ? "text-purple-700" : "text-gray-500"
                      )}>
                        {step.label}
                      </span>
                      {index < progressSteps.length - 1 && (
                        <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {workflowState !== 'form' && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {workflowState === 'generating' ? (
                      <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                    ) : workflowState === 'editing' ? (
                      <Edit3 className="h-6 w-6 text-blue-600" />
                    ) : workflowState === 'saved' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : null}
                    <span className="text-sm font-semibold text-gray-700">
                      {workflowState === 'generating' && 'AI is generating comprehensive notes...'}
                      {workflowState === 'editing' && 'Notes ready for review and editing'}
                      {workflowState === 'saved' && 'Notes successfully created!'}
                    </span>
                  </div>
                  {currentNote && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {currentNote.topic}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Configuration */}
          {workflowState === 'form' && (
            <>
              {/* Step 1: Class Selection */}
              <Card className="shadow-xl border-2 border-gray-200">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                      <GraduationCap className="h-7 w-7 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl font-bold">Step 1: Select Your Class</CardTitle>
                      <CardDescription className="text-lg">Choose the class for which you want to create notes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {classes.map((classItem) => (
                      <ClassCard
                        key={classItem.id}
                        classItem={classItem}
                        isSelected={selectedClass?.id === classItem.id}
                        onSelect={setSelectedClass}
                        studentCount={classItem.student_count}
                      />
                    ))}
                  </div>
                  {classes.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-semibold mb-2">No Classes Assigned</h3>
                      <p>Please contact your administrator to assign classes to your account.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Steps 2-4: Note Configuration */}
              {selectedClass && (
                <Card className="shadow-xl border-2 border-gray-200">
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                          <Target className="h-7 w-7 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold">Note Configuration</CardTitle>
                          <CardDescription className="text-lg">
                            Set up your note details for <span className="font-semibold text-blue-600">{selectedClass.name}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1">
                          <GraduationCap className="h-4 w-4 mr-1" />
                          Semester {selectedClass.semester}
                        </Badge>
                        <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                          <Users className="h-4 w-4 mr-1" />
                          {selectedClass.student_count || 0} Students
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid gap-8 lg:grid-cols-2">
                      {/* Step 2: Note Title */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <Label className="text-lg font-bold text-gray-800">Step 2: Note Title</Label>
                        </div>
                        <Input
                          value={noteTitle}
                          onChange={(e) => setNoteTitle(e.target.value)}
                          placeholder="Enter a descriptive title for your notes..."
                          className="h-14 text-lg border-2 border-gray-200 hover:border-green-300 transition-colors"
                        />
                      </div>

                      {/* Step 3: Topic Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                          <Label className="text-lg font-bold text-gray-800">Step 3: Select Topic</Label>
                        </div>
                        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                          <SelectTrigger className="h-14 text-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                            <SelectValue placeholder="Choose a topic from the curriculum..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(availableTopics).map(([key, value]) => (
                              <SelectItem key={key} value={key} className="py-4">
                                <div>
                                  <div className="font-semibold text-base">{value.topic}</div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    {value.subtopics.length} subtopics available
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Step 4: Subtopic Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-100 rounded-lg">
                            <Award className="h-5 w-5 text-orange-600" />
                          </div>
                          <Label className="text-lg font-bold text-gray-800">Step 4: Select Subtopic</Label>
                        </div>
                        <Select
                          value={selectedSubtopic}
                          onValueChange={setSelectedSubtopic}
                          disabled={!selectedTopic}
                        >
                          <SelectTrigger className="h-14 text-lg border-2 border-gray-200 hover:border-orange-300 transition-colors">
                            <SelectValue placeholder={selectedTopic ? "Choose a subtopic..." : "Select topic first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubtopics.map((subtopic, index) => (
                              <SelectItem key={index} value={subtopic} className="py-4">
                                <div className="max-w-md">
                                  <div className="font-semibold text-sm leading-relaxed">{subtopic}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Generate Button */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Sparkles className="h-5 w-5 text-purple-600" />
                          </div>
                          <Label className="text-lg font-bold text-gray-800">AI Notes Generation</Label>
                        </div>
                        <Button
                          onClick={handleInitialGeneration}
                          disabled={!isFormValid}
                          className="h-14 w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Brain className="h-6 w-6 mr-3" />
                          Generate Smart Notes
                        </Button>
                        <p className="text-sm text-gray-500 text-center">
                          AI will create comprehensive notes based on your curriculum
                        </p>
                      </div>
                    </div>

                    {/* Notes Summary Preview */}
                    {isFormValid && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mt-8">
                        <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
                          <CheckCircle className="h-6 w-6" />
                          Notes Preview
                        </h4>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <span className="font-semibold text-gray-700 block mb-1">Class & Students</span>
                            <span className="text-gray-900 font-medium">{selectedClass.name}</span>
                            <div className="text-gray-600 text-xs mt-1">{selectedClass.student_count || 0} students in class</div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <span className="font-semibold text-gray-700 block mb-1">Note Title</span>
                            <span className="text-gray-900 font-medium">{noteTitle}</span>
                            <div className="text-gray-600 text-xs mt-1">{availableTopics[selectedTopic]?.topic}</div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-green-200">
                            <span className="font-semibold text-gray-700 block mb-1">Focus Area</span>
                            <span className="text-gray-900 font-medium truncate">{selectedSubtopic}</span>
                            <div className="text-gray-600 text-xs mt-1">Semester {selectedClass.semester} curriculum</div>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs text-green-700 bg-white/70 rounded-lg p-3">
                          <div className="flex items-center gap-1">
                            <Brain className="h-4 w-4" />
                            <span>AI will generate comprehensive content</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Edit3 className="h-4 w-4" />
                            <span>Fully editable after generation</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            <span>Export to PDF/DOCX available</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Generation State */}
          {workflowState === 'generating' && (
            <Card className="shadow-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
              <CardContent className="pt-8">
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-8">
                    <Loader2 className="h-20 w-20 animate-spin text-purple-600" />
                    <Brain className="h-8 w-8 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold text-purple-800 mb-3">Generating Your Notes</h3>
                  <p className="text-purple-600 text-center max-w-lg text-lg mb-6">
                    Our AI is analyzing <strong>{selectedSubtopic}</strong> and creating comprehensive study notes
                    for your Semester {selectedClass?.semester} students.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 text-center">
                      <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-gray-800">Content Analysis</div>
                      <div className="text-xs text-gray-600">Processing curriculum</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 text-center">
                      <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-gray-800">Note Generation</div>
                      <div className="text-xs text-gray-600">Creating comprehensive content</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 text-center">
                      <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
                      <div className="text-sm font-semibold text-gray-800">Quality Review</div>
                      <div className="text-xs text-gray-600">Ensuring accuracy</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Editing State */}
          {workflowState === 'editing' && currentNote && (
            <div className="space-y-6">
              {/* Notes Overview */}
              <Card className="shadow-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                        <Eye className="h-7 w-7 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-blue-800">Review Your Notes</CardTitle>
                        <CardDescription className="text-lg text-blue-600">
                          Edit the content and export or save when ready
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notes Details */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-200 text-center">
                      <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-blue-800">{currentNote.title}</div>
                      <div className="text-sm text-blue-600 font-medium">Note Title</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-green-200 text-center">
                      <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-green-800">{currentNote.topic}</div>
                      <div className="text-sm text-green-600 font-medium">Topic</div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200 text-center">
                      <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-lg font-bold text-purple-800">{selectedClass?.name}</div>
                      <div className="text-sm text-purple-600 font-medium">Class</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <AudioPlayer text={currentNote.content} />

                    <Button
                      onClick={() => exportToPDF(currentNote.title, currentNote.content)}
                      variant="outline"
                      className="flex-1 h-12 border-2 border-red-300 text-red-700 hover:bg-red-50 font-semibold"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Export PDF
                    </Button>

                    <Button
                      onClick={() => exportToDocx(currentNote.title, currentNote.content)}
                      variant="outline"
                      className="flex-1 h-12 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Export DOCX
                    </Button>

                    <Button
                      onClick={handleSaveNotes}
                      className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      Save Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card className="shadow-lg border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Edit3 className="h-6 w-6 text-gray-700" />
                    Edit Note Content
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <NoteEditor
                    content={currentNote.content}
                    onChange={handleContentChange}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Success State */}
          {workflowState === 'saved' && currentNote && (
            <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold text-green-800">Notes Created Successfully!</CardTitle>
                    <CardDescription className="text-lg text-green-600">
                      Your notes have been saved and are ready to use in lectures
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-white rounded-xl p-6 border-2 border-green-200 text-center">
                    <FileText className="h-10 w-10 text-green-600 mx-auto mb-3" />
                    <div className="text-lg font-bold text-gray-900">{currentNote.title}</div>
                    <div className="text-sm text-gray-600 mt-1">Note Title</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border-2 border-blue-200 text-center">
                    <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                    <div className="text-lg font-bold text-gray-900">{selectedClass?.name}</div>
                    <div className="text-sm text-gray-600 mt-1">Class</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border-2 border-purple-200 text-center">
                    <BookOpen className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                    <div className="text-lg font-bold text-gray-900">{currentNote.topic}</div>
                    <div className="text-sm text-gray-600 mt-1">Topic</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                  <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
                    <Award className="h-6 w-6" />
                    What's Next?
                  </h4>
                  <div className="grid gap-4 md:grid-cols-2 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Eye className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Use in Lectures</div>
                        <div className="text-gray-600">Access your notes anytime for teaching</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Share with Students</div>
                        <div className="text-gray-600">Share from your notes management page</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Download className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Export Anytime</div>
                        <div className="text-gray-600">Download as PDF or DOCX when needed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Edit3 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Edit & Update</div>
                        <div className="text-gray-600">Modify content anytime from notes page</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <Button
                    onClick={resetWorkflow}
                    variant="outline"
                    className="border-2 border-green-300 text-green-700 hover:bg-green-50 font-semibold mr-4"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Another Note
                  </Button>
                  <Button
                    onClick={() => window.location.href = '/teacher/notes'}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    View All Notes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Instructions Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                  <Brain className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-blue-900 mb-4 text-xl">Smart Notes Creation Workflow</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-blue-800">
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                        <span><strong>Configure:</strong> Select class, title, and topic</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-blue-800">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                        <span><strong>Generate:</strong> AI creates comprehensive content</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-blue-800">
                        <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                        <span><strong>Edit:</strong> Customize content to your needs</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm text-blue-800">
                        <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                        <span><strong>Export:</strong> Download as PDF or DOCX</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-blue-800">
                        <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"></div>
                        <span><strong>Listen:</strong> Use text-to-speech feature</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-blue-800">
                        <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"></div>
                        <span><strong>Save & Share:</strong> Store and share with students</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center gap-4 p-4 bg-white/70 rounded-lg border border-blue-200">
                    <Brain className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI-powered comprehensive content generation</span>
                    <Download className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Multiple export formats supported</span>
                    <Volume2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Text-to-speech functionality</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}