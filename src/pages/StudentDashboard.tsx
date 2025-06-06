"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
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
} from "lucide-react"
import { format } from "date-fns"

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  created_at: string
  submissions?: any[]
}

export default function StudentDashboard() {
  const { profile } = useAuth()
  console.log("PROFILE", profile)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.id && profile?.semester) {
      fetchAssignments()
    }
  }, [profile])

  const fetchAssignments = async () => {
    try {
      // First get assignments for the student's semester
      const studentSemester = profile?.semester
      
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          *,
          submissions(*)
        `)
        .eq("semester", studentSemester) // Only get assignments for student's semester
        .eq("status", "published") // Only get published assignments
        .order("created_at", { ascending: false }) // Order by creation date, latest first

      // Filter submissions to only include current student's submissions
      const assignmentsWithUserSubmissions = assignmentsData?.map(assignment => ({
        ...assignment,
        submissions: assignment.submissions?.filter(sub => sub.student_id === profile?.id) || []
      })) || []

      setAssignments(assignmentsWithUserSubmissions)
    } catch (error) {
      console.error("Error fetching assignments:", error)
    } finally {
      setLoading(false)
    }
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
  const completionRate = assignments.length > 0 ? Math.round((submittedCount / assignments.length) * 100) : 0

  // Get only first 2 assignments for dashboard display (these will be the latest)
  const displayedAssignments = assignments.slice(0, 2)

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">Welcome back, {profile?.full_name?.split(" ")[0]}! 🎬</h1>
                  <p className="text-xl text-white/90 mb-6">Ready to continue your screenwriting journey?</p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-300" />
                      <span className="font-medium">{completionRate}% Complete</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-300" />
                      <span className="font-medium">{submittedCount} Submitted</span>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  <p className="text-blue-100">Get personalized guidance and support from your AI mentor</p>
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
                  <p className="text-purple-100">Test your knowledge with interactive quizzes on any topic</p>
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
                  <p className="text-emerald-100">Get detailed analysis and feedback on your scripts</p>
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

          <div>
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

            {loading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading your assignments...</p>
                </CardContent>
              </Card>
            ) : assignments.length === 0 ? (
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
              <div className="space-y-6">
                {/* Assignment Cards - Show only first 2 (latest) */}
                <div className="space-y-4">
                  {displayedAssignments.map((assignment) => {
                    const { status, color, icon: StatusIcon } = getAssignmentStatus(assignment)
                    const isOverdue = new Date(assignment.due_date) < new Date()

                    // Get first line of description (up to first period or 100 characters)
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
                                {/* New badge to show recently created assignments */}
                                {new Date().getTime() - new Date(assignment.created_at).getTime() < 7 * 24 * 60 * 60 * 1000 && (
                                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                                    New
                                  </Badge>
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
                              </div>
                            </div>
                            {/* <Link to={`/assignment/${assignment.id}`}>
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
                            </Link> */}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
                {assignments.length > 2 && (
                  <div className="text-center pt-4">
                    <Link to="/student/assignments">
                      <Button
                        variant="outline"
                        className="bg-white hover:bg-gray-50 border-2 border-indigo-200 hover:border-indigo-300 text-indigo-600 hover:text-indigo-700 px-6 py-2 h-auto text-md font-medium"
                      >
                        See All Assignments ({assignments.length})
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
