"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { TeacherDashboardShimmer } from "@/components/TeacherDashboardShimmer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  Brain,
  MessageSquare,
  Download,
  Upload,
  ChevronRight,
  Globe,
  TrendingDown,
  PlayCircle,
  Flame,
  TrophyIcon,
  Sparkles,
  Trophy,
  Film,
  Camera,
  Video,
  Clapperboard,
  Megaphone,
  Monitor,
  Mic,
  Zap,
  Layers,
  Palette,
  Lightbulb,
  ListChecks,
  HelpCircle,
  Book,
} from "lucide-react";
import {
  format,
  startOfWeek,
  endOfWeek,
  subWeeks,
  isWithinInterval,
  subDays,
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
  BarChart,
  Bar,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
} from "recharts";


interface TeacherClass {
  id: string;
  name: string;
  semester: number;
  created_at: string;
  student_count: number;
  assignment_count: number;
  avg_completion_rate: number;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_at: string;
  class_id: string;
  topic: string;
  difficulty: string;
  total_points: number;
  status: string;
  submission_count: number;
  total_students: number;
  avg_grade: number;
  classes: {
    id: string;
    name: string;
    semester: number;
  };
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
  profiles: {
    full_name: string;
  };
}

interface StudentPerformance {
  student_id: string;
  student_name: string;
  class_name: string;
  submissions_count: number;
  avg_grade: number;
  completion_rate: number;
}


interface Quiz {
  id: string;
  title: string;
  topic: string;
  subtopic: string;
  due_date: string;
  status: string;
  total_points: number;
  time_limit_minutes: number;
  class_id: string;
  classes: { id: string; name: string; semester: number };
  enrollment_count: number;
  submission_count: number;
  avg_percentage: number; // 0-100
}

interface QuizSubmissionRow {
  id: string;
  quiz_id: string;
  student_id: string;
  submitted_at: string | null;
  percentage: number | null;
  quizzes: { title: string; classes: { name: string } };
  profiles: { full_name: string };
}

interface NoteRow {
  id: string;
  title: string;
  class_id: string;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
  classes: { name: string; semester: number };
}

interface GlossaryRequest {
  id: string;
  word: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  requested_by_ids: any; // jsonb
  context: string | null;
}


interface ScriptNotification {
  id: string;
  script_id: string;
  type: 'submission' | 'review';
  message: string;
  is_read: boolean;
  created_at: string;
  script_analyses: {
    id: string;
    title: string;
    status: 'draft' | 'submitted' | 'reviewed';
  };
}


export default function TeacherDashboard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [studentPerformance, setStudentPerformance] = useState<
    StudentPerformance[]
  >([]);
  // under existing useState declarations
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmissionRow[]>([]);
  const [recentNotes, setRecentNotes] = useState<NoteRow[]>([]);
  const [pendingGlossary, setPendingGlossary] = useState<GlossaryRequest[]>([]);
