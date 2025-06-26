"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  Brain,
  FileText,
  Target,
  Calendar,
  Award,
  ArrowRight,
  User,
  BarChart3,
  PieChart,
  Activity,
  School,
  Star,
  ChevronRight,
  BookMarked,
  ClipboardCheck,
  CircleFadingPlus,
  Sparkles,
  Rocket,
  ChevronLeft,
  Zap,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  isWithinInterval,
} from "date-fns";
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
} from "recharts";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  class_id: string;
  teacher_id: string;
  topic: string;
  difficulty: string;
  total_points: number;
  submissions?: any[];
  classes: {
    id: string;
    name: string;
    semester: number;
  };
  profiles: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface StudentClass {
  id: string;
  name: string;
  semester: number;
  created_at: string;
  teacher: {
    id: string;
    full_name: string;
    email: string;
  };
  assignment_count: number;
  completed_assignments: number;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  created_at: string;
  ai_grade: number;
  teacher_grade: number;
  status: string;
  file_name: string;
  assignment: {
    title: string;
    total_points: number;
    classes: {
      name: string;
    };
  };
}

// Carousel Component
const Carousel = ({
  children,
  className = "",
}: {
  children: React.ReactNode[];
  className?: string;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);

  useEffect(() => {
    const updateItemsPerView = () => {
      if (window.innerWidth >= 1280) setItemsPerView(3);
      else if (window.innerWidth >= 768) setItemsPerView(2);
      else setItemsPerView(1);
    };

    updateItemsPerView();
    window.addEventListener("resize", updateItemsPerView);
    return () => window.removeEventListener("resize", updateItemsPerView);
  }, []);

  const totalItems = children.length;
  const maxIndex = Math.max(0, totalItems - itemsPerView);

  const next = () => setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  const prev = () => setCurrentIndex((prev) => Math.max(prev - 1, 0));

  if (totalItems === 0) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="overflow-hidden">
        <div
          className="flex transition-transform duration-300 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / itemsPerView)}%)`,
          }}
        >
          {children.map((child, index) => (
            <div
              key={index}
              className={`flex-shrink-0 px-2`}
              style={{ width: `${100 / itemsPerView}%` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {totalItems > itemsPerView && (
        <div className="flex justify-center mt-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={prev}
            disabled={currentIndex === 0}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={next}
            disabled={currentIndex >= maxIndex}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default function ModernStudentDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id && profile?.semester) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchAssignments(),
        fetchStudentClasses(),
        fetchSubmissions(),
      ]);
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

  const fetchAssignments = async () => {
    try {
      const { data: enrollmentData } = await supabase
        .from("class_students")
        .select("class_id")
        .eq("student_id", profile?.id);

      if (!enrollmentData?.length) {
        setAssignments([]);
        return;
      }

      const classIds = enrollmentData.map((e) => e.class_id);

      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `
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
        `
        )
        .in("class_id", classIds)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      const assignmentsWithUserSubmissions =
        assignmentsData?.map((assignment) => ({
          ...assignment,
          submissions:
            assignment.submissions?.filter(
              (sub) => sub.student_id === profile?.id
            ) || [],
        })) || [];

      setAssignments(assignmentsWithUserSubmissions);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchStudentClasses = async () => {
    try {
      const { data: classData } = await supabase
        .from("class_students")
        .select(
          `
          classes:class_id (
            id,
            name,
            semester,
            created_at
          )
        `
        )
        .eq("student_id", profile?.id);

      if (!classData?.length) {
        setClasses([]);
        return;
      }

      const classesWithDetails = await Promise.all(
        classData.map(async (item) => {
          const classInfo = item.classes;

          const { data: teacherData } = await supabase
            .from("class_teachers")
            .select(
              `
              profiles:teacher_id (
                id,
                full_name,
                email
              )
            `
            )
            .eq("class_id", classInfo.id)
            .single();

          const { count: totalAssignments } = await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id)
            .eq("status", "published");

          const { data: submissionsData } = await supabase
            .from("submissions")
            .select("assignment_id")
            .eq("student_id", profile?.id);

          const submittedAssignmentIds =
            submissionsData?.map((s) => s.assignment_id) || [];

          const { count: completedAssignments } = await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id)
            .eq("status", "published")
            .in(
              "id",
              submittedAssignmentIds.length > 0 ? submittedAssignmentIds : [""]
            );

          return {
            id: classInfo.id,
            name: classInfo.name,
            semester: classInfo.semester,
            created_at: classInfo.created_at,
            teacher: teacherData?.profiles || {
              id: "",
              full_name: "Unknown",
              email: "",
            },
            assignment_count: totalAssignments || 0,
            completed_assignments: completedAssignments || 0,
          };
        })
      );

      setClasses(classesWithDetails);
    } catch (error) {
      console.error("Error fetching student classes:", error);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const { data: submissionsData } = await supabase
        .from("submissions")
        .select(
          `
          *,
          assignment:assignment_id (
            title,
            total_points,
            classes:class_id (
              name
            )
          )
        `
        )
        .eq("student_id", profile?.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  // Calculate analytics
  const submittedCount = assignments.filter(
    (a) => a.submissions && a.submissions.length > 0
  ).length;
  const pendingCount = assignments.filter(
    (a) => !a.submissions || a.submissions.length === 0
  ).length;
  const overdueCount = assignments.filter(
    (a) =>
      (!a.submissions || a.submissions.length === 0) &&
      new Date(a.due_date) < new Date()
  ).length;
  const completionRate =
    assignments.length > 0
      ? Math.min(Math.round((submittedCount / assignments.length) * 100), 100)
      : 0;

  // Weekly progress data
  const getWeeklyProgress = () => {
    const weeks = [];
    for (let i = 6; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i));
      const weekEnd = endOfWeek(weekStart);

      const weekSubmissions = submissions.filter((s) =>
        isWithinInterval(new Date(s.created_at), {
          start: weekStart,
          end: weekEnd,
        })
      );

      weeks.push({
        week: format(weekStart, "MMM dd"),
        submissions: weekSubmissions.length,
      });
    }
    return weeks;
  };

  // Grade distribution
  const getGradeDistribution = () => {
    const gradedSubmissions = submissions.filter(
      (s) => s.ai_grade || s.teacher_grade
    );
    const total = gradedSubmissions.length;

    if (total === 0) return [];

    const excellent = gradedSubmissions.filter(
      (s) => (s.teacher_grade || s.ai_grade) >= 90
    ).length;
    const good = gradedSubmissions.filter(
      (s) =>
        (s.teacher_grade || s.ai_grade) >= 80 &&
        (s.teacher_grade || s.ai_grade) < 90
    ).length;
    const satisfactory = gradedSubmissions.filter(
      (s) =>
        (s.teacher_grade || s.ai_grade) >= 70 &&
        (s.teacher_grade || s.ai_grade) < 80
    ).length;
    const needsImprovement = gradedSubmissions.filter(
      (s) => (s.teacher_grade || s.ai_grade) < 70
    ).length;

    return [
      {
        name: "Excellent",
        value: Math.min(Math.round((excellent / total) * 100), 100),
        count: excellent,
        fill: "#10B981",
      },
      {
        name: "Good",
        value: Math.min(Math.round((good / total) * 100), 100),
        count: good,
        fill: "#3B82F6",
      },
      {
        name: "Satisfactory",
        value: Math.min(Math.round((satisfactory / total) * 100), 100),
        count: satisfactory,
        fill: "#F59E0B",
      },
      {
        name: "Needs Improvement",
        value: Math.min(Math.round((needsImprovement / total) * 100), 100),
        count: needsImprovement,
        fill: "#EF4444",
      },
    ];
  };

  // Average grade
  const getAverageGrade = () => {
    const gradedSubmissions = submissions.filter(
      (s) => s.teacher_grade || s.ai_grade
    );
    if (gradedSubmissions.length === 0) return 0;

    const totalGrade = gradedSubmissions.reduce(
      (sum, s) => sum + (s.teacher_grade || s.ai_grade),
      0
    );
    return Math.round(totalGrade / gradedSubmissions.length);
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const hasSubmission =
      assignment.submissions && assignment.submissions.length > 0;
    const isOverdue = new Date(assignment.due_date) < new Date();

    if (hasSubmission) {
      return {
        status: "Submitted",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: CheckCircle,
      };
    } else if (isOverdue) {
      return {
        status: "Overdue",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: AlertCircle,
      };
    } else {
      return {
        status: "Pending",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Clock,
      };
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <ModernDashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-r-purple-400 rounded-full animate-spin animation-delay-150"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-gray-700">Loading your dashboard...</h3>
                <p className="text-gray-500">Please wait while we gather your data</p>
              </div>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 md:p-8 text-white shadow-2xl mb-8">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                        <Rocket className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                          Welcome back, {profile?.full_name?.split(" ")[0]}!
                        </h1>
                        <p className="text-lg md:text-xl text-white/90">
                          Ready to continue your learning journey? 📚
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <Award className="h-6 w-6 text-yellow-300" />
                          <div>
                            <p className="text-2xl font-bold">
                              {completionRate}%
                            </p>
                            <p className="text-sm text-white/80">Complete</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <Target className="h-6 w-6 text-green-300" />
                          <div>
                            <p className="text-2xl font-bold">
                              {submittedCount}
                            </p>
                            <p className="text-sm text-white/80">Submitted</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-6 w-6 text-blue-300" />
                          <div>
                            <p className="text-2xl font-bold">
                              {getAverageGrade()}%
                            </p>
                            <p className="text-sm text-white/80">Avg Grade</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                        <div className="flex items-center gap-3">
                          <School className="h-6 w-6 text-purple-300" />
                          <div>
                            <p className="text-2xl font-bold">
                              {classes.length}
                            </p>
                            <p className="text-sm text-white/80">Classes</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:block">
                    <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20">
                      <Brain className="h-16 w-16 text-white/80" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32"></div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Row 1: Stats Cards - 4 columns */}
              <div className="col-span-1">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-600 mb-2">
                          Total
                        </p>
                        <p className="text-3xl font-bold text-blue-900">
                          {assignments.length}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-500 rounded-2xl">
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-1">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-600 mb-2">
                          Completed
                        </p>
                        <p className="text-3xl font-bold text-emerald-900">
                          {submittedCount}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-500 rounded-2xl">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-1">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-amber-600 mb-2">
                          Pending
                        </p>
                        <p className="text-3xl font-bold text-amber-900">
                          {pendingCount}
                        </p>
                      </div>
                      <div className="p-3 bg-amber-500 rounded-2xl">
                        <Clock className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-1">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-rose-50 to-rose-100 hover:shadow-xl transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-rose-600 mb-2">
                          Avg Grade
                        </p>
                        <p className="text-3xl font-bold text-rose-900">
                          {getAverageGrade()}%
                        </p>
                      </div>
                      <div className="p-3 bg-rose-500 rounded-2xl">
                        <Star className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: AI Tools and Grade Distribution - 2 columns */}
              <div className="col-span-1 md:col-span-1 lg:col-span-2">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full overflow-hidden">
                  <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      AI Learning Tools
                      <Badge variant="secondary" className="ml-auto bg-purple-100 text-purple-700">
                        3 Tools
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-2">
                      Enhance your learning with AI-powered tools
                    </p>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="space-y-0">
                      <Link to="/ai-mentor" className="block">
                        <div className="group relative p-6 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                              <MessageSquare className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-lg">AI Mentor</h3>
                                <Sparkles className="h-4 w-4 text-blue-500 group-hover:animate-pulse" />
                              </div>
                              <p className="text-sm text-gray-600 group-hover:text-gray-700">
                                Get personalized guidance and explanations from your AI mentor
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </Link>

                      <Link to="/quiz" className="block">
                        <div className="group relative p-6 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 transition-all duration-300 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                              <Brain className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-lg">Quiz Tool</h3>
                                <Sparkles className="h-4 w-4 text-purple-500 group-hover:animate-pulse" />
                              </div>
                              <p className="text-sm text-gray-600 group-hover:text-gray-700">
                                Test your knowledge with interactive AI-generated quizzes
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </Link>

                      <Link to="/script-analyzer" className="block">
                        <div className="group relative p-6 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-emerald-100 transition-all duration-300 border-b border-gray-100 last:border-b-0">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-gray-900 text-lg">Script Analyzer</h3>
                                <Sparkles className="h-4 w-4 text-emerald-500 group-hover:animate-pulse" />
                              </div>
                              <p className="text-sm text-gray-600 group-hover:text-gray-700">
                                Analyze scripts and screenplays with advanced AI insights
                              </p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all duration-300" />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-1 md:col-span-1 lg:col-span-2">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                        <PieChart className="h-5 w-5 text-white" />
                      </div>
                      Grade Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {getGradeDistribution().length > 0 ? (
                      <>
                        <div className="h-[200px] mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie
                                data={getGradeDistribution()}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                              >
                                {getGradeDistribution().map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value: number, name: string) => [
                                  `${value}%`,
                                  name,
                                ]}
                                contentStyle={{
                                  backgroundColor: "white",
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "12px",
                                  boxShadow:
                                    "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                }}
                              />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-3">
                          {getGradeDistribution().map((entry) => (
                            <div
                              key={entry.name}
                              className="flex items-center justify-between text-sm"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-4 h-4 rounded-full shadow-sm"
                                  style={{ backgroundColor: entry.fill }}
                                ></div>
                                <span className="text-gray-600 font-medium">
                                  {entry.name}
                                </span>
                              </div>
                              <span className="font-bold text-gray-800">
                                {entry.count}
                              </span>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No grades yet</p>
                        <p className="text-sm">
                          Complete assignments to see your grade distribution
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: My Classes Carousel - Full width */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                          <School className="h-5 w-5 text-white" />
                        </div>
                        My Classes
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {classes.length} enrolled
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {classes.length > 0 ? (
                      <Carousel>
                        {classes.map((classItem) => (
                          <div
                            key={classItem.id}
                            className="border border-gray-100 rounded-2xl p-6 bg-white hover:shadow-md transition-all duration-300 h-full"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-bold text-gray-900 text-lg">
                                {classItem.name}
                              </h4>
                              <Badge
                                variant="secondary"
                                className="bg-indigo-100 text-indigo-700"
                              >
                                Sem {classItem.semester}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                              <User className="h-4 w-4" />
                              <span className="font-medium">
                                {classItem.teacher.full_name}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-bold text-gray-700">
                                  {classItem.completed_assignments}/
                                  {classItem.assignment_count} completed
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                                  style={{
                                    width: `${
                                      classItem.assignment_count > 0
                                        ? Math.min(
                                            (classItem.completed_assignments /
                                              classItem.assignment_count) *
                                              100,
                                            100
                                          )
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                              <div className="text-right">
                                <span className="text-lg font-bold text-indigo-600">
                                  {classItem.assignment_count > 0
                                    ? Math.min(
                                        Math.round(
                                          (classItem.completed_assignments /
                                            classItem.assignment_count) *
                                            100
                                        ),
                                        100
                                      )
                                    : 0}
                                  %
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </Carousel>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <School className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">
                          No classes enrolled
                        </p>
                        <p className="text-sm">
                          Contact your administrator to enroll in classes
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Row 4: Completion Rate and Recent Submissions - 2 columns */}
              <div className="col-span-1 md:col-span-1 lg:col-span-2">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                        <CircleFadingPlus className="h-5 w-5 text-white" />
                      </div>
                      Completion Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <div className="relative w-40 h-40">
                        <svg
                          className="w-40 h-40 transform -rotate-90"
                          viewBox="0 0 36 36"
                        >
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="3"
                          />
                          <path
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="3"
                            strokeDasharray={`${completionRate}, 100`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient
                              id="gradient"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#10B981" />
                              <stop offset="100%" stopColor="#3B82F6" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <span className="text-4xl font-bold text-gray-800">
                              {completionRate}%
                            </span>
                            <p className="text-sm text-gray-500 mt-1">
                              Complete
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-1 md:col-span-1 lg:col-span-2">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl">
                        <ClipboardCheck className="h-5 w-5 text-white" />
                      </div>
                      Recent Submissions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {submissions.slice(0, 5).map((submission) => (
                        <div
                          key={submission.id}
                          className="border border-gray-100 rounded-xl p-4 bg-white hover:shadow-sm transition-all duration-300"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-semibold text-gray-900 truncate flex-1 mr-2">
                              {submission.assignment?.title ||
                                "Unknown Assignment"}
                            </h5>
                            <Badge
                              className={`text-xs px-3 py-1 rounded-full ${
                                submission.status === "graded"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-blue-100 text-blue-700 border-blue-200"
                              }`}
                            >
                              {submission.status === "graded"
                                ? "Graded"
                                : "Submitted"}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 mb-3 font-medium">
                            {submission.assignment?.classes?.name}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {format(
                                new Date(submission.created_at),
                                "MMM dd"
                              )}
                            </span>
                            {(submission.teacher_grade ||
                              submission.ai_grade) && (
                              <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                                <Star className="h-3 w-3 text-yellow-500" />
                                <span className="text-sm font-bold text-yellow-700">
                                  {submission.teacher_grade ||
                                    submission.ai_grade}
                                  %
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {submissions.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <ClipboardCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">
                            No submissions yet
                          </p>
                          <p className="text-sm">
                            Start working on assignments to see your submissions
                            here
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 5: Weekly Activity - Full width */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      Weekly Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getWeeklyProgress()}>
                          <defs>
                            <linearGradient
                              id="colorSubmissions"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#6366f1"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#6366f1"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#f0f0f0"
                          />
                          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "12px",
                              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="submissions"
                            stroke="#6366f1"
                            strokeWidth={3}
                            fill="url(#colorSubmissions)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 6: Recent Assignments Carousel - Full width */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-xl">
                          <BookMarked className="h-5 w-5 text-white" />
                        </div>
                        Recent Assignments
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        {pendingCount} pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignments.length > 0 ? (
                      <Carousel>
                        {assignments.slice(0, 6).map((assignment) => {
                          const {
                            status,
                            color,
                            icon: StatusIcon,
                          } = getAssignmentStatus(assignment);
                          const isOverdue =
                            new Date(assignment.due_date) < new Date();

                          return (
                            <div
                              key={assignment.id}
                              className="border border-gray-100 rounded-2xl p-6 hover:shadow-md hover:border-gray-200 transition-all duration-300 bg-white h-full"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <h4 className="font-bold text-gray-900 text-lg truncate flex-1 mr-3">
                                  {assignment.title}
                                </h4>
                                <Badge
                                  className={`${color} border text-xs px-3 py-1 rounded-full`}
                                >
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                                <School className="h-4 w-4" />
                                <span className="font-medium">
                                  {assignment.classes?.name}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-sm font-medium ${
                                    isOverdue ? "text-red-600" : "text-gray-500"
                                  }`}
                                >
                                  Due:{" "}
                                  {format(
                                    new Date(assignment.due_date),
                                    "MMM dd, yyyy"
                                  )}
                                </span>
                                <Link to={`/assignment/${assignment.id}`}>
                                  <Button
                                    size="sm"
                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-md"
                                  >
                                    {assignment.submissions &&
                                    assignment.submissions.length > 0
                                      ? "View"
                                      : "Start"}
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </Carousel>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">
                          No assignments yet
                        </p>
                        <p className="text-sm">
                          Check back later for new assignments
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming Deadlines Section - Full width */}
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                          <Calendar className="h-5 w-5 text-white" />
                        </div>
                        Upcoming Deadlines
                      </CardTitle>
                      {overdueCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="bg-red-100 text-red-700 border-red-200"
                        >
                          {overdueCount} overdue
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assignments
                        .filter(
                          (a) => !a.submissions || a.submissions.length === 0
                        )
                        .sort(
                          (a, b) =>
                            new Date(a.due_date).getTime() -
                            new Date(b.due_date).getTime()
                        )
                        .slice(0, 6)
                        .map((assignment) => {
                          const isOverdue =
                            new Date(assignment.due_date) < new Date();
                          const daysUntilDue = Math.ceil(
                            (new Date(assignment.due_date).getTime() -
                              new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                          );

                          return (
                            <div
                              key={assignment.id}
                              className={`border-2 rounded-2xl p-6 transition-all duration-300 hover:shadow-lg ${
                                isOverdue
                                  ? "border-red-200 bg-gradient-to-br from-red-50 to-red-100"
                                  : daysUntilDue <= 3
                                  ? "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100"
                                  : "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100"
                              }`}
                            >
                              <div className="flex items-start gap-3 mb-4">
                                <div
                                  className={`p-2 rounded-xl ${
                                    isOverdue
                                      ? "bg-red-500"
                                      : daysUntilDue <= 3
                                      ? "bg-amber-500"
                                      : "bg-blue-500"
                                  }`}
                                >
                                  {isOverdue ? (
                                    <AlertCircle className="h-5 w-5 text-white" />
                                  ) : daysUntilDue <= 3 ? (
                                    <Clock className="h-5 w-5 text-white" />
                                  ) : (
                                    <Calendar className="h-5 w-5 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-bold text-gray-900 text-lg mb-1">
                                    {assignment.title}
                                  </h4>
                                  <p className="text-sm text-gray-600 font-medium">
                                    {assignment.classes?.name}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3 mb-4">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <User className="h-4 w-4" />
                                  <span>{assignment.profiles?.full_name}</span>
                                </div>
                                <div
                                  className={`text-sm font-bold ${
                                    isOverdue
                                      ? "text-red-700"
                                      : daysUntilDue <= 3
                                      ? "text-amber-700"
                                      : "text-blue-700"
                                  }`}
                                >
                                  {isOverdue
                                    ? "Overdue!"
                                    : daysUntilDue === 0
                                    ? "Due today"
                                    : daysUntilDue === 1
                                    ? "Due tomorrow"
                                    : `${daysUntilDue} days left`}
                                </div>
                              </div>

                              <Link to={`/assignment/${assignment.id}`}>
                                <Button
                                  className={`w-full shadow-lg hover:shadow-xl transition-all duration-300 ${
                                    isOverdue
                                      ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                                  }`}
                                >
                                  Start Assignment
                                  <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                              </Link>
                            </div>
                          );
                        })}
                      {assignments.filter(
                        (a) => !a.submissions || a.submissions.length === 0
                      ).length === 0 && (
                        <div className="col-span-full text-center py-16 text-gray-500">
                          <CheckCircle className="h-20 w-20 mx-auto mb-4 text-green-400" />
                          <p className="text-2xl font-bold text-gray-700 mb-2">
                            All caught up! 🎉
                          </p>
                          <p className="text-lg">
                            You've completed all your assignments. Great job!
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
