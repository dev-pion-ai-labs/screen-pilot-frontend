"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Calendar,
  Users,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Download,
  SortAsc,
  SortDesc,
  ArrowUpDown,
  BarChart3,
  Target,
  Award,
  XCircle,
  MessageSquare,
  User,
  Star,
  ThumbsUp,
  Lightbulb,
  Sparkles,
  FileType,
  CheckSquare,
  ArrowRight,
  Paperclip,
  Edit,
  Theater,
} from "lucide-react"
import { format, isAfter, parseISO, differenceInDays, subDays, addDays } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Student {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  semester: string
  student_id?: string
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  created_at: string
  subject?: string
  total_points: number
  status: "draft" | "published" | "closed"
}

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  status: "submitted" | "late" | "graded" | "missing"
  grade?: number
  feedback?: string
  files?: string[]
  content?: string
  student: Student
  assignment: Assignment
}

interface AIFeedback {
  summary: string
  strengths: string[]
  improvements: string[]
  suggestedGrade: number
  confidenceScore: number
  detailedFeedback: string
  keyInsights: {
    title: string
    description: string
    score: number
  }[]
}

// Dummy Data for Acting School
const dummyStudents: Student[] = [
  {
    id: "1",
    full_name: "Priya Sharma",
    email: "priya.sharma@actingacademy.edu",
    avatar_url: "/placeholder.svg?height=40&width=40",
    semester: "Fall 2024",
    student_id: "ACT2024001",
  },
  {
    id: "2",
    full_name: "Arjun Kapoor",
    email: "arjun.kapoor@actingacademy.edu",
    avatar_url: "/placeholder.svg?height=40&width=40",
    semester: "Fall 2024",
    student_id: "ACT2024002",
  },
  {
    id: "3",
    full_name: "Ananya Singh",
    email: "ananya.singh@actingacademy.edu",
    avatar_url: "/placeholder.svg?height=40&width=40",
    semester: "Spring 2024",
    student_id: "ACT2024003",
  },
  {
    id: "4",
    full_name: "Vikram Patel",
    email: "vikram.patel@actingacademy.edu",
    avatar_url: "/placeholder.svg?height=40&width=40",
    semester: "Fall 2024",
    student_id: "ACT2024004",
  },
  {
    id: "5",
    full_name: "Kavya Reddy",
    email: "kavya.reddy@actingacademy.edu",
    avatar_url: "/placeholder.svg?height=40&width=40",
    semester: "Spring 2024",
    student_id: "ACT2024005",
  },
  {
    id: "6",
    full_name: "Rohit Gupta",
    email: "rohit.gupta@actingacademy.edu",
    avatar_url: "/placeholder.svg?height=40&width=40",
    semester: "Fall 2024",
    student_id: "ACT2024006",
  },
]

const dummyAssignments: Assignment[] = [
  {
    id: "1",
    title: "Monologue Performance Analysis",
    description: "Write a detailed analysis of your chosen monologue including character motivation, emotional journey, and performance techniques",
    due_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
    created_at: format(subDays(new Date(), 14), "yyyy-MM-dd"),
    subject: "Acting Technique",
    total_points: 100,
    status: "published",
  },
  {
    id: "2",
    title: "Scene Direction and Blocking",
    description: "Create detailed director's notes for the assigned scene including blocking, character movements, and staging concepts",
    due_date: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    created_at: format(subDays(new Date(), 10), "yyyy-MM-dd"),
    subject: "Directing",
    total_points: 150,
    status: "published",
  },
  {
    id: "3",
    title: "Character Development Essay",
    description: "Write a comprehensive character analysis including backstory, motivations, and character arc development",
    due_date: format(subDays(new Date(), 2), "yyyy-MM-dd"),
    created_at: format(subDays(new Date(), 21), "yyyy-MM-dd"),
    subject: "Character Study",
    total_points: 80,
    status: "closed",
  },
  {
    id: "4",
    title: "Script Writing - Short Scene",
    description: "Write an original 5-minute scene with proper formatting, dialogue, and stage directions",
    due_date: format(addDays(new Date(), 14), "yyyy-MM-dd"),
    created_at: format(subDays(new Date(), 7), "yyyy-MM-dd"),
    subject: "Scriptwriting",
    total_points: 120,
    status: "published",
  },
]

