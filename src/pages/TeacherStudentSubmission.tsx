import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { supabase } from "@/integrations/supabase/client"
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
  Sparkles,
  FileType,
  Paperclip,
  Edit,
  Theater,
} from "lucide-react"
import { format, isAfter, parseISO, differenceInDays } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Student {
  id: string
  full_name: string
  email: string
  semester?: number | null
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  created_at: string
  subject?: string | null
  total_points: number
}

type SubmissionStatus = "submitted" | "late" | "graded"

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  status: SubmissionStatus
  grade: number | null
  feedback: string | null
  file_path: string | null
  file_name: string | null
  script_url: string | null
  ai_feedback: any
  ai_evaluation: any
  student: Student
  assignment: Assignment
}

const SUBMISSIONS_BUCKET = "assignment-submissions"

const computeStatus = (
  submissionDate: string | null,
  dueDate: string,
  teacherGrade: number | null,
  grade: number | null,
  rawStatus: string | null,
): SubmissionStatus => {
  if (rawStatus === "graded" || teacherGrade != null) return "graded"
  if (submissionDate && isAfter(parseISO(submissionDate), parseISO(dueDate))) return "late"
  if (rawStatus === "submitted" || rawStatus === "late") return rawStatus as SubmissionStatus
  return "submitted"
}

