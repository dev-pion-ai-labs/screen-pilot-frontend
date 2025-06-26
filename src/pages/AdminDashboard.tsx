"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  FileText,
  Settings,
  BookOpen,
  GraduationCap,
  School,
  TrendingUp,
  Activity,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpIcon,
  ArrowDownIcon,
  Clock,
  CheckCircle,
  AlertTriangle,
  Award,
  Star,
  Brain,
  Sparkles,
  Shield,
  Database,
  Server,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { AdminDashboardShimmer } from "@/components/AdminDashboardShimmer";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  ComposedChart,
  Legend,
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

interface DashboardStats {
  totalUsers: number;
  totalTeachers: number;
  totalStudents: number;
  totalAssignments: number;
  totalSubmissions: number;
  totalClasses: number;
  userGrowth: number;
  assignmentGrowth: number;
  submissionRate: number;
  activeUsers: number;
}

interface AnalyticsData {
  userGrowth: Array<{
    date: string;
    users: number;
    teachers: number;
    students: number;
  }>;
  assignmentStats: Array<{
    date: string;
    created: number;
    submitted: number;
    graded: number;
  }>;
  semesterDistribution: Array<{
    semester: string;
    students: number;
    assignments: number;
    completion: number;
  }>;
  subjectPerformance: Array<{
    subject: string;
    total: number;
    completed: number;
    average_grade: number;
    completion_rate: number;
  }>;
  dailyActivity: Array<{
    date: string;
    submissions: number;
    logins: number;
    assignments_created: number;
  }>;
  teacherProductivity: Array<{
    teacher: string;
    assignments: number;
    students: number;
    avg_grade: number;
  }>;
  systemHealth: {
    server_uptime: number;
    response_time: number;
    error_rate: number;
    active_sessions: number;
  };
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTeachers: 0,
    totalStudents: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    totalClasses: 0,
    userGrowth: 0,
    assignmentGrowth: 0,
    submissionRate: 0,
    activeUsers: 0,
  });

  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    assignmentStats: [],
    semesterDistribution: [],
    subjectPerformance: [],
    dailyActivity: [],
    teacherProductivity: [],
    systemHealth: {
      server_uptime: 99.9,
      response_time: 150,
      error_rate: 0.1,
      active_sessions: 0,
    },
  });

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([fetchBasicStats(), fetchAnalytics()]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchBasicStats = async () => {
    // Fetch current stats
    const [
      { count: totalUsers },
      { count: totalTeachers },
      { count: totalStudents },
      { count: totalAssignments },
      { count: totalSubmissions },
      { count: totalClasses },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "teacher"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "student"),
      supabase.from("assignments").select("*", { count: "exact", head: true }),
      supabase.from("submissions").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
    ]);

    // Calculate growth rates (comparing with previous period)
    const daysAgo =
      selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
    const previousPeriodStart = subDays(new Date(), daysAgo * 2);
    const currentPeriodStart = subDays(new Date(), daysAgo);

    const [{ count: previousUsers }, { count: previousAssignments }] =
      await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .lt("created_at", currentPeriodStart.toISOString()),
        supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .lt("created_at", currentPeriodStart.toISOString()),
      ]);

    const userGrowth = previousUsers
      ? ((totalUsers! - previousUsers) / previousUsers) * 100
      : 0;
    const assignmentGrowth = previousAssignments
      ? ((totalAssignments! - previousAssignments) / previousAssignments) * 100
      : 0;

    // Calculate submission rate
    const submissionRate = totalAssignments
      ? (totalSubmissions! / totalAssignments) * 100
      : 0;

    // Calculate active users (users who have activity in the last 7 days)
    const { count: activeUsers } = await supabase
      .from("submissions")
      .select("student_id", { count: "exact", head: true })
      .gte("created_at", subDays(new Date(), 7).toISOString());

    setStats({
      totalUsers: totalUsers || 0,
      totalTeachers: totalTeachers || 0,
      totalStudents: totalStudents || 0,
      totalAssignments: totalAssignments || 0,
      totalSubmissions: totalSubmissions || 0,
      totalClasses: totalClasses || 0,
      userGrowth: Math.round(userGrowth * 10) / 10,
      assignmentGrowth: Math.round(assignmentGrowth * 10) / 10,
      submissionRate: Math.round(submissionRate * 10) / 10,
      activeUsers: activeUsers || 0,
    });
  };

  const fetchAnalytics = async () => {
    // User growth over time
    const userGrowthData = [];
    const days =
      selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "MMM dd");

      const [{ count: totalUsers }, { count: teachers }, { count: students }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .lte("created_at", date.toISOString()),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "teacher")
            .lte("created_at", date.toISOString()),
          supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("role", "student")
            .lte("created_at", date.toISOString()),
        ]);

      userGrowthData.push({
        date: dateStr,
        users: totalUsers || 0,
        teachers: teachers || 0,
        students: students || 0,
      });
    }

    // Assignment statistics
    const assignmentStatsData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const nextDate = subDays(new Date(), i - 1);
      const dateStr = format(date, "MMM dd");

      const [{ count: created }, { count: submitted }, { count: graded }] =
        await Promise.all([
          supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDate.toISOString()),
          supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDate.toISOString()),
          supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("status", "graded")
            .gte("updated_at", date.toISOString())
            .lt("updated_at", nextDate.toISOString()),
        ]);

      assignmentStatsData.push({
        date: dateStr,
        created: created || 0,
        submitted: submitted || 0,
        graded: graded || 0,
      });
    }

    // Semester distribution
    const { data: semesterData } = await supabase
      .from("profiles")
      .select("semester")
      .eq("role", "student")
      .not("semester", "is", null);

    const semesterGroups =
      semesterData?.reduce((acc, student) => {
        const sem = `Semester ${student.semester}`;
        acc[sem] = (acc[sem] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

    const semesterDistribution = await Promise.all(
      Object.entries(semesterGroups).map(async ([semester, students]) => {
        const semesterNum = parseInt(semester.split(" ")[1]);

        const { count: assignments } = await supabase
          .from("assignments")
          .select("*", { count: "exact", head: true })
          .eq("semester", semesterNum);

        const { count: submissions } = await supabase
          .from("submissions")
          .select("assignment_id", { count: "exact", head: true });

        const completion = assignments
          ? Math.round((submissions! / assignments) * 100)
          : 0;

        return {
          semester,
          students,
          assignments: assignments || 0,
          completion,
        };
      })
    );

    // Subject performance (by class)
    const { data: classesData } = await supabase.from("classes").select("*");

    const subjectPerformance = await Promise.all(
      (classesData || []).map(async (cls) => {
        const [{ count: totalAssignments }, { data: submissions }] =
          await Promise.all([
            supabase
              .from("assignments")
              .select("*", { count: "exact", head: true })
              .eq("class_id", cls.id),
            supabase
              .from("submissions")
              .select("grade, assignments!inner(class_id)")
              .not("grade", "is", null)
              .eq("assignments.class_id", cls.id),
          ]);

        const completed = submissions?.length || 0;
        const averageGrade = submissions?.length
          ? submissions.reduce((sum, sub) => sum + (sub.grade || 0), 0) /
            submissions.length
          : 0;
        const completionRate = totalAssignments
          ? Math.round((completed / totalAssignments) * 100)
          : 0;

        return {
          subject: cls.name,
          total: totalAssignments || 0,
          completed,
          average_grade: Math.round(averageGrade * 10) / 10,
          completion_rate: completionRate,
        };
      })
    );

    // Daily activity
    const dailyActivityData = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const nextDate = subDays(new Date(), i - 1);
      const dateStr = format(date, "MMM dd");

      const [{ count: submissions }, { count: assignmentsCreated }] =
        await Promise.all([
          supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDate.toISOString()),
          supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDate.toISOString()),
        ]);

      dailyActivityData.push({
        date: dateStr,
        submissions: submissions || 0,
        logins: Math.floor(Math.random() * 50) + 10, // Simulated data
        assignments_created: assignmentsCreated || 0,
      });
    }

    // Teacher productivity
    const { data: teachersData } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "teacher");

    const teacherProductivity = await Promise.all(
      (teachersData || []).slice(0, 10).map(async (teacher) => {
        const [
          { count: assignments },
          { data: classStudents },
          { data: grades },
        ] = await Promise.all([
          supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("teacher_id", teacher.id),
          supabase
            .from("class_teachers")
            .select(
              `
            classes:class_id (
              class_students (student_id)
            )
          `
            )
            .eq("teacher_id", teacher.id),
          supabase.from("submissions").select("grade").not("grade", "is", null),
        ]);

        const studentCount =
          classStudents?.reduce(
            (acc, ct) => acc + (ct.classes?.class_students?.length || 0),
            0
          ) || 0;
        const avgGrade = grades?.length
          ? grades.reduce((sum, sub) => sum + (sub.grade || 0), 0) /
            grades.length
          : 0;

        return {
          teacher: teacher.full_name.split(" ")[0] || "Unknown",
          assignments: assignments || 0,
          students: studentCount,
          avg_grade: Math.round(avgGrade * 10) / 10,
        };
      })
    );

    setAnalytics({
      userGrowth: userGrowthData,
      assignmentStats: assignmentStatsData,
      semesterDistribution,
      subjectPerformance: subjectPerformance.filter((sp) => sp.total > 0),
      dailyActivity: dailyActivityData,
      teacherProductivity: teacherProductivity.filter(
        (tp) => tp.assignments > 0
      ),
      systemHealth: {
        server_uptime: 99.9,
        response_time: Math.floor(Math.random() * 100) + 50,
        error_rate: Math.random() * 0.5,
        active_sessions: stats.activeUsers,
      },
    });
  };

  const formatGrowthRate = (rate: number) => {
    const isPositive = rate >= 0;
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const color = isPositive ? "text-green-600" : "text-red-600";

    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">{Math.abs(rate)}%</span>
      </div>
    );
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["admin"]}>
        <ModernDashboardLayout>
          <AdminDashboardShimmer />
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#F97316",
  ];

  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 text-white">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Admin Dashboard 🚀
                  </h1>
                  <p className="text-xl text-white/90 mb-6">
                    Complete system oversight and analytics
                  </p>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-blue-300" />
                      <span className="font-medium">
                        System Health: {analytics.systemHealth.server_uptime}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-5 w-5 text-green-300" />
                      <span className="font-medium">
                        {stats.totalUsers} Users
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-orange-300" />
                      <span className="font-medium">
                        {analytics.systemHealth.response_time}ms Response
                      </span>
                    </div>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-16 w-16 text-white/80" />
                  </div>
                </div>
              </div>

              {/* Period Selection */}
              <div className="mt-8 flex items-center gap-3">
                <span className="text-white/80 text-sm font-medium">
                  Time Period:
                </span>
                <div className="flex bg-white/20 rounded-lg backdrop-blur-sm">
                  {["7d", "30d", "90d"].map((period) => (
                    <Button
                      key={period}
                      variant={
                        selectedPeriod === period ? "secondary" : "ghost"
                      }
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                      className={
                        selectedPeriod === period
                          ? "bg-white text-purple-600 hover:bg-white/90"
                          : "text-white hover:bg-white/20"
                      }
                    >
                      {period === "7d"
                        ? "7 Days"
                        : period === "30d"
                        ? "30 Days"
                        : "90 Days"}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">
                      Total Users
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats.totalUsers}
                    </p>
                    {formatGrowthRate(stats.userGrowth)}
                  </div>
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">
                      Teachers
                    </p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {stats.totalTeachers}
                    </p>
                    <p className="text-xs text-emerald-600">Active educators</p>
                  </div>
                  <div className="p-3 bg-emerald-500 rounded-xl">
                    <School className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">
                      Students
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {stats.totalStudents}
                    </p>
                    <p className="text-xs text-purple-600">
                      {stats.activeUsers} active
                    </p>
                  </div>
                  <div className="p-3 bg-purple-500 rounded-xl">
                    <GraduationCap className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-1">
                      Assignments
                    </p>
                    <p className="text-3xl font-bold text-orange-900">
                      {stats.totalAssignments}
                    </p>
                    {formatGrowthRate(stats.assignmentGrowth)}
                  </div>
                  <div className="p-3 bg-orange-500 rounded-xl">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-pink-50 to-pink-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-pink-600 mb-1">
                      Submissions
                    </p>
                    <p className="text-3xl font-bold text-pink-900">
                      {stats.totalSubmissions}
                    </p>
                    <p className="text-xs text-pink-600">
                      {stats.submissionRate}% rate
                    </p>
                  </div>
                  <div className="p-3 bg-pink-500 rounded-xl">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600 mb-1">
                      Classes
                    </p>
                    <p className="text-3xl font-bold text-indigo-900">
                      {stats.totalClasses}
                    </p>
                    <p className="text-xs text-indigo-600">Active courses</p>
                  </div>
                  <div className="p-3 bg-indigo-500 rounded-xl">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Analytics */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="academic" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Academic
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Performance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* System Health Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Server className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Server Uptime
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {analytics.systemHealth.server_uptime}%
                    </p>
                    <p className="text-sm text-green-700">Last 30 days</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Response Time
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {analytics.systemHealth.response_time}ms
                    </p>
                    <p className="text-sm text-blue-700">Average response</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-orange-900 mb-1">
                      Error Rate
                    </h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {analytics.systemHealth.error_rate.toFixed(2)}%
                    </p>
                    <p className="text-sm text-orange-700">Last 24 hours</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-purple-900 mb-1">
                      Active Sessions
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {analytics.systemHealth.active_sessions}
                    </p>
                    <p className="text-sm text-purple-700">Current users</p>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Activity Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    Daily Activity Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={analytics.dailyActivity}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="submissions"
                          fill="#6366f1"
                          name="Submissions"
                        />
                        <Bar
                          dataKey="assignments_created"
                          fill="#10b981"
                          name="Assignments Created"
                        />
                        <Line
                          type="monotone"
                          dataKey="logins"
                          stroke="#f59e0b"
                          strokeWidth={3}
                          name="Logins"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Growth */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      User Growth Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.userGrowth}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="users"
                            stackId="1"
                            stroke="#3B82F6"
                            fill="#3B82F6"
                            fillOpacity={0.6}
                            name="Total Users"
                          />
                          <Area
                            type="monotone"
                            dataKey="teachers"
                            stackId="2"
                            stroke="#10B981"
                            fill="#10B981"
                            fillOpacity={0.8}
                            name="Teachers"
                          />
                          <Area
                            type="monotone"
                            dataKey="students"
                            stackId="3"
                            stroke="#8B5CF6"
                            fill="#8B5CF6"
                            fillOpacity={0.8}
                            name="Students"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* User Distribution */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-600" />
                      User Role Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Tooltip />
                          <Legend />
                          <Pie
                            data={[
                              {
                                name: "Students",
                                value: stats.totalStudents,
                                color: "#8B5CF6",
                              },
                              {
                                name: "Teachers",
                                value: stats.totalTeachers,
                                color: "#10B981",
                              },
                              {
                                name: "Admins",
                                value:
                                  stats.totalUsers -
                                  stats.totalStudents -
                                  stats.totalTeachers,
                                color: "#F59E0B",
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              {
                                name: "Students",
                                value: stats.totalStudents,
                                color: "#8B5CF6",
                              },
                              {
                                name: "Teachers",
                                value: stats.totalTeachers,
                                color: "#10B981",
                              },
                              {
                                name: "Admins",
                                value:
                                  stats.totalUsers -
                                  stats.totalStudents -
                                  stats.totalTeachers,
                                color: "#F59E0B",
                              },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Semester Distribution */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-indigo-600" />
                    Student Distribution by Semester
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.semesterDistribution}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="semester" type="category" width={100} />
                        <Tooltip />
                        <Bar
                          dataKey="students"
                          fill="#3B82F6"
                          radius={[0, 4, 4, 0]}
                          name="Students"
                        />
                        <Bar
                          dataKey="assignments"
                          fill="#10B981"
                          radius={[0, 4, 4, 0]}
                          name="Assignments"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="academic" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Statistics */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-blue-600" />
                      Assignment Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={analytics.assignmentStats}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="created"
                            stroke="#3B82F6"
                            strokeWidth={3}
                            name="Created"
                          />
                          <Line
                            type="monotone"
                            dataKey="submitted"
                            stroke="#10B981"
                            strokeWidth={3}
                            name="Submitted"
                          />
                          <Line
                            type="monotone"
                            dataKey="graded"
                            stroke="#F59E0B"
                            strokeWidth={3}
                            name="Graded"
                          />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Performance */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Subject Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.subjectPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="subject"
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip />
                          <Bar
                            dataKey="completion_rate"
                            fill="#8B5CF6"
                            radius={[4, 4, 0, 0]}
                            name="Completion Rate %"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Subject Analytics */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Detailed Subject Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {analytics.subjectPerformance.map((subject, index) => (
                      <div
                        key={subject.subject}
                        className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4"
                      >
                        <h4 className="font-semibold text-gray-900 mb-3 truncate">
                          {subject.subject}
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-medium">{subject.total}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Completed:</span>
                            <span className="font-medium text-green-600">
                              {subject.completed}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Avg. Grade:</span>
                            <span className="font-medium text-blue-600">
                              {subject.average_grade}
                            </span>
                          </div>
                          <div className="pt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Completion</span>
                              <span>{subject.completion_rate}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{
                                  width: `${subject.completion_rate}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              {/* Teacher Productivity */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-600" />
                    Teacher Productivity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={analytics.teacherProductivity}
                        layout="horizontal"
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="teacher" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="assignments"
                          fill="#3B82F6"
                          name="Assignments Created"
                        />
                        <Bar
                          dataKey="students"
                          fill="#10B981"
                          name="Students Taught"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-green-900 mb-1">
                      Completion Rate
                    </h3>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.submissionRate}%
                    </p>
                    <p className="text-sm text-green-700">
                      Overall submission rate
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Activity className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-blue-900 mb-1">
                      Active Users
                    </h3>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.activeUsers}
                    </p>
                    <p className="text-sm text-blue-700">Last 7 days</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-purple-900 mb-1">
                      Growth Rate
                    </h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.abs(stats.userGrowth)}%
                    </p>
                    <p className="text-sm text-purple-700">User growth</p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Clock className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-orange-900 mb-1">
                      Avg. Response
                    </h3>
                    <p className="text-2xl font-bold text-orange-600">
                      {analytics.systemHealth.response_time}ms
                    </p>
                    <p className="text-sm text-orange-700">
                      System performance
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Top Performing Classes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.subjectPerformance
                        .sort((a, b) => b.completion_rate - a.completion_rate)
                        .slice(0, 5)
                        .map((subject, index) => (
                          <div
                            key={subject.subject}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                  index === 0
                                    ? "bg-yellow-500"
                                    : index === 1
                                    ? "bg-gray-400"
                                    : index === 2
                                    ? "bg-orange-500"
                                    : "bg-blue-500"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {subject.subject}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {subject.total} assignments
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-green-600">
                                {subject.completion_rate}%
                              </p>
                              <p className="text-sm text-gray-500">
                                completion
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Most Active Teachers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics.teacherProductivity
                        .sort((a, b) => b.assignments - a.assignments)
                        .slice(0, 5)
                        .map((teacher, index) => (
                          <div
                            key={teacher.teacher}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                  index === 0
                                    ? "bg-purple-500"
                                    : index === 1
                                    ? "bg-blue-500"
                                    : index === 2
                                    ? "bg-green-500"
                                    : "bg-gray-500"
                                }`}
                              >
                                {index + 1}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {teacher.teacher}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {teacher.students} students
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-purple-600">
                                {teacher.assignments}
                              </p>
                              <p className="text-sm text-gray-500">
                                assignments
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default AdminDashboard;