// Submission content will be fetched from backend

// AI Feedback will be fetched from backend

const generateDummySubmissions = (): Submission[] => {
  const submissions: Submission[] = []
  let submissionId = 1

  dummyStudents.forEach((student) => {
    dummyAssignments.forEach((assignment, assignmentIndex) => {
      // Not every student submits every assignment
      if (Math.random() > 0.2) {
        const dueDate = parseISO(assignment.due_date)
        const submittedDate = new Date(dueDate.getTime() - Math.random() * 10 * 24 * 60 * 60 * 1000)

        // Some submissions are late
        if (Math.random() > 0.7) {
          submittedDate.setTime(dueDate.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000)
        }

        let status: "submitted" | "late" | "graded" | "missing" = "submitted"
        let grade: number | undefined
        let feedback: string | undefined

        // Determine status
        if (isAfter(submittedDate, dueDate)) {
          status = "late"
        }

        // Some submissions are graded
        if (Math.random() > 0.4) {
          status = "graded"
          grade = Math.floor(Math.random() * assignment.total_points * 0.4) + assignment.total_points * 0.6

          const feedbacks = [
            "Excellent character analysis with strong understanding of motivation and technique.",
            "Good work on staging concepts, but could use more detail in actor direction.",
            "Creative interpretation with solid textual support. Well done!",
            "Strong research and writing, consider adding more contemporary examples.",
            "Good grasp of fundamentals, work on developing more specific performance choices.",
          ]
          feedback = feedbacks[Math.floor(Math.random() * feedbacks.length)]
        }

        submissions.push({
          id: submissionId.toString(),
          assignment_id: assignment.id,
          student_id: student.id,
          submitted_at: submittedDate.toISOString(),
          status,
          grade,
          feedback,
          files: [`${student.full_name.replace(" ", "_")}_${assignment.title.replace(/\s+/g, "_")}.pdf`],
          content: `Sample submission content for ${assignment.title} by ${student.full_name}. This content will be fetched from the backend in the real application.`,
          student,
          assignment,
        })

        submissionId++
      }
    })
  })

  return submissions
}

