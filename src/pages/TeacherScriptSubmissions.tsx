"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Calendar,
  Users,
  FileText,
  Eye,
  CheckCircle,
  Clock,
  Film,
  Loader2,
  AlertCircle,
  Target,
  MessageSquare,
  User,
  Sparkles,
  Link,
  Send,
  Award,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ScriptAnalysisDisplay from "@/components/ScriptAnalysisDisplay";

interface Student {
  id: string;
  full_name: string;
  email: string;
  semester?: number;
}

interface Class {
  id: string;
  name: string;
  semester: number;
}

interface ScriptSubmission {
  id: string;
  title: string;
  script_url: string;
  type: string;
  status: "submitted" | "reviewed";
  submitted_at: string;
  analysis_result: any;
  student_id: string;
  student: Student;
  script_reviews: ScriptReview[];
}

interface ScriptReview {
  id: string;
  script_id: string;
  teacher_id: string;
  class_id: string;
  feedback: string | null;
  show_ai_result: boolean;
  reviewed_at: string | null;
  class: Class;
}

export default function TeacherScriptSubmissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ScriptSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<ScriptSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<ScriptSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showAIResult, setShowAIResult] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeacherClasses();
      fetchSubmissions();
    }
  }, [user]);

  useEffect(() => {
    filterSubmissions();
  }, [submissions, searchTerm, statusFilter, classFilter]);

  const fetchTeacherClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("class_teachers")
        .select(`
          class_id,
          classes (
            id,
            name,
            semester
          )
        `)
        .eq("teacher_id", user?.id);

      if (error) throw error;
      const classList = data?.map((item) => item.classes).filter(Boolean) || [];
      setClasses(classList as Class[]);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      // Get teacher's classes
      const { data: teacherClasses, error: classError } = await supabase
        .from("class_teachers")
        .select("class_id")
        .eq("teacher_id", user?.id);

      if (classError) throw classError;

      const classIds = teacherClasses?.map((c) => c.class_id) || [];

      if (classIds.length === 0) {
        setSubmissions([]);
        setLoading(false);
        return;
      }

      // Get all script submissions for this teacher's reviews
      const { data: reviews, error: reviewError } = await supabase
        .from("script_reviews")
        .select(`
          id,
          script_id,
          teacher_id,
          class_id,
          feedback,
          show_ai_result,
          reviewed_at,
          class:classes!script_reviews_class_id_fkey (
            id,
            name,
            semester
          ),
          script:script_analyses!script_reviews_script_id_fkey (
            id,
            title,
            script_url,
            type,
            status,
            submitted_at,
            analysis_result,
            user_id,
            student:profiles!script_analyses_user_id_fkey1 (
              id,
              full_name,
              email,
              semester
            )
          )
        `)
        .eq("teacher_id", user?.id)
        .in("class_id", classIds);

      if (reviewError) throw reviewError;

      // Group reviews by script
      const scriptMap = new Map<string, ScriptSubmission>();

      reviews?.forEach((review) => {
        const script = review.script;
        if (!script) return;

        if (!scriptMap.has(script.id)) {
          scriptMap.set(script.id, {
            id: script.id,
            title: script.title,
            script_url: script.script_url,
            type: script.type,
            status: script.status as "submitted" | "reviewed",
            submitted_at: script.submitted_at,
            analysis_result: script.analysis_result,
            student_id: script.user_id,
            student: script.student as Student,
            script_reviews: [],
          });
        }

        const submission = scriptMap.get(script.id)!;
        submission.script_reviews.push({
          id: review.id,
          script_id: review.script_id,
          teacher_id: review.teacher_id,
          class_id: review.class_id,
          feedback: review.feedback,
          show_ai_result: review.show_ai_result,
          reviewed_at: review.reviewed_at,
          class: review.class as Class,
        });
      });

      const submissionsList = Array.from(scriptMap.values());
      setSubmissions(submissionsList);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load script submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    let filtered = [...submissions];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (sub) =>
          sub.student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sub.student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter((sub) =>
          sub.script_reviews.some((r) => r.teacher_id === user?.id && !r.reviewed_at)
        );
      } else if (statusFilter === "reviewed") {
        filtered = filtered.filter((sub) =>
          sub.script_reviews.some((r) => r.teacher_id === user?.id && r.reviewed_at)
        );
      }
    }

    // Class filter
    if (classFilter !== "all") {
      filtered = filtered.filter((sub) =>
        sub.script_reviews.some((r) => r.class_id === classFilter)
      );
    }

    setFilteredSubmissions(filtered);
  };

  const openReviewDialog = (submission: ScriptSubmission) => {
    setSelectedSubmission(submission);
    
    // Find the review for this teacher
    const myReview = submission.script_reviews.find((r) => r.teacher_id === user?.id);
    
    if (myReview) {
      setFeedback(myReview.feedback || "");
      setShowAIResult(myReview.show_ai_result);
    } else {
      setFeedback("");
      setShowAIResult(false);
    }
    
    setReviewDialogOpen(true);
  };

  const openViewDialog = (submission: ScriptSubmission) => {
    setSelectedSubmission(submission);
    setViewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission || !user) return;

    // Find the review for this teacher
    const myReview = selectedSubmission.script_reviews.find((r) => r.teacher_id === user.id);
    
    if (!myReview) {
      toast({
        title: "Error",
        description: "Review record not found",
        variant: "destructive",
      });
      return;
    }

    setSubmittingReview(true);
    try {
      // Update the review
      const { error: reviewError } = await supabase
        .from("script_reviews")
        .update({
          feedback,
          show_ai_result: showAIResult,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", myReview.id);

      if (reviewError) throw reviewError;

      // Update script status to 'reviewed'
      const { error: scriptError } = await supabase
        .from("script_analyses")
        .update({ status: "reviewed" })
        .eq("id", selectedSubmission.id);

      if (scriptError) throw scriptError;

      // Create notification for student
      const { error: notifError } = await supabase
        .from("script_notifications")
        .insert({
          user_id: selectedSubmission.student_id,
          script_id: selectedSubmission.id,
          type: "review",
          message: `Your script "${selectedSubmission.title}" has been reviewed by ${user.email}`,
          is_read: false,
        });

      if (notifError) throw notifError;

      toast({
        title: "Review Submitted! 🎉",
        description: "Your feedback has been sent to the student.",
        variant: "default",
      });

      setReviewDialogOpen(false);
      await fetchSubmissions();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setSubmittingReview(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getMyReview = (submission: ScriptSubmission) => {
    return submission.script_reviews.find((r) => r.teacher_id === user?.id);
  };

  const getReviewStatus = (submission: ScriptSubmission) => {
    const myReview = getMyReview(submission);
    return myReview?.reviewed_at ? "reviewed" : "pending";
  };

  const getStatusBadge = (submission: ScriptSubmission) => {
    const status = getReviewStatus(submission);
    
    if (status === "reviewed") {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
          <CheckCircle className="h-3 w-3 mr-1" />
          Reviewed
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
        <Clock className="h-3 w-3 mr-1" />
        Pending Review
      </Badge>
    );
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={["teacher"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <Film className="w-6 h-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-lg font-medium">Loading submissions...</p>
                <p className="text-sm text-muted-foreground">Fetching student script data</p>
              </div>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  const pendingCount = submissions.filter((s) => getReviewStatus(s) === "pending").length;
  const reviewedCount = submissions.filter((s) => getReviewStatus(s) === "reviewed").length;

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <Film className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Script Submissions</h1>
                  <p className="text-white/90 text-lg">
                    Review and provide feedback on student script analyses
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {submissions.length} Total Submissions
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {pendingCount} Pending Review
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  {reviewedCount} Reviewed
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-purple-700">Total Submissions</h3>
                <div className="p-2 bg-purple-100 rounded-full">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-900">{submissions.length}</div>
              <div className="flex items-center gap-1 text-xs text-purple-600 mt-1">
                <Users className="h-3 w-3" />
                <span>From your students</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-yellow-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-700">Pending Review</h3>
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-900">{pendingCount}</div>
              <div className="flex items-center gap-1 text-xs text-yellow-600 mt-1">
                <AlertCircle className="h-3 w-3" />
                <span>Awaiting feedback</span>
              </div>
            </div>

            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 p-6 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-green-700">Reviewed</h3>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-900">{reviewedCount}</div>
              <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                <Award className="h-3 w-3" />
                <span>Feedback provided</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="border-0 shadow-lg p-6 rounded-lg bg-white">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students or scripts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Submissions List */}
          {filteredSubmissions.length === 0 ? (
            <div className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 p-12 rounded-lg text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <Film className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {submissions.length === 0
                  ? "No students have submitted scripts yet."
                  : "Try adjusting your search criteria or filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const myReview = getMyReview(submission);
                const myClass = myReview?.class;

                return (
                  <div
                    key={submission.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 p-6 rounded-lg"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarImage src="/placeholder.svg" alt={submission.student.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {getInitials(submission.student.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {submission.student.full_name}
                              </h3>
                              {getStatusBadge(submission)}
                              {myClass && (
                                <Badge variant="outline" className="text-xs">
                                  {myClass.name}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>{submission.student.email}</span>
                              {submission.student.semester && (
                                <>
                                  <span>•</span>
                                  <span>Semester {submission.student.semester}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewDialog(submission)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant={myReview?.reviewed_at ? "outline" : "default"}
                              onClick={() => openReviewDialog(submission)}
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {myReview?.reviewed_at ? "Update Review" : "Review"}
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <div className="text-xs text-purple-600 mb-1">Script Title</div>
                            <div className="flex items-center gap-2">
                              <Film className="h-4 w-4 text-purple-700" />
                              <span className="font-medium text-gray-900">{submission.title}</span>
                            </div>
                            <div className="text-xs text-purple-600 mt-1 capitalize">
                              {submission.type}
                            </div>
                          </div>

                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-xs text-blue-600 mb-1">Submission Date</div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-blue-700" />
                              <span className="font-medium text-gray-900">
                                {format(new Date(submission.submitted_at), "MMM dd, yyyy")}
                              </span>
                            </div>
                          </div>

                          <div className="bg-green-50 p-3 rounded-lg">
                            <div className="text-xs text-green-600 mb-1">Your Status</div>
                            <div className="flex items-center gap-2">
                              {myReview?.reviewed_at ? (
                                <>
                                  <CheckCircle className="h-4 w-4 text-green-700" />
                                  <span className="font-medium text-gray-900">
                                    Reviewed {format(new Date(myReview.reviewed_at), "MMM dd")}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <span className="text-gray-500">Not reviewed</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {myReview?.feedback && (
                          <div className="mt-4 bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-700">Your Feedback</span>
                            </div>
                            <p className="text-sm text-gray-700">{myReview.feedback}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* View Dialog */}
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Film className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <span>Script Review</span>
                    {selectedSubmission && (
                      <div className="text-sm font-normal text-gray-600 mt-1">
                        {selectedSubmission.student.full_name} • {selectedSubmission.title}
                      </div>
                    )}
                  </div>
                </DialogTitle>
              </DialogHeader>

              {selectedSubmission && (
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mb-4 flex-shrink-0">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                        <AvatarImage src="/placeholder.svg" alt={selectedSubmission.student.full_name} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
                          {getInitials(selectedSubmission.student.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {selectedSubmission.student.full_name}
                          </h3>
                          {getStatusBadge(selectedSubmission)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{selectedSubmission.student.email}</span>
                          <span>•</span>
                          <span>
                            Submitted {format(new Date(selectedSubmission.submitted_at), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        </div>
                      </div>
                      {selectedSubmission.script_url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedSubmission.script_url, "_blank")}
                        >
                          <Link className="h-4 w-4 mr-2" />
                          View Script File
                        </Button>
                      )}
                    </div>
                  </div>

                  <Tabs defaultValue="ai-analysis" className="flex-1 flex flex-col min-h-0">
                    <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                      <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        AI Analysis
                      </TabsTrigger>
                      <TabsTrigger value="reviews" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        All Reviews
                      </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 overflow-y-auto mt-4 min-h-0">
                      <TabsContent value="ai-analysis" className="mt-0 h-full">
                        {selectedSubmission.analysis_result ? (
                          <div className="pb-4">
                            <ScriptAnalysisDisplay
                              analysisResult={selectedSubmission.analysis_result}
                              type={selectedSubmission.type}
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            No AI analysis available
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="reviews" className="mt-0 h-full">
                        <div className="space-y-4 pb-4">
                          {selectedSubmission.script_reviews
                            .filter((r) => r.reviewed_at)
                            .map((review) => (
                              <div
                                key={review.id}
                                className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-900">
                                      {review.teacher_id === user?.id ? "You" : "Another Teacher"}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {review.class.name}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-gray-600">
                                    {format(new Date(review.reviewed_at), "PPp")}
                                  </span>
                                </div>
                                {review.feedback && (
                                  <p className="text-sm text-gray-700 mt-2 italic">"{review.feedback}"</p>
                                )}
                                <div className="mt-2 flex items-center gap-2 text-xs">
                                  {review.show_ai_result ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      AI Result Shown
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-gray-600">
                                      AI Result Hidden
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          
                          {selectedSubmission.script_reviews.filter((r) => r.reviewed_at).length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              No reviews submitted yet
                            </div>
                          )}
                        </div>
                      </TabsContent>
                    </div>
                  </Tabs>
                </div>
              )}

              <DialogFooter className="flex-shrink-0 border-t pt-4">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Review Dialog */}
          <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Review Script Submission</DialogTitle>
                <DialogDescription>
                  {selectedSubmission && (
                    <>
                      Script: <span className="font-medium">{selectedSubmission.title}</span>
                      <br />
                      Student: <span className="font-medium">{selectedSubmission.student.full_name}</span>
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">Your Feedback</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Write your feedback for the student..."
                    rows={6}
                    className="resize-none"
                  />
                </div>

                <div className="flex items-center space-x-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Checkbox
                    id="show-ai"
                    checked={showAIResult}
                    onCheckedChange={(checked) => setShowAIResult(checked as boolean)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="show-ai" className="text-sm font-medium cursor-pointer">
                      Show AI Analysis Result to Student
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      If checked, the student will be able to see the AI-generated analysis along with your feedback.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setReviewDialogOpen(false)}
                  disabled={submittingReview}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview} disabled={submittingReview || !feedback.trim()}>
                  {submittingReview ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Review
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}