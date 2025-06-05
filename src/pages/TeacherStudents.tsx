"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Search,
  Calendar,
  Users,
  FileText,
  Download,
  BarChart3,
  Target,
  Award,
  TrendingUp,
  TrendingDown,
  User,
  Star,
  Clock,
  Theater,
  Filter,
  FileDown,
  Printer,
  Eye,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  PieChart,
  LineChart,
  Activity,
  BookOpen,
  GraduationCap,
  CalendarDays,
} from "lucide-react"
import { format, subDays, addDays, subMonths, startOfMonth, endOfMonth } from "date-fns"
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
  subject: string
  total_points: number
  due_date: string
}

interface StudentPerformance {
  student: Student
  totalAssignments: number
  completedAssignments: number
  averageGrade: number
  totalPoints: number
  earnedPoints: number
  trend: "up" | "down" | "stable"
  trendPercentage: number
  recentGrades: number[]
  subjectPerformance: {
    subject: string
    average: number
    count: number
  }[]
  monthlyPerformance: {
    month: string
    average: number
    assignments: number
  }[]
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

// Dummy data for acting school
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

const subjects = ["Acting Technique", "Directing", "Character Study", "Scriptwriting", "Theater History", "Voice & Movement"]

// Generate dummy performance data
const generateStudentPerformance = (): StudentPerformance[] => {
  return dummyStudents.map((student) => {
    const totalAssignments = Math.floor(Math.random() * 5) + 8 // 8-12 assignments
    const completedAssignments = Math.floor(Math.random() * 3) + totalAssignments - 2 // Most completed
    const averageGrade = Math.floor(Math.random() * 30) + 70 // 70-100
    const totalPoints = totalAssignments * 100
    const earnedPoints = Math.floor((averageGrade / 100) * totalPoints)
    
    const trends = ["up", "down", "stable"] as const
    const trend = trends[Math.floor(Math.random() * trends.length)]
    const trendPercentage = Math.floor(Math.random() * 15) + 2 // 2-16%
    
    const recentGrades = Array.from({ length: 6 }, () => Math.floor(Math.random() * 30) + 70)
    
    const subjectPerformance = subjects.slice(0, Math.floor(Math.random() * 3) + 3).map(subject => ({
      subject,
      average: Math.floor(Math.random() * 30) + 70,
      count: Math.floor(Math.random() * 3) + 2
    }))

    const monthlyPerformance = [
      { month: "Sep 2024", average: Math.floor(Math.random() * 20) + 75, assignments: Math.floor(Math.random() * 3) + 2 },
      { month: "Oct 2024", average: Math.floor(Math.random() * 20) + 75, assignments: Math.floor(Math.random() * 3) + 2 },
      { month: "Nov 2024", average: Math.floor(Math.random() * 20) + 75, assignments: Math.floor(Math.random() * 3) + 2 },
      { month: "Dec 2024", average: Math.floor(Math.random() * 20) + 75, assignments: Math.floor(Math.random() * 3) + 2 },
    ]

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
  })
}

const generateClassStats = (performances: StudentPerformance[]): ClassStats => {
  const totalStudents = performances.length
  const averageGrade = Math.floor(performances.reduce((acc, p) => acc + p.averageGrade, 0) / totalStudents)
  const completionRate = Math.floor(
    (performances.reduce((acc, p) => acc + (p.completedAssignments / p.totalAssignments), 0) / totalStudents) * 100
  )
  const topPerformers = performances.filter(p => p.averageGrade >= 90).length
  const needsAttention = performances.filter(p => p.averageGrade < 75).length
  const totalAssignments = Math.max(...performances.map(p => p.totalAssignments))
  const gradedAssignments = Math.floor(totalAssignments * 0.8)

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

export default function PerformanceReportsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [performances, setPerformances] = useState<StudentPerformance[]>([])
  const [classStats, setClassStats] = useState<ClassStats | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [semesterFilter, setSemesterFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [performanceFilter, setPerformanceFilter] = useState<string>("all") // all, high, average, low
  const [selectedStudent, setSelectedStudent] = useState<StudentPerformance | null>(null)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "individual">("overview")

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      const studentPerformances = generateStudentPerformance()
      setPerformances(studentPerformances)
      setClassStats(generateClassStats(studentPerformances))
      setLoading(false)
    }, 1000)
  }, [])

  const filteredPerformances = performances.filter((performance) => {
    const matchesSearch = performance.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         performance.student.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSemester = semesterFilter === "all" || performance.student.semester === semesterFilter
    const matchesPerformance = performanceFilter === "all" || 
                              (performanceFilter === "high" && performance.averageGrade >= 90) ||
                              (performanceFilter === "average" && performance.averageGrade >= 75 && performance.averageGrade < 90) ||
                              (performanceFilter === "low" && performance.averageGrade < 75)
    
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

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = (trend: "up" | "down" | "stable") => {
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
      title: "Report Downloaded",
      description: `Performance report for ${student.student.full_name} has been generated.`,
    })
    
    // In real implementation, this would generate and download a PDF
    console.log("Generating report for:", student.student.full_name)
  }

  const downloadClassReport = () => {
    toast({
      title: "Class Report Downloaded", 
      description: "Complete class performance report has been generated.",
    })
    
    // In real implementation, this would generate and download a PDF
    console.log("Generating class report")
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
          {/* Header */}
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
                        Track student progress and generate performance reports
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {classStats?.totalStudents} Students
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {classStats?.averageGrade}% Avg Grade
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {classStats?.completionRate}% Completion
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    onClick={downloadClassReport}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Class Report
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          {classStats && (
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
                  <span>Overall performance</span>
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
          )}

          {/* View Mode Toggle */}
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

            {/* Filters */}
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

               
                </div>

                <div className="text-sm text-gray-500">
                  Showing {filteredPerformances.length} of {performances.length} students
                </div>
              </div>
            </div>

            <TabsContent value="overview" className="mt-0">
              {/* Class Performance Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* <div className="border-0 shadow-lg bg-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-purple-600" />
                    Grade Distribution
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Excellent (90-100%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(classStats?.topPerformers || 0) / (classStats?.totalStudents || 1) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{classStats?.topPerformers}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Good (80-89%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.max(0, ((classStats?.totalStudents || 0) - (classStats?.topPerformers || 0) - (classStats?.needsAttention || 0)) / (classStats?.totalStudents || 1) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.max(0, (classStats?.totalStudents || 0) - (classStats?.topPerformers || 0) - (classStats?.needsAttention || 0))}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Needs Attention (&lt;75%)</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full" 
                            style={{ width: `${(classStats?.needsAttention || 0) / (classStats?.totalStudents || 1) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{classStats?.needsAttention}</span>
                      </div>
                    </div>
                  </div>
                </div> */}

                {/* <div className="border-0 shadow-lg bg-white p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                    Subject Performance
                  </h3>
                  <div className="space-y-4">
                    {subjects.slice(0, 4).map((subject, index) => {
                      const avgGrade = Math.floor(Math.random() * 20) + 75
                      return (
                        <div key={subject} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{subject}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className={cn(
                                  "h-2 rounded-full",
                                  avgGrade >= 90 ? "bg-green-600" :
                                  avgGrade >= 80 ? "bg-blue-600" :
                                  avgGrade >= 70 ? "bg-yellow-600" : "bg-red-600"
                                )} 
                                style={{ width: `${avgGrade}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{avgGrade}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div> */}
              </div>

              {/* Top Performers */}
              <div className="border-0 shadow-lg bg-white p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  Top Performers This Month
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPerformances
                    .sort((a, b) => b.averageGrade - a.averageGrade)
                    .slice(0, 6)
                    .map((performance, index) => (
                      <div key={performance.student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                            index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-400" : "bg-purple-500"
                          )}>
                            {index + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={performance.student.avatar_url} alt={performance.student.full_name} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white text-xs">
                              {getInitials(performance.student.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{performance.student.full_name}</p>
                          <p className="text-xs text-gray-500">{performance.averageGrade}% average</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="individual" className="mt-0">
              {/* Individual Student Performance Cards */}
              <div className="space-y-4">
                {filteredPerformances.map((performance) => (
                  <div
                    key={performance.student.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage
                          src={performance.student.avatar_url || "/placeholder.svg"}
                          alt={performance.student.full_name}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {getInitials(performance.student.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">{performance.student.full_name}</h3>
                              <Badge className={cn("text-xs", getPerformanceBadgeColor(performance.averageGrade))}>
                                {performance.averageGrade >= 90 ? "Excellent" : 
                                 performance.averageGrade >= 80 ? "Good" : 
                                 performance.averageGrade >= 70 ? "Average" : "Needs Attention"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{performance.student.email}</span>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {performance.student.semester}
                              </Badge>
                              {performance.student.student_id && (
                                <>
                                  <span>•</span>
                                  <span>ID: {performance.student.student_id}</span>
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
                                {performance.averageGrade}%
                              </span>
                              <div className={cn("flex items-center text-xs", getTrendColor(performance.trend))}>
                                {getTrendIcon(performance.trend)}
                                <span className="ml-1">{performance.trendPercentage}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-xs text-green-600 mb-1">Assignments</div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-green-700" />
                              <span className="font-medium text-gray-900">
                                {performance.completedAssignments}/{performance.totalAssignments}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({Math.round((performance.completedAssignments / performance.totalAssignments) * 100)}%)
                              </span>
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
                                {performance.subjectPerformance.length > 0 
                                  ? performance.subjectPerformance.sort((a, b) => b.average - a.average)[0].subject.split(' ')[0]
                                  : "N/A"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance Progress Bar */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs text-gray-500">Overall Performance</div>
                            <div className="text-xs font-medium">{performance.averageGrade}%</div>
                          </div>
                          <Progress value={performance.averageGrade} className="h-2" />
                        </div>

                        {/* Recent Performance Trend */}
                        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Recent Performance Trend</span>
                            <span className={cn("text-xs", getTrendColor(performance.trend))}>
                              {performance.trend === "up" ? "Improving" : 
                               performance.trend === "down" ? "Declining" : "Stable"}
                            </span>
                          </div>
                          <div className="flex items-end gap-1 h-8">
                            {performance.recentGrades.map((grade, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "flex-1 rounded-t",
                                  grade >= 90 ? "bg-green-400" :
                                  grade >= 80 ? "bg-blue-400" :
                                  grade >= 70 ? "bg-yellow-400" : "bg-red-400"
                                )}
                                style={{ height: `${(grade / 100) * 100}%` }}
                                title={`Assignment ${index + 1}: ${grade}%`}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          {/* Student Detail Dialog */}
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
                        {selectedStudent.student.full_name} • Detailed Analytics
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              {selectedStudent && (
                <div className="flex-1 overflow-auto">
                  <div className="space-y-6">
                    {/* Student Info Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                          <AvatarImage
                            src={selectedStudent.student.avatar_url || "/placeholder.svg"}
                            alt={selectedStudent.student.full_name}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                            {getInitials(selectedStudent.student.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900">{selectedStudent.student.full_name}</h3>
                          <p className="text-gray-600">{selectedStudent.student.email}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <Badge variant="outline">{selectedStudent.student.semester}</Badge>
                            <Badge className={getPerformanceBadgeColor(selectedStudent.averageGrade)}>
                              {selectedStudent.averageGrade}% Average
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <Button onClick={() => downloadStudentReport(selectedStudent)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Report
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Performance Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600">{selectedStudent.averageGrade}%</div>
                        <div className="text-sm text-gray-600">Overall Average</div>
                        <div className={cn("flex items-center text-xs mt-1", getTrendColor(selectedStudent.trend))}>
                          {getTrendIcon(selectedStudent.trend)}
                          <span className="ml-1">{selectedStudent.trendPercentage}% from last month</span>
                        </div>
                      </div>
                      
                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600">
                          {selectedStudent.completedAssignments}/{selectedStudent.totalAssignments}
                        </div>
                        <div className="text-sm text-gray-600">Assignments</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round((selectedStudent.completedAssignments / selectedStudent.totalAssignments) * 100)}% completion rate
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600">{selectedStudent.earnedPoints}</div>
                        <div className="text-sm text-gray-600">Points Earned</div>
                        <div className="text-xs text-gray-500 mt-1">
                          out of {selectedStudent.totalPoints} total
                        </div>
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedStudent.subjectPerformance.length}
                        </div>
                        <div className="text-sm text-gray-600">Subjects</div>
                        <div className="text-xs text-gray-500 mt-1">Currently enrolled</div>
                      </div>
                    </div>

                    {/* Subject Performance */}
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
                                      subject.average >= 90 ? "bg-green-500" :
                                      subject.average >= 80 ? "bg-blue-500" :
                                      subject.average >= 70 ? "bg-yellow-500" : "bg-red-500"
                                    )}
                                    style={{ width: `${subject.average}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">{subject.count} assignments</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Monthly Performance */}
                    <div className="bg-white border rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance Trend</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {selectedStudent.monthlyPerformance.map((month) => (
                          <div key={month.month} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-lg font-bold text-purple-600">{month.average}%</div>
                            <div className="text-sm text-gray-600">{month.month}</div>
                            <div className="text-xs text-gray-500">{month.assignments} assignments</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent Grades Visualization */}
                    <div className="bg-white border rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Assignments</h4>
                      <div className="space-y-3">
                        {selectedStudent.recentGrades.map((grade, index) => (
                          <div key={index} className="flex items-center gap-4">
                            <div className="w-16 text-sm text-gray-600">#{index + 1}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-3">
                              <div
                                className={cn(
                                  "h-3 rounded-full",
                                  grade >= 90 ? "bg-green-500" :
                                  grade >= 80 ? "bg-blue-500" :
                                  grade >= 70 ? "bg-yellow-500" : "bg-red-500"
                                )}
                                style={{ width: `${grade}%` }}
                              ></div>
                            </div>
                            <div className="w-12 text-sm font-medium text-gray-700">{grade}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                    Print Report Card
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