import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Users,
  FileText,
  Download,
  BarChart3,
  Target,
  Award,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  Activity,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
  Star,
  Clock,
  Eye,
  Printer,
  BookOpen,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Profile {
  id: string
  full_name: string
  email: string
  semester?: number | null
}

interface AssignmentLite {
  id: string
  title: string
  subject: string | null
  total_points: number | null
  due_date: string
}

interface SubmissionLite {
  id: string
  assignment_id: string
  student_id: string
  grade: number | null
  teacher_grade: number | null
  status: string | null
  submission_date: string | null
  created_at: string
}

type Trend = "up" | "down" | "stable"

interface StudentPerformance {
  student: Profile
  totalAssignments: number
  completedAssignments: number
  averageGrade: number
  totalPoints: number
  earnedPoints: number
  trend: Trend
  trendPercentage: number
  recentGrades: number[]
  subjectPerformance: { subject: string; average: number; count: number }[]
  monthlyPerformance: { month: string; average: number; assignments: number }[]
}

interface ClassStats {
  totalStudents: number
  averageGrade: number
  completionRate: number
  topPerformers: number
  needsAttention: number
  totalAssignments: number
  gradedAssignments: number
}

const computePerformance = (
  student: Profile,
  assignments: AssignmentLite[],
  submissions: SubmissionLite[],
): StudentPerformance => {
  const studentSubs = submissions.filter((s) => s.student_id === student.id)
  const subsByAssignment = new Map(studentSubs.map((s) => [s.assignment_id, s]))
  const totalAssignments = assignments.length
  const completedAssignments = subsByAssignment.size

  const gradedScores: number[] = []
  let totalPoints = 0
  let earnedPoints = 0
  for (const assignment of assignments) {
    const sub = subsByAssignment.get(assignment.id)
    const max = assignment.total_points ?? 100
    totalPoints += max
    if (!sub) continue
    const raw = sub.teacher_grade ?? sub.grade
    if (raw == null) continue
    earnedPoints += raw
    gradedScores.push(max > 0 ? (raw / max) * 100 : 0)
  }

  const averageGrade = gradedScores.length
    ? Math.round(gradedScores.reduce((a, b) => a + b, 0) / gradedScores.length)
    : 0

  const sortedSubs = [...studentSubs].sort((a, b) => {
    const aTime = new Date(a.submission_date ?? a.created_at).getTime()
    const bTime = new Date(b.submission_date ?? b.created_at).getTime()
    return bTime - aTime
  })

  const recentGrades: number[] = []
  for (const sub of sortedSubs.slice(0, 6)) {
    const assignment = assignments.find((a) => a.id === sub.assignment_id)
    const max = assignment?.total_points ?? 100
    const raw = sub.teacher_grade ?? sub.grade
    if (raw == null || max <= 0) continue
    recentGrades.push(Math.round((raw / max) * 100))
  }
  recentGrades.reverse()

  let trend: Trend = "stable"
  let trendPercentage = 0
  if (recentGrades.length >= 4) {
    const half = Math.floor(recentGrades.length / 2)
    const earlier = recentGrades.slice(0, half)
    const later = recentGrades.slice(half)
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length
    const laterAvg = later.reduce((a, b) => a + b, 0) / later.length
    const diff = laterAvg - earlierAvg
    trendPercentage = Math.round(Math.abs(diff))
    if (diff > 2) trend = "up"
    else if (diff < -2) trend = "down"
  }

  const subjectAggregates = new Map<string, { total: number; count: number }>()
  for (const assignment of assignments) {
    const sub = subsByAssignment.get(assignment.id)
    if (!sub) continue
    const raw = sub.teacher_grade ?? sub.grade
    if (raw == null) continue
    const max = assignment.total_points ?? 100
    if (max <= 0) continue
    const subject = assignment.subject?.trim() || "General"
    const pct = (raw / max) * 100
    const agg = subjectAggregates.get(subject) ?? { total: 0, count: 0 }
    agg.total += pct
    agg.count += 1
    subjectAggregates.set(subject, agg)
  }
  const subjectPerformance = Array.from(subjectAggregates.entries())
    .map(([subject, { total, count }]) => ({
      subject,
      average: Math.round(total / count),
      count,
    }))
    .sort((a, b) => b.average - a.average)

  const monthlyAggregates = new Map<string, { total: number; count: number }>()
  for (const sub of studentSubs) {
    const raw = sub.teacher_grade ?? sub.grade
    if (raw == null) continue
    const assignment = assignments.find((a) => a.id === sub.assignment_id)
    const max = assignment?.total_points ?? 100
    if (max <= 0) continue
    const date = sub.submission_date ?? sub.created_at
    if (!date) continue
    const monthKey = format(parseISO(date), "MMM yyyy")
    const pct = (raw / max) * 100
    const agg = monthlyAggregates.get(monthKey) ?? { total: 0, count: 0 }
    agg.total += pct
    agg.count += 1
    monthlyAggregates.set(monthKey, agg)
  }
  const monthlyPerformance = Array.from(monthlyAggregates.entries())
    .map(([month, { total, count }]) => ({
      month,
      average: Math.round(total / count),
      assignments: count,
    }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

  return {
    student,
    totalAssignments,
    completedAssignments,
    averageGrade,
    totalPoints,
    earnedPoints,
    trend,
    trendPercentage,
    recentGrades,
    subjectPerformance,
    monthlyPerformance,
  }
}

const computeClassStats = (performances: StudentPerformance[]): ClassStats => {
  const totalStudents = performances.length
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      averageGrade: 0,
      completionRate: 0,
      topPerformers: 0,
      needsAttention: 0,
      totalAssignments: 0,
      gradedAssignments: 0,
    }
  }
  const totalAssignments = performances[0]?.totalAssignments ?? 0
  const gradesWithSubmissions = performances.filter((p) => p.completedAssignments > 0)
  const averageGrade = gradesWithSubmissions.length
    ? Math.round(
        gradesWithSubmissions.reduce((acc, p) => acc + p.averageGrade, 0) /
          gradesWithSubmissions.length,
      )
    : 0
  const completionRate = totalAssignments
    ? Math.round(
        (performances.reduce(
          (acc, p) => acc + p.completedAssignments / Math.max(totalAssignments, 1),
          0,
        ) /
          totalStudents) *
          100,
      )
    : 0
  const topPerformers = performances.filter((p) => p.averageGrade >= 90).length
  const needsAttention = performances.filter(
    (p) => p.completedAssignments > 0 && p.averageGrade < 75,
  ).length
  const gradedAssignments = performances.reduce(
    (acc, p) => acc + p.recentGrades.length,
    0,
  )
  return {
    totalStudents,
    averageGrade,
    completionRate,
    topPerformers,
    needsAttention,
    totalAssignments,
    gradedAssignments,
  }
}

