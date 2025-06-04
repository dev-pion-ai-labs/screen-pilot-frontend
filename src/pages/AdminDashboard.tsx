"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Users,
  Loader2,
  BarChartIcon as ChartBarIcon,
  BookOpen,
  TrendingUp,
  Calendar,
  Search,
  Filter,
  Plus,
  Eye,
  Activity,
  Award,
  Clock,
  FileText,
  UserPlus,
  Settings,
  BarChart3,
} from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

interface User {
  id: string
  full_name: string
  email: string
  role: "admin" | "teacher" | "student"
  created_at: string
  subject?: string
  grade?: string
}

interface Assignment {
  id: string
  title: string
  description?: string
  teacher_id: string
  created_at: string
  due_date?: string
}

interface Submission {
  id: string
  assignment_id: string
  student_id: string
  submitted_at: string
  status: string
}

interface Stats {
  totalUsers: number
  totalAssignments: number
  totalSubmissions: number
  studentCount: number
  teacherCount: number
  submissionRate: number
}

interface NewUser {
  full_name: string
  email: string
  password: string
  role: "teacher" | "student"
  subject?: string
  grade?: string
}

interface ChartData {
  roleDistribution: { role: string; count: number }[]
  monthlyActivity: { month: string; assignments: number; submissions: number }[]
  submissionTrends: { status: string; count: number }[]
}

