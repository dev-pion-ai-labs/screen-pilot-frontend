
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Upload, FileText, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  teacher_id: string;
}

interface Submission {
  id: string;
  script_url?: string;
  file_path?: string;
  file_name?: string;
  submission_date?: string;
  status?: string;
  ai_feedback?: any;
  grade?: number;
  created_at: string;
}

const SUBMISSIONS_BUCKET = 'assignment-submissions';

export default function AssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !profile?.id) return;
    fetchAssignmentAndSubmission();
  }, [id, profile?.id]);

  const fetchAssignmentAndSubmission = async () => {
    if (!id || !profile?.id) return;
    setLoading(true);
    try {
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (assignmentError) throw assignmentError;
      setAssignment(assignmentData);

      const { data: submissionData, error: submissionError } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', id)
        .eq('student_id', profile.id)
        .maybeSingle();

      if (submissionError) throw submissionError;
      setSubmission(submissionData);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Failed to load assignment',
        description: error?.message ?? 'Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !assignment || !profile?.id) return;

    setUploading(true);

    let uploadedPath: string | null = null;
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${profile.id}/${assignment.id}_${Date.now()}_${safeName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(SUBMISSIONS_BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;
      uploadedPath = uploadData.path;

      const { data: urlData } = supabase.storage
        .from(SUBMISSIONS_BUCKET)
        .getPublicUrl(uploadedPath);

      const now = new Date().toISOString();
      const submissionData = {
        assignment_id: assignment.id,
        student_id: profile.id,
        file_path: uploadedPath,
        file_name: file.name,
        script_url: urlData.publicUrl,
        submission_date: now,
        status: 'submitted',
        updated_at: now
      };

      if (submission) {
        const { data, error } = await supabase
          .from('submissions')
          .update(submissionData)
          .eq('id', submission.id)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (data) setSubmission(data);
      } else {
        const { data, error } = await supabase
          .from('submissions')
          .insert(submissionData)
          .select()
          .maybeSingle();

        if (error) throw error;
        if (data) setSubmission(data);
      }

      toast({
        title: 'Success!',
        description: 'Your script has been uploaded successfully.'
      });

      fetchAssignmentAndSubmission();
    } catch (error: any) {
      console.error('Upload error:', error);
      if (uploadedPath) {
        await supabase.storage.from(SUBMISSIONS_BUCKET).remove([uploadedPath]);
      }
      toast({
        title: 'Upload failed',
        description: error?.message ?? 'There was an error uploading your file. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
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

  if (!assignment) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <ModernDashboardLayout>
          <div className="text-center py-8">
            <h2 className="text-2xl font-bold text-gray-900">Assignment not found</h2>
            <Link to="/student/dashboard">
              <Button className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  const isOverdue = new Date(assignment.due_date) < new Date();
  const hasSubmission = !!submission;

  return (
    <AuthGuard allowedRoles={['student']}>
      <ModernDashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/student/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{assignment.title}</CardTitle>
                <Badge
                  variant={hasSubmission ? "default" : isOverdue ? "destructive" : "secondary"}
                  className="flex items-center gap-1"
                >
                  {hasSubmission ? (
                    <CheckCircle className="h-3 w-3" />
                  ) : (
                    <Clock className="h-3 w-3" />
                  )}
                  {hasSubmission ? 'Submitted' : isOverdue ? 'Overdue' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{assignment.description}</p>
              <div className="text-sm text-gray-500">
                Due: {format(new Date(assignment.due_date), 'PPP')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Submission</CardTitle>
            </CardHeader>
            <CardContent>
              {hasSubmission ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">{submission.file_name || 'Script uploaded'}</p>
                      <p className="text-sm text-green-700">
                        Submitted on {format(new Date(submission.submission_date || submission.created_at), 'PPP')}
                      </p>
                    </div>
                  </div>

                  {submission.grade != null && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-medium text-blue-900">Grade: {submission.grade}/100</p>
                    </div>
                  )}

                  {submission.ai_feedback && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">AI Feedback:</p>
                      <p className="text-gray-700">{JSON.stringify(submission.ai_feedback)}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="resubmit">Upload new version (optional)</Label>
                    <Input
                      id="resubmit"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload your script</h3>
                    <p className="text-gray-600">Choose a file to submit for this assignment</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Select file</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                    <p className="text-sm text-gray-500">
                      Supported formats: PDF, DOC, DOCX, TXT
                    </p>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <span>Uploading...</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
