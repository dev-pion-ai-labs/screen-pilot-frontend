"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/integrations/supabase/client"
import {
  Users,
  Plus,
  Sparkles,
  Calendar as CalendarIcon,
  Target,
  GraduationCap,
  Loader2,
  CheckCircle,
  BookOpen,
  Clock,
  ArrowRight,
  FileText,
  Save,
  UserPlus,
  Edit3,
  RotateCcw,
  Eye,
  MessageSquare,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { format } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import AssignmentDisplay from "@/components/AssignmentDisplay"

// Semester syllabus data
const semester1Syllabus = { 
  introductionToDirection: { 
    topic: "Introduction to Direction", 
    subtopics: [ 
      "Film Analysis", 
      "Different Approaches to Shooting and Types of Films", 
      "Case Studies of Filmmakers and Their Approach", 
      "Case Studies of Filmmakers in Historical Perspective", 
      "Writing an Actuality Report", 
      "Film Diary (Analysis of Films, Directors, Scripts, Thoughts, Ideas/Stories, Scenes, Photographs)", 
    ], 
  }, 
  visualStorytellingAndCollaboration: { 
    topic: "Visual Storytelling and Collaboration", 
    subtopics: [ 
      "Introduction to Visual Storytelling (Composition, Cutting, Closeup, Continuity, Camera Angles)", 
      "Recreating a Painting", 
      "Collaboration with Camera, Editing, and Sound", 
      "Turning Actualities into Stories (Writing Based on Observations)", 
      "Trip to a Closed Public Space (e.g., Library, Museum)", 
      "Trip to an Open Public Space (e.g., Park, Marketplace, Bus Stop)", 
    ], 
  }, 
  principlesOfContinuity: { 
    topic: "Principles of Continuity", 
    subtopics: [ 
      "Decoupage (Script Breakdown) and Continuity Planning", 
      "Aspects of Continuity in Films", 
      "Understanding Time and Space in Films", 
      "Scene Analysis of Classical Hollywood Films and Contemporary Films", 
    ], 
  }, 
  conceptIdeationAndResearch: { 
    topic: "Concept, Ideation & Research", 
    subtopics: [ 
      "Types of Stories", 
      "Developing a Concept for a Film", 
      "Usage of VFX Elements in Storytelling", 
      "Oral Narrative Skills (Storytelling Practice)", 
      "Creative Writing: Personal Memoir, Descriptive Writing", 
      "Reading and Analysis of Short Stories", 
    ], 
  }, 
  theoriesAndFormatsOfScriptwriting: { 
    topic: "Theories and Formats of Scriptwriting", 
    subtopics: [ 
      "History of Storytelling", 
      "Overview of Screenplay Writing Process", 
      "Elements of a Screenplay (Premise, Plot, Treatment, Characters, Conflict)", 
      "Screenwriting Software Introduction", 
      "Introduction to Story Structures (Three-Act Structure, Five-Act Structure)", 
      "Creating Simple Screenplays using the Three-Act Structure", 
    ], 
  } 
}

const semester2Syllabus = {
  stagingAndBlocking: {
    topic: "Staging and Blocking",
    subtopics: [
      "Understanding the Concept of Staging and Blocking",
      "Types of Staging and Blocking",
      "Usage of Props and Space",
      "I, A, L, C, S Patterns",
      "Blocking for VFX",
    ],
  },
  workingWithActors: {
    topic: "Working with Actors",
    subtopics: [
      "Staging a Scene with Actors",
      "Exercise on Improvisation",
      "Styles of Acting",
      "Difference between Stage and Film Acting",
      "Working with Virtual/Digital Actors: Possibilities & Limitations",
    ],
  },
  sceneAnalysis: {
    topic: "Scene Analysis",
    subtopics: [
      "Dialogue – Acting – Composition – Staging and Blocking",
      "Use of Visualization Tools like Traditional/Digital Storyboards",
      "Using AI Tools for Mood Boards",
    ],
  },
  dialogueWritingAndStoryStructures: {
    topic: "Dialogue Writing & Story Structures",
    subtopics: [
      "Dialogue, Monologue and Conversation",
      "Types of Dialogue",
      "Writing Effective Dialogue",
      "Dialogue Through Observation",
      "Dialogue in a Situation",
      "Story Structures II (Hero's Journey, Dan Harmon Story Circle)",
      "Creating Effective Story Conflicts",
    ],
  },
  rhythmAndPace: {
    topic: "Rhythm and Pace",
    subtopics: [
      "Usage of Edit, Sound, and BGM from the Director's Point of View",
      "Tonalities of Dialogue",
      "Space and Action Dynamics",
    ],
  },
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

interface GeneratedAssignment {
  title: string;
  topic: string;
  content: string;
  revisionHistory: Array<{
    version: number;
    content: string;
    revisionRequest?: string;
    timestamp: Date;
  }>;
}

// Assignment workflow states
type WorkflowState = 
  | 'form' 
  | 'generating' 
  | 'reviewing' 
  | 'requesting-changes' 
  | 'regenerating' 
  | 'saving' 
  | 'enrolling' 
  | 'complete'

const ClassCard = ({ classItem, isSelected, onSelect, studentCount }) => (
  <Card 
    className={cn(
      "cursor-pointer transition-all duration-200 hover:shadow-md group relative overflow-hidden",
      isSelected 
        ? "ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 shadow-lg transform scale-[1.02]" 
        : "hover:ring-1 hover:ring-purple-300 bg-white"
    )}
    onClick={() => onSelect(classItem)}
  >
    {isSelected && (
      <div className="absolute top-3 right-3 bg-purple-500 rounded-full p-1.5">
        <CheckCircle className="h-4 w-4 text-white" />
      </div>
    )}
    
    <CardContent className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className={cn(
            "text-lg font-semibold mb-2 transition-colors",
            isSelected ? "text-purple-700" : "text-gray-900 group-hover:text-purple-600"
          )}>
            {classItem.name}
          </h3>
          <div className="flex items-center gap-3">
            <Badge 
              variant={isSelected ? "default" : "secondary"}
              className={cn(
                "font-medium",
                isSelected && "bg-purple-600 hover:bg-purple-700"
              )}
            >
              <GraduationCap className="h-3 w-3 mr-1" />
              Semester {classItem.semester}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{studentCount || 0} Students</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500">
        Created {new Date(classItem.created_at).toLocaleDateString()}
      </div>
      
      {isSelected && (
        <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 font-medium">
          <CheckCircle className="h-4 w-4" />
          Selected for assignment creation
        </div>
      )}
    </CardContent>
  </Card>
);

const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.indexOf("safari") !== -1 && ua.indexOf("chrome") === -1
}

const safeFetch = (url: string, options: RequestInit): Promise<Response> => {
  const safariOptions = {
    ...options,
    mode: "cors" as RequestMode,
    credentials: "omit" as RequestCredentials,
    headers: {
      ...options.headers,
      "User-Agent": navigator.userAgent,
    },
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), 30000)
  })

  return Promise.race([fetch(url, safariOptions), timeoutPromise])
}