export default function AdminDashboard() {
  const { profile } = useAuth()
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState<NewUser>({
    full_name: "",
    email: "",
    password: "",
    role: "student",
    subject: "",
    grade: "",
  })
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    studentCount: 0,
    teacherCount: 0,
    submissionRate: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  const { toast } = useToast()

  const chartData: ChartData = useMemo(() => {
    const roleDistribution = [
      { role: "Students", count: stats.studentCount },
      { role: "Teachers", count: stats.teacherCount },
    ]

    const submissionTrends = [
      { status: "Submitted", count: stats.totalSubmissions },
      { status: "Pending", count: Math.max(0, stats.totalAssignments - stats.totalSubmissions) },
    ]

    const monthlyActivity = [
      {
        month: "Jan",
        assignments: Math.floor(stats.totalAssignments * 0.1),
        submissions: Math.floor(stats.totalSubmissions * 0.1),
      },
      {
        month: "Feb",
        assignments: Math.floor(stats.totalAssignments * 0.15),
        submissions: Math.floor(stats.totalSubmissions * 0.15),
      },
      {
        month: "Mar",
        assignments: Math.floor(stats.totalAssignments * 0.2),
        submissions: Math.floor(stats.totalSubmissions * 0.2),
      },
      {
        month: "Apr",
        assignments: Math.floor(stats.totalAssignments * 0.25),
        submissions: Math.floor(stats.totalSubmissions * 0.25),
      },
      {
        month: "May",
        assignments: Math.floor(stats.totalAssignments * 0.3),
        submissions: Math.floor(stats.totalSubmissions * 0.3),
      },
      {
        month: "Jun",
        assignments: Math.floor(stats.totalAssignments * 0.4),
        submissions: Math.floor(stats.totalSubmissions * 0.4),
      },
    ]

    return {
      roleDistribution,
      monthlyActivity,
      submissionTrends,
    }
  }, [stats])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch all data in parallel
      const [
        { data: usersData, error: usersError },
        { data: assignmentsData, error: assignmentsError },
        { data: submissionsData, error: submissionsError },
        { count: totalUsers },
        { count: studentCount },
        { count: teacherCount },
        { count: totalAssignments },
        { count: totalSubmissions },
      ] = await Promise.all([
        supabase.from("profiles").select("*").limit(100),
        supabase.from("assignments").select("*").limit(100),
        supabase.from("submissions").select("*").limit(100),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
        supabase.from("assignments").select("*", { count: "exact", head: true }),
        supabase.from("submissions").select("*", { count: "exact", head: true }),
      ])

      if (usersError) throw usersError
      if (assignmentsError) throw assignmentsError
      if (submissionsError) throw submissionsError

      setUsers(usersData || [])
      setAssignments(assignmentsData || [])
      setSubmissions(submissionsData || [])

      const submissionRate =
        totalAssignments && totalAssignments > 0 ? Math.round(((totalSubmissions || 0) / totalAssignments) * 100) : 0

      setStats({
        totalUsers: totalUsers || 0,
        totalAssignments: totalAssignments || 0,
        totalSubmissions: totalSubmissions || 0,
        studentCount: studentCount || 0,
        teacherCount: teacherCount || 0,
        submissionRate,
      })
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading && users.length === 0) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary/40 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Loading Dashboard</p>
                <p className="text-muted-foreground">Fetching latest data...</p>
              </div>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Manage your Screen Pilot platform with powerful insights
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/admin/users">
                <Button variant="outline" className="group hover:scale-105 transition-all duration-200">
                  <Users className="mr-2 h-4 w-4" />
                  Manage Users
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <div className="p-2 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={75} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">75% active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.studentCount} students, {stats.teacherCount} teachers
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
                <div className="p-2 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <BookOpen className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.totalAssignments}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={60} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">60% active</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Created by teachers</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
                <div className="p-2 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{stats.totalSubmissions}</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={stats.submissionRate} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">{stats.submissionRate}% rate</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Student submissions</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Activity</CardTitle>
                <div className="p-2 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{stats.submissionRate}%</div>
                <div className="flex items-center gap-2 mt-2">
                  <Progress value={stats.submissionRate} className="flex-1 h-2" />
                  <span className="text-xs text-muted-foreground">
                    {stats.submissionRate > 70 ? "High" : stats.submissionRate > 40 ? "Medium" : "Low"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Submission rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabs Section */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-fit bg-white">
              <TabsTrigger value="overview" className="flex items-center gap-2 bg-white">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              {/* <TabsTrigger value="analytics" className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="activity" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Activity
              </TabsTrigger> */}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Recent Users
                    </CardTitle>
                    <CardDescription>Recently registered users</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.length > 0 ? (
                            users.slice(0, 5).map((user) => (
                              <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-medium text-primary">
                                        {user.full_name?.charAt(0).toUpperCase() || "U"}
                                      </span>
                                    </div>
                                    {user.full_name || "Unknown"}
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant={user.role === "teacher" ? "default" : "secondary"}>{user.role}</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                No users found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      Recent Assignments
                    </CardTitle>
                    <CardDescription>Recently created assignments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>Title</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignments.length > 0 ? (
                            assignments.slice(0, 5).map((assignment) => (
                              <TableRow key={assignment.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">{assignment.title}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {new Date(assignment.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">Active</Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                No assignments found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      User Distribution
                    </CardTitle>
                    <CardDescription>Platform users by role</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Users",
                          color: "hsl(var(--chart-1))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.roleDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ role, count }) => `${role}: ${count}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {chartData.roleDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Submission Status
                    </CardTitle>
                    <CardDescription>Assignment submission overview</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        count: {
                          label: "Count",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.submissionTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Platform Activity Trends
                    </CardTitle>
                    <CardDescription>Monthly assignments and submissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        assignments: {
                          label: "Assignments",
                          color: "hsl(var(--chart-1))",
                        },
                        submissions: {
                          label: "Submissions",
                          color: "hsl(var(--chart-2))",
                        },
                      }}
                      className="h-[300px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.monthlyActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Area
                            type="monotone"
                            dataKey="assignments"
                            stackId="1"
                            stroke="var(--color-assignments)"
                            fill="var(--color-assignments)"
                            fillOpacity={0.6}
                          />
                          <Area
                            type="monotone"
                            dataKey="submissions"
                            stackId="1"
                            stroke="var(--color-submissions)"
                            fill="var(--color-submissions)"
                            fillOpacity={0.6}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <CardTitle>User Management</CardTitle>
                      <CardDescription>Search and manage platform users</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>User</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                    <span className="font-medium text-primary">
                                      {user.full_name?.charAt(0).toUpperCase() || "U"}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-medium">{user.full_name || "Unknown"}</p>
                                    {user.subject && <p className="text-sm text-muted-foreground">{user.subject}</p>}
                                    {user.grade && <p className="text-sm text-muted-foreground">Grade {user.grade}</p>}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">{user.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.role === "teacher"
                                      ? "default"
                                      : user.role === "admin"
                                        ? "destructive"
                                        : "secondary"
                                  }
                                >
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(user.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                              No users found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <Link to="/admin/users">
                  <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">User Management</h3>
                          <p className="text-sm text-muted-foreground">Create and manage accounts</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                        <BarChart3 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">System Reports</h3>
                        <p className="text-sm text-muted-foreground">View platform analytics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <Settings className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Platform Settings</h3>
                        <p className="text-sm text-muted-foreground">Configure system settings</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-dashed hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Award className="h-6 w-6 text-primary" />
                    Advanced Features Coming Soon
                  </CardTitle>
                  <CardDescription>
                    We're building comprehensive management tools for your Screen Pilot platform.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="relative mb-6">
                    <div className="rounded-full bg-gradient-to-r from-primary/20 to-primary/10 p-6">
                      <ChartBarIcon className="h-12 w-12 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">!</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Enhanced Analytics Dashboard</h3>
                  <p className="text-center text-muted-foreground max-w-md mb-6">
                    Track detailed user activity, assignment performance, platform engagement metrics, and comprehensive
                    reporting tools.
                  </p>
                  <div className="flex gap-3">
                    <Button className="hover:scale-105 transition-transform">
                      <Eye className="mr-2 h-4 w-4" />
                      View Roadmap
                    </Button>
                    <Button variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Get Updates
                    </Button>
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
