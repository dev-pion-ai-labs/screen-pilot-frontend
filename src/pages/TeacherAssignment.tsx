"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { AuthGuard } from "@/components/AuthGuard";
import { TeacherAssignmentShimmer } from "@/components/TeacherAssignmentShimmer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Users,
  FileText,
  Calendar,
  Download,
  Star,
  X,
  BookOpen,
  Award,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Target,
} from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  semester: number;
  topic: string;
  total_points: number;
  difficulty: string;
  status: string;
  created_at: string;
  assignment_enrollments?: any[];
  submissions?: any[];
}

interface Submission {
  id: string;
  student_id: string;
  status: string;
  submission_date: string;
  ai_grade?: number;
  ai_overall_grade?: string;
  ai_strengths?: string;
  ai_areas_for_improvement?: string;
  ai_recommendations?: string;
  ai_rubric_breakdown?: string;
  ai_academic_integrity?: string;
  ai_status?: string;
  ai_red_flags?: string;
  ai_evaluation?: any;
  teacher_grade?: number | null;
  teacher_feedback?: string | null;
  file_name?: string;
  file_path?: string;
  script_url?: string;
  profiles?: { full_name: string };
}

const TeacherAssignment = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("manage");
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState("");
  const [feedbackInput, setFeedbackInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  console.log("hey", viewSubmission);

  // Add filter states
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [dueDateFilter, setDueDateFilter] = useState<string>("all");
  const [submissionDateFilter, setSubmissionDateFilter] =
    useState<string>("all");

  // Filter functions
  const filterAssignments = (assignments: Assignment[]) => {
    return assignments.filter((assignment) => {
      const semesterMatch =
        semesterFilter === "all" ||
        assignment.semester === Number.parseInt(semesterFilter);
      const dueDateMatch =
        dueDateFilter === "all" ||
        isWithinDateRange(assignment.due_date, dueDateFilter);
      return semesterMatch && dueDateMatch;
    });
  };

  const filterSubmissions = (submissions: Submission[]) => {
    return submissions.filter((submission) => {
      const semesterMatch =
        semesterFilter === "all" ||
        assignments.find((a) =>
          a.submissions?.some((s) => s.id === submission.id)
        )?.semester === Number.parseInt(semesterFilter);
      const submissionDateMatch =
        submissionDateFilter === "all" ||
        isWithinDateRange(submission.submission_date, submissionDateFilter);
      return semesterMatch && submissionDateMatch;
    });
  };

  const isWithinDateRange = (date: string, filter: string) => {
    const submissionDate = new Date(date);
    const today = new Date();
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case "today":
        return submissionDate.toDateString() === today.toDateString();
      case "week":
        return submissionDate >= oneWeekAgo && submissionDate <= today;
      case "month":
        return submissionDate >= oneMonthAgo && submissionDate <= today;
      default:
        return true;
    }
  };

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("assignments")
        .select(
          `
    *,
    assignment_enrollments(count),
    submissions(
      *,
      profiles:profiles!submissions_student_id_fkey(
        id,
        full_name
      )
    )
  `
        )
        .eq("teacher_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("✅ Assignments fetched:", data);
      data?.forEach((a) => {
        a.submissions?.forEach((s) => {
          console.log(
            `📄 Submission: ${s.id} | Student: ${s.student_id} | Name: ${s.profiles?.full_name}`
          );
        });
      });
      setAssignments(data || []);
    } catch (error) {
      console.error("❌ Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSubmission = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("assignment-submissions")
        .download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("Download failed!");
    }
  };

  const handleOpenSubmission = (submission: Submission) => {
    console.log("🔍 TEACHER VIEW - RAW SUBMISSION DATA:", JSON.stringify(submission, null, 2));
    console.log("📝 SUBMISSION TYPE:", typeof submission);
    console.log("🎯 SUBMISSION KEYS:", Object.keys(submission || {}));
    console.log("📊 AI FEEDBACK RAW:", submission.ai_feedback);
    console.log("💾 AI EVALUATION RAW:", submission.ai_evaluation);
    console.log("🔍 AI FEEDBACK TYPE:", typeof submission.ai_feedback);
    console.log("💾 AI EVALUATION TYPE:", typeof submission.ai_evaluation);
    console.log("📋 SUBMISSION BREAKDOWN:", {
      id: submission.id,
      studentId: submission.student_id,
      studentName: submission.profiles?.full_name,
      hasAiFeedback: !!submission.ai_feedback,
      hasAiEvaluation: !!submission.ai_evaluation,
      hasAiStrengths: !!submission.ai_strengths,
      hasAiAreasForImprovement: !!submission.ai_areas_for_improvement,
      hasAiRecommendations: !!submission.ai_recommendations,
      aiGrade: submission.ai_grade,
      teacherGrade: submission.teacher_grade,
      status: submission.status,
      submissionDate: submission.submission_date
    });
    
    // Try to parse ai_feedback if it's a string
    if (submission.ai_feedback && typeof submission.ai_feedback === 'string') {
      try {
        const parsedFeedback = JSON.parse(submission.ai_feedback);
        console.log("✅ PARSED AI FEEDBACK:", JSON.stringify(parsedFeedback, null, 2));
        console.log("🔍 PARSED FEEDBACK KEYS:", Object.keys(parsedFeedback || {}));
        if (parsedFeedback.rawText) {
          console.log("📄 RAW TEXT CONTENT:", parsedFeedback.rawText);
          console.log("🧾 SUMMARY FEEDBACK CHECK:", parsedFeedback.rawText.includes('🧾 **Summary Feedback**'));
          console.log("🎓 LECTURER'S GUIDANCE CHECK:", parsedFeedback.rawText.includes('🎓 **Lecturer\'s Guidance**'));
        }
      } catch (e) {
        console.error("❌ FAILED TO PARSE AI FEEDBACK:", e);
      }
    }
    
    setViewSubmission(submission);
    setGradeInput(submission.teacher_grade?.toString() || "");
    setFeedbackInput(submission.teacher_feedback || "");
  };

  const handleGradeSubmit = async () => {
    if (!viewSubmission) return;
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({
          teacher_grade: gradeInput ? Number(gradeInput) : null,
          teacher_feedback: feedbackInput || null,
          status: "graded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", viewSubmission.id);

      if (error) throw error;
      fetchAssignments();
      setViewSubmission(null);
    } catch (error) {
      alert("Failed to update grade/feedback!");
    } finally {
      setSubmitting(false);
    }
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "published":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
      case "draft":
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0";
      case "submitted":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0";
      case "graded":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0";
    }
  };

  const getGradeColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getGradeBadgeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case "excellent":
        return "bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0";
      case "good":
        return "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0";
      case "satisfactory":
        return "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0";
      case "needs improvement":
        return "bg-gradient-to-r from-red-500 to-pink-500 text-white border-0";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-0";
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <TeacherAssignmentShimmer />
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto space-y-8 p-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Assignment Management
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Manage your assignments and review student submissions
              </p>
            </div>

            {/* Main Content */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4">
                  <TabsList className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl p-1">
                    <TabsTrigger
                      value="manage"
                      className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Manage Assignments
                    </TabsTrigger>
                    <TabsTrigger
                      value="submissions"
                      className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white transition-all duration-300"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Submissions
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Assignment overview */}
                <TabsContent value="manage" className="p-6">
                  <div className="space-y-6">
                    {/* Filters for Manage Assignments */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-0 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                          <Calendar className="h-4 w-4 text-white" />
                        </div>
                        Filter Assignments
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Semester
                          </label>
                          <select
                            value={semesterFilter}
                            onChange={(e) => setSemesterFilter(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 font-medium text-gray-700"
                          >
                            <option value="all">All Semesters</option>
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Due Date
                          </label>
                          <select
                            value={dueDateFilter}
                            onChange={(e) => setDueDateFilter(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 font-medium text-gray-700"
                          >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {assignments.length === 0 ? (
                      <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-0">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl mb-6">
                          <FileText className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          No assignments created
                        </h3>
                        <p className="text-gray-600 text-lg">
                          Create your first assignment to get started.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-6">
                        {filterAssignments(assignments).map((assignment) => (
                          <Card
                            key={assignment.id}
                            className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                          >
                            <CardHeader className="pb-4">
                              <div className="flex justify-between items-start">
                                <div className="space-y-2">
                                  <CardTitle className="text-xl font-bold text-gray-900">
                                    {assignment.title}
                                  </CardTitle>
                                  <p className="text-gray-600 font-medium">
                                    {assignment.topic}
                                  </p>
                                </div>
                                <div className="flex gap-3">
                                  <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
                                    Sem {assignment.semester}
                                  </Badge>
                                  <Badge
                                    className={getStatusBadgeColor(
                                      assignment.status
                                    )}
                                  >
                                    {capitalizeFirst(assignment.status)}
                                  </Badge>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="grid md:grid-cols-4 gap-6">
                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl">
                                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                                    <Calendar className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-600 font-medium">
                                      Due Date
                                    </div>
                                    <div className="font-bold text-gray-900">
                                      {format(
                                        new Date(assignment.due_date),
                                        "MMM dd"
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                                  <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                                    <Users className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-600 font-medium">
                                      Students
                                    </div>
                                    <div className="font-bold text-gray-900">
                                      {assignment.assignment_enrollments?.[0]
                                        ?.count || 0}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                    <FileText className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-600 font-medium">
                                      Submissions
                                    </div>
                                    <div className="font-bold text-gray-900">
                                      {assignment.submissions?.length || 0}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl">
                                  <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                                    <Award className="h-4 w-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="text-xs text-gray-600 font-medium">
                                      Total Points
                                    </div>
                                    <div className="font-bold text-gray-900">
                                      {assignment.total_points}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Submissions table */}
                <TabsContent value="submissions" className="p-6">
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-0">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-100">
                      <h2 className="text-2xl font-bold text-gray-900">
                        Student Submissions
                      </h2>
                      <p className="text-gray-600 mt-1">
                        Review and grade student submissions
                      </p>

                      {/* Filters for Submissions */}
                      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-purple-100">
                        <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <FileText className="h-3.5 w-3.5 text-white" />
                          </div>
                          Filter Submissions
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Semester
                            </label>
                            <select
                              value={semesterFilter}
                              onChange={(e) =>
                                setSemesterFilter(e.target.value)
                              }
                              className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 font-medium text-gray-700"
                            >
                              <option value="all">All Semesters</option>
                              <option value="1">Semester 1</option>
                              <option value="2">Semester 2</option>
                              <option value="3">Semester 3</option>
                              <option value="4">Semester 4</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-gray-700 mb-2 block">
                              Submission Date
                            </label>
                            <select
                              value={submissionDateFilter}
                              onChange={(e) =>
                                setSubmissionDateFilter(e.target.value)
                              }
                              className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 font-medium text-gray-700"
                            >
                              <option value="all">All Time</option>
                              <option value="today">Today</option>
                              <option value="week">This Week</option>
                              <option value="month">This Month</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 hover:from-gray-50 hover:to-blue-50 border-0">
                            <TableHead className="font-semibold text-gray-700 py-4">
                              Student
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4">
                              Assignment
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4">
                              Submitted
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4">
                              AI Grade
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4">
                              Teacher Grade
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4">
                              Status
                            </TableHead>
                            <TableHead className="font-semibold text-gray-700 py-4">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignments.flatMap((assignment) =>
                            filterSubmissions(assignment.submissions || []).map(
                              (submission: Submission) => (
                                <TableRow
                                  key={submission.id}
                                  className="hover:bg-purple-50/50 transition-colors duration-200 border-0"
                                >
                                  <TableCell className="font-medium text-gray-900 py-4">
                                    {submission.profiles?.full_name ||
                                      "Unknown Student"}
                                  </TableCell>
                                  <TableCell className="text-gray-600 py-4">
                                    {assignment.title}
                                  </TableCell>
                                  <TableCell className="text-gray-600 py-4">
                                    {format(
                                      new Date(submission.submission_date),
                                      "MMM dd, yyyy"
                                    )}
                                  </TableCell>
                                  <TableCell className="text-gray-600 py-4">
                                    {submission.ai_grade ??
                                      submission.ai_evaluation?.Score ??
                                      "N/A"}
                                  </TableCell>
                                  <TableCell className="text-gray-600 py-4">
                                    {submission.teacher_grade ?? "Not graded"}
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <Badge
                                      className={getStatusBadgeColor(
                                        submission.status
                                      )}
                                    >
                                      {capitalizeFirst(submission.status)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4">
                                    <div className="flex gap-2">
                                      {submission.file_path &&
                                        submission.file_name && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              downloadSubmission(
                                                submission.file_path!,
                                                submission.file_name!
                                              )
                                            }
                                            className="hover:bg-blue-50 border-blue-200"
                                          >
                                            <Download className="h-4 w-4" />
                                          </Button>
                                        )}
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleOpenSubmission(submission)
                                        }
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            )
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Submission Review Modal */}
          <Dialog
            open={!!viewSubmission}
            onOpenChange={() => setViewSubmission(null)}
          >
            <DialogContent className="max-w-6xl w-full max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Submission Review:{" "}
                  {viewSubmission?.profiles?.full_name || "Unknown Student"}
                </DialogTitle>
              </DialogHeader>

              {viewSubmission && (
                <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-6">
                  {/* Enhanced Overall Score Section */}
                  {(() => {
                    const getOverallData = (submission: any) => {
                      let feedbackData = null;
                      let score = "N/A";
                      let overallGrade = "N/A";
                      let adminDetails = null;
                      let facultyProgress = null;
                      
                      // Parse ai_feedback JSON first
                      if (submission.ai_feedback) {
                        try {
                          feedbackData = JSON.parse(submission.ai_feedback);
                          score = feedbackData.Score || submission.ai_grade || "N/A";
                          overallGrade = feedbackData["Overall Grade"] || submission.ai_overall_grade || "N/A";
                        } catch (e) {
                          console.warn('❌ Failed to parse ai_feedback JSON:', e);
                        }
                      }
                      
                      // Fallback to individual fields
                      if (score === "N/A") {
                        score = submission.ai_grade || submission.ai_evaluation?.Score || "N/A";
                      }
                      if (overallGrade === "N/A") {
                        overallGrade = submission.ai_overall_grade || submission.ai_evaluation?.["Overall Grade"] || "N/A";
                      }
                      
                      // Parse admin details from rawText if available
                      if (feedbackData?.rawText) {
                        const rawText = feedbackData.rawText;
                        const studentMatch = rawText.match(/Student: (.+?) \(ID: (.+?)\)/);
                        const assignmentMatch = rawText.match(/Assignment: (.+?)(?=\n|\*|$)/);
                        const submissionDateMatch = rawText.match(/Submission Date: (.+?)(?=\n|\*|$)/);
                        const evaluationDateMatch = rawText.match(/Evaluation Date: (.+?)(?=\n|\*|$)/);
                        
                        if (studentMatch || assignmentMatch || submissionDateMatch || evaluationDateMatch) {
                          adminDetails = {
                            Student: studentMatch ? studentMatch[1] : null,
                            StudentID: studentMatch ? studentMatch[2] : null,
                            Assignment: assignmentMatch ? assignmentMatch[1] : null,
                            "Submission Date": submissionDateMatch ? submissionDateMatch[1] : null,
                            "Evaluation Date": evaluationDateMatch ? evaluationDateMatch[1] : null
                          };
                        }
                        
                        // Parse faculty progress
                        const statusMatch = rawText.match(/\*\*Status\*\*: (.+?)(?=\n|\*|$)/);
                        const redFlagsMatch = rawText.match(/\*\*Red Flags\*\*: (.+?)(?=\n|\*|$)/);
                        const integrityMatch = rawText.match(/\*\*Academic Integrity\*\*: (.+?)(?=\n|\*|$)/);
                        
                        if (statusMatch || redFlagsMatch || integrityMatch) {
                          facultyProgress = {
                            Status: statusMatch ? statusMatch[1] : null,
                            "Red Flags": redFlagsMatch ? redFlagsMatch[1] : null,
                            "Academic Integrity": integrityMatch ? integrityMatch[1] : null
                          };
                        }
                      }
                      
                      return {
                        score,
                        overallGrade,
                        adminDetails: adminDetails || submission.ai_evaluation?.["Administrative Details"],
                        facultyProgress: facultyProgress || submission.ai_evaluation?.["Faculty Progress Summary"]
                      };
                    };

                    const overallData = getOverallData(viewSubmission);
                    
                    return (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
                              <Star className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900">
                                AI Evaluation Summary
                              </h3>
                              <p className="text-gray-600">
                                Comprehensive automated assessment
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-4xl font-bold ${getGradeColor(
                                parseInt(overallData.score) || 0
                              )}`}
                            >
                              {overallData.score}
                            </div>
                            <Badge
                              className={getGradeBadgeColor(overallData.overallGrade)}
                            >
                              {overallData.overallGrade}
                            </Badge>
                          </div>
                        </div>

                        {/* Enhanced Administrative Details */}
                        {overallData.adminDetails && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                              <div className="text-xs text-gray-600 font-medium">
                                Student
                              </div>
                              <div className="font-bold text-gray-900">
                                {overallData.adminDetails.Student || 
                                 viewSubmission.profiles?.full_name ||
                                 "Unknown Student"}
                              </div>
                              {overallData.adminDetails.StudentID && (
                                <div className="text-xs text-gray-500">
                                  ID: {overallData.adminDetails.StudentID}
                                </div>
                              )}
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                              <div className="text-xs text-gray-600 font-medium">
                                Assignment
                              </div>
                              <div className="font-bold text-gray-900">
                                {overallData.adminDetails.Assignment || 
                                 overallData.adminDetails.Assignment?.Title || 
                                 "Unknown Assignment"}
                              </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                              <div className="text-xs text-gray-600 font-medium">
                                Evaluation Date
                              </div>
                              <div className="font-bold text-gray-900">
                                {overallData.adminDetails["Evaluation Date"] || "N/A"}
                              </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
                              <div className="text-xs text-gray-600 font-medium">
                                Submission Date
                              </div>
                              <div className="font-bold text-gray-900">
                                {overallData.adminDetails["Submission Date"] || "N/A"}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Enhanced Academic Integrity Status */}
                        {overallData.facultyProgress && (
                          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3 mb-3">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <h4 className="font-bold text-gray-900">
                                Academic Integrity Status
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <div className="text-xs text-gray-600 font-medium">
                                  Status
                                </div>
                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                  {overallData.facultyProgress.Status || "N/A"}
                                </Badge>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 font-medium">
                                  Red Flags
                                </div>
                                <div className="font-medium text-gray-900">
                                  {overallData.facultyProgress["Red Flags"] || "None"}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-600 font-medium">
                                  Academic Integrity
                                </div>
                                <div className="font-medium text-green-600">
                                  {overallData.facultyProgress["Academic Integrity"] || "N/A"}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Enhanced Rubric Breakdown - Parse from actual data structure */}
                  {(() => {
                    const parseRubricFromSubmission = (submission: any) => {
                      console.log('🔍 Parsing detailed submission:', submission);
                      
                      // First check if we have rubric items directly in ai_evaluation
                      if (submission.ai_evaluation?.["Rubric Items"]) {
                        console.log('✅ Found Rubric Items in ai_evaluation:', submission.ai_evaluation["Rubric Items"]);
                        return submission.ai_evaluation["Rubric Items"];
                      }
                      
                      // Then check ai_feedback
                      if (submission.ai_feedback?.["Rubric Items"]) {
                        console.log('✅ Found Rubric Items in ai_feedback:', submission.ai_feedback["Rubric Items"]);
                        return submission.ai_feedback["Rubric Items"];
                      }
                      
                      // Fallback to parsing from rawText if needed
                      let feedbackData = null;
                      let rawText = '';
                      
                      // Parse ai_feedback JSON
                      if (submission.ai_feedback) {
                        try {
                          feedbackData = JSON.parse(submission.ai_feedback);
                          rawText = feedbackData.rawText || '';
                          console.log('✅ Parsed ai_feedback with rawText');
                        } catch (e) {
                          console.warn('❌ Failed to parse ai_feedback JSON:', e);
                        }
                      }
                      
                      // Fallback to ai_evaluation.rawText
                      if (!rawText && submission.ai_evaluation?.rawText) {
                        rawText = submission.ai_evaluation.rawText;
                        console.log('🔄 Using ai_evaluation.rawText');
                      }
                      
                      if (!rawText) {
                        console.warn('⚠️ No rawText found');
                        return null;
                      }
                      
                      // Parse rubric breakdown from rawText - updated for exact format
                      const rubricItems = [];
                      
                      console.log('🔍 Raw text to parse:', rawText);
                      
                      // Updated pattern to match: * **Name (percentage%)**: score/maxScore - assessment
                      const rubricPattern = /\* \*\*([^(]+)\s*\((\d+)\)\*\*:\s*(\d+)\/(\d+)\s*-\s*([^*]+?)(?=\n\*|$)/g;
                      
                      let match;
                      while ((match = rubricPattern.exec(rawText)) !== null) {
                        const criterion = match[1].trim();
                        const percentage = match[2];
                        const score = parseInt(match[3]);
                        const maxScore = parseInt(match[4]);
                        const assessment = match[5].trim();
                        
                        console.log('✅ Found rubric item:', { criterion, percentage, score, maxScore, assessment });
                        
                        rubricItems.push({
                          criterion,
                          percentage: percentage ,
                          score,
                          maxScore,
                          assessment
                        });
                      }
                      
                      // Fallback: if no matches found, try alternative patterns
                      if (rubricItems.length === 0) {
                        console.log('🔄 Trying fallback patterns...');
                        
                        // Try without the leading * 
                        const altPattern = /\*\*([^(]+)\s*\((\d+)\)\*\*:\s*(\d+)\/(\d+)\s*-\s*([^*]+?)(?=\n\*|$)/g;
                        
                        while ((match = altPattern.exec(rawText)) !== null) {
                          const criterion = match[1].trim();
                          const percentage = match[2];
                          const score = parseInt(match[3]);
                          const maxScore = parseInt(match[4]);
                          const assessment = match[5].trim();
                          
                          console.log('✅ Found alt rubric item:', { criterion, percentage, score, maxScore, assessment });
                          
                          rubricItems.push({
                            criterion,
                            percentage: percentage ,
                            score,
                            maxScore,
                            assessment
                          });
                        }
                      }
                      
                      // If still no matches, try the criterion pattern
                      if (rubricItems.length === 0) {
                        console.log('🔄 Trying criterion pattern...');
                        
                        const criterionPattern = /\*\* (Criterion \d+: [^*]+) \*\*[\s\S]*?- Score: (\d+)\/(\d+)[\s\S]*?- Assessment: ([^*]+?)(?=\*\*|$)/g;
                        
                        while ((match = criterionPattern.exec(rawText)) !== null) {
                          const fullName = match[1];
                          const criterionName = fullName.replace(/^Criterion \d+: /, '');
                          const score = parseInt(match[2]);
                          const maxScore = parseInt(match[3]);
                          const assessment = match[4].trim();
                          
                          console.log('✅ Found criterion item:', { criterionName, score, maxScore, assessment });
                          
                          rubricItems.push({
                            criterion: criterionName,
                            score,
                            maxScore,
                            assessment
                          });
                        }
                      }
                      
                      console.log('🎯 Parsed rubric items:', rubricItems);
                      return rubricItems.length > 0 ? rubricItems : null;
                    };

                    const rubricItems = parseRubricFromSubmission(viewSubmission);
                    
                    return rubricItems ? (
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                            <Target className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              Detailed Rubric Assessment
                            </h3>
                            <p className="text-gray-600">
                              Comprehensive breakdown by evaluation criteria
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          {rubricItems.map((item, index) => (
                            <div
                              key={index}
                              className="bg-white/80 backdrop-blur-sm rounded-xl p-4"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-900">
                                    {item.criterion?.replace(/\*\*/g, '') || item.criterion}
                                  </h4>
                                  {(item.percentage || item.weightage) && (
                                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 text-xs">
                                      {item.percentage || item.weightage}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-lg font-bold ${item.isGraded === false ? 'text-gray-400' : getGradeColor(
                                      (item.score / (item.maxScore || item.weightage || 20)) * 100
                                    )}`}
                                  >
                                    {item.isGraded === false ? 'Not Graded' : `${item.score}`}
                                  </span>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700">
                                {item.assessment || item.comment}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Enhanced Constructive Feedback */}
                  {(() => {
                    const getFeedbackData = (submission: any) => {
                      let feedbackData = null;
                      let strengths = "";
                      let areasForImprovement = "";
                      let recommendations = "";
                      
                      // Parse ai_feedback JSON first
                      if (submission.ai_feedback) {
                        try {
                          feedbackData = JSON.parse(submission.ai_feedback);
                          
                          // Extract from structured data or parse from rawText
                          if (feedbackData["Constructive Feedback"]) {
                            const feedback = feedbackData["Constructive Feedback"];
                            
                            // Clean up the strings by extracting only the relevant parts
                            if (feedback.Strengths) {
                              const strengthsText = feedback.Strengths;
                              // Remove any areas for improvement or recommendations that got mixed in
                              const strengthsMatch = strengthsText.match(/^([^*]+?)(?=\n\s*\*\s*\*\*Areas for Improvement\*\*|\n\s*\*\s*\*\*Recommendations\*\*|$)/s);
                              strengths = strengthsMatch ? strengthsMatch[1].trim() : strengthsText.split('\n\n')[0].trim();
                            }
                            
                            if (feedback["Areas for Improvement"]) {
                              const areas = feedback["Areas for Improvement"];
                              // Remove any recommendations that got mixed in
                              const areasMatch = areas.match(/^([^*]+?)(?=\n\s*\*\s*\*\*Recommendations\*\*|$)/s);
                              areasForImprovement = areasMatch ? areasMatch[1].trim() : areas.split('\n\n')[0].trim();
                            }
                            
                            if (feedback.Recommendations) {
                              recommendations = feedback.Recommendations;
                            }
                          } else if (feedbackData.rawText) {
                            // Parse from rawText if structured data not available
                            const rawText = feedbackData.rawText;
                            
                            // NEW: Try parsing Summary Feedback and Lecturer's Guidance sections first
                            const summaryMatch = rawText.match(/🧾 \*\*Summary Feedback\*\*:\s*\n([\s\S]+?)(?=🎓|$)/u);
                            if (summaryMatch) {
                              strengths = summaryMatch[1].trim();
                              console.log("✅ Found Summary Feedback in teacher view:", strengths);
                            }
                            
                            const guidanceMatch = rawText.match(/🎓 \*\*Lecturer's Guidance\*\*:\s*\n([\s\S]+?)(?=$)/u);
                            if (guidanceMatch) {
                              const lecturerGuidance = guidanceMatch[1].trim();
                              console.log("✅ Found Lecturer's Guidance in teacher view:", lecturerGuidance);
                              areasForImprovement = lecturerGuidance;
                              recommendations = lecturerGuidance;
                            }
                            
                            // Fallback to old patterns if new ones not found
                            if (!strengths) {
                              const strengthsMatch = rawText.match(/\*\*Strengths\*\*: ([^*]+?)(?=\n\*\*|$)/);
                              strengths = strengthsMatch ? strengthsMatch[1].trim() : "";
                            }
                            if (!areasForImprovement) {
                              const areasMatch = rawText.match(/\*\*Areas for Improvement\*\*: ([^*]+?)(?=\n\*\*|$)/);
                              areasForImprovement = areasMatch ? areasMatch[1].trim() : "";
                            }
                            if (!recommendations) {
                              const recommendationsMatch = rawText.match(/\*\*Recommendations\*\*: ([^*]+?)(?=\n\*\*|$)/);
                              recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : "";
                            }
                          }
                        } catch (e) {
                          console.warn('❌ Failed to parse ai_feedback JSON:', e);
                        }
                      }
                      
                      // Fallback to individual fields
                      if (!strengths && submission.ai_strengths) {
                        const strengthsText = submission.ai_strengths;
                        // Remove any areas for improvement or recommendations that got mixed in
                        const strengthsMatch = strengthsText.match(/^([^*]+?)(?=\n\s*\*\s*\*\*Areas for Improvement\*\*|\n\s*\*\s*\*\*Recommendations\*\*|$)/s);
                        strengths = strengthsMatch ? strengthsMatch[1].trim() : strengthsText.split('\n\n')[0].trim();
                      }
                      
                      if (!areasForImprovement && submission.ai_areas_for_improvement) {
                        const areasText = submission.ai_areas_for_improvement;
                        // Remove any recommendations that got mixed in
                        const areasMatch = areasText.match(/^([^*]+?)(?=\n\s*\*\s*\*\*Recommendations\*\*|$)/s);
                        areasForImprovement = areasMatch ? areasMatch[1].trim() : areasText.split('\n\n')[0].trim();
                      }
                      
                      if (!recommendations && submission.ai_recommendations) {
                        recommendations = submission.ai_recommendations;
                      }
                      
                      // Final fallback to ai_evaluation
                      if (!strengths && submission.ai_evaluation?.["Constructive Feedback"]?.Strengths) {
                        const strengthsText = submission.ai_evaluation["Constructive Feedback"].Strengths;
                        // Remove any areas for improvement or recommendations that got mixed in
                        const strengthsMatch = strengthsText.match(/^([^*]+?)(?=\n\s*\*\s*\*\*Areas for Improvement\*\*|\n\s*\*\s*\*\*Recommendations\*\*|$)/s);
                        strengths = strengthsMatch ? strengthsMatch[1].trim() : strengthsText.split('\n\n')[0].trim();
                      }
                      
                      return {
                        strengths: strengths || "No strengths data available",
                        areasForImprovement: areasForImprovement || "No improvement areas specified",
                        recommendations: recommendations || "No specific recommendations provided"
                      };
                    };

                    const feedbackData = getFeedbackData(viewSubmission);
                    
                    return (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900">
                              Constructive Feedback
                            </h3>
                            <p className="text-gray-600">
                              Detailed analysis and recommendations
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="font-bold text-blue-800 text-sm">
                                📝 Summary Feedback
                              </h4>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {feedbackData.strengths}
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                                <AlertTriangle className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="font-bold text-orange-800 text-sm">
                                🎯 Areas for Improvement
                              </h4>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {feedbackData.areasForImprovement}
                            </p>
                          </div>

                          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                <Star className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="font-bold text-purple-800 text-sm">
                                ⭐ Recommendations
                              </h4>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {feedbackData.recommendations}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Submission Review - Raw Data Section */}
                  {/* <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-slate-500 to-gray-500 rounded-xl">
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Submission Review
                        </h3>
                        <p className="text-gray-600">
                          Complete raw data from the submission
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 max-h-96 overflow-y-auto">
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                        {JSON.stringify(viewSubmission, null, 2)}
                      </pre>
                    </div>
                  </div> */}

                  {/* Teacher Grading Section */}
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                          Teacher Assessment
                        </h3>
                        <p className="text-gray-600">
                          Provide your grade and feedback
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Input
                        type="number"
                        value={gradeInput}
                        min={0}
                        max={100}
                        placeholder="Enter grade (0-100)"
                        onChange={(e) => setGradeInput(e.target.value)}
                        className="border-amber-200 focus:border-amber-400 focus:ring-amber-400 h-12"
                      />
                      <Textarea
                        value={feedbackInput}
                        onChange={(e) => setFeedbackInput(e.target.value)}
                        placeholder="Enter detailed feedback for the student..."
                        rows={4}
                        className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex gap-3 pt-4 border-t border-gray-100">
                <Button
                  onClick={handleGradeSubmit}
                  disabled={submitting || gradeInput === ""}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 px-6 py-3 h-auto"
                >
                  {submitting ? "Saving..." : "Save Grade"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setViewSubmission(null)}
                  className="hover:bg-gray-50 border-gray-200 px-6 py-3 h-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default TeacherAssignment;
