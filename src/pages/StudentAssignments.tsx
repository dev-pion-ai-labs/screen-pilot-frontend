import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Calendar,
  Clock,
  Upload,
  Eye,
  CheckCircle,
  FileText,
  Loader2,
  X,
  Send,
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

// --- RelevanceAI Config ---
const RELEVANCE_CONFIG = {
  agent: {
    endpoint: "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
    authorization: "5cc7752400a6-4648-b47b-04fc92b47cae:sk-OGIxMWJiMzAtMTk5Ni00Nzk3LTk5MTYtZTFmZTI4NzIzNTNj",
    agent_id: "6c425902-6090-4781-b8de-df38ff3f26fb",
  },
  extractPdf: {
    endpoint:
      "https://api-d7b62b.stack.tryrelevance.com/latest/studios/5a6eaca2-6e92-4557-a299-c0e2bbbac201/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
    authorization: "5cc7752400a6-4648-b47b-04fc92b47cae:sk-OTJkZGIzNzYtMGU5Yi00MDY4LTk2NjEtM2JkODE4NjM4M2Jk",
  },
  extractDocx: {
    endpoint:
      "https://api-d7b62b.stack.tryrelevance.com/latest/studios/aa26fd47-2966-428c-b542-cb40e608357a/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
    authorization: "5cc7752400a6-4648-b47b-04fc92b47cae:sk-OWQzMGE4MTUtMjVmOS00Nzk5LWJkNzEtZDdjOWRkOWJmZGRm",
  },
  region: "d7b62b",
};

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  topic: string;
  difficulty: string;
  created_at: string;
  submissions?: Submission[];
}

interface Submission {
  id: string;
  status: string;
  submission_date: string;
  ai_evaluation: any;
  teacher_grade: number | null;
  teacher_feedback: string | null;
  file_name: string | null;
  file_path: string | null;
  grade: number | null;
  ai_grade?: string | null;
  ai_overall_grade?: string | null;
  ai_strengths?: string | null;
  ai_areas_for_improvement?: string | null;
  ai_recommendations?: string | null;
  ai_rubric_breakdown?: string | null;
  ai_academic_integrity?: string | null;
  ai_status?: string | null;
  ai_red_flags?: string | null;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  semester?: number;
  created_at: string;
  updated_at: string;
}

// --- Helper: Extract text from uploaded file (supports .txt, .pdf, .docx) ---
async function extractTextFromFile(file: File, publicUrl: string): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "txt") {
    // Read text directly
    return await file.text();
  }
  if (ext === "pdf") {
    // Give the storage a second to make file available
    await new Promise(res => setTimeout(res, 2000));
    const response = await fetch(RELEVANCE_CONFIG.extractPdf.endpoint, {
      method: "POST",
      headers: { Authorization: RELEVANCE_CONFIG.extractPdf.authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
    });
    const data = await response.json();
    if (data?.result?.text) return data.result.text;
    if (data?.output) return data.output;
    throw new Error("Failed to extract text from PDF.");
  }

  if (ext === "docx") {
    // Use RelevanceAI DOCX extractor (send public URL)
    const response = await fetch(RELEVANCE_CONFIG.extractDocx.endpoint, {
      method: "POST",
      headers: { Authorization: RELEVANCE_CONFIG.extractDocx.authorization, "Content-Type": "application/json" },
      body: JSON.stringify({ url: publicUrl }),
    });
    const data = await response.json();
    if (data?.result?.text) return data.result.text;
    if (data?.output) return data.output;
    throw new Error("Failed to extract text from DOCX.");
  }
  throw new Error("Unsupported file type");
}

// --- Helper: Parse AI Evaluation Result ---
function parseAIFeedback(aiResult: any) {
  let parsed = aiResult;

  if (aiResult?.raw) {
    let raw = aiResult.raw;
    if (typeof raw === "string" && raw.startsWith("```json")) {
      raw = raw.replace(/```json|```/g, "").trim();
    }
    try { parsed = JSON.parse(raw); } catch { parsed = aiResult; }
  }
  const get = (obj: any, path: string, fallback: any = null) =>
    path.split('.').reduce((res, key) => (res && res[key] !== undefined ? res[key] : fallback), obj);

  return {
    ai_grade: String(get(parsed, "Score") || ""),
    ai_overall_grade: get(parsed, "Overall Grade") || "",
    ai_strengths: get(parsed, "Constructive Feedback.Strengths") || "",
    ai_areas_for_improvement: get(parsed, "Constructive Feedback.Areas for Improvement") || "",
    ai_recommendations: get(parsed, "Constructive Feedback.Recommendations") || "",
    ai_rubric_breakdown: JSON.stringify(get(parsed, "Rubric-Based Breakdown") || {}),
    ai_academic_integrity: get(parsed, "Faculty Progress Summary.Academic Integrity") || "",
    ai_status: get(parsed, "Faculty Progress Summary.Status") || "",
    ai_red_flags: get(parsed, "Faculty Progress Summary.Red Flags") || "",
    ai_feedback: JSON.stringify(parsed, null, 2),
    ai_evaluation: parsed,
    grade: get(parsed, "Score") || null,
  };
}