const smartDelay = (ms: number): Promise<void> => {
  const delayTime = isSafari() ? ms * 1.5 : ms
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "undefined") {
      let start: number
      const step = (timestamp: number) => {
        if (!start) start = timestamp
        if (timestamp - start >= delayTime) {
          resolve()
        } else {
          requestAnimationFrame(step)
        }
      }
      requestAnimationFrame(step)
    } else {
      setTimeout(resolve, delayTime)
    }
  })
}

export default function CreateAssignment() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [workflowState, setWorkflowState] = useState<WorkflowState>('form')

  // Form state
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string>("")
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("")
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [availableTopics, setAvailableTopics] = useState<any>({})
  const [availableSubtopics, setAvailableSubtopics] = useState<string[]>([])
  
  // Assignment workflow state
  const [currentAssignment, setCurrentAssignment] = useState<GeneratedAssignment | null>(null)
  const [revisionRequest, setRevisionRequest] = useState<string>("")
  const [finalAssignmentId, setFinalAssignmentId] = useState<string | null>(null)

  // Calendar state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

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


  const callAssignmentAgent = async ({
  subtopic,
  isRevision = false,
  content,
  changes,
}) => {
  let url, payload;
  if (isRevision) {
    url = "https://vijiteshnaik.app.n8n.cloud/webhook/e72a35be-6d20-4ee5-a5ab-06dc94a98f0d";
    payload = {
      content,
      subtopic,
      changes,
    };
    console.log("Calling n8n for revision with payload:", payload);
    
  } else {
    url = "https://vijiteshnaik.app.n8n.cloud/webhook/6a7c5ac0-bd6d-4fd6-9aea-af711dd902f9";
    payload = {
      subtopic,
    };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Assignment agent error: " + (await response.text()));
  }

  const result = await response.json();
  return result; // Adapt this if your n8n agent's structure is different!
};




