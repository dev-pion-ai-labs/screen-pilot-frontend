
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileSubmissionDialog } from '@/components/FileSubmissionDialog';
import { AlertCircle, Calendar, Clock, FileText, Eye, Upload } from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  semester: number;
  topic: string;
  total_points: number;
  estimated_time: number;
  difficulty: string;
  status: string;
  submission?: {
    id: string;
    status: string;
    submission_date: string;
    ai_evaluation: any;
    teacher_feedback: string;
    teacher_grade: number;
  };
}

const StudentAssignments = () => {
  const { user, profile } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  useEffect(() => {
    if (user && profile?.semester) {
      fetchAssignments();
    }
  }, [user, profile]);

  const fetchAssignments = async () => {
    try {
      // First get enrolled assignments
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('assignment_enrollments')
        .select(`
          assignment_id,
          assignments (
            id,
            title,
            description,
            due_date,
            semester,
            topic,
            total_points,
            estimated_time,
            difficulty,
            status
          )
        `)
        .eq('student_id', user?.id);

      if (enrollmentError) throw enrollmentError;

      const assignmentIds = enrollments?.map(e => e.assignment_id) || [];
      
      // Get submissions for these assignments
      const { data: submissions, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('student_id', user?.id)
        .in('assignment_id', assignmentIds);

      if (submissionError) throw submissionError;

      // Combine assignments with their submissions
      const assignmentsWithSubmissions = enrollments?.map(enrollment => {
        const assignment = enrollment.assignments;
        const submission = submissions?.find(s => s.assignment_id === assignment.id);
        
        return {
          ...assignment,
          submission
        };
      }) || [];

      setAssignments(assignmentsWithSubmissions);
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

  const getStatusColor = (assignment: Assignment) => {
    if (assignment.submission) {
      switch (assignment.submission.status) {
        case 'submitted': return 'bg-green-100 text-green-800';
        case 'graded': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    if (dueDate < now) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (assignment: Assignment) => {
    if (assignment.submission) {
      return assignment.submission.status === 'submitted' ? 'Submitted' : 'Graded';
    }
    
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    if (dueDate < now) {
      return 'Overdue';
    }
    return 'Pending';
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['student']}>
      <ModernDashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
            <Badge variant="outline" className="text-sm">
              Semester {profile?.semester}
            </Badge>
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                <p className="text-gray-600">Check back later for new assignments from your teachers.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg font-semibold line-clamp-2">
                        {assignment.title}
                      </CardTitle>
                      <Badge className={getStatusColor(assignment)}>
                        {getStatusText(assignment)}
                      </Badge>
                    </div>
                    {assignment.topic && (
                      <p className="text-sm text-gray-600">{assignment.topic}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="text-sm text-gray-600 line-clamp-3">
                      {assignment.description.substring(0, 150)}...
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                      </div>
                      {assignment.estimated_time > 0 && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {assignment.estimated_time}h
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {assignment.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {assignment.total_points} pts
                      </Badge>
                    </div>

                    {assignment.submission?.ai_evaluation && (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">
                          AI Grade: {assignment.submission.ai_evaluation.score || 'N/A'}
                        </p>
                        {assignment.submission.teacher_grade && (
                          <p className="text-sm font-medium text-blue-800">
                            Teacher Grade: {assignment.submission.teacher_grade}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAssignment(assignment)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      {!assignment.submission && (
                        <Button
                          size="sm"
                          onClick={() => handleSubmitAssignment(assignment)}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Submit
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Assignment Detail Modal */}
          {selectedAssignment && !showSubmissionDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold">{selectedAssignment.title}</h2>
                    <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
                      Close
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Due Date:</strong> {format(new Date(selectedAssignment.due_date), 'PPP')}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Topic:</strong> {selectedAssignment.topic}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Total Points:</strong> {selectedAssignment.total_points}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        <strong>Difficulty:</strong> {selectedAssignment.difficulty}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Estimated Time:</strong> {selectedAssignment.estimated_time} hours
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Semester:</strong> {selectedAssignment.semester}
                      </p>
                    </div>
                  </div>
                  
                  <div className="prose max-w-none">
                    <h3>Assignment Description</h3>
                    <div className="whitespace-pre-wrap">{selectedAssignment.description}</div>
                  </div>

                  {selectedAssignment.submission && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold mb-2">Submission Details</h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Submitted on: {format(new Date(selectedAssignment.submission.submission_date), 'PPP')}
                      </p>
                      
                      {selectedAssignment.submission.ai_evaluation && (
                        <div className="mt-4 p-3 bg-white rounded border">
                          <h4 className="font-medium mb-2">AI Evaluation</h4>
                          <div className="text-sm space-y-1">
                            <p><strong>Grade:</strong> {selectedAssignment.submission.ai_evaluation.grade || 'N/A'}</p>
                            <p><strong>Score:</strong> {selectedAssignment.submission.ai_evaluation.score || 'N/A'}</p>
                            {selectedAssignment.submission.ai_evaluation.feedback && (
                              <div>
                                <strong>Feedback:</strong>
                                <div className="mt-1 text-gray-700">
                                  {selectedAssignment.submission.ai_evaluation.feedback}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {selectedAssignment.submission.teacher_feedback && (
                        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                          <h4 className="font-medium mb-2">Teacher Feedback</h4>
                          <p className="text-sm">{selectedAssignment.submission.teacher_feedback}</p>
                          {selectedAssignment.submission.teacher_grade && (
                            <p className="text-sm font-medium mt-2">
                              Teacher Grade: {selectedAssignment.submission.teacher_grade}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-6 flex gap-2">
                    {!selectedAssignment.submission && (
                      <Button onClick={() => handleSubmitAssignment(selectedAssignment)}>
                        <Upload className="h-4 w-4 mr-1" />
                        Submit Assignment
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File Submission Dialog */}
          {showSubmissionDialog && selectedAssignment && (
            <FileSubmissionDialog
              open={showSubmissionDialog}
              onOpenChange={setShowSubmissionDialog}
              assignmentId={selectedAssignment.id}
              assignmentTitle={selectedAssignment.title}
              onSubmissionComplete={() => {
                fetchAssignments();
                setSelectedAssignment(null);
              }}
            />
          )}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default StudentAssignments;