// --- Main Component ---
export default function StudentAssignments() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionStep, setSubmissionStep] = useState<"upload" | "submitting">("upload");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch assignments + submissions ---
  useEffect(() => {
    if (user && (profile as Profile)?.semester) fetchAssignments();
    // eslint-disable-next-line
  }, [user, profile]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data: enrollments, error } = await supabase
        .from("assignment_enrollments")
        .select(`
          assignment_id,
          assignments (
            id,
            title,
            description,
            due_date,
            total_points,
            topic,
            difficulty,
            created_at,
            submissions (
              id,
              status,
              submission_date,
              ai_evaluation,
              teacher_grade,
              teacher_feedback,
              file_name,
              file_path,
              grade,
              ai_grade,
              ai_overall_grade,
              ai_strengths,
              ai_areas_for_improvement,
              ai_recommendations,
              ai_rubric_breakdown,
              ai_academic_integrity,
              ai_status,
              ai_red_flags
            )
          )
        `)
        .eq("student_id", user?.id);

      if (error) throw error;

      const assignmentsData =
        enrollments?.map((enrollment) => ({
          ...enrollment.assignments,
          submissions:
            enrollment.assignments?.submissions?.filter((sub: any) => sub && typeof sub === "object") || [],
        })) || [];
      setAssignments(assignmentsData);
    } catch (e) {
      toast({ title: "Error loading assignments", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- File upload handler ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a PDF, DOCX, or TXT file.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "File size should be less than 10MB", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
  };

  // --- Upload to Supabase Storage ---
  const uploadFileToSupabase = async (file: File, studentId: string, assignmentId: string): Promise<{ filePath: string; publicUrl: string; }> => {
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${studentId}/${assignmentId}_${timestamp}_${safeFileName}`;
    const { data, error } = await supabase.storage.from("assignment-submissions").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("assignment-submissions").getPublicUrl(filePath);
    return { filePath, publicUrl: urlData.publicUrl };
  };

  // --- AI Evaluation (pass content & file URL) ---
  const callRelevanceAgent = async (
    assignmentTitle: string,
    studentName: string,
    additionalNotes: string,
    fileContent: string,
    fileUrl: string
  ): Promise<any> => {
    const message = `Assignment Title: ${assignmentTitle}
Student: ${studentName}
Notes from student: ${additionalNotes || "None"}
Assignment File URL: ${fileUrl}
Assignment Text Content:
${fileContent}
Please evaluate the assignment according to the assignment rubric, provide an overall grade and a rubric-based breakdown, and detailed feedback in JSON.`;
    const payload = {
      message: { role: "user", content: message },
      agent_id: RELEVANCE_CONFIG.agent.agent_id,
    };
    const response = await fetch(RELEVANCE_CONFIG.agent.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: RELEVANCE_CONFIG.agent.authorization },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`AI Agent error: ${response.status}`);
    const data = await response.json();
    // Poll for result
    if (data?.job_info?.studio_id && data?.job_info?.job_id) {
      return await pollAgentResponse(data.job_info.studio_id, data.job_info.job_id);
    } else {
      throw new Error("AI Agent did not return job info");
    }
  };

  const pollAgentResponse = async (studioId: string, jobId: string): Promise<any> => {
    const maxAttempts = 20;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const res = await fetch(
        `https://api-${RELEVANCE_CONFIG.region}.stack.tryrelevance.com/latest/studios/${studioId}/async_poll/${jobId}`,
        { headers: { Authorization: RELEVANCE_CONFIG.agent.authorization } }
      );
      if (!res.ok) throw new Error(`Polling failed: ${res.status}`);
      const status = await res.json();
      for (const update of status.updates || []) {
        if (update.type === "chain-success" && update.output) {
          let content = "";
          if (update.output.output && update.output.output.answer) content = update.output.output.answer;
          else if (typeof update.output === "string") content = update.output;
          else if (update.output.answer && typeof update.output.answer === "string") content = update.output.answer;
          else content = JSON.stringify(update.output, null, 2);
          // Try to parse JSON in response
          try {
            return typeof content === "string" && content.startsWith("{") ? JSON.parse(content) : { raw: content };
          } catch {
            return { raw: content };
          }
        }
        if (update.type === "chain-error") throw new Error(update.error || "AI evaluation failed");
      }
      attempts++;
      await new Promise((res) => setTimeout(res, 3000));
    }
    throw new Error("AI evaluation timed out");
  };

  // --- Submission Handler ---
  const handleSubmitAssignment = async (): Promise<void> => {
    if (!selectedAssignment || !selectedFile || !user || !profile) return;
    setSubmissionStep("submitting");
    try {
      // 1. Upload file
      const { filePath, publicUrl } = await uploadFileToSupabase(selectedFile, user.id, selectedAssignment.id);
      // 2. Extract content (for AI eval)
      const fileContent = await extractTextFromFile(selectedFile, publicUrl);
      // 3. Get AI evaluation
      const aiResult = await callRelevanceAgent(
        selectedAssignment.title,
        profile.full_name,
        additionalNotes,
        fileContent,
        publicUrl
      );
      // 4. Parse AI result
      const aiData = parseAIFeedback(aiResult);
      // 5. Insert to submissions (all fields)
      const submissionId = uuidv4();
      const now = new Date().toISOString();
      const { error: insertErr } = await supabase.from("submissions").insert([{
        id: submissionId,
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        script_url: publicUrl,
        file_path: filePath,
        file_name: selectedFile.name,
        submission_date: now,
        ai_feedback: aiData.ai_feedback,
        grade: aiData.grade,
        ai_grade: aiData.ai_grade,
        ai_overall_grade: aiData.ai_overall_grade,
        ai_strengths: aiData.ai_strengths,
        ai_areas_for_improvement: aiData.ai_areas_for_improvement,
        ai_recommendations: aiData.ai_recommendations,
        ai_rubric_breakdown: aiData.ai_rubric_breakdown,
        ai_academic_integrity: aiData.ai_academic_integrity,
        ai_status: aiData.ai_status,
        ai_red_flags: aiData.ai_red_flags,
        ai_evaluation: aiData.ai_evaluation,
        status: "submitted",
        created_at: now,
        updated_at: now,
      }]);
      if (insertErr) throw insertErr;
      toast({ title: "Assignment submitted! 🎉", description: "AI evaluation and feedback attached." });
      setSubmitDialogOpen(false);
      setSelectedFile(null);
      setSubmissionStep("upload");
      setAdditionalNotes("");
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      setSubmissionStep("upload");
    }
  };

  const resetSubmission = (): void => {
    setSelectedFile(null);
    setSubmissionStep("upload");
    setAdditionalNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- UI helpers ---
  const getSubmissionStatus = (assignment: Assignment | null) => {
    if (!assignment) return "not_submitted";
    const submission = assignment.submissions?.[0];
    if (!submission) return "not_submitted";
    return submission.status;
  };
  const getSubmissionBadge = (assignment: Assignment) => {
    const status = getSubmissionStatus(assignment);
    const isOverdue = isAfter(new Date(), new Date(assignment.due_date));
    switch (status) {
      case "submitted": return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
      case "graded": return <Badge className="bg-blue-100 text-blue-800">Graded</Badge>;
      default:
        return isOverdue
          ? <Badge variant="destructive">Overdue</Badge>
          : <Badge variant="outline">Pending</Badge>;
    }
  };

  // --- Main render ---
  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
              <p className="mt-2 text-gray-600">
                Semester {(profile as Profile)?.semester} assignments and submissions
              </p>
            </div>
          </div>
          {/* Assignments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Available Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                  <p className="text-gray-600">New assignments will appear here when your teachers create them.</p>
                </div>
              ) : (
                <table className="min-w-full table-auto">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-4">Assignment</th>
                      <th className="text-left py-2 px-4">Topic</th>
                      <th className="text-left py-2 px-4">Due Date</th>
                      <th className="text-left py-2 px-4">Points</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignments.map((assignment) => (
                      <tr key={assignment.id}>
                        <td className="py-2 px-4 font-medium">
                          {assignment.title}
                          <div className="text-sm text-gray-600">
                            Created {format(new Date(assignment.created_at), "MMM dd")}
                          </div>
                        </td>
                        <td className="py-2 px-4 text-sm">{assignment.topic}</td>
                        <td className="py-2 px-4 text-sm">{format(new Date(assignment.due_date), "MMM dd, yyyy")}</td>
                        <td className="py-2 px-4 text-sm">{assignment.total_points} pts</td>
                        <td className="py-2 px-4">{getSubmissionBadge(assignment)}</td>
                        <td className="py-2 px-4">
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAssignment(assignment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {getSubmissionStatus(assignment) === "not_submitted" && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedAssignment(assignment);
                                  setSubmitDialogOpen(true);
                                }}
                              >
                                <Upload className="h-4 w-4 mr-1" />
                                Submit
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* View/Submit Dialog */}
          <Dialog open={!!selectedAssignment || submitDialogOpen} onOpenChange={() => {
            setSelectedAssignment(null);
            setSubmitDialogOpen(false);
            setSelectedFile(null);
            setSubmissionStep("upload");
          }}>
            <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>{selectedAssignment?.title}</DialogTitle>
                <DialogDescription>
                  {selectedAssignment?.description}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 overflow-y-auto py-4">
                <div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Due: {selectedAssignment && format(new Date(selectedAssignment.due_date), "PPP")}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedAssignment?.total_points} points</span>
                  </div>
                </div>
                {selectedAssignment?.submissions && selectedAssignment.submissions.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Your Submission</h3>
                    {selectedAssignment.submissions.map((submission) => (
                      <div key={submission.id} className="bg-green-50 p-4 rounded-lg mb-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Submitted</span>
                          <span className="text-sm text-gray-600">
                            {format(new Date(submission.submission_date), "PPp")}
                          </span>
                        </div>
                        {submission.ai_evaluation && (
                          <div className="mt-2 text-sm bg-white p-2 rounded border">
                            <div><b>AI Evaluation:</b></div>
                            <pre className="whitespace-pre-wrap text-xs text-gray-800">
                              {typeof submission.ai_evaluation === "string"
                                ? submission.ai_evaluation
                                : JSON.stringify(submission.ai_evaluation, null, 2)}
                            </pre>
                          </div>
                        )}
                        {submission.ai_grade && <div className="mt-2 text-sm font-bold text-green-800">Grade: {submission.ai_grade}</div>}
                        {submission.ai_overall_grade && <div className="mt-1"><b>Overall:</b> {submission.ai_overall_grade}</div>}
                        {submission.ai_strengths && <div className="mt-1"><b>Strengths:</b> {submission.ai_strengths}</div>}
                        {submission.ai_areas_for_improvement && <div className="mt-1"><b>Improvements:</b> {submission.ai_areas_for_improvement}</div>}
                        {submission.ai_recommendations && <div className="mt-1"><b>Recommendations:</b> {submission.ai_recommendations}</div>}
                        {submission.ai_rubric_breakdown && (
                          <pre className="whitespace-pre-wrap text-xs text-gray-800">{submission.ai_rubric_breakdown}</pre>
                        )}
                        {submission.ai_academic_integrity && <div><b>Academic Integrity:</b> {submission.ai_academic_integrity}</div>}
                        {submission.ai_status && <div><b>Status:</b> {submission.ai_status}</div>}
                        {submission.ai_red_flags && <div><b>Red Flags:</b> {submission.ai_red_flags}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Submission Dialog */}
              {selectedAssignment && getSubmissionStatus(selectedAssignment) === "not_submitted" && (
                <div className="mt-4">
                  <div className="mb-3">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileUpload}
                      disabled={submissionStep === "submitting"}
                    />
                    {selectedFile && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span>{selectedFile.name}</span>
                        <Button size="sm" variant="ghost" onClick={resetSubmission}><X /></Button>
                      </div>
                    )}
                  </div>
                  <Textarea
                    placeholder="Additional notes (optional)"
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    rows={3}
                  />
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitDialogOpen(false);
                        setSelectedAssignment(null);
                        resetSubmission();
                      }}
                      disabled={submissionStep === "submitting"}
                    >
                      Cancel
                    </Button>
                    {submissionStep === "upload" && selectedFile && (
                      <Button onClick={handleSubmitAssignment}>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Assignment
                      </Button>
                    )}
                    {submissionStep === "submitting" && (
                      <div className="flex items-center gap-2 ml-4">
                        <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                        <span>Submitting...</span>
                      </div>
                    )}
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