//   const generateAssignment = async (isRevision = false) => {
//     const config = selectedClass!.semester === 1 ? semester1Config : semester2Config
    
//     let message: string
//     if (isRevision && currentAssignment && revisionRequest) {
//       // For revisions, include the current assignment and the revision request
//       message = `Based on this existing assignment:

// ${currentAssignment.content}

// Please make the following changes: ${revisionRequest}

// Subtopic: ${selectedSubtopic}`
//     } else {
//       // For initial generation
//       message = `Create an assignment for the subtopic: ${selectedSubtopic}`
//     }

//     console.log("📝 Sending message to agent:", message)

//     const agentResponse = await callRelevanceAgent(message, config)

//     if (agentResponse.job_info) {
//       console.log("⏳ Job created, starting polling...")
//       const result = await pollAgentResponse(agentResponse.job_info, config)

//       if (result.success) {
//         const assignmentContent = result.content?.output?.answer || result.content?.answer || "No assignment content generated"
//         console.log("📋 Assignment Content:", assignmentContent)

//         const newAssignment: GeneratedAssignment = {
//           title: selectedSubtopic,
//           topic: availableTopics[selectedTopic]?.topic || selectedTopic,
//           content: assignmentContent,
//           revisionHistory: currentAssignment ? [
//             ...currentAssignment.revisionHistory,
//             {
//               version: currentAssignment.revisionHistory.length + 1,
//               content: assignmentContent,
//               revisionRequest: isRevision ? revisionRequest : undefined,
//               timestamp: new Date()
//             }
//           ] : [
//             {
//               version: 1,
//               content: assignmentContent,
//               timestamp: new Date()
//             }
//           ]
//         }

//         setCurrentAssignment(newAssignment)
//         setRevisionRequest("")
//         setWorkflowState('reviewing')

//         toast({
//           title: isRevision ? "Assignment Revised Successfully!" : "Assignment Generated Successfully!",
//           description: "Please review the assignment and decide if you want to make any changes.",
//         })

//         return true
//       } else {
//         throw new Error(result.error || "Assignment generation failed")
//       }
//     } else {
//       throw new Error("No job info received from agent")
//     }
//   }


