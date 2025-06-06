
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { FileSubmissionDialog } from '@/components/FileSubmissionDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Upload, 
  Eye, 
  CheckCircle,
  AlertCircle,
  FileText 
} from 'lucide-react';
import { format, isAfter } from 'date-fns';

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

const StudentAssignments = () => {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  useEffect(() => {
    if (user && (profile as Profile)?.semester) {
      fetchAssignments();
    }
  }, [user, profile]);

  const fetchAssignments = async () => {
    try {
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('assignment_enrollments')
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
              teacher_feedback
            )
          )
        `)
        .eq('student_id', user?.id);

      if (enrollmentError) throw enrollmentError;

      // Transform the data to get assignments with submissions
      const assignmentsData = enrollments?.map(enrollment => ({
        ...enrollment.assignments,
        submissions: enrollment.assignments?.submissions?.filter(
          (sub: any) => sub && typeof sub === 'object'
        ) || []
      })) || [];

      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
  };

  const handleSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowSubmissionDialog(true);
  };

  const handleSubmissionComplete = () => {
    fetchAssignments();
    setShowSubmissionDialog(false);
    setSelectedAssignment(null);
  };

  const getSubmissionStatus = (assignment: Assignment) => {
    const submission = assignment.submissions?.[0];
    if (!submission) return 'not_submitted';
    return submission.status;
  };

  const getSubmissionBadge = (assignment: Assignment) => {
    const status = getSubmissionStatus(assignment);
    const isOverdue = isAfter(new Date(), new Date(assignment.due_date));
    
    switch (status) {
      case 'submitted':
        return <Badge className="bg-green-100 text-green-800">Submitted</Badge>;
      case 'graded':
        return <Badge className="bg-blue-100 text-blue-800">Graded</Badge>;
      default:
        return isOverdue 
          ? <Badge variant="destructive">Overdue</Badge>
          : <Badge variant="outline">Pending</Badge>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['student']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
              <p className="mt-2 text-gray-600">
                Semester {(profile as Profile)?.semester} assignments and submissions
              </p>
            </div>
          </div>

          {/* Assignment Details Modal */}
          {selectedAssignment && !showSubmissionDialog && (
            <Card className="border-2 border-blue-200">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{selectedAssignment.title}</CardTitle>
                    <p className="text-gray-600 mt-2">{selectedAssignment.topic}</p>
                  </div>
                  <div className="flex gap-2">
                    {getSubmissionBadge(selectedAssignment)}
                    <Badge variant="outline" className={getDifficultyColor(selectedAssignment.difficulty)}>
                      {selectedAssignment.difficulty}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedAssignment.description}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      Due: {format(new Date(selectedAssignment.due_date), 'PPP')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{selectedAssignment.total_points} points</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">PDF/TXT submission</span>
                  </div>
                </div>

                {/* Submission Status */}
                {selectedAssignment.submissions && selectedAssignment.submissions.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Your Submission</h3>
                    {selectedAssignment.submissions.map((submission) => (
                      <div key={submission.id} className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">Submitted</span>
                          <span className="text-sm text-gray-600">
                            {format(new Date(submission.submission_date), 'PPp')}
                          </span>
                        </div>
                        
                        {submission.ai_evaluation && (
                          <div className="mt-3 p-3 bg-white rounded border">
                            <h4 className="font-medium mb-2">AI Evaluation</h4>
                            <div className="space-y-2 text-sm">
                              <div>Grade: {submission.ai_evaluation.grade}</div>
                              <div>Score: {submission.ai_evaluation.score}</div>
                              {submission.ai_evaluation.feedback && (
                                <div className="mt-2">
                                  <div className="font-medium">Feedback:</div>
                                  <div className="whitespace-pre-wrap text-gray-700">
                                    {submission.ai_evaluation.feedback}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {submission.teacher_grade && (
                          <div className="mt-3 p-3 bg-blue-50 rounded border">
                            <h4 className="font-medium mb-2">Teacher Grade</h4>
                            <div>Grade: {submission.teacher_grade}/100</div>
                            {submission.teacher_feedback && (
                              <div className="mt-2">
                                <div className="font-medium">Feedback:</div>
                                <div className="text-gray-700">{submission.teacher_feedback}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedAssignment(null)}
                  >
                    Close
                  </Button>
                  {getSubmissionStatus(selectedAssignment) === 'not_submitted' && (
                    <Button 
                      onClick={() => handleSubmitAssignment(selectedAssignment)}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Submit Assignment
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Assignments Table */}
          {!selectedAssignment && (
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Assignment</TableHead>
                        <TableHead>Topic</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Points</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{assignment.title}</div>
                              <div className="text-sm text-gray-600">
                                Created {format(new Date(assignment.created_at), 'MMM dd')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{assignment.topic}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{assignment.total_points} pts</div>
                          </TableCell>
                          <TableCell>
                            {getSubmissionBadge(assignment)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAssignment(assignment)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                              {getSubmissionStatus(assignment) === 'not_submitted' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleSubmitAssignment(assignment)}
                                >
                                  <Upload className="h-4 w-4 mr-1" />
                                  Submit
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* File Submission Dialog */}
          {showSubmissionDialog && selectedAssignment && (
            <FileSubmissionDialog
              open={showSubmissionDialog}
              onOpenChange={setShowSubmissionDialog}
              assignmentId={selectedAssignment.id}
              assignmentTitle={selectedAssignment.title}
              onSubmissionComplete={handleSubmissionComplete}
            />
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
};

export default StudentAssignments;