export default function SubmissionsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("submitted_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeValue, setGradeValue] = useState<string>("")
  const [feedbackValue, setFeedbackValue] = useState<string>("")
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewedSubmission, setViewedSubmission] = useState<Submission | null>(null)
  const [aiFeedback, setAIFeedback] = useState<AIFeedback | null>(null)
  const [activeViewTab, setActiveViewTab] = useState<"submission" | "feedback">("submission")

  // Load AI feedback when viewing submission (simulating it's already generated)
  useEffect(() => {
    if (viewedSubmission && viewDialogOpen) {
      // Simulate AI feedback is already available
      const dummyFeedback: AIFeedback = {
        summary: "This submission demonstrates solid understanding of theater concepts with clear analysis and thoughtful interpretation.",
        strengths: [
          "Clear writing and organization",
          "Good understanding of fundamental concepts", 
          "Thoughtful analysis and interpretation",
          "Appropriate use of theater terminology"
        ],
        improvements: [
          "Could include more specific examples",
          "Add more detailed analysis of key concepts",
          "Consider contemporary applications", 
          "Expand on theoretical foundations"
        ],
        suggestedGrade: 85,
        confidenceScore: 90,
        detailedFeedback: "This submission shows solid understanding of theater concepts with clear analysis and good organization. The work demonstrates appropriate use of terminology and shows thoughtful engagement with the material. The student has successfully addressed the assignment requirements and shown creative thinking in their approach.",
        keyInsights: [
          {
            title: "Content Understanding",
            description: "Grasp of key concepts and principles", 
            score: 88
          },
          {
            title: "Analysis Quality",
            description: "Depth and clarity of analysis",
            score: 83
          },
          {
            title: "Written Communication", 
            description: "Clarity and organization of writing",
            score: 87
          }
        ]
      }
      setAIFeedback(dummyFeedback)
    }
  }, [viewedSubmission, viewDialogOpen])

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const dummySubmissions = generateDummySubmissions()
      setSubmissions(dummySubmissions)
      setAssignments(dummyAssignments)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    filterAndSortSubmissions()
  }, [submissions, searchTerm, statusFilter, assignmentFilter, sortBy, sortOrder])

  const filterAndSortSubmissions = () => {
    let filtered = [...submissions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (submission) =>
          submission.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          submission.assignment.title.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((submission) => submission.status === statusFilter)
    }

    // Assignment filter
    if (assignmentFilter !== "all") {
      filtered = filtered.filter((submission) => submission.assignment_id === assignmentFilter)
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortBy) {
        case "student_name":
          aValue = a.student.full_name.toLowerCase()
          bValue = b.student.full_name.toLowerCase()
          break
        case "assignment_title":
          aValue = a.assignment.title.toLowerCase()
          bValue = b.assignment.title.toLowerCase()
          break
        case "grade":
          aValue = a.grade || -1
          bValue = b.grade || -1
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = new Date(a[sortBy as keyof Submission] as string).getTime()
          bValue = new Date(b[sortBy as keyof Submission] as string).getTime()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredSubmissions(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-green-50 text-green-700 border-green-200"
      case "late":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "graded":
        return "bg-blue-50 text-blue-700 border-blue-200"
      case "missing":
        return "bg-red-50 text-red-700 border-red-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="h-3 w-3" />
      case "late":
        return <Clock className="h-3 w-3" />
      case "graded":
        return <Award className="h-3 w-3" />
      case "missing":
        return <XCircle className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getLatenessText = (submission: Submission) => {
    const dueDate = parseISO(submission.assignment.due_date)
    const submittedDate = parseISO(submission.submitted_at)

    if (isAfter(submittedDate, dueDate)) {
      const days = differenceInDays(submittedDate, dueDate)
      return `${days} ${days === 1 ? "day" : "days"} late`
    }
    return "On time"
  }

  const getInitials = (name: string) => {
    if (!name) return "S"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return

    const grade = Number.parseFloat(gradeValue)
    if (isNaN(grade) || grade < 0 || grade > selectedSubmission.assignment.total_points) {
      toast({
        title: "Invalid Grade",
        description: `Grade must be between 0 and ${selectedSubmission.assignment.total_points}.`,
        variant: "destructive",
      })
      return
    }

    // Update local state (simulating API call)
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === selectedSubmission.id ? { ...sub, grade, feedback: feedbackValue, status: "graded" } : sub,
      ),
    )

    toast({
      title: "Success",
      description: "Submission graded successfully.",
    })

    setIsGradingDialogOpen(false)
  }

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGradeValue(submission.grade?.toString() || "")
    setFeedbackValue(submission.feedback || "")
    setIsGradingDialogOpen(true)
  }

  const openViewDialog = (submission: Submission) => {
    setViewedSubmission(submission)
    setViewDialogOpen(true)
    setActiveViewTab("submission")
    setAIFeedback(null) // Will be set by useEffect
  }

  const applyAIGrade = () => {
    if (!viewedSubmission || !aiFeedback) return

    // Update local state (simulating API call)
    setSubmissions((prev) =>
      prev.map((sub) =>
        sub.id === viewedSubmission.id
          ? {
              ...sub,
              grade: aiFeedback.suggestedGrade,
              feedback: aiFeedback.detailedFeedback,
              status: "graded",
            }
          : sub,
      ),
    )

    toast({
      title: "AI Grade Applied",
      description: `Grade of ${aiFeedback.suggestedGrade} applied to submission.`,
    })

    setViewDialogOpen(false)
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4" />
      case "txt":
        return <FileType className="h-4 w-4" />
      case "doc":
      case "docx":
        return <FileText className="h-4 w-4" />
      default:
        return <Paperclip className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <Theater className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Loading submissions...</p>
                <p className="text-sm text-muted-foreground">Fetching student submission data</p>
              </div>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <Theater className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Student Submissions</h1>
                  <p className="text-white/90 text-lg">
                    Review scripts, analyses, and acting assignments with AI feedback
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {submissions.length} Total Submissions
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {submissions.filter((s) => s.status === "graded").length} Graded
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {submissions.filter((s) => s.status === "late").length} Late
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-700">Total Submissions</h3>
                <div className="p-2 bg-purple-100 rounded-full">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-900">{submissions.length}</div>
              <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                <Users className="h-3 w-3" />
                <span>From all students</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-700">Graded</h3>
                <div className="p-2 bg-green-100 rounded-full">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {submissions.filter((s) => s.status === "graded").length}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <CheckCircle className="h-3 w-3" />
                <span>Completed grading</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-700">Pending</h3>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-900">
                {submissions.filter((s) => s.status === "submitted" || s.status === "late").length}
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>Awaiting review</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-700">Average Grade</h3>
                <div className="p-2 bg-blue-100 rounded-full">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {submissions.filter((s) => s.grade !== null).length > 0
                  ? (
                      submissions.filter((s) => s.grade !== null).reduce((acc, s) => acc + (s.grade || 0), 0) /
                      submissions.filter((s) => s.grade !== null).length
                    ).toFixed(1)
                  : "N/A"}
              </div>
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <Star className="h-3 w-3" />
                <span>Points average</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="border-0 shadow-lg p-6 rounded-lg bg-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search students or assignments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full md:w-64"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                    <SelectItem value="missing">Missing</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                  <SelectTrigger className="w-full md:w-56">
                    <SelectValue placeholder="Assignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignments</SelectItem>
                    {assignments.map((assignment) => (
                      <SelectItem key={assignment.id} value={assignment.id}>
                        {assignment.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy("submitted_at")}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Submission Date
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("student_name")}>
                      <User className="h-4 w-4 mr-2" />
                      Student Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("assignment_title")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Assignment Title
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("grade")}>
                      <Award className="h-4 w-4 mr-2" />
                      Grade
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("status")}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Status
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
                      {sortOrder === "asc" ? (
                        <>
                          <SortDesc className="h-4 w-4 mr-2" />
                          Descending
                        </>
                      ) : (
                        <>
                          <SortAsc className="h-4 w-4 mr-2" />
                          Ascending
                        </>
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 p-12 rounded-lg text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Theater className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Try adjusting your search criteria or filters to find submissions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg"
                >
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                      <AvatarImage
                        src={submission.student.avatar_url || "/placeholder.svg"}
                        alt={submission.student.full_name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        {getInitials(submission.student.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">{submission.student.full_name}</h3>
                            <Badge className={cn("text-xs", getStatusColor(submission.status))}>
                              {getStatusIcon(submission.status)}
                              <span className="ml-1 capitalize">{submission.status}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{submission.student.email}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {submission.student.semester}
                            </Badge>
                            {submission.student.student_id && (
                              <>
                                <span>•</span>
                                <span>ID: {submission.student.student_id}</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => openGradingDialog(submission)}
                          >
                            <Award className="h-4 w-4" />
                            {submission.status === "graded" ? "Update Grade" : "Grade"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openViewDialog(submission)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-xs text-purple-600 mb-1">Assignment</div>
                          <div className="flex items-center gap-2">
                            <Theater className="h-4 w-4 text-purple-700" />
                            <span className="font-medium text-gray-900">{submission.assignment.title}</span>
                          </div>
                          <div className="text-xs text-purple-600 mt-1">{submission.assignment.subject}</div>
                        </div>

                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-xs text-blue-600 mb-1">Submission Date</div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-700" />
                            <span className="font-medium text-gray-900">
                              {format(new Date(submission.submitted_at), "MMM dd, yyyy")}
                            </span>
                            {submission.status === "late" && (
                              <Badge variant="outline" className="text-xs text-yellow-600">
                                {getLatenessText(submission)}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-xs text-green-600 mb-1">Grade</div>
                          <div className="flex items-center gap-2">
                            {submission.grade !== null ? (
                              <>
                                <Award className="h-4 w-4 text-green-700" />
                                <span className="font-medium text-gray-900">
                                  {submission.grade} / {submission.assignment.total_points}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({Math.round((submission.grade / submission.assignment.total_points) * 100)}
                                  %)
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span className="text-gray-500">Not graded</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {submission.grade !== null && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs text-gray-500">Score</div>
                            <div className="text-xs font-medium">
                              {submission.grade} / {submission.assignment.total_points}
                            </div>
                          </div>
                          <Progress
                            value={(submission.grade / submission.assignment.total_points) * 100}
                            className="h-2"
                          />
                        </div>
                      )}

                      {submission.feedback && (
                        <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">Feedback</span>
                          </div>
                          <p className="text-sm text-gray-700">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* View Submission Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Theater className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span>Submission Review</span>
                    {viewedSubmission && (
                      <div className="text-sm font-normal text-gray-600 mt-1">
                        {viewedSubmission.student.full_name} • {viewedSubmission.assignment.title}
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              {viewedSubmission && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  {/* Student Info Header */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mb-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={viewedSubmission.student.avatar_url || "/placeholder.svg"}
                          alt={viewedSubmission.student.full_name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {getInitials(viewedSubmission.student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{viewedSubmission.student.full_name}</h3>
                          <Badge className={cn("text-xs", getStatusColor(viewedSubmission.status))}>
                            {getStatusIcon(viewedSubmission.status)}
                            <span className="ml-1 capitalize">{viewedSubmission.status}</span>
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{viewedSubmission.student.email}</span>
                          <span>•</span>
                          <span>
                            Submitted {format(new Date(viewedSubmission.submitted_at), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {viewedSubmission.grade !== null ? (
                          <div>
                            <div className="text-xl font-bold text-purple-600">
                              {viewedSubmission.grade}/{viewedSubmission.assignment.total_points}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((viewedSubmission.grade / viewedSubmission.assignment.total_points) * 100)}%
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not graded</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <Tabs value={activeViewTab} onValueChange={(value) => setActiveViewTab(value as "submission" | "feedback")} className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                      <TabsTrigger value="submission" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Submission
                      </TabsTrigger>
                      <TabsTrigger value="feedback" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Feedback
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-auto mt-4">
                      <TabsContent value="submission" className="mt-0 h-full">
                        <div className="space-y-4">
                          {/* Assignment Details */}
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                              <Theater className="h-4 w-4" />
                              {viewedSubmission.assignment.title}
                            </h4>
                            <p className="text-sm text-purple-700 mb-3">{viewedSubmission.assignment.description}</p>
                            <div className="flex items-center gap-4 text-xs text-purple-600">
                              <span>Due: {format(new Date(viewedSubmission.assignment.due_date), "MMM dd, yyyy")}</span>
                              <span>•</span>
                              <span>Total Points: {viewedSubmission.assignment.total_points}</span>
                              <span>•</span>
                              <span>Subject: {viewedSubmission.assignment.subject}</span>
                            </div>
                          </div>

                          {/* Files */}
                          {viewedSubmission.files && viewedSubmission.files.length > 0 && (
                            <div className="bg-white border rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Submitted Files
                              </h5>
                              <div className="grid grid-cols-1 gap-2">
                                {viewedSubmission.files.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors cursor-pointer"
                                  >
                                    {getFileIcon(file)}
                                    <span className="text-sm text-gray-700 flex-1">{file}</span>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Submission Content */}
                          <div className="bg-white border rounded-lg p-4">
                            <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              Submission Content
                            </h5>
                            <div className="bg-gray-50 rounded-lg p-4 border h-96 overflow-auto">
                              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                                {viewedSubmission.content || "No content available"}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="feedback" className="mt-0 h-full">
                        {aiFeedback ? (
                          <div className="space-y-6">
                            {/* AI Summary */}
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                  <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">AI Analysis Summary</h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>Confidence: {aiFeedback.confidenceScore}%</span>
                                    <span>•</span>
                                    <span>
                                      Suggested Grade: {aiFeedback.suggestedGrade}/
                                      {viewedSubmission.assignment.total_points}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <p className="text-gray-700">{aiFeedback.summary}</p>
                            </div>

                            {/* Key Insights */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {aiFeedback.keyInsights.map((insight, index) => (
                                <div key={index} className="bg-white border rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">{insight.title}</h4>
                                    <Badge
                                      variant={
                                        insight.score >= 90 ? "default" : insight.score >= 75 ? "secondary" : "outline"
                                      }
                                      className="text-xs"
                                    >
                                      {insight.score}%
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
                                  <Progress value={insight.score} className="h-2" />
                                </div>
                              ))}
                            </div>

                            {/* Strengths and Improvements */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <ThumbsUp className="h-5 w-5 text-green-600" />
                                  <h4 className="font-medium text-green-900">Strengths</h4>
                                </div>
                                <ul className="space-y-2">
                                  {aiFeedback.strengths.map((strength, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                                      <CheckSquare className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                      {strength}
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Lightbulb className="h-5 w-5 text-amber-600" />
                                  <h4 className="font-medium text-amber-900">Areas for Improvement</h4>
                                </div>
                                <ul className="space-y-2">
                                  {aiFeedback.improvements.map((improvement, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-amber-800">
                                      <ArrowRight className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                      {improvement}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>

                            {/* Detailed Feedback */}
                            <div className="bg-white border rounded-lg p-6">
                              <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="h-5 w-5 text-purple-600" />
                                <h4 className="font-medium text-gray-900">Detailed Feedback</h4>
                              </div>
                              <div className="prose prose-sm max-w-none">
                                <div className="whitespace-pre-wrap text-gray-700">{aiFeedback.detailedFeedback}</div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-4 border-t">
                              <Button
                                onClick={applyAIGrade}
                                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                              >
                                <Award className="h-4 w-4 mr-2" />
                                Apply AI Grade ({aiFeedback.suggestedGrade} pts)
                              </Button>
                              <Button variant="outline" onClick={() => openGradingDialog(viewedSubmission)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Manual Grade
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-500">Loading AI feedback...</p>
                            </div>
                          </div>
                        )}
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Grading Dialog */}
          <Dialog open={isGradingDialogOpen} onOpenChange={setIsGradingDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Grade Submission</DialogTitle>
                <DialogDescription>
                  {selectedSubmission && (
                    <>
                      Assignment: <span className="font-medium">{selectedSubmission.assignment.title}</span>
                      <br />
                      Student: <span className="font-medium">{selectedSubmission.student.full_name}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="grade" className="text-sm font-medium">
                      Grade
                    </label>
                    {selectedSubmission && (
                      <span className="text-xs text-gray-500">
                        Max: {selectedSubmission.assignment.total_points} points
                      </span>
                    )}
                  </div>
                  <Input
                    id="grade"
                    type="number"
                    min="0"
                    max={selectedSubmission?.assignment.total_points}
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    placeholder="Enter grade"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="feedback" className="text-sm font-medium">
                    Feedback
                  </label>
                  <Textarea
                    id="feedback"
                    value={feedbackValue}
                    onChange={(e) => setFeedbackValue(e.target.value)}
                    placeholder="Enter feedback for the student"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGradingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGradeSubmission}>Save Grade</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}