
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { AssignmentCreator } from '@/components/AssignmentCreator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Eye, Users, FileText, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';

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

const TeacherAssignment = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create');

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          assignment_enrollments(count),
          submissions(
            id,
            student_id,
            status,
            submission_date,
            ai_evaluation,
            teacher_grade,
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

  const handleAssignmentCreated = () => {
    fetchAssignments();
    setActiveTab('manage');
  };

  const downloadSubmission = async (submissionId: string, fileName: string) => {
    try {
      const { data: submission } = await supabase
        .from('submissions')
        .select('file_path')
        .eq('id', submissionId)
        .single();

      if (submission?.file_path) {
        const { data, error } = await supabase.storage
          .from('assignment-submissions')
          .download(submission.file_path);

        if (error) throw error;

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (loading) {
    return (
      <AuthGuard allowedRoles={['teacher']}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['teacher']}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Assignment Management</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="create">Create Assignment</TabsTrigger>
              <TabsTrigger value="manage">Manage Assignments</TabsTrigger>
              <TabsTrigger value="submissions">View Submissions</TabsTrigger>
            </TabsList>

            <TabsContent value="create">
              <AssignmentCreator onAssignmentCreated={handleAssignmentCreated} />
            </TabsContent>

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
                        assignment.submissions?.map(submission => (
                          <TableRow key={submission.id}>
                            <TableCell className="font-medium">
                              {submission.profiles?.full_name}
                            </TableCell>
                            <TableCell>{assignment.title}</TableCell>
                            <TableCell>
                              {format(new Date(submission.submission_date), 'MMM dd, yyyy')}
                            </TableCell>
                            <TableCell>
                              {submission.ai_evaluation?.score || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {submission.teacher_grade || 'Not graded'}
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
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => downloadSubmission(submission.id, `${submission.profiles?.full_name}_${assignment.title}`)}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
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
      </ModernDashboardLayout>
    </AuthGuard>
  );
};

export default TeacherAssignment;
