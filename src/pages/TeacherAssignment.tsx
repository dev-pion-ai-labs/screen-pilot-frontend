import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Eye, Users, FileText, Calendar, Download, Star, X
} from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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
  enrollments?: any[];
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
  const [activeTab, setActiveTab] = useState('manage');
  const [viewSubmission, setViewSubmission] = useState<Submission | null>(null);
  const [gradeInput, setGradeInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchAssignments();
  }, [user]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_enrollments(count),
          submissions(
            *,
            profiles(full_name)
          )
        `)
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadSubmission = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('assignment-submissions')
        .download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Download failed!');
    }
  };

  const handleOpenSubmission = (submission: Submission) => {
    setViewSubmission(submission);
    setGradeInput(submission.teacher_grade?.toString() || '');
    setFeedbackInput(submission.teacher_feedback || '');
  };

  const handleGradeSubmit = async () => {
    if (!viewSubmission) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('submissions')
        .update({
          teacher_grade: gradeInput ? Number(gradeInput) : null,
          teacher_feedback: feedbackInput || null,
          status: 'graded',
          updated_at: new Date().toISOString()
        })
        .eq('id', viewSubmission.id);

      if (error) throw error;
      fetchAssignments();
      setViewSubmission(null);
    } catch (error) {
      alert('Failed to update grade/feedback!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthGuard allowedRoles={['teacher']}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Assignment Management</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="manage">Manage Assignments</TabsTrigger>
              <TabsTrigger value="submissions">View Submissions</TabsTrigger>
            </TabsList>

            {/* Assignment overview */}
            <TabsContent value="manage">
              <div className="space-y-4">
                {assignments.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments created</h3>
                      <p className="text-gray-600">Create your first assignment to get started.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {assignments.map((assignment) => (
                      <Card key={assignment.id}>
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{assignment.title}</CardTitle>
                              <p className="text-sm text-gray-600 mt-1">{assignment.topic}</p>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline">Sem {assignment.semester}</Badge>
                              <Badge className={assignment.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {assignment.status}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              <span>Due: {format(new Date(assignment.due_date), 'MMM dd')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <span>{assignment.enrollments?.[0]?.count || 0} students</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span>{assignment.submissions?.length || 0} submissions</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{assignment.total_points} pts</span>
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
            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle>Student Submissions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>AI Grade</TableHead>
                        <TableHead>Teacher Grade</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.flatMap(assignment =>
                        assignment.submissions?.map((submission: Submission) => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.profiles?.full_name}
                            </TableCell>
                            <TableCell>{assignment.title}</TableCell>
                            <TableCell>
                              {format(new Date(submission.submission_date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {submission.ai_grade ?? submission.ai_evaluation?.Score ?? 'N/A'}
                            </TableCell>
                            <TableCell>
                              {submission.teacher_grade ?? 'Not graded'}
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                submission.status === 'submitted'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-green-100 text-green-800'
                              }>
                                {submission.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {submission.file_path && submission.file_name && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => downloadSubmission(submission.file_path!, submission.file_name!)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenSubmission(submission)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) || []
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Submission Review Modal */}
        <Dialog open={!!viewSubmission} onOpenChange={() => setViewSubmission(null)}>
          <DialogContent className="max-w-2xl w-full max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>
                Submission by {viewSubmission?.profiles?.full_name}
              </DialogTitle>
              <div className="text-sm text-gray-600 mb-2">
                <span>Submitted: {viewSubmission?.submission_date && format(new Date(viewSubmission.submission_date), 'PPpp')}</span>
              </div>
            </DialogHeader>

            {viewSubmission && (
              <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="font-semibold mb-2">AI Evaluation:</div>
                  <div className="text-xs whitespace-pre-wrap">
                    {viewSubmission.ai_evaluation
                      ? typeof viewSubmission.ai_evaluation === "string"
                        ? viewSubmission.ai_evaluation
                        : JSON.stringify(viewSubmission.ai_evaluation, null, 2)
                      : "No evaluation"}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div><b>AI Grade:</b> {viewSubmission.ai_grade ?? viewSubmission.ai_evaluation?.Score ?? "N/A"}</div>
                    <div><b>AI Overall:</b> {viewSubmission.ai_overall_grade ?? viewSubmission.ai_evaluation?.["Overall Grade"] ?? "N/A"}</div>
                    <div><b>Strengths:</b> {viewSubmission.ai_strengths ?? viewSubmission.ai_evaluation?.["Constructive Feedback"]?.Strengths ?? "N/A"}</div>
                    <div><b>Areas for Improvement:</b> {viewSubmission.ai_areas_for_improvement ?? viewSubmission.ai_evaluation?.["Constructive Feedback"]?.["Areas for Improvement"] ?? "N/A"}</div>
                    <div><b>Recommendations:</b> {viewSubmission.ai_recommendations ?? viewSubmission.ai_evaluation?.["Constructive Feedback"]?.Recommendations ?? "N/A"}</div>
                    <div><b>Academic Integrity:</b> {viewSubmission.ai_academic_integrity ?? viewSubmission.ai_evaluation?.["Faculty Progress Summary"]?.["Academic Integrity"] ?? "N/A"}</div>
                  </div>
                  <div className="mt-2">
                    <b>Rubric Breakdown:</b>
                    <div className="text-xs mt-1 whitespace-pre-wrap">
                      {viewSubmission.ai_rubric_breakdown
                        ? typeof viewSubmission.ai_rubric_breakdown === "string"
                          ? viewSubmission.ai_rubric_breakdown
                          : JSON.stringify(viewSubmission.ai_rubric_breakdown, null, 2)
                        : viewSubmission.ai_evaluation?.["Rubric-Based Breakdown"]
                          ? JSON.stringify(viewSubmission.ai_evaluation["Rubric-Based Breakdown"], null, 2)
                          : "N/A"}
                    </div>
                  </div>
                </div>
                <div className="bg-white border rounded-lg p-4">
                  <div className="font-semibold mb-2">Teacher Grade & Feedback</div>
                  <Input
                    type="number"
                    value={gradeInput}
                    min={0}
                    max={100}
                    placeholder="Enter grade"
                    onChange={e => setGradeInput(e.target.value)}
                    className="mb-2"
                  />
                  <Textarea
                    value={feedbackInput}
                    onChange={e => setFeedbackInput(e.target.value)}
                    placeholder="Enter feedback"
                    rows={3}
                  />
                  <DialogFooter className="mt-2">
                    <Button
                      onClick={handleGradeSubmit}
                      disabled={submitting || gradeInput === ''}
                    >
                      {submitting ? "Saving..." : "Save Grade"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setViewSubmission(null)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                      Close
                    </Button>
                  </DialogFooter>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default TeacherAssignment;
