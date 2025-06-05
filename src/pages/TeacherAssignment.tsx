"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/integrations/supabase/client"
import {
  BookOpen,
  Search,
  Plus,
  Calendar,
  Users,
  FileText,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  Grid3X3,
  List,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Target,
  GraduationCap,
  ArrowUpDown,
  SortAsc,
  SortDesc,
} from "lucide-react"
import { format, isAfter, isBefore, addDays } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  created_at: string
  subject?: string
  difficulty?: string
  status: "draft" | "published" | "closed"
  submissions: any[]
  total_points?: number
  estimated_time?: number
}

interface AssignmentStats {
  total: number
  published: number
  draft: number
  closed: number
  totalSubmissions: number
  averageSubmissions: number
  upcomingDeadlines: number
}

export default function AssignmentsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [filteredAssignments, setFilteredAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [subjectFilter, setSubjectFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    published: 0,
    draft: 0,
    closed: 0,
    totalSubmissions: 0,
    averageSubmissions: 0,
    upcomingDeadlines: 0,
  })

  useEffect(() => {
    fetchAssignments()
  }, [])

  useEffect(() => {
    filterAndSortAssignments()
  }, [assignments, searchTerm, statusFilter, subjectFilter, sortBy, sortOrder])

  const fetchAssignments = async () => {
    try {
      setLoading(true)
      const { data: assignmentsData, error } = await supabase
        .from("assignments")
        .select(`
          *,
          submissions(*)
        `)
        .eq("teacher_id", profile?.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      type DbAssignment = {
        id: string
        title: string
        description: string
        due_date: string
        created_at: string
        teacher_id: string
        updated_at: string
        status?: "published" | "draft" | "closed"
        subject?: string
        difficulty?: string
        total_points?: number
        estimated_time?: number
        submissions: any[]
      }

      const processedAssignments = (assignmentsData || []).map((assignment: DbAssignment): Assignment => ({
        ...assignment,
        status: assignment.status || "draft",
      }))

      setAssignments(processedAssignments)
      calculateStats(processedAssignments)
    } catch (error) {
      console.error("Error fetching assignments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch assignments. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (assignmentsList: Assignment[]) => {
    const total = assignmentsList.length
    const published = assignmentsList.filter((a) => a.status === "published").length
    const draft = assignmentsList.filter((a) => a.status === "draft").length
    const closed = assignmentsList.filter((a) => a.status === "closed").length
    const totalSubmissions = assignmentsList.reduce((acc, a) => acc + a.submissions.length, 0)
    const averageSubmissions = total > 0 ? Math.round(totalSubmissions / total) : 0
    const upcomingDeadlines = assignmentsList.filter((a) => {
      const dueDate = new Date(a.due_date)
      const nextWeek = addDays(new Date(), 7)
      return isAfter(dueDate, new Date()) && isBefore(dueDate, nextWeek)
    }).length

    setStats({
      total,
      published,
      draft,
      closed,
      totalSubmissions,
      averageSubmissions,
      upcomingDeadlines,
    })
  }

  const filterAndSortAssignments = () => {
    let filtered = [...assignments]

    if (searchTerm) {
      filtered = filtered.filter(
        (assignment) =>
          assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assignment.subject?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }


    if (statusFilter !== "all") {
      filtered = filtered.filter((assignment) => assignment.status === statusFilter)
    }

    if (subjectFilter !== "all") {
      filtered = filtered.filter((assignment) => assignment.subject === subjectFilter)
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Assignment]
      let bValue: any = b[sortBy as keyof Assignment]

      if (sortBy === "submissions") {
        aValue = a.submissions.length
        bValue = b.submissions.length
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredAssignments(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-50 text-green-700 border-green-200"
      case "draft":
        return "bg-yellow-50 text-yellow-700 border-yellow-200"
      case "closed":
        return "bg-gray-50 text-gray-700 border-gray-200"
      default:
        return "bg-blue-50 text-blue-700 border-blue-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return <CheckCircle className="h-3 w-3" />
      case "draft":
        return <Clock className="h-3 w-3" />
      case "closed":
        return <AlertCircle className="h-3 w-3" />
      default:
        return <FileText className="h-3 w-3" />
    }
  }

  const getDueDateStatus = (dueDate: string) => {
    const due = new Date(dueDate)
    const now = new Date()
    const daysDiff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 3600 * 24))

    if (daysDiff < 0) {
      return { text: "Overdue", color: "text-red-600", bgColor: "bg-red-50" }
    } else if (daysDiff === 0) {
      return { text: "Due Today", color: "text-orange-600", bgColor: "bg-orange-50" }
    } else if (daysDiff <= 3) {
      return { text: `Due in ${daysDiff} days`, color: "text-yellow-600", bgColor: "bg-yellow-50" }
    } else {
      return { text: `Due in ${daysDiff} days`, color: "text-green-600", bgColor: "bg-green-50" }
    }
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
      return
    }

    try {
      const { error } = await supabase.from("assignments").delete().eq("id", assignmentId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Assignment deleted successfully.",
      })

      fetchAssignments()
    } catch (error) {
      console.error("Error deleting assignment:", error)
      toast({
        title: "Error",
        description: "Failed to delete assignment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateAssignment = async (assignment: Assignment) => {
    try {
      const { error } = await supabase.from("assignments").insert({
        title: `${assignment.title} (Copy)`,
        description: assignment.description,
        due_date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
        teacher_id: profile?.id,
        subject: assignment.subject,
        difficulty: assignment.difficulty,
        total_points: assignment.total_points,
        estimated_time: assignment.estimated_time,
        status: "draft",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Assignment duplicated successfully.",
      })

      fetchAssignments()
    } catch (error) {
      console.error("Error duplicating assignment:", error)
      toast({
        title: "Error",
        description: "Failed to duplicate assignment. Please try again.",
        variant: "destructive",
      })
    }
  }

  const uniqueSubjects = Array.from(new Set(assignments.map((a) => a.subject).filter(Boolean)))

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <GraduationCap className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Loading assignments...</p>
                <p className="text-sm text-muted-foreground">Fetching your assignment history</p>
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                      <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">Assignment History</h1>
                      <p className="text-white/90 text-lg">Manage and track all your created assignments</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {stats.total} Total Assignments
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {stats.totalSubmissions} Total Submissions
                    </div>
                  </div>
                </div>
              
              </div>
            </div>
            <div className="absolute top-4 right-4 opacity-20">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>


          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search assignments..."
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
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  {uniqueSubjects.length > 0 && (
                    <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                      <SelectTrigger className="w-full md:w-40">
                        <SelectValue placeholder="Subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {uniqueSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject!}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

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
                      <DropdownMenuItem onClick={() => setSortBy("created_at")}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Date Created
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("due_date")}>
                        <Clock className="h-4 w-4 mr-2" />
                        Due Date
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("title")}>
                        <FileText className="h-4 w-4 mr-2" />
                        Title
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("submissions")}>
                        <Users className="h-4 w-4 mr-2" />
                        Submissions
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

                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignments Display */}
          {filteredAssignments.length === 0 ? (
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
              <CardContent className="text-center py-12">
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== "all" || subjectFilter !== "all"
                    ? "No assignments found"
                    : "No assignments yet"}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || statusFilter !== "all" || subjectFilter !== "all"
                    ? "Try adjusting your search criteria or filters to find assignments."
                    : "Create your first assignment to get started with managing your classroom activities."}
                </p>
                {!searchTerm && statusFilter === "all" && subjectFilter === "all" && (
                  <Link to="/teacher/assignments/new">
                    <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={cn(viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4")}>
              {filteredAssignments.map((assignment) => {
                const dueDateStatus = getDueDateStatus(assignment.due_date)

                if (viewMode === "list") {
                  return (
                    <Card
                      key={assignment.id}
                      className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50"
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                                  <Badge className={cn("text-xs", getStatusColor(assignment.status))}>
                                    {getStatusIcon(assignment.status)}
                                    <span className="ml-1 capitalize">{assignment.status}</span>
                                  </Badge>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 line-clamp-2">{assignment.description}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Created {format(new Date(assignment.created_at), "MMM dd, yyyy")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span className={dueDateStatus.color}>
                                      Due {format(new Date(assignment.due_date), "MMM dd, yyyy")}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {assignment.submissions.length} submissions
                                  </div>
                                  {assignment.subject && (
                                    <Badge variant="outline" className="text-xs">
                                      {assignment.subject}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Link to={`/teacher/assignments/${assignment.id}`}>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </Link>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link to={`/teacher/assignments/${assignment.id}/edit`}>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicateAssignment(assignment)}>
                                      <Copy className="h-4 w-4 mr-2" />
                                      Duplicate
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                      <Download className="h-4 w-4 mr-2" />
                                      Export
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteAssignment(assignment.id)}
                                      className="text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                }

                return (
                  <Card
                    key={assignment.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 group"
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("text-xs", getStatusColor(assignment.status))}>
                              {getStatusIcon(assignment.status)}
                              <span className="ml-1 capitalize">{assignment.status}</span>
                            </Badge>
                            {assignment.subject && (
                              <Badge variant="outline" className="text-xs">
                                {assignment.subject}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                            {assignment.title}
                          </CardTitle>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/teacher/assignments/${assignment.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicateAssignment(assignment)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Export
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">{assignment.description}</p>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Calendar className="h-4 w-4" />
                            Created {format(new Date(assignment.created_at), "MMM dd")}
                          </div>
                          <div
                            className={cn(
                              "flex items-center gap-1 text-sm px-2 py-1 rounded-full",
                              dueDateStatus.bgColor,
                            )}
                          >
                            <Clock className="h-3 w-3" />
                            <span className={dueDateStatus.color}>{dueDateStatus.text}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Users className="h-4 w-4" />
                            {assignment.submissions.length} submissions
                          </div>
                          <Link to={`/teacher/assignments/${assignment.id}`}>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View Details
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Results Summary */}
          {filteredAssignments.length > 0 && (
            <div className="text-center text-sm text-gray-500">
              Showing {filteredAssignments.length} of {assignments.length} assignments
            </div>
          )}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