export default function TeacherStudentSubmission() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const teacherId = (profile as any)?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("submitted_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [gradeValue, setGradeValue] = useState<string>("")
  const [feedbackValue, setFeedbackValue] = useState<string>("")
  const [isGradingDialogOpen, setIsGradingDialogOpen] = useState(false)
  const [isSavingGrade, setIsSavingGrade] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewedSubmission, setViewedSubmission] = useState<Submission | null>(null)
  const [activeViewTab, setActiveViewTab] = useState<"submission" | "feedback">("submission")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (!teacherId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data: assignmentRows, error: assignmentError } = await supabase
          .from("assignments")
          .select("id, title, description, due_date, created_at, subject, total_points")
          .eq("teacher_id", teacherId)
          .order("due_date", { ascending: false })
        if (assignmentError) throw assignmentError

        const assignmentList: Assignment[] = (assignmentRows ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          description: row.description,
          due_date: row.due_date,
          created_at: row.created_at,
          subject: row.subject ?? null,
          total_points: row.total_points ?? 100,
        }))
        const assignmentMap = new Map(assignmentList.map((a) => [a.id, a]))

        let submissionList: Submission[] = []
        if (assignmentList.length > 0) {
          const { data: submissionRows, error: submissionError } = await supabase
            .from("submissions")
            .select(
              `id, assignment_id, student_id, submission_date, created_at,
               status, grade, teacher_grade, teacher_feedback, file_path, file_name,
               script_url, ai_feedback, ai_evaluation,
               profiles:student_id (id, full_name, email, semester)`,
            )
            .in(
              "assignment_id",
              assignmentList.map((a) => a.id),
            )
            .order("created_at", { ascending: false })
          if (submissionError) throw submissionError

          submissionList = (submissionRows ?? [])
            .map((row: any): Submission | null => {
              const assignment = assignmentMap.get(row.assignment_id)
              const studentProfile = row.profiles
              if (!assignment || !studentProfile) return null
              const submittedAt = row.submission_date ?? row.created_at
              const status = computeStatus(
                row.submission_date,
                assignment.due_date,
                row.teacher_grade,
                row.grade,
                row.status,
              )
              return {
                id: row.id,
                assignment_id: row.assignment_id,
                student_id: row.student_id,
                submitted_at: submittedAt,
                status,
                grade: row.teacher_grade ?? row.grade ?? null,
                feedback: row.teacher_feedback ?? null,
                file_path: row.file_path ?? null,
                file_name: row.file_name ?? null,
                script_url: row.script_url ?? null,
                ai_feedback: row.ai_feedback ?? null,
                ai_evaluation: row.ai_evaluation ?? null,
                student: {
                  id: studentProfile.id,
                  full_name: studentProfile.full_name,
                  email: studentProfile.email,
                  semester: studentProfile.semester ?? null,
                },
                assignment,
              }
            })
            .filter((s): s is Submission => s !== null)
        }

        if (cancelled) return
        setAssignments(assignmentList)
        setSubmissions(submissionList)
      } catch (error: any) {
        console.error("Error loading submissions:", error)
        if (!cancelled) {
          toast({
            title: "Failed to load submissions",
            description: error?.message ?? "Please try again.",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [teacherId, toast])

  const filteredSubmissions = useMemo(() => {
    let filtered = [...submissions]

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.student.full_name?.toLowerCase().includes(q) ||
          s.student.email?.toLowerCase().includes(q) ||
          s.assignment.title?.toLowerCase().includes(q),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter)
    }

    if (assignmentFilter !== "all") {
      filtered = filtered.filter((s) => s.assignment_id === assignmentFilter)
    }

    filtered.sort((a, b) => {
      let aValue: any
      let bValue: any
      switch (sortBy) {
        case "student_name":
          aValue = a.student.full_name?.toLowerCase() ?? ""
          bValue = b.student.full_name?.toLowerCase() ?? ""
          break
        case "assignment_title":
          aValue = a.assignment.title?.toLowerCase() ?? ""
          bValue = b.assignment.title?.toLowerCase() ?? ""
          break
        case "grade":
          aValue = a.grade ?? -1
          bValue = b.grade ?? -1
          break
        case "status":
          aValue = a.status
          bValue = b.status
          break
        default:
          aValue = new Date(a.submitted_at).getTime()
          bValue = new Date(b.submitted_at).getTime()
      }
      if (sortOrder === "asc") return aValue > bValue ? 1 : -1
      return aValue < bValue ? 1 : -1
    })

    return filtered
  }, [submissions, searchTerm, statusFilter, assignmentFilter, sortBy, sortOrder])

  const stats = useMemo(() => {
    const total = submissions.length
    const graded = submissions.filter((s) => s.status === "graded").length
    const late = submissions.filter((s) => s.status === "late").length
    const gradedScores = submissions.filter((s) => s.grade != null)
    const averageGrade = gradedScores.length
      ? (gradedScores.reduce((acc, s) => acc + (s.grade ?? 0), 0) / gradedScores.length).toFixed(1)
      : "N/A"
    return { total, graded, late, averageGrade }
  }, [submissions])

  const getStatusColor = (status: SubmissionStatus) => {
    switch (status) {
      case "submitted":
        return "bg-green-50 text-green-700 border-green-200"
      case "late":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "graded":
        return "bg-blue-50 text-blue-700 border-blue-200"
      default:
        return "bg-gray-50 text-gray-700 border-gray-200"
    }
  }

  const getStatusIcon = (status: SubmissionStatus) => {
    switch (status) {
      case "submitted":
        return <CheckCircle className="h-3 w-3" />
      case "late":
        return <Clock className="h-3 w-3" />
      case "graded":
        return <Award className="h-3 w-3" />
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

  const persistGrade = async (
    submission: Submission,
    grade: number,
    feedback: string,
  ): Promise<Submission | null> => {
    const now = new Date().toISOString()
    const { data, error } = await supabase
      .from("submissions")
      .update({
        teacher_grade: grade,
        teacher_feedback: feedback,
        status: "graded",
        updated_at: now,
      })
      .eq("id", submission.id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) return null

    return {
      ...submission,
      grade,
      feedback,
      status: "graded",
    }
  }

  const handleGradeSubmission = async () => {
    if (!selectedSubmission) return
    const grade = Number.parseFloat(gradeValue)
    if (Number.isNaN(grade) || grade < 0 || grade > selectedSubmission.assignment.total_points) {
      toast({
        title: "Invalid Grade",
        description: `Grade must be between 0 and ${selectedSubmission.assignment.total_points}.`,
        variant: "destructive",
      })
      return
    }

    setIsSavingGrade(true)
    try {
      const updated = await persistGrade(selectedSubmission, grade, feedbackValue)
      if (updated) {
        setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        if (viewedSubmission?.id === updated.id) setViewedSubmission(updated)
      }
      toast({ title: "Saved", description: "Submission graded successfully." })
      setIsGradingDialogOpen(false)
    } catch (error: any) {
      console.error("Error saving grade:", error)
      toast({
        title: "Failed to save grade",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingGrade(false)
    }
  }

  const aiSuggestedGrade = (submission: Submission): number | null => {
    const feedback = submission.ai_feedback
    const evaluation = submission.ai_evaluation
    const candidates = [feedback?.suggestedGrade, feedback?.grade, evaluation?.suggestedGrade, evaluation?.grade]
    for (const c of candidates) {
      if (typeof c === "number" && !Number.isNaN(c)) return c
      if (typeof c === "string") {
        const parsed = Number.parseFloat(c)
        if (!Number.isNaN(parsed)) return parsed
      }
    }
    return null
  }

  const aiFeedbackSummary = (submission: Submission): string | null => {
    const feedback = submission.ai_feedback
    const evaluation = submission.ai_evaluation
    return (
      feedback?.detailedFeedback ??
      feedback?.feedback ??
      feedback?.summary ??
      evaluation?.detailedFeedback ??
      evaluation?.feedback ??
      evaluation?.summary ??
      (typeof feedback === "string" ? feedback : null)
    )
  }

  const applyAIGrade = async () => {
    if (!viewedSubmission) return
    const suggested = aiSuggestedGrade(viewedSubmission)
    const summary = aiFeedbackSummary(viewedSubmission)
    if (suggested == null) {
      toast({
        title: "No AI grade available",
        description: "This submission does not have an AI-suggested grade to apply.",
        variant: "destructive",
      })
      return
    }
    setIsSavingGrade(true)
    try {
      const updated = await persistGrade(viewedSubmission, suggested, summary ?? "")
      if (updated) {
        setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        setViewedSubmission(updated)
      }
      toast({
        title: "AI Grade Applied",
        description: `Grade of ${suggested} applied to submission.`,
      })
      setViewDialogOpen(false)
    } catch (error: any) {
      console.error("Error applying AI grade:", error)
      toast({
        title: "Failed to apply AI grade",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSavingGrade(false)
    }
  }

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setGradeValue(submission.grade?.toString() ?? "")
    setFeedbackValue(submission.feedback ?? "")
    setIsGradingDialogOpen(true)
  }

  const openViewDialog = (submission: Submission) => {
    setViewedSubmission(submission)
    setViewDialogOpen(true)
    setActiveViewTab("submission")
  }

  const downloadFile = async (submission: Submission) => {
    const path = submission.file_path
    if (!path) {
      if (submission.script_url) {
        window.open(submission.script_url, "_blank", "noopener,noreferrer")
        return
      }
      toast({
        title: "No file attached",
        description: "This submission has no downloadable file.",
        variant: "destructive",
      })
      return
    }
    setDownloadingId(submission.id)
    try {
      const { data, error } = await supabase.storage
        .from(SUBMISSIONS_BUCKET)
        .createSignedUrl(path, 60 * 5)
      if (error) throw error
      if (!data?.signedUrl) throw new Error("Could not create download link")
      window.open(data.signedUrl, "_blank", "noopener,noreferrer")
    } catch (error: any) {
      console.error("Error generating download link:", error)
      toast({
        title: "Download failed",
        description: error?.message ?? "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDownloadingId(null)
    }
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
                    Review submissions for the assignments you created and apply grades.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {stats.total} Total Submissions
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {stats.graded} Graded
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {stats.late} Late
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-700">Total Submissions</h3>
                <div className="p-2 bg-purple-100 rounded-full">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-900">{stats.total}</div>
              <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                <Users className="h-3 w-3" />
                <span>Across all your assignments</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-700">Graded</h3>
                <div className="p-2 bg-green-100 rounded-full">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-900">{stats.graded}</div>
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
              <div className="text-2xl font-bold text-yellow-900">{stats.total - stats.graded}</div>
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
              <div className="text-2xl font-bold text-blue-900">{stats.averageGrade}</div>
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <Star className="h-3 w-3" />
                <span>Points average</span>
              </div>
            </div>
          </div>

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
                    <DropdownMenuItem
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    >
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

          {filteredSubmissions.length === 0 ? (
            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 p-12 rounded-lg text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Theater className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {submissions.length === 0
                  ? "No students have submitted any of your assignments yet."
                  : "Try adjusting your search criteria or filters."}
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
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                        {getInitials(submission.student.full_name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {submission.student.full_name}
                            </h3>
                            <Badge className={cn("text-xs", getStatusColor(submission.status))}>
                              {getStatusIcon(submission.status)}
                              <span className="ml-1 capitalize">{submission.status}</span>
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{submission.student.email}</span>
                            {submission.student.semester != null && (
                              <>
                                <span>•</span>
                                <Badge variant="outline" className="text-xs">
                                  Semester {submission.student.semester}
                                </Badge>
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
                          {submission.assignment.subject && (
                            <div className="text-xs text-purple-600 mt-1">
                              {submission.assignment.subject}
                            </div>
                          )}
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
                            {submission.grade != null ? (
                              <>
                                <Award className="h-4 w-4 text-green-700" />
                                <span className="font-medium text-gray-900">
                                  {submission.grade} / {submission.assignment.total_points}
                                </span>
                                <span className="text-xs text-gray-500">
                                  (
                                  {Math.round(
                                    (submission.grade / submission.assignment.total_points) * 100,
                                  )}
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

                      {submission.grade != null && (
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
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

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
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mb-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
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
                            Submitted{" "}
                            {format(new Date(viewedSubmission.submitted_at), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {viewedSubmission.grade != null ? (
                          <div>
                            <div className="text-xl font-bold text-purple-600">
                              {viewedSubmission.grade}/{viewedSubmission.assignment.total_points}
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round(
                                (viewedSubmission.grade / viewedSubmission.assignment.total_points) * 100,
                              )}
                              %
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Not graded</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Tabs
                    value={activeViewTab}
                    onValueChange={(value) => setActiveViewTab(value as "submission" | "feedback")}
                    className="flex-1 flex flex-col"
                  >
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
                          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <h4 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                              <Theater className="h-4 w-4" />
                              {viewedSubmission.assignment.title}
                            </h4>
                            <p className="text-sm text-purple-700 mb-3">
                              {viewedSubmission.assignment.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-purple-600">
                              <span>
                                Due: {format(new Date(viewedSubmission.assignment.due_date), "MMM dd, yyyy")}
                              </span>
                              <span>•</span>
                              <span>Total Points: {viewedSubmission.assignment.total_points}</span>
                              {viewedSubmission.assignment.subject && (
                                <>
                                  <span>•</span>
                                  <span>Subject: {viewedSubmission.assignment.subject}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {(viewedSubmission.file_path || viewedSubmission.script_url) && (
                            <div className="bg-white border rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                                <Paperclip className="h-4 w-4" />
                                Submitted File
                              </h5>
                              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border hover:bg-gray-100 transition-colors">
                                {getFileIcon(viewedSubmission.file_name ?? "submission")}
                                <span className="text-sm text-gray-700 flex-1">
                                  {viewedSubmission.file_name ?? "Submission file"}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2"
                                  disabled={downloadingId === viewedSubmission.id}
                                  onClick={() => downloadFile(viewedSubmission)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Open
                                </Button>
                              </div>
                            </div>
                          )}

                          {!viewedSubmission.file_path && !viewedSubmission.script_url && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
                              No file is attached to this submission.
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="feedback" className="mt-0 h-full">
                        {viewedSubmission.ai_feedback || viewedSubmission.ai_evaluation ? (
                          <div className="space-y-6">
                            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                                  <Sparkles className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900">AI Analysis</h3>
                                  {aiSuggestedGrade(viewedSubmission) != null && (
                                    <div className="text-sm text-gray-600">
                                      Suggested Grade: {aiSuggestedGrade(viewedSubmission)}/
                                      {viewedSubmission.assignment.total_points}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {aiFeedbackSummary(viewedSubmission) ? (
                                <p className="text-gray-700 whitespace-pre-wrap">
                                  {aiFeedbackSummary(viewedSubmission)}
                                </p>
                              ) : (
                                <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-white/60 p-3 rounded border">
                                  {JSON.stringify(
                                    viewedSubmission.ai_feedback ?? viewedSubmission.ai_evaluation,
                                    null,
                                    2,
                                  )}
                                </pre>
                              )}
                            </div>

                            {aiSuggestedGrade(viewedSubmission) != null && (
                              <div className="flex items-center gap-3 pt-4 border-t">
                                <Button
                                  onClick={applyAIGrade}
                                  disabled={isSavingGrade}
                                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                >
                                  <Award className="h-4 w-4 mr-2" />
                                  Apply AI Grade ({aiSuggestedGrade(viewedSubmission)} pts)
                                </Button>
                                <Button variant="outline" onClick={() => openGradingDialog(viewedSubmission)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Manual Grade
                                </Button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                              <div className="bg-gray-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <Sparkles className="h-8 w-8 text-gray-400" />
                              </div>
                              <p className="text-gray-500">No AI feedback has been generated for this submission.</p>
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
                <Button
                  variant="outline"
                  onClick={() => setIsGradingDialogOpen(false)}
                  disabled={isSavingGrade}
                >
                  Cancel
                </Button>
                <Button onClick={handleGradeSubmission} disabled={isSavingGrade}>
                  {isSavingGrade ? "Saving..." : "Save Grade"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