const generateAssignment = async (isRevision = false) => {
  try {
    let agentResponse;

    // Always use the revision agent if isRevision is true
    const subtopicToUse = isRevision
      ? (selectedSubtopic || currentAssignment?.title || "")
      : selectedSubtopic;

    if (isRevision && currentAssignment) {
      // Always use the revision agent regardless of revisionRequest value
      agentResponse = await callAssignmentAgent({
        isRevision: true,
        content: currentAssignment.content,
        subtopic: subtopicToUse,
        changes: revisionRequest, // may be empty, that's fine
      });
    } else {
      // Initial assignment generation
      agentResponse = await callAssignmentAgent({
        isRevision: false,
        subtopic: subtopicToUse,
        content: undefined,
        changes: undefined,
      });
    }

    const assignmentContent =
      agentResponse.output ||
      agentResponse.content ||
      agentResponse.answer ||
      "No assignment content generated";

      console.log("📋 Assignment Content..........:", assignmentContent);

    const newAssignment = {
      title: subtopicToUse,
      topic: availableTopics[selectedTopic]?.topic || selectedTopic,
      content: assignmentContent,
      revisionHistory: currentAssignment
        ? [
            ...currentAssignment.revisionHistory,
            {
              version: currentAssignment.revisionHistory.length + 1,
              content: assignmentContent,
              revisionRequest: isRevision ? revisionRequest : undefined,
              timestamp: new Date(),
            },
          ]
        : [
            {
              version: 1,
              content: assignmentContent,
              timestamp: new Date(),
            },
          ],
    };

    setCurrentAssignment(newAssignment);
    setRevisionRequest("");
    setWorkflowState("reviewing");

    toast({
      title: isRevision
        ? "Assignment Revised Successfully!"
        : "Assignment Generated Successfully!",
      description: "Please review the assignment and decide if you want to make any changes.",
    });

    return true;
  } catch (error) {
    console.error("❌ Assignment Generation Error:", error);
    toast({
      title: isRevision ? "Revision Failed" : "Generation Failed",
      description: error instanceof Error ? error.message : "Unknown error occurred",
      variant: "destructive",
    });
    setWorkflowState(isRevision ? "reviewing" : "form");
    return false;
  }
};





  const handleInitialGeneration = async () => {
    // Validation
    if (!selectedClass || !selectedSubtopic || !dueDate) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setWorkflowState('generating')

    try {
      await generateAssignment(false)
    } catch (error) {
      console.error("❌ Assignment Generation Error:", error)
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
      setWorkflowState('form')
    }
  }

  const handleRevisionRequest = async () => {
    if (!revisionRequest.trim()) {
      toast({
        title: "Revision Request Required",
        description: "Please describe what changes you'd like to make",
        variant: "destructive"
      })
      return
    }

    setWorkflowState('regenerating')

    try {
      await generateAssignment(true)
    } catch (error) {
      console.error("❌ Assignment Revision Error:", error)
      toast({
        title: "Revision Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      })
      setWorkflowState('reviewing')
    }
  }

  const saveAssignmentToDatabase = async (): Promise<string | null> => {
    try {
      console.log("💾 Saving assignment to database...")

      const assignmentData = {
        title: currentAssignment!.title,
        topic: currentAssignment!.topic,
        ai_generated_content: currentAssignment!.content,
        description: `Assignment for ${selectedSubtopic} in ${availableTopics[selectedTopic]?.topic || selectedTopic}`,
        teacher_id: (profile as Profile)?.id,
        class_id: selectedClass?.id,
        semester: selectedClass?.semester,
        due_date: dueDate?.toISOString(),
        status: 'published',
        difficulty: 'medium',
        total_points: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log("📝 Assignment data to save:", assignmentData)

      const { data, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()
        .single()

      if (error) {
        console.error("❌ Database save error:", error)
        throw error
      }

      console.log("✅ Assignment saved successfully:", data)
      return data.id
    } catch (error) {
      console.error("❌ Error saving assignment:", error)
      throw error
    }
  }

  const enrollStudentsInAssignment = async (assignmentId: string): Promise<boolean> => {
    try {
      console.log("👥 Enrolling students in assignment...")

      const { data: students, error: studentsError } = await supabase
        .from('class_students')
        .select('student_id')
        .eq('class_id', selectedClass?.id)

      if (studentsError) {
        console.error("❌ Error fetching students:", studentsError)
        throw studentsError
      }

      if (!students || students.length === 0) {
        console.log("⚠️ No students found in class")
        return false
      }

      console.log(`📋 Found ${students.length} students to enroll`)

      const enrollmentData = students.map(student => ({
        assignment_id: assignmentId,
        student_id: student.student_id,
        assigned_at: new Date().toISOString(),
        status: 'assigned'
      }))

      console.log("👥 Enrollment data:", enrollmentData)

      const { data: enrollments, error: enrollmentError } = await supabase
        .from('assignment_enrollments')
        .insert(enrollmentData)
        .select()

      if (enrollmentError) {
        console.error("❌ Error enrolling students:", enrollmentError)
        throw enrollmentError
      }

      console.log("✅ Students enrolled successfully:", enrollments)
      return true
    } catch (error) {
      console.error("❌ Error enrolling students:", error)
      throw error
    }
  }

  const handleSaveAssignment = async () => {
    setWorkflowState('saving')

    try {
      const assignmentId = await saveAssignmentToDatabase()
      
      if (assignmentId) {
        setFinalAssignmentId(assignmentId)
        setWorkflowState('enrolling')
        
        const enrollmentSuccess = await enrollStudentsInAssignment(assignmentId)
        
        if (enrollmentSuccess) {
          setWorkflowState('complete')
          toast({
            title: "Assignment Created Successfully!",
            description: `Assignment saved and assigned to ${selectedClass?.student_count || 0} students`,
          })
        } else {
          toast({
            title: "Assignment Saved",
            description: "Assignment saved but no students were enrolled (no students in class)",
          })
          setWorkflowState('complete')
        }
      }
    } catch (error) {
      console.error("❌ Save Assignment Error:", error)
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save assignment",
        variant: "destructive"
      })
      setWorkflowState('reviewing')
    }
  }

  const resetWorkflow = () => {
    setWorkflowState('form')
    setCurrentAssignment(null)
    setRevisionRequest("")
    setFinalAssignmentId(null)
    setSelectedClass(null)
    setSelectedTopic("")
    setSelectedSubtopic("")
    setDueDate(undefined)
  }

  const isFormValid = selectedClass && selectedSubtopic && dueDate
  const progressSteps = [
    { completed: !!selectedClass, label: "Class" },
    { completed: !!selectedTopic, label: "Topic" },
    { completed: !!selectedSubtopic, label: "Subtopic" },
    { completed: !!dueDate, label: "Due Date" },
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
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Create New Assignment
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {workflowState === 'form' && "Follow the steps below to create a personalized assignment using our AI-powered system"}
              {workflowState === 'generating' && "Please wait while we generate your assignment..."}
              {workflowState === 'reviewing' && "Review your generated assignment and request changes if needed"}
              {workflowState === 'requesting-changes' && "Describe the changes you'd like to make to the assignment"}
              {workflowState === 'regenerating' && "Regenerating assignment with your requested changes..."}
              {workflowState === 'saving' && "Saving assignment to database..."}
              {workflowState === 'enrolling' && "Enrolling students in the assignment..."}
              {workflowState === 'complete' && "Assignment created successfully and assigned to students!"}
            </p>
          </div>

          {/* Workflow Progress Indicator */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Workflow Progress</h3>
                <Badge variant={workflowState === 'complete' ? 'default' : 'secondary'} className="bg-purple-600 text-white">
                  {workflowState === 'form' && 'Form Configuration'}
                  {workflowState === 'generating' && 'Generating Assignment'}
                  {workflowState === 'reviewing' && 'Review & Approval'}
                  {workflowState === 'requesting-changes' && 'Requesting Changes'}
                  {workflowState === 'regenerating' && 'Regenerating Assignment'}
                  {workflowState === 'saving' && 'Saving Assignment'}
                  {workflowState === 'enrolling' && 'Enrolling Students'}
                  {workflowState === 'complete' && 'Complete'}
                </Badge>
              </div>
              
              {workflowState === 'form' && (
                <div className="flex items-center space-x-4">
                  {progressSteps.map((step, index) => (
                    <div key={step.label} className="flex items-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                        step.completed 
                          ? "bg-purple-600 text-white" 
                          : "bg-gray-200 text-gray-500"
                      )}>
                        {step.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className={cn(
                        "ml-2 text-sm font-medium",
                        step.completed ? "text-purple-600" : "text-gray-500"
                      )}>
                        {step.label}
                      </span>
                      {index < progressSteps.length - 1 && (
                        <ArrowRight className="h-4 w-4 text-gray-400 mx-4" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {workflowState !== 'form' && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {workflowState === 'generating' || workflowState === 'regenerating' ? (
                      <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                    ) : workflowState === 'reviewing' || workflowState === 'requesting-changes' ? (
                      <Eye className="h-5 w-5 text-blue-600" />
                    ) : workflowState === 'saving' || workflowState === 'enrolling' ? (
                      <Save className="h-5 w-5 text-green-600" />
                    ) : workflowState === 'complete' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : null}
                    <span className="text-sm font-medium text-gray-700">
                      {workflowState === 'generating' && 'AI is generating your assignment...'}
                      {workflowState === 'reviewing' && 'Assignment ready for review'}
                      {workflowState === 'requesting-changes' && 'Waiting for your feedback'}
                      {workflowState === 'regenerating' && 'AI is revising the assignment...'}
                      {workflowState === 'saving' && 'Saving to database...'}
                      {workflowState === 'enrolling' && 'Enrolling students...'}
                      {workflowState === 'complete' && 'Assignment successfully created!'}
                    </span>
                  </div>
                  {currentAssignment && (
                    <Badge variant="outline" className="ml-auto">
                      Version {currentAssignment.revisionHistory.length}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Configuration (Step 1-4) */}
          {workflowState === 'form' && (
            <>
              {/* Step 1: Class Selection */}
              <Card className="shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <GraduationCap className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Step 1: Select Class</CardTitle>
                      <CardDescription>Choose the class for which you want to create an assignment</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No classes found. Please contact admin to assign classes.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Steps 2-4: Assignment Configuration */}
              {selectedClass && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Target className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">Assignment Configuration</CardTitle>
                        <CardDescription>
                          Configure assignment details for {selectedClass.name} (Semester {selectedClass.semester})
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="ml-auto">
                        Semester {selectedClass.semester}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="grid gap-8 lg:grid-cols-2">
                      {/* Step 2: Topic Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5 text-blue-600" />
                          <Label className="text-base font-semibold">Step 2: Select Topic</Label>
                        </div>
                        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder="Choose a topic..." />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(availableTopics).map(([key, value]) => (
                              <SelectItem key={key} value={key} className="py-3">
                                <div>
                                  <div className="font-medium">{value.topic}</div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {value.subtopics.length} subtopics available
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Step 3: Subtopic Selection */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-green-600" />
                          <Label className="text-base font-semibold">Step 3: Select Subtopic</Label>
                        </div>
                        <Select 
                          value={selectedSubtopic} 
                          onValueChange={setSelectedSubtopic}
                          disabled={!selectedTopic}
                        >
                          <SelectTrigger className="h-12">
                            <SelectValue placeholder={selectedTopic ? "Choose a subtopic..." : "Select topic first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSubtopics.map((subtopic, index) => (
                              <SelectItem key={index} value={subtopic} className="py-3">
                                <div className="max-w-sm">
                                  <div className="font-medium text-sm leading-relaxed">{subtopic}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Step 4: Due Date */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-orange-600" />
                          <Label className="text-base font-semibold">Step 4: Set Due Date</Label>
                        </div>
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "h-12 w-full justify-start text-left font-normal",
                                !dueDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dueDate ? format(dueDate, "PPP") : "Pick a due date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={dueDate}
                              onSelect={(date) => {
                                setDueDate(date)
                                setIsCalendarOpen(false)
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Generate Button */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-purple-600" />
                          <Label className="text-base font-semibold">Generate Assignment</Label>
                        </div>
                        <Button
                          onClick={handleInitialGeneration}
                          disabled={!isFormValid}
                          className="h-12 w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Generate Assignment 
                        </Button>
                      </div>
                    </div>

                    {/* Assignment Summary */}
                    {isFormValid && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
                        <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Assignment Summary
                        </h4>
                        <div className="grid gap-3 md:grid-cols-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Class:</span>
                            <span className="ml-2 text-gray-900">{selectedClass.name}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Semester:</span>
                            <span className="ml-2 text-gray-900">{selectedClass.semester}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Topic:</span>
                            <span className="ml-2 text-gray-900">{availableTopics[selectedTopic]?.topic}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Students:</span>
                            <span className="ml-2 text-gray-900">{selectedClass.student_count || 0}</span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-700">Subtopic:</span>
                            <span className="ml-2 text-gray-900">{selectedSubtopic}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Due Date:</span>
                            <span className="ml-2 text-gray-900">{dueDate && format(dueDate, "PPP")}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">AI Agent:</span>
                            <span className="ml-2 text-gray-900">Semester {selectedClass.semester} Specialist</span>
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
            <Card className="shadow-lg border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600 mb-6" />
                    <Sparkles className="h-6 w-6 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-purple-800 mb-2">Generating Your Assignment</h3>
                  <p className="text-purple-600 text-center max-w-md">
                    Our AI is creating a personalized assignment for <strong>{selectedSubtopic}</strong>. 
                    This may take a few moments...
                  </p>
                  <div className="mt-6 bg-white rounded-lg p-4 shadow-sm border border-purple-200">
                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>Using Semester {selectedClass?.semester} specialized AI agent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>Analyzing curriculum and creating tailored content</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review Assignment */}
          {workflowState === 'reviewing' && currentAssignment && (
            <Card className="shadow-lg border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Eye className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-blue-800">Review Generated Assignment</CardTitle>
                      <CardDescription className="text-blue-600">
                        Review the assignment and decide if you want to make any changes
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                    Version {currentAssignment.revisionHistory.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Assignment Details */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-1">Assignment Title</div>
                    <div className="text-gray-900 font-semibold">{currentAssignment.title}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-1">Topic</div>
                    <div className="text-gray-900">{currentAssignment.topic}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <div className="text-sm font-medium text-blue-700 mb-1">Due Date</div>
                    <div className="text-gray-900">{format(dueDate!, "PPP")}</div>
                  </div>
                </div>
                
                {/* Assignment Content */}
                <div className="bg-white rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Generated Assignment Content
                  </h4>
                  <div className="prose max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                    <AssignmentDisplay content={currentAssignment.content} />
                  </div>
                </div>

                {/* Revision History */}
                {currentAssignment.revisionHistory.length > 1 && (
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      Revision History
                    </h4>
                    <div className="space-y-2">
                      {currentAssignment.revisionHistory.map((revision, index) => (
                        <div key={index} className="flex items-center gap-3 text-sm">
                          <Badge variant="outline" className="text-xs">v{revision.version}</Badge>
                          <span className="text-gray-600">
                            {format(revision.timestamp, "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                          {revision.revisionRequest && (
                            <span className="text-gray-500 italic">- {revision.revisionRequest}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button
                    onClick={() => setWorkflowState('requesting-changes')}
                    variant="outline"
                    className="flex-1 h-12 border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <Edit3 className="h-5 w-5 mr-2" />
                    Request Changes
                  </Button>
                  <Button
                    onClick={handleSaveAssignment}
                    className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    Save This Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Request Changes */}
          {workflowState === 'requesting-changes' && (
            <Card className="shadow-lg border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MessageSquare className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-orange-800">Request Assignment Changes</CardTitle>
                    <CardDescription className="text-orange-600">
                      Describe what changes you'd like to make to the assignment
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <Label className="text-base font-semibold text-orange-800 mb-3 block">
                    What would you like to change?
                  </Label>
                  <Textarea
                    value={revisionRequest}
                    onChange={(e) => setRevisionRequest(e.target.value)}
                    placeholder="Describe the changes you want. For example:
• Remove the section about film history
• Add more practical exercises
• Include examples from recent movies
• Make the assignment shorter
• Add specific grading criteria"
                    className="min-h-[120px] resize-none border-orange-200 focus:border-orange-400 focus:ring-orange-400"
                  />
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Tips for effective revision requests:</p>
                      <ul className="space-y-1 text-amber-700">
                        <li>• Be specific about what to change</li>
                        <li>• Mention if you want to add or remove content</li>
                        <li>• Include any specific examples or requirements</li>
                        <li>• The AI will revise based on your current assignment</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={() => setWorkflowState('reviewing')}
                    variant="outline"
                    className="flex-1 h-12"
                  >
                    <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
                    Back to Review
                  </Button>
                  <Button
                    onClick={handleRevisionRequest}
                    disabled={!revisionRequest.trim()}
                    className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Generate Revised Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Regenerating State */}
          {workflowState === 'regenerating' && (
            <Card className="shadow-lg border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-orange-600 mb-6" />
                    <RefreshCw className="h-6 w-6 text-orange-400 absolute -top-2 -right-2 animate-pulse" />
                  </div>
                  <h3 className="text-xl font-semibold text-orange-800 mb-2">Revising Your Assignment</h3>
                  <p className="text-orange-600 text-center max-w-md mb-4">
                    Our AI is incorporating your feedback and generating a revised version...
                  </p>
                  <div className="bg-white rounded-lg p-4 shadow-sm border border-orange-200 max-w-md">
                    <div className="text-sm text-gray-600">
                      <div className="font-medium text-orange-800 mb-2">Your revision request:</div>
                      <div className="italic text-gray-700 bg-gray-50 rounded p-2">
                        "{revisionRequest}"
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Saving/Enrolling States */}
          {(workflowState === 'saving' || workflowState === 'enrolling') && (
            <Card className="shadow-lg border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative">
                    <Loader2 className="h-16 w-16 animate-spin text-green-600 mb-6" />
                    {workflowState === 'saving' ? (
                      <Save className="h-6 w-6 text-green-400 absolute -top-2 -right-2 animate-pulse" />
                    ) : (
                      <UserPlus className="h-6 w-6 text-green-400 absolute -top-2 -right-2 animate-pulse" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    {workflowState === 'saving' ? 'Saving Assignment' : 'Enrolling Students'}
                  </h3>
                  <p className="text-green-600 text-center max-w-md">
                    {workflowState === 'saving' 
                      ? 'Saving your assignment to the database...'
                      : `Enrolling ${selectedClass?.student_count || 0} students in the assignment...`
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success State */}
          {workflowState === 'complete' && currentAssignment && (
            <Card className="shadow-lg border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-green-800">Assignment Created Successfully! 🎉</CardTitle>
                    <CardDescription className="text-green-600">
                      Your assignment has been saved and assigned to all students in the class
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-1">Assignment</div>
                    <div className="text-gray-900 font-semibold">{currentAssignment.title}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-1">Class</div>
                    <div className="text-gray-900">{selectedClass?.name}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-1">Students Enrolled</div>
                    <div className="text-gray-900 font-semibold">{selectedClass?.student_count || 0}</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="text-sm font-medium text-green-700 mb-1">Due Date</div>
                    <div className="text-gray-900">{format(dueDate!, "MMM dd, yyyy")}</div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Final Assignment Content
                  </h4>
                  <div className="prose max-w-none text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <AssignmentDisplay content={currentAssignment.content} />
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <UserPlus className="h-4 w-4" />
                      <span>Students enrolled</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-700">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        Version {currentAssignment.revisionHistory.length}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={resetWorkflow}
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Another Assignment
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Sparkles className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-3">Assignment Creation Workflow</h3>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span><strong>Step 1-4:</strong> Configure class, topic, subtopic, and due date</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span><strong>Generate:</strong> AI creates initial assignment based on curriculum</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span><strong>Review:</strong> Examine the generated content and decide on changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span><strong>Revise (Optional):</strong> Request changes and regenerate with feedback</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span><strong>Save & Enroll:</strong> Finalize assignment and auto-enroll students in that class</span>
                    </div>
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