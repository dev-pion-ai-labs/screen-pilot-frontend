"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  FileText,
  TrendingUp,
  Target,
  Zap,
  Calendar,
  Award,
  PlayCircle,
  ArrowRight,
  User,
  Users,
  GraduationCap,
  BarChart3,
  PieChart,
  Activity,
  School,
  Timer,
  Star,
  Flame,
  Trophy,
} from "lucide-react"
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval } from "date-fns"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts"

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  created_at: string
  class_id: string
  teacher_id: string
  topic: string
  difficulty: string
  total_points: number
  submissions?: any[]
  classes: {
    id: string
    name: string
    semester: number
  }
  profiles: {
    id: string
    full_name: string
    email: string
  }
}

interface StudentClass {
  id: string
  name: string
  semester: number
  created_at: string
  teacher: {
    id: string
    full_name: string
    email: string
  }
  assignment_count: number
  completed_assignments: number
}

interface AnalyticsData {
  weeklyProgress: Array<{
    week: string
    completed: number
    assigned: number
  }>
  difficultyBreakdown: Array<{
    name: string
    value: number
    color: string
  }>
  subjectPerformance: Array<{
    subject: string
    completed: number
    total: number
    percentage: number
  }>
  recentActivity: Array<{
    date: string
    submissions: number
  }>
}

