"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import {
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  TrendingUp,
  Calendar,
  Award,
  ArrowRight,
  User,
  GraduationCap,
  BarChart3,
  PieChart,
  Activity,
  School,
  Star,
  Target,
  Plus,
  Eye,
  Edit,
  ClipboardCheck,
  UserCheck,
  BookMarked,
  Timer,
  Zap,
  Brain,
  MessageSquare,
  Download,
  Upload,
  ChevronRight,
  Globe,
  TrendingDown,
  PlayCircle,
  Flame,
  TrophyIcon
} from "lucide-react"
import { format, startOfWeek, endOfWeek, subWeeks, isWithinInterval, subDays } from "date-fns"
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
  RadialBarChart,
  RadialBar
} from "recharts"

interface TeacherClass {
  id: string
  name: string
  semester: number
  created_at: string
  student_count: number
  assignment_count: number
  avg_completion_rate: number
}

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  created_at: string
  class_id: string
  topic: string
  difficulty: string
  total_points: number
  status: string
  submission_count: number
  total_students: number
  avg_grade: number
  classes: {
    id: string
    name: string
    semester: number
  }
}

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  created_at: string
  ai_grade: number
  teacher_grade: number
  status: string
  file_name: string
  assignment: {
    title: string
    total_points: number
    classes: {
      name: string
    }
  }
  profiles: {
    full_name: string
  }
}

