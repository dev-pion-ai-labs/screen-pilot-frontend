"use client"

import { useState, useEffect } from "react"
import { AuthGuard } from "@/components/AuthGuard"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import { Users, FileText, Settings, Trash2, UserPlus, BookOpen, GraduationCap, School, Edit } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { Json } from "@/integrations/supabase/types"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"

interface User {
  id: string
  email: string
  full_name: string
  role: "admin" | "teacher" | "student"
  semester?: number
  created_at: string
  updated_at: string
}

interface Assignment {
  id: string
  title: string
  description: string
  teacher_id: string
  semester: number
  due_date: string
  total_points: number
  created_at: string
  status: string
}

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  grade?: number
  status: string
  created_at: string
  updated_at: string
  ai_evaluation?: Json
  ai_feedback?: Json
  file_name?: string
  file_path?: string
  script_url?: string
  teacher_feedback?: string
  teacher_grade?: number
}

const AdminDashboard = () => {
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch users (profiles)
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (profilesError) throw profilesError

      // Fetch assignments
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from("assignments")
        .select("*")
        .order("created_at", { ascending: false })

      if (assignmentsError) throw assignmentsError

      // Fetch submissions
      const { data: submissionsData, error: submissionsError } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false })

      if (submissionsError) throw submissionsError

      // Type cast and map the data properly
      const typedUsers: User[] = (profilesData || []).map((profile) => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role as "admin" | "teacher" | "student",
        semester: profile.semester || undefined,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      }))

      const typedSubmissions: Submission[] = (submissionsData || []).map((submission) => ({
        id: submission.id,
        assignment_id: submission.assignment_id,
        student_id: submission.student_id,
        submitted_at: submission.submission_date || submission.created_at,
        grade: submission.grade || undefined,
        status: submission.status || "submitted",
        created_at: submission.created_at,
        updated_at: submission.updated_at,
        ai_evaluation: submission.ai_evaluation,
        ai_feedback: submission.ai_feedback,
        file_name: submission.file_name || undefined,
        file_path: submission.file_path || undefined,
        script_url: submission.script_url || undefined,
        teacher_feedback: submission.teacher_feedback || undefined,
        teacher_grade: submission.teacher_grade || undefined,
      }))

      setUsers(typedUsers)
      setAssignments(assignmentsData || [])
      setSubmissions(typedSubmissions)
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

  const deleteUser = async (userId: string) => {
    // Show confirmation dialog
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user? This action cannot be undone and will also delete all related data (assignments, submissions, etc.)."
    )
    
    if (!confirmDelete) return

    try {
      // First, try to delete related data
      // Delete user's submissions
      const { error: submissionsError } = await supabase
        .from("submissions")
        .delete()
        .eq("student_id", userId)

      if (submissionsError) {
        console.error("Error deleting submissions:", submissionsError)
        // Continue anyway, as submissions might not exist
      }

      // Delete user's assignments (if they're a teacher)
      const { error: assignmentsError } = await supabase
        .from("assignments")
        .delete()
        .eq("teacher_id", userId)

      if (assignmentsError) {
        console.error("Error deleting assignments:", assignmentsError)
        // Continue anyway, as assignments might not exist
      }

      // Finally, delete the user profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId)

      if (profileError) throw profileError

      // For complete user deletion from Supabase Auth, you need admin privileges
      // This would require a server-side function or Supabase Admin API
      // For now, we're just deleting the profile

      toast({
        title: "Success",
        description: "User and related data deleted successfully",
      })

      fetchDashboardData()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: `Failed to delete user: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0"
      case "teacher":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
      case "student":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0"
    }
  }

  const getAssignmentStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0"
      case "draft":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
      case "archived":
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0"
      default:
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
    }
  }

  const getSubmissionStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "graded":
        return "bg-gradient-to-r from-purple-500 to-violet-500 text-white border-0"
      case "submitted":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0"
      case "pending":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0"
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-500 text-white border-0"
    }
  }

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  const getStudentName = (studentId: string) => {
    const student = users.find(user => user.id === studentId)
    return student ? student.full_name : studentId.substring(0, 8) + "..."
  }

  const getAssignmentTitle = (assignmentId: string) => {
    const assignment = assignments.find(assign => assign.id === assignmentId)
    return assignment ? assignment.title : assignmentId.substring(0, 8) + "..."
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
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

  const totalUsers = users.length
  const totalTeachers = users.filter((u) => u.role === "teacher").length
  const totalStudents = users.filter((u) => u.role === "student").length
  const totalAssignments = assignments.length
  const totalSubmissions = submissions.length

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="space-y-8 p-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">Manage users, assignments, and system settings</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-gray-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    Total Users
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                      <School className="h-4 w-4 text-white" />
                    </div>
                    Teachers
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">{totalTeachers}</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <GraduationCap className="h-4 w-4 text-white" />
                    </div>
                    Students
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">{totalStudents}</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-violet-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">{totalAssignments}</div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg">
                      <FileText className="h-4 w-4 text-white" />
                    </div>
                    Submissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">{totalSubmissions}</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
              <Tabs defaultValue="users" className="w-full">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
                  <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-1">
                    <TabsTrigger
                      value="users"
                      className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Users
                    </TabsTrigger>
                    <TabsTrigger
                      value="assignments"
                      className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Assignments
                    </TabsTrigger>
                    <TabsTrigger
                      value="submissions"
                      className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Submissions
                    </TabsTrigger>
                    
                  </TabsList>
                </div>

                <TabsContent value="users" className="p-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                      <p className="text-gray-600">Manage users, assignments, and system settings</p>
                    </div>
                   
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-50 hover:to-blue-50 border-0">
                          <TableHead className="font-semibold text-gray-700">Name</TableHead>
                          <TableHead className="font-semibold text-gray-700">Email</TableHead>
                          <TableHead className="font-semibold text-gray-700">Role</TableHead>
                          <TableHead className="font-semibold text-gray-700">Semester</TableHead>
                          <TableHead className="font-semibold text-gray-700">Created</TableHead>
                          <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow
                            key={user.id}
                            className="hover:bg-blue-50/50 transition-colors duration-200 border-0"
                          >
                            <TableCell className="font-medium text-gray-900">{user.full_name}</TableCell>
                            <TableCell className="text-gray-600">{user.email}</TableCell>
                            <TableCell>
                              <Badge className={getRoleBadgeColor(user.role)}>
                                {capitalizeFirstLetter(user.role)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{user.semester || "N/A"}</TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(user.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="hover:bg-blue-50 border-blue-200">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteUser(user.id)}
                                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="assignments" className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Assignment Overview</h2>
                    <p className="text-gray-600">Manage users, assignments, and system settings</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-50 hover:to-pink-50 border-0">
                          <TableHead className="font-semibold text-gray-700">Title</TableHead>
                          <TableHead className="font-semibold text-gray-700">Semester</TableHead>
                          <TableHead className="font-semibold text-gray-700">Due Date</TableHead>
                          <TableHead className="font-semibold text-gray-700">Points</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                          <TableHead className="font-semibold text-gray-700">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment) => (
                          <TableRow
                            key={assignment.id}
                            className="hover:bg-purple-50/50 transition-colors duration-200 border-0"
                          >
                            <TableCell className="font-medium text-gray-900">{assignment.title}</TableCell>
                            <TableCell className="text-gray-600">Semester {assignment.semester}</TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(assignment.due_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gray-600">{assignment.total_points}</TableCell>
                            <TableCell>
                              <Badge className={getAssignmentStatusBadgeColor(assignment.status)}>
                                {capitalizeFirstLetter(assignment.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(assignment.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="submissions" className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Submission Overview</h2>
                    <p className="text-gray-600">Manage users, assignments, and system settings</p>
                  </div>

                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-green-50 to-teal-50 hover:from-green-50 hover:to-teal-50 border-0">
                          <TableHead className="font-semibold text-gray-700">Assignment</TableHead>
                          <TableHead className="font-semibold text-gray-700">Student</TableHead>
                          <TableHead className="font-semibold text-gray-700">Submitted</TableHead>
                          <TableHead className="font-semibold text-gray-700">Grade</TableHead>
                          <TableHead className="font-semibold text-gray-700">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {submissions.map((submission) => (
                          <TableRow
                            key={submission.id}
                            className="hover:bg-green-50/50 transition-colors duration-200 border-0"
                          >
                            <TableCell className="text-gray-600">
                              {getAssignmentTitle(submission.assignment_id)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {getStudentName(submission.student_id)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {new Date(submission.submitted_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-gray-600">{submission.grade || "Not graded"}</TableCell>
                            <TableCell>
                              <Badge className={getSubmissionStatusBadgeColor(submission.status)}>
                                {capitalizeFirstLetter(submission.status)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}

export default AdminDashboard