export default function TeacherStudentsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const teacherId = (profile as any)?.id as string | undefined

  const [loading, setLoading] = useState(true)
  const [students, setStudents] = useState<Profile[]>([])
  const [assignments, setAssignments] = useState<AssignmentLite[]>([])
  const [submissions, setSubmissions] = useState<SubmissionLite[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [semesterFilter, setSemesterFilter] = useState<string>("all")
  const [performanceFilter, setPerformanceFilter] = useState<string>("all")
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "individual">("overview")

  useEffect(() => {
    if (!teacherId) return
    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const { data: classRows, error: classError } = await supabase
          .from("class_teachers")
          .select("class_id")
          .eq("teacher_id", teacherId)
        if (classError) throw classError

        const classIds = (classRows ?? []).map((row: any) => row.class_id).filter(Boolean)

        let studentList: Profile[] = []
        if (classIds.length > 0) {
          const { data: studentRows, error: studentError } = await supabase
            .from("class_students")
            .select("student_id, profiles:student_id (id, full_name, email, semester)")
            .in("class_id", classIds)
          if (studentError) throw studentError

          const dedup = new Map<string, Profile>()
          for (const row of studentRows ?? []) {
            const p = (row as any).profiles
            if (!p?.id) continue
            dedup.set(p.id, {
              id: p.id,
              full_name: p.full_name,
              email: p.email,
              semester: p.semester ?? null,
            })
          }
          studentList = Array.from(dedup.values()).sort((a, b) =>
            (a.full_name ?? "").localeCompare(b.full_name ?? ""),
          )
        }

        const { data: assignmentRows, error: assignmentError } = await supabase
          .from("assignments")
          .select("id, title, subject, total_points, due_date")
          .eq("teacher_id", teacherId)
        if (assignmentError) throw assignmentError
        const assignmentList: AssignmentLite[] = (assignmentRows ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          subject: row.subject,
          total_points: row.total_points,
          due_date: row.due_date,
        }))

        let submissionList: SubmissionLite[] = []
        if (assignmentList.length > 0 && studentList.length > 0) {
          const { data: submissionRows, error: submissionError } = await supabase
            .from("submissions")
            .select(
              "id, assignment_id, student_id, grade, teacher_grade, status, submission_date, created_at",
            )
            .in(
              "assignment_id",
              assignmentList.map((a) => a.id),
            )
            .in(
              "student_id",
              studentList.map((s) => s.id),
            )
          if (submissionError) throw submissionError
          submissionList = (submissionRows ?? []) as SubmissionLite[]
        }

        if (cancelled) return
        setStudents(studentList)
        setAssignments(assignmentList)
        setSubmissions(submissionList)
      } catch (error: any) {
        console.error("Error loading teacher students:", error)
        if (!cancelled) {
          toast({
            title: "Failed to load students",
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

  const performances = useMemo(
    () => students.map((s) => computePerformance(s, assignments, submissions)),
    [students, assignments, submissions],
  )

  const classStats = useMemo(() => computeClassStats(performances), [performances])

  const semesterOptions = useMemo(() => {
    const set = new Set<number>()
    for (const s of students) if (s.semester != null) set.add(s.semester)
    return Array.from(set).sort((a, b) => a - b)
  }, [students])

  const filteredPerformances = performances.filter((performance) => {
    const matchesSearch =
      performance.student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      performance.student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSemester =
      semesterFilter === "all" ||
      String(performance.student.semester ?? "") === semesterFilter
    const matchesPerformance =
      performanceFilter === "all" ||
      (performanceFilter === "high" && performance.averageGrade >= 90) ||
      (performanceFilter === "average" &&
        performance.averageGrade >= 75 &&
        performance.averageGrade < 90) ||
      (performanceFilter === "low" &&
        performance.completedAssignments > 0 &&
        performance.averageGrade < 75)
    return matchesSearch && matchesSemester && matchesPerformance
  })

  const getInitials = (name: string) => {
    if (!name) return "S"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getTrendIcon = (trend: Trend) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: Trend) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getPerformanceColor = (grade: number) => {
    if (grade >= 90) return "text-green-600"
    if (grade >= 80) return "text-blue-600"
    if (grade >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceBadgeColor = (grade: number) => {
    if (grade >= 90) return "bg-green-50 text-green-700 border-green-200"
    if (grade >= 80) return "bg-blue-50 text-blue-700 border-blue-200"
    if (grade >= 70) return "bg-yellow-50 text-yellow-700 border-yellow-200"
    return "bg-red-50 text-red-700 border-red-200"
  }

  const downloadStudentReport = (student: StudentPerformance) => {
    toast({
      title: "Report download coming soon",
      description: `PDF export for ${student.student.full_name} is not yet implemented.`,
    })
  }

  const downloadClassReport = () => {
    toast({
      title: "Report download coming soon",
      description: "Class-level PDF export is not yet implemented.",
    })
  }

  const openStudentDetail = (performance: StudentPerformance) => {
    setSelectedStudent(performance)
    setReportDialogOpen(true)
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <BarChart3 className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Loading performance data...</p>
                <p className="text-sm text-muted-foreground">Analyzing student progress and grades</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Performance & Reports</h1>
                      <p className="text-white/90 text-lg">
                        Track student progress and grades across your classes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {classStats.totalStudents} Students
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {classStats.averageGrade}% Avg Grade
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {classStats.completionRate}% Completion
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={downloadClassReport}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Class Report
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-blue-700">Class Average</h3>
                <div className="p-2 bg-blue-100 rounded-full">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-900">{classStats.averageGrade}%</div>
              <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span>Across graded submissions</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-700">Top Performers</h3>
                <div className="p-2 bg-green-100 rounded-full">
                  <Award className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-900">{classStats.topPerformers}</div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <Star className="h-3 w-3" />
                <span>90% or above</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-700">Need Attention</h3>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{classStats.needsAttention}</div>
              <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                <Clock className="h-3 w-3" />
                <span>Below 75%</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-700">Completion Rate</h3>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-900">{classStats.completionRate}%</div>
              <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                <FileText className="h-3 w-3" />
                <span>Assignment completion</span>
              </div>
            </div>
          </div>

          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "overview" | "individual")}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger
                  value="overview"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Class Overview
                </TabsTrigger>
                <TabsTrigger
                  value="individual"
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Individual Performance
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="border-0 shadow-lg p-6 rounded-lg bg-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full md:w-64"
                    />
                  </div>
                  <select
                    value={semesterFilter}
                    onChange={(e) => setSemesterFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">All semesters</option>
                    {semesterOptions.map((sem) => (
                      <option key={sem} value={String(sem)}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                  <select
                    value={performanceFilter}
                    onChange={(e) => setPerformanceFilter(e.target.value)}
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="all">All performance</option>
                    <option value="high">High (90%+)</option>
                    <option value="average">Average (75-89%)</option>
                    <option value="low">Needs attention (&lt;75%)</option>
                  </select>
                </div>
                <div className="text-sm text-gray-500">
                  Showing {filteredPerformances.length} of {performances.length} students
                </div>
              </div>
            </div>

            <TabsContent value="overview" className="mt-0">
              <div className="border-0 shadow-lg bg-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Top Performers
                </h3>
                {filteredPerformances.length === 0 ? (
                  <p className="text-sm text-gray-500">No students match the current filters.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPerformances
                      .filter((p) => p.completedAssignments > 0)
                      .sort((a, b) => b.averageGrade - a.averageGrade)
                      .slice(0, 6)
                      .map((performance, index) => (
                        <div
                          key={performance.student.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                                index === 0
                                  ? "bg-yellow-500"
                                  : index === 1
                                    ? "bg-gray-400"
                                    : index === 2
                                      ? "bg-orange-400"
                                      : "bg-purple-500",
                              )}
                            >
                              {index + 1}
                            </div>
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                                {getInitials(performance.student.full_name)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {performance.student.full_name}
                            </p>
                            <p className="text-xs text-gray-500">{performance.averageGrade}% average</p>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="individual" className="mt-0">
              {filteredPerformances.length === 0 ? (
                <div className="border-0 shadow-lg bg-white p-12 rounded-lg text-center text-gray-500">
                  No students match the current filters.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredPerformances.map((performance) => (
                    <div
                      key={performance.student.id}
                      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg"
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                            {getInitials(performance.student.full_name)}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {performance.student.full_name}
                                </h3>
                                {performance.completedAssignments > 0 && (
                                  <Badge className={cn("text-xs", getPerformanceBadgeColor(performance.averageGrade))}>
                                    {performance.averageGrade >= 90
                                      ? "Excellent"
                                      : performance.averageGrade >= 80
                                        ? "Good"
                                        : performance.averageGrade >= 70
                                          ? "Average"
                                          : "Needs Attention"}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>{performance.student.email}</span>
                                {performance.student.semester != null && (
                                  <>
                                    <span>•</span>
                                    <Badge variant="outline" className="text-xs">
                                      Semester {performance.student.semester}
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
                                onClick={() => openStudentDetail(performance)}
                              >
                                <Eye className="h-4 w-4" />
                                View Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => downloadStudentReport(performance)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Report Card
                              </Button>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <div className="text-xs text-blue-600 mb-1">Average Grade</div>
                              <div className="flex items-center gap-2">
                                <GraduationCap className="h-4 w-4 text-blue-700" />
                                <span className={cn("font-bold text-lg", getPerformanceColor(performance.averageGrade))}>
                                  {performance.completedAssignments > 0 ? `${performance.averageGrade}%` : "—"}
                                </span>
                                {performance.trendPercentage > 0 && (
                                  <div className={cn("flex items-center text-xs", getTrendColor(performance.trend))}>
                                    {getTrendIcon(performance.trend)}
                                    <span className="ml-1">{performance.trendPercentage}%</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="bg-green-50 p-3 rounded-lg">
                              <div className="text-xs text-green-600 mb-1">Assignments</div>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-green-700" />
                                <span className="font-medium text-gray-900">
                                  {performance.completedAssignments}/{performance.totalAssignments}
                                </span>
                                {performance.totalAssignments > 0 && (
                                  <span className="text-xs text-gray-500">
                                    (
                                    {Math.round(
                                      (performance.completedAssignments / performance.totalAssignments) * 100,
                                    )}
                                    %)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="bg-purple-50 p-3 rounded-lg">
                              <div className="text-xs text-purple-600 mb-1">Points Earned</div>
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-purple-700" />
                                <span className="font-medium text-gray-900">
                                  {performance.earnedPoints}/{performance.totalPoints}
                                </span>
                              </div>
                            </div>

                            <div className="bg-yellow-50 p-3 rounded-lg">
                              <div className="text-xs text-yellow-600 mb-1">Best Subject</div>
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-yellow-700" />
                                <span className="font-medium text-gray-900 text-sm">
                                  {performance.subjectPerformance[0]?.subject ?? "—"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                              <div className="text-xs text-gray-500">Overall Performance</div>
                              <div className="text-xs font-medium">
                                {performance.completedAssignments > 0 ? `${performance.averageGrade}%` : "—"}
                              </div>
                            </div>
                            <Progress value={performance.averageGrade} className="h-2" />
                          </div>

                          {performance.recentGrades.length > 0 && (
                            <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">Recent Performance Trend</span>
                                <span className={cn("text-xs", getTrendColor(performance.trend))}>
                                  {performance.trend === "up"
                                    ? "Improving"
                                    : performance.trend === "down"
                                      ? "Declining"
                                      : "Stable"}
                                </span>
                              </div>
                              <div className="flex items-end gap-1 h-8">
                                {performance.recentGrades.map((grade, index) => (
                                  <div
                                    key={index}
                                    className={cn(
                                      "flex-1 rounded-t",
                                      grade >= 90
                                        ? "bg-green-400"
                                        : grade >= 80
                                          ? "bg-blue-400"
                                          : grade >= 70
                                            ? "bg-yellow-400"
                                            : "bg-red-400",
                                    )}
                                    style={{ height: `${Math.max((grade / 100) * 100, 8)}%` }}
                                    title={`Grade ${index + 1}: ${grade}%`}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span>Student Performance Details</span>
                    {selectedStudent && (
                      <div className="text-sm font-normal text-gray-600 mt-1">
                        {selectedStudent.student.full_name} • Detailed analytics
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              {selectedStudent && (
                <div className="flex-1 overflow-auto">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                            {getInitials(selectedStudent.student.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{selectedStudent.student.full_name}</h3>
                          <p className="text-gray-600">{selectedStudent.student.email}</p>
                          <div className="flex items-center gap-4 mt-2">
                            {selectedStudent.student.semester != null && (
                              <Badge variant="outline">Semester {selectedStudent.student.semester}</Badge>
                            )}
                            {selectedStudent.completedAssignments > 0 && (
                              <Badge className={getPerformanceBadgeColor(selectedStudent.averageGrade)}>
                                {selectedStudent.averageGrade}% Average
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">
                          {selectedStudent.completedAssignments > 0 ? `${selectedStudent.averageGrade}%` : "—"}
                        </div>
                        <div className="text-sm text-gray-600">Overall Average</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStudent.completedAssignments}/{selectedStudent.totalAssignments}
                        </div>
                        <div className="text-sm text-gray-600">Assignments Submitted</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">{selectedStudent.earnedPoints}</div>
                        <div className="text-sm text-gray-600">Points Earned</div>
                        <div className="text-xs text-gray-500 mt-1">out of {selectedStudent.totalPoints}</div>
                      </div>
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedStudent.subjectPerformance.length}
                        </div>
                        <div className="text-sm text-gray-600">Subjects with grades</div>
                      </div>
                    </div>

                    {selectedStudent.subjectPerformance.length > 0 && (
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h4>
                        <div className="space-y-4">
                          {selectedStudent.subjectPerformance.map((subject) => (
                            <div key={subject.subject} className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700">{subject.subject}</span>
                                  <span className="text-sm text-gray-600">{subject.average}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                                    <div
                                      className={cn(
                                        "h-2 rounded-full",
                                        subject.average >= 90
                                          ? "bg-green-500"
                                          : subject.average >= 80
                                            ? "bg-blue-500"
                                            : subject.average >= 70
                                              ? "bg-yellow-500"
                                              : "bg-red-500",
                                      )}
                                      style={{ width: `${subject.average}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {subject.count} assignment{subject.count === 1 ? "" : "s"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedStudent.monthlyPerformance.length > 0 && (
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          {selectedStudent.monthlyPerformance.map((month) => (
                            <div key={month.month} className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="text-lg font-bold text-purple-600">{month.average}%</div>
                              <div className="text-sm text-gray-600">{month.month}</div>
                              <div className="text-xs text-gray-500">
                                {month.assignments} assignment{month.assignments === 1 ? "" : "s"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                  Close
                </Button>
                {selectedStudent && (
                  <Button onClick={() => downloadStudentReport(selectedStudent)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print Report
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