export default function StudentDashboard() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<StudentClass[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    weeklyProgress: [],
    difficultyBreakdown: [],
    subjectPerformance: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (profile?.id && profile?.semester) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchAssignments(),
        fetchStudentClasses(),
      ])
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      // Get assignments from classes the student is enrolled in
      const { data: enrollmentData } = await supabase
        .from("class_students")
        .select("class_id")
        .eq("student_id", profile?.id)

      if (!enrollmentData?.length) {
        setAssignments([])
        return
      }

      const classIds = enrollmentData.map(e => e.class_id)

      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          *,
          classes:class_id (
            id,
            name,
            semester
          ),
          profiles:teacher_id (
            id,
            full_name,
            email
          ),
          submissions!left (*)
        `)
        .in("class_id", classIds)
        .eq("status", "published")
        .order("created_at", { ascending: false })

      // Filter submissions to only include current student's submissions
      const assignmentsWithUserSubmissions = assignmentsData?.map(assignment => ({
        ...assignment,
        submissions: assignment.submissions?.filter(sub => sub.student_id === profile?.id) || []
      })) || []

      setAssignments(assignmentsWithUserSubmissions)
      generateAnalytics(assignmentsWithUserSubmissions)
    } catch (error) {
      console.error("Error fetching assignments:", error)
    }
  }

  const fetchStudentClasses = async () => {
    try {
      const { data: classData } = await supabase
        .from("class_students")
        .select(`
          classes:class_id (
            id,
            name,
            semester,
            created_at
          )
        `)
        .eq("student_id", profile?.id)

      if (!classData?.length) {
        setClasses([])
        return
      }

      // Get teacher and assignment info for each class
      const classesWithDetails = await Promise.all(
        classData.map(async (item) => {
          const classInfo = item.classes

          // Get teacher info
          const { data: teacherData } = await supabase
            .from("class_teachers")
            .select(`
              profiles:teacher_id (
                id,
                full_name,
                email
              )
            `)
            .eq("class_id", classInfo.id)
            .single()

          // Get assignment counts
          const { count: totalAssignments } = await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id)
            .eq("status", "published")

          // Get completed assignment count
          const { data: submissionsData } = await supabase
            .from("submissions")
            .select("assignment_id")
            .eq("student_id", profile?.id)

          const submittedAssignmentIds = submissionsData?.map(s => s.assignment_id) || []
          
          const { count: completedAssignments } = await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id)
            .eq("status", "published")
            .in("id", submittedAssignmentIds.length > 0 ? submittedAssignmentIds : [""])

          return {
            id: classInfo.id,
            name: classInfo.name,
            semester: classInfo.semester,
            created_at: classInfo.created_at,
            teacher: teacherData?.profiles || { id: "", full_name: "Unknown", email: "" },
            assignment_count: totalAssignments || 0,
            completed_assignments: completedAssignments || 0,
          }
        })
      )

      setClasses(classesWithDetails)
    } catch (error) {
      console.error("Error fetching student classes:", error)
    }
  }

  const generateAnalytics = (assignmentsData: Assignment[]) => {
    // Weekly progress for last 8 weeks
    const weeks = []
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      const weekEnd = endOfWeek(weekStart)
      
      const weekAssignments = assignmentsData.filter(a => 
        isWithinInterval(new Date(a.created_at), { start: weekStart, end: weekEnd })
      )
      
      const weekSubmissions = assignmentsData.filter(a => 
        a.submissions?.some(s => 
          isWithinInterval(new Date(s.created_at), { start: weekStart, end: weekEnd })
        )
      )

      weeks.push({
        week: format(weekStart, "MMM dd"),
        completed: weekSubmissions.length,
        assigned: weekAssignments.length,
      })
    }

    // Difficulty breakdown
    const difficultyCount = assignmentsData.reduce((acc, assignment) => {
      const difficulty = assignment.difficulty || "medium"
      acc[difficulty] = (acc[difficulty] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const difficultyColors = {
      easy: "#10B981",
      medium: "#F59E0B", 
      hard: "#EF4444"
    }

    const difficultyBreakdown = Object.entries(difficultyCount).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value,
      color: difficultyColors[key as keyof typeof difficultyColors] || "#6B7280"
    }))

    // Subject performance (by class)
    const subjectPerformance = classes.map(cls => ({
      subject: cls.name,
      completed: cls.completed_assignments,
      total: cls.assignment_count,
      percentage: cls.assignment_count > 0 ? Math.round((cls.completed_assignments / cls.assignment_count) * 100) : 0
    }))

    // Recent activity (last 7 days)
    const recentActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const daySubmissions = assignmentsData.filter(a => 
        a.submissions?.some(s => 
          format(new Date(s.created_at), "yyyy-MM-dd") === format(date, "yyyy-MM-dd")
        )
      ).length

      recentActivity.push({
        date: format(date, "MMM dd"),
        submissions: daySubmissions
      })
    }

    setAnalytics({
      weeklyProgress: weeks,
      difficultyBreakdown,
      subjectPerformance,
      recentActivity
    })
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    const hasSubmission = assignment.submissions && assignment.submissions.length > 0
    const isOverdue = new Date(assignment.due_date) < new Date()

    if (hasSubmission) {
      return { status: "Submitted", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle }
    } else if (isOverdue) {
      return { status: "Overdue", color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle }
    } else {
      return { status: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock }
    }
  }

  const submittedCount = assignments.filter((a) => a.submissions && a.submissions.length > 0).length
  const pendingCount = assignments.filter((a) => !a.submissions || a.submissions.length === 0).length
  const overdueCount = assignments.filter((a) => 
    (!a.submissions || a.submissions.length === 0) && new Date(a.due_date) < new Date()
  ).length
  const completionRate = assignments.length > 0 ? Math.round((submittedCount / assignments.length) * 100) : 0

  // Calculate streak
  const calculateStreak = () => {
    // This is a simplified streak calculation
    const recentSubmissions = analytics.recentActivity.reverse()
    let streak = 0
    for (const day of recentSubmissions) {
      if (day.submissions > 0) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const streak = calculateStreak()

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <ModernDashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animation-delay-150"></div>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Welcome back, {profile?.full_name?.split(" ")[0]}! 🎬
                  </h1>
                  <p className="text-xl text-white/90 mb-6">Ready to continue your cinematic journey?</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-300" />
                      <span className="font-medium">{completionRate}% Complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-300" />
                      <span className="font-medium">{submittedCount} Submitted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-orange-300" />
                      <span className="font-medium">{streak} Day Streak</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Brain className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Assignments</p>
                    <p className="text-3xl font-bold text-blue-900">{assignments.length}</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">Completed</p>
                    <p className="text-3xl font-bold text-emerald-900">{submittedCount}</p>
                  </div>
                  <div className="p-3 bg-emerald-500 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-1">Pending</p>
                    <p className="text-3xl font-bold text-amber-900">{pendingCount}</p>
                  </div>
                  <div className="p-3 bg-amber-500 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">Overdue</p>
                    <p className="text-3xl font-bold text-red-900">{overdueCount}</p>
                  </div>
                  <div className="p-3 bg-red-500 rounded-xl">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Success Rate</p>
                    <p className="text-3xl font-bold text-purple-900">{completionRate}%</p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <School className="h-4 w-4" />
                My Classes
              </TabsTrigger>
              <TabsTrigger value="assignments" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Assignments
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* AI Tools Section */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">AI-Powered Learning Tools</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <MessageSquare className="h-8 w-8" />
                        <div className="p-2 bg-white/20 rounded-lg">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">AI Mentor</h3>
                      <p className="text-blue-100">Get personalized guidance and support</p>
                    </div>
                    <CardContent className="p-6">
                      <Link to="/ai-mentor">
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 group-hover:scale-105 transition-transform">
                          Start Conversation
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <Brain className="h-8 w-8" />
                        <div className="p-2 bg-white/20 rounded-lg">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Quiz Tool</h3>
                      <p className="text-purple-100">Test your knowledge with interactive quizzes</p>
                    </div>
                    <CardContent className="p-6">
                      <Link to="/quiz">
                        <Button className="w-full bg-purple-600 hover:bg-purple-700 group-hover:scale-105 transition-transform">
                          Take Quiz
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <FileText className="h-8 w-8" />
                        <div className="p-2 bg-white/20 rounded-lg">
                          <PlayCircle className="h-5 w-5" />
                        </div>
                      </div>
                      <h3 className="text-xl font-bold mb-2">Script Analyzer</h3>
                      <p className="text-emerald-100">Get detailed analysis and feedback</p>
                    </div>
                    <CardContent className="p-6">
                      <Link to="/script-analyzer">
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700 group-hover:scale-105 transition-transform">
                          Analyze Script
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Recent Activity Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Recent Activity (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.recentActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="submissions" 
                          stroke="#6366f1" 
                          fill="#6366f1" 
                          fillOpacity={0.3} 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="classes" className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <School className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
                <Badge variant="outline">{classes.length} enrolled</Badge>
              </div>

              {classes.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <School className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No classes enrolled</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      You're not enrolled in any classes yet. Contact your administrator to get enrolled.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classes.map((classItem) => (
                    <Card key={classItem.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <BookOpen className="h-5 w-5 text-indigo-600" />
                            </div>
                            <div>
                              <CardTitle className="text-lg text-indigo-900">{classItem.name}</CardTitle>
                              <Badge variant="secondary" className="mt-1">
                                Semester {classItem.semester}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>Teacher: {classItem.teacher.full_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>{classItem.assignment_count} Total Assignments</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4" />
                            <span>{classItem.completed_assignments} Completed</span>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-700">Progress</span>
                              <span className="text-sm text-gray-500">
                                {classItem.assignment_count > 0 
                                  ? Math.round((classItem.completed_assignments / classItem.assignment_count) * 100)
                                  : 0
                                }%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                                style={{ 
                                  width: `${classItem.assignment_count > 0 
                                    ? (classItem.completed_assignments / classItem.assignment_count) * 100 
                                    : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignments" className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                  <h2 className="text-2xl font-bold text-gray-900">Your Assignments</h2>
                </div>
                {assignments.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    {pendingCount} pending
                  </Badge>
                )}
              </div>

              {assignments.length === 0 ? (
                <Card className="border-0 shadow-lg">
                  <CardContent className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      New assignments will appear here when they're created by your instructors.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => {
                    const { status, color, icon: StatusIcon } = getAssignmentStatus(assignment)
                    const isOverdue = new Date(assignment.due_date) < new Date()

                    const shortDescription =
                      assignment.description.split(".")[0].substring(0, 100) +
                      (assignment.description.length > 100 ? "..." : "")

                    return (
                      <Card
                        key={assignment.id}
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">{assignment.title}</h3>
                                <Badge className={`${color} border`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status}
                                </Badge>
                                {new Date().getTime() - new Date(assignment.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                                    New
                                  </Badge>
                                )}
                                {assignment.difficulty && (
                                  <Badge 
                                    variant="outline" 
                                    className={
                                      assignment.difficulty === 'easy' ? 'border-green-300 text-green-700' :
                                      assignment.difficulty === 'medium' ? 'border-yellow-300 text-yellow-700' :
                                      'border-red-300 text-red-700'
                                    }
                                  >
                                    {assignment.difficulty.charAt(0).toUpperCase() + assignment.difficulty.slice(1)}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 mb-3 text-sm">
                                <div className="flex items-center gap-1 text-indigo-600">
                                  <School className="h-4 w-4" />
                                  {assignment.classes?.name}
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <User className="h-4 w-4" />
                                  {assignment.profiles?.full_name}
                                </div>
                                {assignment.topic && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Target className="h-4 w-4" />
                                    {assignment.topic}
                                  </div>
                                )}
                              </div>
                              <p className="text-gray-600 mb-3">{shortDescription}</p>
                              <div className="flex items-center gap-4 text-sm">
                                <div
                                  className={`flex items-center gap-1 ${isOverdue ? "text-red-600" : "text-gray-500"}`}
                                >
                                  <Calendar className="h-4 w-4" />
                                  Due: {format(new Date(assignment.due_date), "MMM dd, yyyy")}
                                </div>
                                <div className="flex items-center gap-1 text-gray-500">
                                  <Clock className="h-4 w-4" />
                                  Created: {format(new Date(assignment.created_at), "MMM dd, yyyy")}
                                </div>
                                {assignment.total_points && (
                                  <div className="flex items-center gap-1 text-gray-500">
                                    <Star className="h-4 w-4" />
                                    {assignment.total_points} points
                                  </div>
                                )}
                              </div>
                            </div>
                            <Link to={`/assignment/${assignment.id}`}>
                              <Button
                                className={`ml-6 ${
                                  assignment.submissions && assignment.submissions.length > 0
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-indigo-600 hover:bg-indigo-700"
                                }`}
                              >
                                {assignment.submissions && assignment.submissions.length > 0
                                  ? "View Submission"
                                  : "Start Assignment"}
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-900">Learning Analytics</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Weekly Progress Chart */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.weeklyProgress}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="week" />
                          <YAxis />
                          <Tooltip />
                          <Line 
                            type="monotone" 
                            dataKey="completed" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            name="Completed"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="assigned" 
                            stroke="#6366F1" 
                            strokeWidth={3}
                            name="Assigned"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Difficulty Breakdown */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-600" />
                      Assignment Difficulty
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Tooltip />
                          <Cell />
                          {analytics.difficultyBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 mt-4">
                      {analytics.difficultyBreakdown.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: entry.color }}
                          ></div>
                          <span className="text-sm text-gray-600">
                            {entry.name}: {entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Performance */}
                <Card className="border-0 shadow-lg lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-600" />
                      Performance by Subject
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.subjectPerformance} layout="horizontal">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="subject" type="category" width={150} />
                          <Tooltip 
                            formatter={(value: any, name: string) => [
                              `${value}%`, 
                              'Completion Rate'
                            ]}
                            labelFormatter={(label: string) => `Subject: ${label}`}
                          />
                          <Bar dataKey="percentage" fill="#6366F1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Performance Insights */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    Performance Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Trophy className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-green-900 mb-1">Best Performance</h3>
                      <p className="text-sm text-green-700">
                        {analytics.subjectPerformance.length > 0 
                          ? analytics.subjectPerformance.reduce((a, b) => a.percentage > b.percentage ? a : b).subject
                          : "No data yet"
                        }
                      </p>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Flame className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-blue-900 mb-1">Current Streak</h3>
                      <p className="text-sm text-blue-700">{streak} days</p>
                    </div>
                    
                    <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Target className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-purple-900 mb-1">Avg. Completion</h3>
                      <p className="text-sm text-purple-700">{completionRate}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}