const [scriptNotifications, setScriptNotifications] = useState<ScriptNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([
        fetchTeacherClasses(),
        fetchTeacherAssignments(),
        fetchRecentSubmissions(),
        fetchStudentPerformance(),
        fetchTeacherQuizzes(),           // ✅ NEW
        fetchRecentQuizSubmissions(),    // ✅ NEW
        fetchRecentNotes(),              // ✅ NEW
        fetchPendingGlossaryRequests(),  // ✅ NEW
        fetchScriptNotifications(),      // ✅ NEW
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

  const fetchTeacherClasses = async () => {
    try {
      const { data: classData } = await supabase
        .from("class_teachers")
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
        .eq("teacher_id", profile?.id);

      if (!classData?.length) {
        setClasses([]);
        return;
      }

      const classesWithDetails = await Promise.all(
        classData.map(async (item) => {
          const classInfo = item.classes;

          // Get student count
          const { count: studentCount } = await supabase
            .from("class_students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id);

          // Get assignment count
          const { count: assignmentCount } = await supabase
            .from("assignments")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classInfo.id)
            .eq("status", "published");

          // Calculate average completion rate
          const { data: assignmentIds } = await supabase
            .from("assignments")
            .select("id")
            .eq("class_id", classInfo.id)
            .eq("status", "published");

          let avgCompletionRate = 0;
          if (assignmentIds?.length && studentCount) {
            const { count: totalSubmissions } = await supabase
              .from("submissions")
              .select("*", { count: "exact", head: true })
              .in(
                "assignment_id",
                assignmentIds.map((a) => a.id)
              );

            const expectedSubmissions =
              assignmentIds.length * (studentCount || 0);
            avgCompletionRate =
              expectedSubmissions > 0
                ? Math.min(
                  Math.round(
                    ((totalSubmissions || 0) / expectedSubmissions) * 100
                  ),
                  100
                )
                : 0;
          }

          return {
            id: classInfo.id,
            name: classInfo.name,
            semester: classInfo.semester,
            created_at: classInfo.created_at,
            student_count: studentCount || 0,
            assignment_count: assignmentCount || 0,
            avg_completion_rate: avgCompletionRate,
          };
        })
      );

      setClasses(classesWithDetails);
    } catch (error) {
      console.error("Error fetching teacher classes:", error);
    }
  };

  const fetchTeacherAssignments = async () => {
    try {
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(
          `
          *,
          classes:class_id (
            id,
            name,
            semester
          )
        `
        )
        .eq("teacher_id", profile?.id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (!assignmentsData?.length) {
        setAssignments([]);
        return;
      }

      const assignmentsWithStats = await Promise.all(
        assignmentsData.map(async (assignment) => {
          // Get submission count
          const { count: submissionCount } = await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .eq("assignment_id", assignment.id);

          // Get total students in class
          const { count: totalStudents } = await supabase
            .from("class_students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", assignment.class_id);

          // Get average grade
          const { data: gradeData } = await supabase
            .from("submissions")
            .select("teacher_grade, ai_grade")
            .eq("assignment_id", assignment.id)
            .not("teacher_grade", "is", null)
            .not("ai_grade", "is", null);

          let avgGrade = 0;
          if (gradeData?.length) {
            const totalGrade = gradeData.reduce(
              (sum, sub) => sum + (sub.teacher_grade || sub.ai_grade || 0),
              0
            );
            avgGrade = Math.round(totalGrade / gradeData.length);
          }

          return {
            ...assignment,
            submission_count: submissionCount || 0,
            total_students: totalStudents || 0,
            avg_grade: avgGrade,
          };
        })
      );

      setAssignments(assignmentsWithStats);
    } catch (error) {
      console.error("Error fetching teacher assignments:", error);
    }
  };

  const fetchRecentSubmissions = async () => {
    try {
      // Get assignments by this teacher
      const { data: teacherAssignments } = await supabase
        .from("assignments")
        .select("id")
        .eq("teacher_id", profile?.id);

      if (!teacherAssignments?.length) {
        setSubmissions([]);
        return;
      }

      const assignmentIds = teacherAssignments.map((a) => a.id);

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
          ),
          profiles:student_id (
            full_name
          )
        `
        )
        .in("assignment_id", assignmentIds)
        .order("created_at", { ascending: false })
        .limit(20);

      setSubmissions(submissionsData || []);
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
    }
  };

  const fetchStudentPerformance = async () => {
    try {
      // Get all students from teacher's classes
      const { data: teacherClasses } = await supabase
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", profile?.id);

      if (!teacherClasses?.length) {
        setStudentPerformance([]);
        return;
      }

      const classIds = teacherClasses.map((tc) => tc.class_id);

      const { data: studentsData } = await supabase
        .from("class_students")
        .select(
          `
          student_id,
          class_id,
          classes:class_id (
            name
          ),
          profiles:student_id (
            full_name
          )
        `
        )
        .in("class_id", classIds);

      if (!studentsData?.length) {
        setStudentPerformance([]);
        return;
      }

      const studentStats = await Promise.all(
        studentsData.map(async (student) => {
          // Get assignments for this class
          const { data: classAssignments } = await supabase
            .from("assignments")
            .select("id")
            .eq("class_id", student.class_id)
            .eq("teacher_id", profile?.id)
            .eq("status", "published");

          const assignmentIds = classAssignments?.map((a) => a.id) || [];

          // Get student submissions
          const { data: studentSubmissions } = await supabase
            .from("submissions")
            .select("teacher_grade, ai_grade")
            .eq("student_id", student.student_id)
            .in("assignment_id", assignmentIds);

          const submissionsCount = studentSubmissions?.length || 0;
          const totalAssignments = assignmentIds.length;
          const completionRate =
            totalAssignments > 0
              ? Math.min(
                Math.round((submissionsCount / totalAssignments) * 100),
                100
              )
              : 0;

          // Calculate average grade
          let avgGrade = 0;
          if (studentSubmissions?.length) {
            const gradedSubmissions = studentSubmissions.filter(
              (s) => s.teacher_grade || s.ai_grade
            );
            if (gradedSubmissions.length > 0) {
              const totalGrade = gradedSubmissions.reduce(
                (sum, sub) => sum + (sub.teacher_grade || sub.ai_grade || 0),
                0
              );
              avgGrade = Math.round(totalGrade / gradedSubmissions.length);
            }
          }

          return {
            student_id: student.student_id,
            student_name: student.profiles?.full_name || "Unknown Student",
            class_name: student.classes?.name || "Unknown Class",
            submissions_count: submissionsCount,
            avg_grade: avgGrade,
            completion_rate: completionRate,
          };
        })
      );

      setStudentPerformance(studentStats);
    } catch (error) {
      console.error("Error fetching student performance:", error);
    }
  };

  const fetchTeacherQuizzes = async () => {
    try {
      const { data: quizzesData } = await supabase
        .from("quizzes")
        .select(
          `
          *,
          classes:class_id (
            id, name, semester
          )
        `
        )
        .eq("teacher_id", profile?.id)
        .eq("status", "published")
        .order("due_date", { ascending: true });

      if (!quizzesData?.length) {
        setQuizzes([]);
        return;
      }

      // For each quiz, collect enrollment/submission counts + avg %
      const enhanced = await Promise.all(
        quizzesData.map(async (q) => {
          const [{ count: enrollmentCount }, { count: submissionCount }, { data: percRows }] =
            await Promise.all([
              supabase
                .from("quiz_enrollments")
                .select("*", { count: "exact", head: true })
                .eq("quiz_id", q.id),
              supabase
                .from("quiz_submissions")
                .select("*", { count: "exact", head: true })
                .eq("quiz_id", q.id),
              supabase
                .from("quiz_submissions")
                .select("percentage")
                .eq("quiz_id", q.id)
                .not("percentage", "is", null),
            ]);

          let avg = 0;
          if (percRows?.length) {
            const nums = percRows.map((r: any) => Number(r.percentage) || 0);
            avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
          }

          return {
            ...q,
            enrollment_count: enrollmentCount || 0,
            submission_count: submissionCount || 0,
            avg_percentage: avg,
          } as Quiz;
        })
      );

      setQuizzes(enhanced);
    } catch (e) {
      console.error("Error fetching quizzes:", e);
      setQuizzes([]);
    }
  };

  const fetchRecentQuizSubmissions = async () => {
    try {
      // gather quiz ids for this teacher
      const { data: teacherQuizzes } = await supabase
        .from("quizzes")
        .select("id")
        .eq("teacher_id", profile?.id);

      if (!teacherQuizzes?.length) {
        setQuizSubmissions([]);
        return;
      }

      const quizIds = teacherQuizzes.map((q) => q.id);

      const { data: subs } = await supabase
        .from("quiz_submissions")
        .select(
          `
          id, quiz_id, student_id, submitted_at, percentage,
          quizzes:quiz_id (
            title,
            classes:class_id ( name )
          ),
          profiles:student_id ( full_name )
        `
        )
        .in("quiz_id", quizIds)
        .order("submitted_at", { ascending: false })
        .limit(20);

      setQuizSubmissions((subs || []) as unknown as QuizSubmissionRow[]);
    } catch (e) {
      console.error("Error fetching quiz submissions:", e);
      setQuizSubmissions([]);
    }
  };

  const fetchRecentNotes = async () => {
    try {
      const { data } = await supabase
        .from("notes")
        .select(
          `
          id, title, class_id, is_shared, created_at, updated_at,
          classes:class_id ( name, semester )
        `
        )
        .eq("teacher_id", profile?.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentNotes((data || []) as unknown as NoteRow[]);
    } catch (e) {
      console.error("Error fetching notes:", e);
      setRecentNotes([]);
    }
  };

  const fetchPendingGlossaryRequests = async () => {
    try {
      const { data } = await supabase
        .from("glossary_requests")
        .select("id, word, status, created_at, requested_by_ids, context")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(6);

      setPendingGlossary((data || []) as GlossaryRequest[]);
    } catch (e) {
      console.error("Error fetching glossary requests:", e);
      setPendingGlossary([]);
    }
  };


  const fetchScriptNotifications = async () => {
  try {
    const { data } = await supabase
      .from("script_notifications")
      .select(`
        id,
        script_id,
        type,
        message,
        is_read,
        created_at,
        script_analyses:script_id (
          id,
          title,
          status
        )
      `)
      .eq("user_id", profile?.id)
      .eq("type", "review")  // Only show review notifications
      .order("created_at", { ascending: false })
      .limit(5);

    setScriptNotifications((data as any) || []);
  } catch (e) {
    console.error("Error fetching script notifications:", e);
  }
};


  const upcomingQuizzes = quizzes
    .filter((q) => new Date(q.due_date) >= new Date())
    .slice(0, 5);

  const totalQuizzes = quizzes.length;

  const avgQuizScoreOverall =
    quizzes.length > 0
      ? Math.round(
        quizzes.reduce((acc, q) => acc + (q.avg_percentage || 0), 0) / quizzes.length
      )
      : 0;




  // Analytics calculations
  const totalStudents = classes.reduce(
    (sum, cls) => sum + cls.student_count,
    0
  );
  const totalAssignments = assignments.length;
  const totalSubmissions = submissions.length;
  const pendingGrading = submissions.filter(
    (s) => s.status !== "graded"
  ).length;

  // Weekly submissions data
  const getWeeklySubmissions = () => {
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

  // Class performance data
  const getClassPerformance = () => {
    return classes.map((cls) => ({
      name: cls.name.length > 15 ? cls.name.substring(0, 15) + "..." : cls.name,
      fullName: cls.name,
      students: cls.student_count,
      assignments: cls.assignment_count,
      completion: cls.avg_completion_rate,
    }));
  };

  // Grade distribution
  const getGradeDistribution = () => {
    const gradedSubmissions = submissions.filter(
      (s) => s.teacher_grade || s.ai_grade
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
        name: "Excellent (90+)",
        value: Math.min(Math.round((excellent / total) * 100), 100),
        count: excellent,
        fill: "#10B981",
      },
      {
        name: "Good (80-89)",
        value: Math.min(Math.round((good / total) * 100), 100),
        count: good,
        fill: "#3B82F6",
      },
      {
        name: "Satisfactory (70-79)",
        value: Math.min(Math.round((satisfactory / total) * 100), 100),
        count: satisfactory,
        fill: "#F59E0B",
      },
      {
        name: "Needs Improvement (<70)",
        value: Math.min(Math.round((needsImprovement / total) * 100), 100),
        count: needsImprovement,
        fill: "#EF4444",
      },
    ];
  };

  // Assignment difficulty distribution
  const getDifficultyDistribution = () => {
    const total = assignments.length;
    if (total === 0) return [];

    const easy = assignments.filter((a) => a.difficulty === "easy").length;
    const medium = assignments.filter((a) => a.difficulty === "medium").length;
    const hard = assignments.filter((a) => a.difficulty === "hard").length;

    return [
      {
        name: "Easy",
        value: Math.min(Math.round((easy / total) * 100), 100),
        count: easy,
        fill: "#10B981",
      },
      {
        name: "Medium",
        value: Math.min(Math.round((medium / total) * 100), 100),
        count: medium,
        fill: "#F59E0B",
      },
      {
        name: "Hard",
        value: Math.min(Math.round((hard / total) * 100), 100),
        count: hard,
        fill: "#EF4444",
      },
    ];
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <TeacherDashboardShimmer />
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>

        <div className="min-h-screen">
          {/* Professional Header */}
          <div className="relative mx-8 overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-400 via-red-500 to-emerald-500 text-white shadow-2xl">
            {/* Contrast overlay + soft glows */}
            <div className="absolute inset-0 bg-black/25" />
            <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 -left-28 h-[28rem] w-[28rem] rounded-full bg-black/20 blur-3xl" />

            <div className="relative px-8 py-12">
              <div className="mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-4 flex items-center gap-4">
                      <div className="rounded-xl bg-black/30 p-3 ring-1 ring-white/20">
                        <Film className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="mb-2 text-4xl font-bold">
                          Welcome back, {profile?.full_name?.split(" ")[0]}
                        </h1>
                        <p className="text-xl text-white/90">
                          Film &amp; Media Arts Department Dashboard
                        </p>
                      </div>
                    </div>

                    {/* Stats — mapped to logo colors */}
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-5">
                      {/* Students (Yellow) */}
                      
                      
                      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-yellow-500/25 p-3 ring-1 ring-yellow-300/40">
                            <Users className="h-6 w-6 text-yellow-200" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-white">
                              {totalStudents}
                            </div>
                            <div className="text-sm text-yellow-100/90">Students</div>
                          </div>
                        </div>
                      </div>

                      {/* Assignments (Red) */}
                      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-red-500/25 p-3 ring-1 ring-red-300/40">
                            <Clapperboard className="h-6 w-6 text-red-100" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-white">
                              {totalAssignments}
                            </div>
                            <div className="text-sm text-red-100/90">Assignments</div>
                          </div>
                        </div>
                      </div>

                      {/* Submissions (Emerald/Green) */}
                      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-emerald-500/25 p-3 ring-1 ring-emerald-300/40">
                            <ClipboardCheck className="h-6 w-6 text-emerald-100" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-white">
                              {totalSubmissions}
                            </div>
                            <div className="text-sm text-emerald-100/90">Submissions</div>
                          </div>
                        </div>
                      </div>

                      {/* Classes (Green end of logo) */}
                      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-green-600/25 p-3 ring-1 ring-green-300/40">
                            <School className="h-6 w-6 text-green-100" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-white">
                              {classes.length}
                            </div>
                            <div className="text-sm text-green-100/90">Classes</div>
                          </div>
                        </div>
                      </div>

                       {/* Script Notifications */}
                       <Link to={"/teacher/script-submissions"} >
                      <div className="rounded-xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
                        <div className="flex items-center gap-4">
                          <div className="rounded-lg bg-green-600/25 p-3 ring-1 ring-green-300/40">
                            <Monitor className="h-6 w-6 text-green-100" />
                          </div>
                          <div>
                            <div className="text-3xl font-bold text-white">
                             {scriptNotifications.length}
                            </div>
                            <div className="text-sm text-green-100/90">Script Notifications</div>
                          </div>
                        </div>
                        
                      </div>
                      </Link>
                    </div>
                  </div>

                  {/* Optional logo “swoosh” glow placeholder on large screens */}
                  <div className="hidden lg:block">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-sm">
                      {/* Keep this empty or place a small logo image here if you want */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          <div className="max-w-7xl mx-auto px-8 py-8 space-y-8">

            {/* Quick Actions Section */}
            {/* Quick Actions Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              {/* Header themed to logo colors */}
              <div className="bg-gradient-to-r from-yellow-500 via-red-500 to-emerald-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <Zap className="h-6 w-6 text-white/90" />
                  Quick Actions
                </h2>
                <p className="text-white/90 text-sm mt-1">Streamline your workflow</p>
              </div>

              {/* Use grid + gap for reliable vertical spacing */}
              <div className="p-6 grid grid-cols-1 gap-4">
                <Link to="/teacher/create-assignment">
                  <Button className="w-full justify-start bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-12 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Clapperboard className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Create Film Assignment</div>
                        <div className="text-xs text-red-100">New assignment with AI assistance</div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link to="/teacher/create-quiz">
                  <Button className="w-full justify-start bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white h-12 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Timer className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Create Quiz</div>
                        <div className="text-xs text-emerald-100">Knowledge assessment</div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link to="/teacher/create-notes">
                  <Button className="w-full justify-start bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white h-12 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Book className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Create Lecture Notes</div>
                        <div className="text-xs text-yellow-100">Share with students</div>
                      </div>
                    </div>
                  </Button>
                </Link>

                <Link to="/teacher/classes">
                  <Button className="w-full justify-start bg-gradient-to-r from-green-700 to-emerald-800 hover:from-green-800 hover:to-emerald-900 text-white h-12 text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Monitor className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Manage Classes</div>
                        <div className="text-xs text-emerald-100">View and organize</div>
                      </div>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>


            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Weekly Submissions Chart */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <Activity className="h-5 w-5" />
                    Weekly Submissions
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">Submission trends over time</p>
                </div>
                <div className="p-6">
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getWeeklySubmissions()}>
                        <defs>
                          <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis
                          dataKey="week"
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <YAxis
                          stroke="#6B7280"
                          fontSize={12}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="submissions"
                          stroke="#3B82F6"
                          fill="url(#colorSubmissions)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Grade Distribution */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <PieChart className="h-5 w-5" />
                    Grade Distribution
                  </h3>
                  <p className="text-emerald-100 text-sm mt-1">Student performance overview</p>
                </div>
                <div className="p-6">
                  {getGradeDistribution().length > 0 ? (
                    <>
                      <div className="h-[200px] mb-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie
                              data={getGradeDistribution()}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {getGradeDistribution().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value: any) => [`${value}%`, '']}
                              contentStyle={{
                                backgroundColor: '#1F2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#F9FAFB'
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {getGradeDistribution().map((entry) => (
                          <div
                            key={entry.name}
                            className="flex items-center justify-between text-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: entry.fill }}
                              ></div>
                              <span className="text-gray-600">{entry.name}</span>
                            </div>
                            <span className="font-medium text-gray-900">{entry.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-sm">No graded submissions yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Film Assignments Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                      <Clapperboard className="h-5 w-5" />
                      Recent Film Assignments
                    </h3>
                    <p className="text-indigo-100 text-sm mt-1">Latest assignments and submissions</p>
                  </div>
                  <Link to="/teacher/create-assignment">
                    <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      <Plus className="h-4 w-4 mr-1" />
                      New Assignment
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {assignments.slice(0, 5).map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-gray-300 transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 truncate flex-1 mr-2">
                          {assignment.title}
                        </h4>
                        <Badge
                          className={
                            assignment.difficulty === "easy"
                              ? "bg-green-100 text-green-700 border-green-200"
                              : assignment.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : "bg-red-100 text-red-700 border-red-200"
                          }
                        >
                          {assignment.difficulty?.charAt(0).toUpperCase() +
                            assignment.difficulty?.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <School className="h-4 w-4" />
                          {assignment.classes?.name} • Sem {assignment.classes?.semester}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {assignment.submission_count}/{assignment.total_students}
                          </span>
                          {assignment.avg_grade > 0 && (
                            <span className="text-emerald-600 font-medium flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              Avg: {assignment.avg_grade}%
                            </span>
                          )}
                        </div>
                        <Link to={`/teacher/assignments`}>
                          <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700">
                            View Details
                            <ChevronRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {assignments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Clapperboard className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium mb-2">No Assignments yet</h4>
                      <p className="text-sm mb-4">Create your first film Assignment to get started</p>
                      <Link to="/teacher/create-assignment">
                        <Button className="bg-indigo-600 hover:bg-indigo-700">
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Assignment
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Classes Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-3">
                      <Monitor className="h-5 w-5" />
                      My Classes
                    </h3>
                    <p className="text-purple-100 text-sm mt-1">Manage your film classes</p>
                  </div>
                  <Link to="/teacher/classes">
                    <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                      Manage All
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((classItem) => (
                    <div key={classItem.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-br from-gray-50 to-white">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">
                          {classItem.name}
                        </h4>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                          Sem {classItem.semester}
                        </Badge>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            Students
                          </span>
                          <span className="font-medium">{classItem.student_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Clapperboard className="h-4 w-4" />
                            Assignments
                          </span>
                          <span className="font-medium">{classItem.assignment_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 flex items-center gap-1">
                            <Target className="h-4 w-4" />
                            Completion
                          </span>
                          <span className="font-medium text-emerald-600">{classItem.avg_completion_rate}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(classItem.avg_completion_rate, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {classes.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      <Monitor className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h4 className="text-lg font-medium mb-2">No classes assigned</h4>
                      <p className="text-sm">Contact your administrator to get assigned to classes</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quizzes and Notes Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Upcoming Quizzes */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <Timer className="h-5 w-5" />
                        Upcoming Quizzes
                      </h3>
                      <p className="text-emerald-100 text-sm mt-1">Knowledge assessments</p>
                    </div>
                    <Link to="/teacher/quizzes">
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        Manage
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {upcomingQuizzes.map((q) => (
                      <div key={q.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 truncate mr-2">{q.title}</h4>
                          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Sem {q.classes?.semester}</Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4" />
                            {q.classes?.name}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            Due {format(new Date(q.due_date), "MMM dd, yyyy")}
                          </span>
                          <div className="flex items-center gap-2">
                            {q.avg_percentage > 0 && (
                              <span className="text-emerald-600 font-medium">
                                Avg: {q.avg_percentage}%
                              </span>
                            )}
                            <Badge className="bg-gray-100 text-gray-700">
                              {q.submission_count}/{q.enrollment_count}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingQuizzes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Timer className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No upcoming quizzes</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Notes */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <Book className="h-5 w-5" />
                        Recent Notes
                      </h3>
                      <p className="text-amber-100 text-sm mt-1">Lecture materials</p>
                    </div>
                    <Link to="/teacher/notes">
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        View All
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recentNotes.map((n) => (
                      <div key={n.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 truncate mr-2">{n.title}</h4>
                          {n.is_shared ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Shared</Badge>
                          ) : (
                            <Badge variant="outline">Private</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <School className="h-4 w-4" />
                            {n.classes?.name} • Sem {n.classes?.semester}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {format(new Date(n.updated_at || n.created_at), "MMM dd")}
                          </span>
                          <Link to="/teacher/notes">
                            <Button size="sm" variant="ghost" className="text-amber-600 hover:text-amber-700">
                              Open
                              <ChevronRight className="h-3 w-3 ml-1" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                    {recentNotes.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Book className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No notes yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>



            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Recent Submissions */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <ClipboardCheck className="h-5 w-5" />
                    Recent Submissions
                  </h3>
                  <p className="text-green-100 text-sm mt-1">Latest student work</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {submissions.slice(0, 5).map((submission) => (
                      <div key={submission.id} className="border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">
                            {submission.assignment?.title || "Unknown Assignment"}
                          </h5>
                          <Badge className={`text-xs ${submission.status === "graded"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}>
                            {submission.status === "graded" ? "Graded" : "Pending"}
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
                </div>
              </div>

              {/* Quiz Submissions */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <ListChecks className="h-5 w-5" />
                    Quiz Submissions
                  </h3>
                  <p className="text-indigo-100 text-sm mt-1">Assessment results</p>
                </div>
                <div className="p-6">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {quizSubmissions.slice(0, 5).map((s) => (
                      <div key={s.id} className="border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-900 truncate mr-2">
                            {s.quizzes?.title || "Unknown Quiz"}
                          </h5>
                          <Badge className={`text-xs ${s.percentage != null
                            ? "bg-green-100 text-green-700 border-green-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                            }`}>
                            {s.percentage != null ? "Scored" : "Submitted"}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-600 mb-2">
                          {s.profiles?.full_name} • {s.quizzes?.classes?.name}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {s.submitted_at ? format(new Date(s.submitted_at), "MMM dd") : ""}
                          </span>
                          {s.percentage != null && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-sm font-medium text-gray-700">
                                {Math.round(Number(s.percentage))}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {quizSubmissions.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <ListChecks className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No quiz submissions yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Glossary Requests */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-3">
                        <HelpCircle className="h-5 w-5" />
                        Glossary Requests
                      </h3>
                      <p className="text-amber-100 text-sm mt-1">Pending review</p>
                    </div>
                    <Link to="/teacher/glossary">
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                        Review
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {pendingGlossary.map((g) => (
                      <div key={g.id} className="border border-gray-200 rounded-xl p-3 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900 truncate">{g.word}</div>
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending</Badge>
                        </div>
                        {g.context && (
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {g.context}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-2">
                          Requested on {format(new Date(g.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                    ))}
                    {pendingGlossary.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <HelpCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>No new glossary requests</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Class Performance Chart */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-600 to-yellow-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <TrophyIcon className="h-5 w-5" />
                  Class Performance
                </h3>
                <p className="text-yellow-100 text-sm mt-1">Overview of all classes</p>
              </div>
              <div className="p-6">
                {getClassPerformance().length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getClassPerformance()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                        <YAxis stroke="#6B7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1F2937',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any, name: string) => {
                            if (name === "students") return [`${value}`, "Students"];
                            if (name === "assignments") return [`${value}`, "Assignments"];
                            if (name === "completion") return [`${value}%`, "Completion Rate"];
                            return [value, name];
                          }}
                          labelFormatter={(label: string) => {
                            const item = getClassPerformance().find((c) => c.name === label);
                            return item ? item.fullName : label;
                          }}
                        />
                        <Bar dataKey="students" fill="#3B82F6" name="students" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="assignments" fill="#10B981" name="assignments" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="completion" fill="#6366F1" name="completion" radius={[4, 4, 0, 0]} />
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
              </div>
            </div>

            {/* Top Students */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-3">
                  <UserCheck className="h-5 w-5" />
                  Top Performing Students
                </h3>
                <p className="text-blue-100 text-sm mt-1">Best performers across classes</p>
              </div>
              <div className="p-6">
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {studentPerformance
                    .filter((student) => student.avg_grade > 0)
                    .sort((a, b) => b.avg_grade - a.avg_grade)
                    .slice(0, 6)
                    .map((student, index) => (
                      <div key={student.student_id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-white font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{student.student_name}</h4>
                            <p className="text-sm text-gray-600">{student.class_name}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-emerald-600">{student.avg_grade}%</div>
                            <div className="text-xs text-gray-500">Average</div>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-600">Completion: {student.completion_rate}%</span>
                          <span className="text-gray-600">{student.submissions_count} submissions</span>
                        </div>
                      </div>
                    ))}
                  {studentPerformance.filter((s) => s.avg_grade > 0).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <UserCheck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p>No student performance data available yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          {assignments.filter(
            (a) =>
              a.submission_count < a.total_students &&
              new Date(a.due_date) < new Date()
          ).length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-amber-200 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    <AlertCircle className="h-5 w-5" />
                    Assignments Requiring Attention
                  </h3>
                  <p className="text-amber-100 text-sm mt-1">Overdue Assignments with missing submissions</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {assignments
                      .filter(
                        (a) =>
                          a.submission_count < a.total_students &&
                          new Date(a.due_date) < new Date()
                      )
                      .slice(0, 6)
                      .map((assignment) => (
                        <div key={assignment.id} className="border border-amber-200 rounded-xl p-4 bg-amber-50 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <h4 className="font-semibold text-gray-900 truncate flex-1">
                              {assignment.title}
                            </h4>
                          </div>
                          <div className="text-sm text-gray-600 mb-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <School className="h-4 w-4" />
                              {assignment.classes?.name}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
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
                </div>
              </div>
            )}
        </div>

      </ModernDashboardLayout>
    </AuthGuard >
  );
}