interface StudentPerformance {
  student_id: string
  student_name: string
  class_name: string
  submissions_count: number
  avg_grade: number
  completion_rate: number
}

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [studentPerformance, setStudentPerformance] = useState<StudentPerformance[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchTeacherClasses(),
        fetchTeacherAssignments(),
        fetchRecentSubmissions(),
        fetchStudentPerformance()
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

  const fetchTeacherClasses = async () => {
    try {
      const { data: classData } = await supabase
        .from("class_teachers")
        .select(`
          classes:class_id (
            id,
            name,
            semester,
            created_at
          )
        `)
        .eq("teacher_id", profile?.id)

      if (!classData?.length) {
        setClasses([])
        return
      }

      const classesWithDetails = await Promise.all(
        classData.map(async (item) => {
          const classInfo = item.classes

          // Get student count
          const { count: studentCount } = await supabase
            .from("class_students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id)

          // Get assignment count
          const { count: assignmentCount } = await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id)
            .eq("status", "published")

          // Calculate average completion rate
          const { data: assignmentIds } = await supabase
            .from("assignments")
            .select("id")
            .eq("class_id", classInfo.id)
            .eq("status", "published")

          let avgCompletionRate = 0
          if (assignmentIds?.length && studentCount) {
            const { count: totalSubmissions } = await supabase
              .from("submissions")
              .select("*", { count: "exact", head: true })
              .in("assignment_id", assignmentIds.map(a => a.id))

            const expectedSubmissions = assignmentIds.length * (studentCount || 0)
            avgCompletionRate = expectedSubmissions > 0 
              ? Math.min(Math.round(((totalSubmissions || 0) / expectedSubmissions) * 100), 100)
              : 0
          }

          return {
            id: classInfo.id,
            name: classInfo.name,
            semester: classInfo.semester,
            created_at: classInfo.created_at,
            student_count: studentCount || 0,
            assignment_count: assignmentCount || 0,
            avg_completion_rate: avgCompletionRate
          }
        })
      )

      setClasses(classesWithDetails)
    } catch (error) {
      console.error("Error fetching teacher classes:", error)
    }
  }

  const fetchTeacherAssignments = async () => {
    try {
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          *,
          classes:class_id (
            id,
            name,
            semester
          )
        `)
        .eq("teacher_id", profile?.id)
        .eq("status", "published")
        .order("created_at", { ascending: false })

      if (!assignmentsData?.length) {
        setAssignments([])
        return
      }

      const assignmentsWithStats = await Promise.all(
        assignmentsData.map(async (assignment) => {
          // Get submission count
          const { count: submissionCount } = await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("assignment_id", assignment.id)

          // Get total students in class
          const { count: totalStudents } = await supabase
            .from("class_students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", assignment.class_id)

          // Get average grade
          const { data: gradeData } = await supabase
            .from("submissions")
            .select("teacher_grade, ai_grade")
            .eq("assignment_id", assignment.id)
            .not("teacher_grade", "is", null)
            .not("ai_grade", "is", null)

          let avgGrade = 0
          if (gradeData?.length) {
            const totalGrade = gradeData.reduce((sum, sub) => 
              sum + (sub.teacher_grade || sub.ai_grade || 0), 0
            )
            avgGrade = Math.round(totalGrade / gradeData.length)
          }

          return {
            ...assignment,
            submission_count: submissionCount || 0,
            total_students: totalStudents || 0,
            avg_grade: avgGrade
          }
        })
      )

      setAssignments(assignmentsWithStats)
    } catch (error) {
      console.error("Error fetching teacher assignments:", error)
    }
  }

  const fetchRecentSubmissions = async () => {
    try {
      // Get assignments by this teacher
      const { data: teacherAssignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("teacher_id", profile?.id)

      if (!teacherAssignments?.length) {
        setSubmissions([])
        return
      }

      const assignmentIds = teacherAssignments.map(a => a.id)

      const { data: submissionsData } = await supabase
        .from("submissions")
        .select(`
          *,
          assignment:assignment_id (
            title,
            total_points,
            classes:class_id (
              name
            )
          ),
          profiles:student_id (
            full_name
          )
        `)
        .in("assignment_id", assignmentIds)
        .order("created_at", { ascending: false })
        .limit(20)

      setSubmissions(submissionsData || [])
    } catch (error) {
      console.error("Error fetching recent submissions:", error)
    }
  }

  const fetchStudentPerformance = async () => {
    try {
      // Get all students from teacher's classes
      const { data: teacherClasses } = await supabase
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", profile?.id)

      if (!teacherClasses?.length) {
        setStudentPerformance([])
        return
      }

      const classIds = teacherClasses.map(tc => tc.class_id)

      const { data: studentsData } = await supabase
        .from("class_students")
        .select(`
          student_id,
          class_id,
          classes:class_id (
            name
          ),
          profiles:student_id (
            full_name
          )
        `)
        .in("class_id", classIds)

      if (!studentsData?.length) {
        setStudentPerformance([])
        return
      }

      const studentStats = await Promise.all(
        studentsData.map(async (student) => {
          // Get assignments for this class
          const { data: classAssignments } = await supabase
            .from("assignments")
            .select("id")
            .eq("class_id", student.class_id)
            .eq("teacher_id", profile?.id)
            .eq("status", "published")

          const assignmentIds = classAssignments?.map(a => a.id) || []

          // Get student submissions
          const { data: studentSubmissions } = await supabase
            .from("submissions")
            .select("teacher_grade, ai_grade")
            .eq("student_id", student.student_id)
            .in("assignment_id", assignmentIds)

          const submissionsCount = studentSubmissions?.length || 0
          const totalAssignments = assignmentIds.length
          const completionRate = totalAssignments > 0 
            ? Math.min(Math.round((submissionsCount / totalAssignments) * 100), 100)
            : 0

          // Calculate average grade
          let avgGrade = 0
          if (studentSubmissions?.length) {
            const gradedSubmissions = studentSubmissions.filter(s => s.teacher_grade || s.ai_grade)
            if (gradedSubmissions.length > 0) {
              const totalGrade = gradedSubmissions.reduce((sum, sub) => 
                sum + (sub.teacher_grade || sub.ai_grade || 0), 0
              )
              avgGrade = Math.round(totalGrade / gradedSubmissions.length)
            }
          }

          return {
            student_id: student.student_id,
            student_name: student.profiles?.full_name || 'Unknown Student',
            class_name: student.classes?.name || 'Unknown Class',
            submissions_count: submissionsCount,
            avg_grade: avgGrade,
            completion_rate: completionRate
          }
        })
      )

      setStudentPerformance(studentStats)
    } catch (error) {
      console.error("Error fetching student performance:", error)
    }
  }

  // Analytics calculations
  const totalStudents = classes.reduce((sum, cls) => sum + cls.student_count, 0)
  const totalAssignments = assignments.length
  const totalSubmissions = submissions.length
  const pendingGrading = submissions.filter(s => s.status !== 'graded').length

  // Weekly submissions data
  const getWeeklySubmissions = () => {
    const weeks = []
    for (let i = 6; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i))
      const weekEnd = endOfWeek(weekStart)
      
      const weekSubmissions = submissions.filter(s => 
        isWithinInterval(new Date(s.created_at), { start: weekStart, end: weekEnd })
      )

      weeks.push({
        week: format(weekStart, "MMM dd"),
        submissions: weekSubmissions.length,
      })
    }
    return weeks
  }

  // Class performance data
  const getClassPerformance = () => {
    return classes.map(cls => ({
      name: cls.name.length > 15 ? cls.name.substring(0, 15) + '...' : cls.name,
      fullName: cls.name,
      students: cls.student_count,
      assignments: cls.assignment_count,
      completion: cls.avg_completion_rate
    }))
  }

  // Grade distribution
  const getGradeDistribution = () => {
    const gradedSubmissions = submissions.filter(s => s.teacher_grade || s.ai_grade)
    const total = gradedSubmissions.length
    
    if (total === 0) return []

    const excellent = gradedSubmissions.filter(s => (s.teacher_grade || s.ai_grade) >= 90).length
    const good = gradedSubmissions.filter(s => (s.teacher_grade || s.ai_grade) >= 80 && (s.teacher_grade || s.ai_grade) < 90).length
    const satisfactory = gradedSubmissions.filter(s => (s.teacher_grade || s.ai_grade) >= 70 && (s.teacher_grade || s.ai_grade) < 80).length
    const needsImprovement = gradedSubmissions.filter(s => (s.teacher_grade || s.ai_grade) < 70).length

    return [
      { name: 'Excellent (90+)', value: Math.min(Math.round((excellent / total) * 100), 100), count: excellent, fill: '#10B981' },
      { name: 'Good (80-89)', value: Math.min(Math.round((good / total) * 100), 100), count: good, fill: '#3B82F6' },
      { name: 'Satisfactory (70-79)', value: Math.min(Math.round((satisfactory / total) * 100), 100), count: satisfactory, fill: '#F59E0B' },
      { name: 'Needs Improvement (<70)', value: Math.min(Math.round((needsImprovement / total) * 100), 100), count: needsImprovement, fill: '#EF4444' }
    ]
  }

  // Assignment difficulty distribution
  const getDifficultyDistribution = () => {
    const total = assignments.length
    if (total === 0) return []

    const easy = assignments.filter(a => a.difficulty === 'easy').length
    const medium = assignments.filter(a => a.difficulty === 'medium').length
    const hard = assignments.filter(a => a.difficulty === 'hard').length

    return [
      { name: 'Easy', value: Math.min(Math.round((easy / total) * 100), 100), count: easy, fill: '#10B981' },
      { name: 'Medium', value: Math.min(Math.round((medium / total) * 100), 100), count: medium, fill: '#F59E0B' },
      { name: 'Hard', value: Math.min(Math.round((hard / total) * 100), 100), count: hard, fill: '#EF4444' }
    ]
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
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
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Welcome, {profile?.full_name?.split(" ")[0]}! 🎓
                  </h1>
                  <p className="text-xl text-white/90 mb-6">Empowering the next generation of filmmakers</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-300" />
                      <span className="font-medium">{totalStudents} Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-300" />
                      <span className="font-medium">{totalAssignments} Assignments</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="h-5 w-5 text-yellow-300" />
                      <span className="font-medium">{totalSubmissions} Submissions</span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <GraduationCap className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Stats and Quick Actions */}
            <div className="lg:col-span-4 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600 mb-1">Classes</p>
                        <p className="text-2xl font-bold text-blue-900">{classes.length}</p>
                      </div>
                      <School className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-600 mb-1">Students</p>
                        <p className="text-2xl font-bold text-emerald-900">{totalStudents}</p>
                      </div>
                      <Users className="h-8 w-8 text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600 mb-1">Assignments</p>
                        <p className="text-2xl font-bold text-purple-900">{totalAssignments}</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-amber-600 mb-1">Pending</p>
                        <p className="text-2xl font-bold text-amber-900">{pendingGrading}</p>
                      </div>
                      <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to="/teacher/create-assignment">
                    <Button className="w-full justify-start bg-indigo-600 hover:bg-indigo-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </Link>
                  <Link to="/teacher/classes">
                    <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                      <School className="h-4 w-4 mr-2" />
                      Manage Classes
                    </Button>
                  </Link>
                  <Link to="/teacher/assignments">
                    <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700">
                      <Eye className="h-4 w-4 mr-2" />
                      View All Assignments
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {/* Weekly Submissions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-600" />
                    Weekly Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getWeeklySubmissions()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
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
            </div>

            {/* Middle Column - Assignments and Classes */}
            <div className="lg:col-span-5 space-y-6">
              {/* Recent Assignments */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <BookMarked className="h-5 w-5 text-indigo-600" />
                      Recent Assignments
                    </CardTitle>
                    <Link to="/teacher/create-assignment">
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Create New
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {assignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 truncate flex-1 mr-2">
                            {assignment.title}
                          </h4>
                          <Badge 
                            className={
                              assignment.difficulty === 'easy' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : assignment.difficulty === 'medium'
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                  : 'bg-red-100 text-red-700 border-red-200'
                            }
                          >
                            {assignment.difficulty?.charAt(0).toUpperCase() + assignment.difficulty?.slice(1)}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <School className="h-3 w-3" />
                            {assignment.classes?.name}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {assignment.submission_count}/{assignment.total_students} submitted
                          </span>
                          <div className="flex items-center gap-2">
                            {assignment.avg_grade > 0 && (
                              <span className="text-green-600 font-medium">
                                Avg: {assignment.avg_grade}%
                              </span>
                            )}
                            <Link to={`/teacher/assignments`}>
                              <Button size="sm" variant="ghost">
                                View
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    {assignments.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No assignments created yet</p>
                        <Link to="/teacher/create-assignment">
                          <Button className="mt-3">Create Your First Assignment</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* My Classes */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <School className="h-5 w-5 text-indigo-600" />
                      My Classes
                    </CardTitle>
                    <Link to="/teacher/classes">
                      <Button size="sm" variant="outline">
                        Manage All
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {classes.map((classItem) => (
                      <div key={classItem.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{classItem.name}</h4>
                          <Badge variant="secondary">Sem {classItem.semester}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {classItem.student_count} students
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {classItem.assignment_count} assignments
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {classItem.avg_completion_rate}% completion
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(classItem.avg_completion_rate, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {classes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <School className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No classes assigned yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Analytics and Recent Activity */}
            <div className="lg:col-span-3 space-y-6">
              {/* Grade Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-600" />
                    Grade Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getGradeDistribution().length > 0 ? (
                    <>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Tooltip 
                              formatter={(value: any, name: string) => [`${value}%`, name]}
                            />
                            {getGradeDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {getGradeDistribution().map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: entry.fill }}
                              ></div>
                              <span className="text-gray-600">{entry.name}</span>
                            </div>
                            <span className="font-medium">{entry.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No graded submissions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Assignment Difficulty */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    Assignment Difficulty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {getDifficultyDistribution().length > 0 ? (
                    <>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Tooltip 
                              formatter={(value: any, name: string) => [`${value}%`, name]}
                            />
                            {getDifficultyDistribution().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {getDifficultyDistribution().map((entry) => (
                          <div key={entry.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: entry.fill }}
                              ></div>
                              <span className="text-gray-600">{entry.name}</span>
                            </div>
                            <span className="font-medium">{entry.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No assignments created yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Submissions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                    Recent Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {submissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                            {submission.assignment?.title || 'Unknown Assignment'}
                          </h5>
                          <Badge 
                            className={`text-xs ${
                              submission.status === 'graded' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}
                          >
                            {submission.status === 'graded' ? 'Graded' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {submission.profiles?.full_name} • {submission.assignment?.classes?.name}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {format(new Date(submission.created_at), "MMM dd")}
                          </span>
                          {(submission.teacher_grade || submission.ai_grade) && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {submission.teacher_grade || submission.ai_grade}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {submissions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <ClipboardCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No submissions yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Class Performance Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrophyIcon className="h-5 w-5 text-yellow-600" />
                Class Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {getClassPerformance().length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getClassPerformance()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'students') return [`${value}`, 'Students']
                          if (name === 'assignments') return [`${value}`, 'Assignments']
                          if (name === 'completion') return [`${value}%`, 'Completion Rate']
                          return [value, name]
                        }}
                        labelFormatter={(label: string) => {
                          const item = getClassPerformance().find(c => c.name === label)
                          return item ? item.fullName : label
                        }}
                      />
                      <Bar dataKey="students" fill="#3B82F6" name="students" />
                      <Bar dataKey="assignments" fill="#10B981" name="assignments" />
                      <Bar dataKey="completion" fill="#6366F1" name="completion" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No classes to display</h3>
                  <p>Classes will appear here once you're assigned to teach them.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Performance Section */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Top Performing Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {studentPerformance
                  .filter(student => student.avg_grade > 0)
                  .sort((a, b) => b.avg_grade - a.avg_grade)
                  .slice(0, 6)
                  .map((student) => (
                    <div key={student.student_id} className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{student.student_name}</h4>
                          <p className="text-sm text-gray-600">{student.class_name}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Average Grade:</span>
                          <span className="font-medium text-green-600">{student.avg_grade}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completion Rate:</span>
                          <span className="font-medium text-blue-600">{student.completion_rate}%</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Submissions:</span>
                          <span className="font-medium text-gray-700">{student.submissions_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                {studentPerformance.filter(s => s.avg_grade > 0).length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <UserCheck className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No student performance data available yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignments Requiring Attention */}
          {assignments.filter(a => a.submission_count < a.total_students && new Date(a.due_date) < new Date()).length > 0 && (
            <Card className="border-0 shadow-lg border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-5 w-5" />
                  Assignments Requiring Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignments
                    .filter(a => a.submission_count < a.total_students && new Date(a.due_date) < new Date())
                    .slice(0, 6)
                    .map((assignment) => (
                      <div key={assignment.id} className="border border-amber-200 rounded-lg p-4 bg-amber-50">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-600" />
                          <h4 className="font-semibold text-gray-900 truncate flex-1">
                            {assignment.title}
                          </h4>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1 mb-1">
                            <School className="h-3 w-3" />
                            {assignment.classes?.name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Due: {format(new Date(assignment.due_date), "MMM dd, yyyy")}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-amber-700 font-medium">
                            {assignment.submission_count}/{assignment.total_students} submitted
                          </span>
                          <Link to="/teacher/assignments">
                            <Button size="sm" variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                              Review
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}