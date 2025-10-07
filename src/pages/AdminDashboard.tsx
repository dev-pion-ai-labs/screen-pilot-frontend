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
import { addDays } from "date-fns";


// ------------------------------------------------------------
interface QuizKPIs {
  total: number;
  open: number;
  dueSoon: number;
  completionRate: number;
  avgScore: number;
  lateRate: number;
}

interface QuizAnalytics {
  scoreTrend: Array<{ date: string; avg: number }>;
  completionBySemester: Array<{ semester: string; assigned: number; submitted: number; completion: number }>;
  upcoming: Array<{ id: string; title: string; due_date: string; class_name?: string; semester: number }>;
}

interface NoteKPIs {
  total: number;
  newThisPeriod: number;
  sharedPct: number;
  coverage: number; // unique classes with new notes in period
  medianAgeDays: number;
}

interface NoteAnalytics {
  notesTrend: Array<{ date: string; count: number }>;
  bySemester: Array<{ semester: string; shared: number; total: number }>;
  recentNotes: Array<{ id: string; title: string; semester: number; created_at: string; class_name?: string }>;
}

// ------------------------------------------------------------

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

  });

  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("7d");

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      await Promise.all([fetchBasicStats(), fetchAnalytics(), fetchQuizData(), fetchNoteData()]);
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
        // 1) Get published assignments for this class + student count
        const [{ data: classAssignments, count: totalAssignments }, { count: studentCount }] =
          await Promise.all([
            supabase
              .from("assignments")
              .select("id", { count: "exact" })
              .eq("class_id", cls.id)
              .eq("status", "published"),
            supabase
              .from("class_students")
              .select("*", { count: "exact", head: true })
              .eq("class_id", cls.id),
          ]);

        const assignmentIds = (classAssignments || []).map((a) => a.id);

        // 2) Total submissions across those assignments
        const { count: totalSubmissions } = assignmentIds.length
          ? await supabase
            .from("submissions")
            .select("*", { count: "exact", head: true })
            .in("assignment_id", assignmentIds)
          : { count: 0 };

        // 3) Average grade (keep using graded submissions)
        const { data: gradedSubs } = await supabase
          .from("submissions")
          .select("grade, assignments!inner(class_id)")
          .not("grade", "is", null)
          .eq("assignments.class_id", cls.id);

        const averageGrade = gradedSubs?.length
          ? gradedSubs.reduce((sum, sub) => sum + (sub.grade || 0), 0) / gradedSubs.length
          : 0;

        // 4) Correct completion rate: submissions / (assignments * students)
        const expected = (totalAssignments || 0) * (studentCount || 0);
        const completionRate = expected
          ? Math.min(Math.round(((totalSubmissions || 0) / expected) * 100), 100)
          : 0;

        return {
          subject: cls.name,
          total: totalAssignments || 0,
          completed: totalSubmissions || 0,   // you’re showing this in the card
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

  const [quizKPIs, setQuizKPIs] = useState<QuizKPIs>({
    total: 0,
    open: 0,
    dueSoon: 0,
    completionRate: 0,
    avgScore: 0,
    lateRate: 0,
  });

  const [quizAnalytics, setQuizAnalytics] = useState<QuizAnalytics>({
    scoreTrend: [],
    completionBySemester: [],
    upcoming: [],
  });

  const [noteKPIs, setNoteKPIs] = useState<NoteKPIs>({
    total: 0,
    newThisPeriod: 0,
    sharedPct: 0,
    coverage: 0,
    medianAgeDays: 0,
  });

  const [noteAnalytics, setNoteAnalytics] = useState<NoteAnalytics>({
    notesTrend: [],
    bySemester: [],
    recentNotes: [],
  });


  const fetchQuizData = async () => {
    const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
    const startISO = subDays(new Date(), days).toISOString();
    const nowISO = new Date().toISOString();
    const soonISO = addDays(new Date(), 7).toISOString();

    // KPIs
    const [{ count: total }, { count: open }, { count: dueSoon }] = await Promise.all([
      supabase.from("quizzes").select("*", { count: "exact", head: true }),
      supabase.from("quizzes").select("*", { count: "exact", head: true }).eq("status", "published").gt("due_date", nowISO),
      supabase.from("quizzes").select("*", { count: "exact", head: true })
        .eq("status", "published")
        .gte("due_date", nowISO)
        .lte("due_date", soonISO),
    ]);

    const { data: subs } = await supabase
      .from("quiz_submissions")
      .select("quiz_id, submitted_at, percentage, score, total_points")
      .gte("submitted_at", startISO);

    const { data: enrollmentsSem } = await supabase
      .from("quiz_enrollments")
      .select("quiz_id, assigned_at, quizzes:quiz_id(semester)")
      .gte("assigned_at", startISO);

    const { data: submissionsSem } = await supabase
      .from("quiz_submissions")
      .select("quiz_id, submitted_at, quizzes:quiz_id(semester)")
      .gte("submitted_at", startISO);

    // avg score overall
    const percentages = (subs || []).map(s => {
      if (typeof s.percentage === "number") return s.percentage;
      if (s.total_points && s.total_points > 0 && typeof s.score === "number") {
        return (s.score / s.total_points) * 100;
      }
      return null;
    }).filter((v): v is number => v !== null);
    const avgScore = percentages.length ? Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length) : 0;

    // late rate
    const quizIds = Array.from(new Set((subs || []).map(s => s.quiz_id))).filter(Boolean);
    let lateRate = 0;
    if (quizIds.length) {
      const { data: quizMeta } = await supabase
        .from("quizzes")
        .select("id, due_date")
        .in("id", quizIds);
      const dueMap = new Map((quizMeta || []).map(q => [q.id, q.due_date]));
      const lateCount = (subs || []).reduce((acc, s) => {
        const due = dueMap.get(s.quiz_id);
        if (!due) return acc;
        return acc + (new Date(s.submitted_at) > new Date(due) ? 1 : 0);
      }, 0);
      lateRate = subs && subs.length ? Math.round((lateCount / subs.length) * 100) : 0;
    }

    // completion rate overall (period)
    const assignedCount = enrollmentsSem?.length || 0;
    const submittedCount = submissionsSem?.length || 0;
    const completionRate = assignedCount ? Math.min(Math.round((submittedCount / assignedCount) * 100), 100) : 0;

    // score trend per day
    const dayKey = (d: string) => format(new Date(d), "MMM dd");
    const byDay: Record<string, number[]> = {};
    (subs || []).forEach(s => {
      const k = dayKey(s.submitted_at);
      const p = typeof s.percentage === "number"
        ? s.percentage
        : (s.total_points && s.total_points > 0 && typeof s.score === "number")
          ? (s.score / s.total_points) * 100
          : null;
      if (p !== null) {
        byDay[k] = byDay[k] || [];
        byDay[k].push(p);
      }
    });
    const scoreTrend = Object.entries(byDay).map(([date, arr]) => ({
      date,
      avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // completion by semester
    const semAssigned: Record<string, number> = {};
    const semSubmitted: Record<string, number> = {};
    (enrollmentsSem || []).forEach(e => {
      const sem = e.quizzes?.semester ? `Semester ${e.quizzes.semester}` : "Unknown";
      semAssigned[sem] = (semAssigned[sem] || 0) + 1;
    });
    (submissionsSem || []).forEach(s => {
      const sem = s.quizzes?.semester ? `Semester ${s.quizzes.semester}` : "Unknown";
      semSubmitted[sem] = (semSubmitted[sem] || 0) + 1;
    });
    const semesters = Array.from(new Set([...Object.keys(semAssigned), ...Object.keys(semSubmitted)]));
    const completionBySemester = semesters.map(sem => {
      const a = semAssigned[sem] || 0;
      const sub = semSubmitted[sem] || 0;
      return { semester: sem, assigned: a, submitted: sub, completion: a ? Math.min(Math.round((sub / a) * 100), 100) : 0 };
    });

    // upcoming quizzes (next 7 days)
    const { data: upcomingData } = await supabase
      .from("quizzes")
      .select("id, title, due_date, semester, classes:class_id(name)")
      .eq("status", "published")
      .gte("due_date", nowISO)
      .lte("due_date", soonISO)
      .order("due_date", { ascending: true })
      .limit(6);

    setQuizKPIs({
      total: total || 0,
      open: open || 0,
      dueSoon: dueSoon || 0,
      completionRate,
      avgScore,
      lateRate,
    });

    setQuizAnalytics({
      scoreTrend,
      completionBySemester,
      upcoming: (upcomingData || []).map(q => ({
        id: q.id,
        title: q.title,
        due_date: q.due_date,
        class_name: q.classes?.name,
        semester: q.semester,
      })),
    });
  };

  const fetchNoteData = async () => {
    const days = selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;
    const startISO = subDays(new Date(), days).toISOString();

    // KPIs
    const [{ count: total }, { data: newNotes }, { count: sharedCount }, { data: allNotes }] = await Promise.all([
      supabase.from("notes").select("*", { count: "exact", head: true }),
      supabase.from("notes").select("created_at, class_id").gte("created_at", startISO),
      supabase.from("notes").select("*", { count: "exact", head: true }).eq("is_shared", true),
      supabase.from("notes").select("created_at"),
    ]);

    const coverage = new Set((newNotes || []).map(n => n.class_id)).size;

    const ages = (allNotes || []).map(n => {
      const daysOld = Math.floor((Date.now() - new Date(n.created_at).getTime()) / (1000 * 60 * 60 * 24));
      return daysOld;
    }).sort((a, b) => a - b);
    const medianAgeDays = ages.length
      ? (ages.length % 2 === 1
        ? ages[(ages.length - 1) / 2]
        : Math.round((ages[ages.length / 2 - 1] + ages[ages.length / 2]) / 2))
      : 0;

    const sharedPct = total ? Math.round(((sharedCount || 0) / total) * 100) : 0;

    // notes trend (per day)
    const dayKey = (d: string) => format(new Date(d), "MMM dd");
    const dayCounts: Record<string, number> = {};
    (newNotes || []).forEach(n => {
      const k = dayKey(n.created_at);
      dayCounts[k] = (dayCounts[k] || 0) + 1;
    });
    const notesTrend = Object.entries(dayCounts).map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // notes by semester
    const { data: notesSem } = await supabase.from("notes").select("semester, is_shared");
    const semTotals: Record<string, { total: number; shared: number }> = {};
    (notesSem || []).forEach(n => {
      const sem = n.semester ? `Semester ${n.semester}` : "Unknown";
      if (!semTotals[sem]) semTotals[sem] = { total: 0, shared: 0 };
      semTotals[sem].total += 1;
      if (n.is_shared) semTotals[sem].shared += 1;
    });
    const bySemester = Object.entries(semTotals).map(([semester, v]) => ({
      semester,
      total: v.total,
      shared: v.shared,
    }));

    // recent shared notes
    const { data: recent } = await supabase
      .from("notes")
      .select("id, title, semester, created_at, classes:class_id(name)")
      .eq("is_shared", true)
      .order("created_at", { ascending: false })
      .limit(5);

    setNoteKPIs({
      total: total || 0,
      newThisPeriod: newNotes?.length || 0,
      sharedPct,
      coverage,
      medianAgeDays,
    });

    setNoteAnalytics({
      notesTrend,
      bySemester,
      recentNotes: (recent || []).map(r => ({
        id: r.id,
        title: r.title,
        semester: r.semester,
        created_at: r.created_at,
        class_name: r.classes?.name,
      })),
    });
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

                </div>
                <div className="hidden lg:block">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Sparkles className="h-16 w-16 text-white/80" />
                  </div>
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

          {/* Quizzes & Notes KPIs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-indigo-600" />
                  Quiz KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-2xl font-bold">{quizKPIs.total}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Open</div>
                    <div className="text-2xl font-bold">{quizKPIs.open}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Due (7d)</div>
                    <div className="text-2xl font-bold">{quizKPIs.dueSoon}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Completion</div>
                    <div className="text-2xl font-bold">{quizKPIs.completionRate}%</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Avg Score</div>
                    <div className="text-2xl font-bold">{quizKPIs.avgScore}%</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Late Rate</div>
                    <div className="text-2xl font-bold">{quizKPIs.lateRate}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  Notes KPIs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Total</div>
                    <div className="text-2xl font-bold">{noteKPIs.total}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">New (period)</div>
                    <div className="text-2xl font-bold">{noteKPIs.newThisPeriod}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">% Shared</div>
                    <div className="text-2xl font-bold">{noteKPIs.sharedPct}%</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Coverage</div>
                    <div className="text-2xl font-bold">{noteKPIs.coverage}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-white">
                    <div className="text-xs text-gray-500">Median Age</div>
                    <div className="text-2xl font-bold">{noteKPIs.medianAgeDays}d</div>
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-indigo-600" />
                      Average Quiz Score (trend)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={quizAnalytics.scoreTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="avg" stroke="#6366F1" strokeWidth={3} name="Avg %" />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AreaChart className="h-5 w-5 text-purple-600" />
                      Notes Created (trend)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={noteAnalytics.notesTrend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} name="Notes" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                        layout="vertical"
                        margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 'dataMax + 5']} />
                        <YAxis type="category" dataKey="semester" width={110} />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="students"
                          name="Students"
                          fill="#3B82F6"
                          radius={[0, 6, 6, 0]}
                          barSize={14}
                        />
                        <Bar
                          dataKey="assignments"
                          name="Assignments"
                          fill="#10B981"
                          radius={[0, 6, 6, 0]}
                          barSize={14}
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      Quiz Completion by Semester
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quizAnalytics.completionBySemester}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semester" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="assigned" fill="#3B82F6" name="Assigned" />
                          <Bar dataKey="submitted" fill="#10B981" name="Submitted" />
                          <Bar dataKey="completion" fill="#6366F1" name="Completion %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-600" />
                      Notes by Semester
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={noteAnalytics.bySemester}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="semester" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total" fill="#8B5CF6" name="Total" />
                          <Bar dataKey="shared" fill="#10B981" name="Shared" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-indigo-600" />
                      Upcoming Quizzes (7 days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {quizAnalytics.upcoming.length > 0 ? (
                        quizAnalytics.upcoming.map(q => (
                          <div key={q.id} className="p-3 rounded-lg border bg-white flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{q.title}</div>
                              <div className="text-xs text-gray-600">
                                {q.class_name ? `${q.class_name} • ` : ""}Sem {q.semester}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-indigo-600">
                              {format(new Date(q.due_date), "MMM dd, yyyy")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No quizzes due soon</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      Recently Shared Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {noteAnalytics.recentNotes.length > 0 ? (
                        noteAnalytics.recentNotes.map(n => (
                          <div key={n.id} className="p-3 rounded-lg border bg-white flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{n.title}</div>
                              <div className="text-xs text-gray-600">
                                {n.class_name ? `${n.class_name} • ` : ""}Sem {n.semester}
                              </div>
                            </div>
                            <div className="text-sm font-semibold text-purple-600">
                              {format(new Date(n.created_at), "MMM dd")}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No shared notes yet</div>
                      )}
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
                        layout="vertical"                          // <— key fix
                        margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
                        barCategoryGap={14}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          domain={[0, 'dataMax + 5']}              // keeps bars visible even for small values
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="teacher"
                          width={120}
                          interval={0}                             // show all labels
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="assignments"
                          name="Assignments Created"
                          fill="#3B82F6"
                          barSize={14}
                          radius={[0, 6, 6, 0]}
                        />
                        <Bar
                          dataKey="students"
                          name="Students Taught"
                          fill="#10B981"
                          barSize={14}
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                </CardContent>
              </Card>

              {/* Performance Metrics */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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


              </div> */}

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
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0
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
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${index === 0
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
