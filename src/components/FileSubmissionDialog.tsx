
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

interface FileSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignmentId: string;
  assignmentTitle: string;
  onSubmissionComplete: () => void;
}

export const FileSubmissionDialog = ({ 
  open, 
  onOpenChange, 
  assignmentId, 
  assignmentTitle,
  onSubmissionComplete 
}: FileSubmissionDialogProps) => {
  const { user, profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [studentId, setStudentId] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, TXT, or DOCX file.",
          variant: "destructive"
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const generateSubmissionMetadata = () => {
    const submissionDate = new Date().toLocaleDateString();
    return `Student Name: ${profile?.full_name || 'Unknown'}
ID: ${studentId}
Course Code: ACFM2024
Assignment Title: ${assignmentTitle}
Submission Date: ${submissionDate}

---

`;
  };

  const handleSubmit = async () => {
    if (!file || !user || !studentId.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file and enter your student ID.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if student already has a submission
      const { data: existingSubmission } = await supabase
        .from('submissions')
        .select('id')
        .eq('assignment_id', assignmentId)
        .eq('student_id', user.id)
        .single();

      if (existingSubmission) {
        toast({
          title: "Submission already exists",
          description: "You have already submitted this assignment. Only one submission is allowed.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      // Upload file to storage
      const fileName = `${user.id}/${assignmentId}_${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from('submissions')
        .insert([
          {
            assignment_id: assignmentId,
            student_id: user.id,
            file_path: uploadData.path,
            file_name: file.name,
            status: 'submitted'
          }
        ])
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Call AI evaluation function
      await evaluateSubmissionWithAI(submission.id, uploadData.path);

      toast({
        title: "Submission successful!",
        description: "Your assignment has been submitted and is being evaluated by AI."
      });

      onSubmissionComplete();
      onOpenChange(false);
      setFile(null);
      setStudentId('');
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your assignment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const evaluateSubmissionWithAI = async (submissionId: string, filePath: string) => {
    try {
      // This would call your AI evaluation edge function
      const response = await fetch('/api/evaluate-submission', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          submissionId,
          filePath,
          metadata: generateSubmissionMetadata()
        })
      });

      if (!response.ok) {
        console.error('AI evaluation failed');
      }
    } catch (error) {
      console.error('Error calling AI evaluation:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="student-id">Student ID</Label>
            <Input
              id="student-id"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter your student ID"
              required
            />
          </div>

          <div>
            <Label htmlFor="file-upload">Upload File (PDF, TXT, or DOCX)</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.txt,.docx"
              required
            />
          </div>

          {file && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium">Selected file: {file.name}</p>
              <p className="text-xs text-gray-600">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Required Information (will be auto-added):</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p>• Student Name: {profile?.full_name}</p>
              <p>• ID: [Your input above]</p>
              <p>• Course Code: ACFM2024</p>
              <p>• Assignment Title: {assignmentTitle}</p>
              <p>• Submission Date: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !file || !studentId.trim()}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Upload className="mr-2 h-4 w-4" />
            Submit Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
