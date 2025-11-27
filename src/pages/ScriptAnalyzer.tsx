import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Upload,
  Film,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Star,
  FileUp,
  Link,
  Send,
  Eye,
  Clock,
  User,
  MessageSquare,
  Calendar,
  Award,
  Bell
} from 'lucide-react';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import ScriptAnalysisDisplay from '@/components/ScriptAnalysisDisplay';
import { format } from 'date-fns';

const N8N_SCRIPT_ANALYZER_ENDPOINT = "https://vijiteshnaik.app.n8n.cloud/webhook/4dd12417-e6e1-4dd7-a431-c9e031136a40";

interface ScriptAnalysis {
  id: string
  title: string
  script_content: string
  script_url?: string
  analysis_result: any
  created_at: string
  updated_at: string
  user_id: string
  type: string
  status: 'draft' | 'submitted' | 'reviewed'
  submitted_at?: string
  script_reviews?: ScriptReview[]
}

interface ScriptReview {
  id: string
  script_id: string
  teacher_id: string
  class_id: string
  feedback: string | null
  show_ai_result: boolean
  reviewed_at: string | null
  custom_analysis_result: string | null
  created_at: string
  teacher: {
    id: string
    full_name: string
    email: string
  }
  class: {
    id: string
    name: string
  }
}

interface AnalysisProgress {
  step: string
  progress: number
  message: string
}

const SCRIPT_TYPES = [
  { value: "assignment", label: "Assignment" },
  { value: "documentary", label: "Documentary" },
  { value: "shortfilm", label: "Short Film" },
  { value: "feature film", label: "Feature Film" },
  { value: "episodic content", label: "Episodic Content" }
];

const ScriptAnalyzer = () => {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<ScriptAnalysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<ScriptAnalysis | null>(null)
  const [scriptType, setScriptType] = useState(SCRIPT_TYPES[0].value);
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [scriptContent, setScriptContent] = useState('')
  const [scriptTitle, setScriptTitle] = useState('')
  const [scriptUrl, setScriptUrl] = useState('')
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'new' | 'submissions'>('new')
  const [submitting, setSubmitting] = useState(false)
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false)
  const [scriptToSubmit, setScriptToSubmit] = useState<ScriptAnalysis | null>(null)
  const [draftResultModalOpen, setDraftResultModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAnalyses()
    }
  }, [user])

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('script_analyses')
        .select(`
          *,
          script_reviews (
            id,
            script_id,
            teacher_id,
            class_id,
            feedback,
            show_ai_result,
            reviewed_at,
            custom_analysis_result,
            created_at,
            teacher:profiles!script_reviews_teacher_id_fkey (
              id,
              full_name,
              email
            ),
            class:classes!script_reviews_class_id_fkey (
              id,
              name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setAnalyses(data || [])
    } catch (error) {
      console.error('Error fetching analyses:', error)
      toast({
        title: "Error",
        description: "Failed to load script analyses",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const pollN8nJobResult = async (jobId) => {
    const maxAttempts = 20;
    let attempts = 0;
    while (attempts < maxAttempts) {
      try {
        const pollRes = await fetch(`${N8N_SCRIPT_ANALYZER_ENDPOINT}/status/${jobId}`);
        if (!pollRes.ok) throw new Error('Polling failed');
        const status = await pollRes.json();
        if (status.status === "completed") return status.result;
        if (status.status === "error") throw new Error(status.error);
        attempts++;
        await new Promise(r => setTimeout(r, 3000));
      } catch (e) {
        attempts++;
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    throw new Error("Timed out waiting for script analysis result.");
  };

  const triggerScriptAnalysis = async (scriptTitle: string, scriptUrl: string, scriptType: string) => {
    try {
      if (!scriptUrl) throw new Error('No script file URL provided to agent.');
      const payload = {
        "Type": scriptType,
        "file_url": scriptUrl
      };
      console.log("payload", payload);

      const response = await fetch(N8N_SCRIPT_ANALYZER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Agent trigger failed (${response.status}): ${errorText}`);
      }
      const result = await response.json();
      if (result.jobId) {
        return await pollN8nJobResult(result.jobId);
      }
      return result.result || result.output || result;
    } catch (error) {
      console.error('Agent Trigger Error:', error);
      throw error;
    }
  };

  const uploadFileToSupabase = async (file: File): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('scripts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from('scripts')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload PDF, DOCX, or TXT files only",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    try {
      setUploadProgress(20);
      const uploadedUrl = await uploadFileToSupabase(file);
      setUploadProgress(80);
      setScriptTitle(file.name.replace(/\.[^/.]+$/, ''));
      setScriptUrl(uploadedUrl);
      setUploadProgress(100);
      toast({
        title: "File uploaded successfully",
        description: `File uploaded: ${file.name}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const processScriptAnalysis = async () => {
    if (!scriptTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a script title",
        variant: "destructive"
      });
      return;
    }

    if (!scriptUrl) {
      toast({
        title: "Missing Script File",
        description: "Please upload a script file to analyze.",
        variant: "destructive"
      });
      return;
    }

    if (!scriptType) {
      toast({
        title: "Missing Script Type",
        description: "Please select script type.",
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress({ step: 'initializing', progress: 10, message: 'Preparing script analysis...' });

    try {
      const analysisData = {
        user_id: user?.id,
        title: scriptTitle,
        type: scriptType,
        script_content: '',
        script_url: scriptUrl,
        analysis_result: null,
        status: 'draft'
      };

      const { data: dbResult, error: dbError } = await supabase
        .from('script_analyses')
        .insert([analysisData])
        .select()
        .single();

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      setAnalysisProgress({ step: 'processing', progress: 40, message: 'Agent processing script file...' });

      let analysisResult;
      try {
        analysisResult = await triggerScriptAnalysis(scriptTitle, scriptUrl, scriptType);
        setAnalysisProgress({ step: 'completing', progress: 90, message: 'Finalizing analysis results...' });
      } catch (apiError) {
        console.error('Agent API error:', apiError);
        toast({
          title: "Analysis Error",
          description: apiError instanceof Error ? apiError.message : "Failed to analyze script",
          variant: "destructive"
        });
        setAnalyzing(false);
        setTimeout(() => setAnalysisProgress(null), 2000);
        return;
      }

      setAnalysisProgress({ step: 'saving', progress: 95, message: 'Saving analysis results...' });
      const { error: updateError } = await supabase
        .from('script_analyses')
        .update({
          analysis_result: analysisResult,
          script_content: '',
          updated_at: new Date().toISOString()
        })
        .eq('id', dbResult.id);

      if (updateError) throw new Error(`Update error: ${updateError.message}`);

      setAnalysisProgress({ step: 'complete', progress: 100, message: 'Analysis complete!' });

      toast({
        title: "Analysis Complete",
        description: "Your script has been analyzed. You can now submit it for teacher review.",
        variant: "default"
      });

      await fetchAnalyses();
      setSelectedAnalysis({ ...dbResult, analysis_result: analysisResult, script_content: '', status: 'draft' });

      setScriptContent('');
      setScriptTitle('');
      setScriptUrl('');

    } catch (error) {
      console.error('Error analyzing script:', error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to analyze script",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
      setTimeout(() => setAnalysisProgress(null), 2000);
    }
  }

  const handleSubmitForReview = async (analysis: ScriptAnalysis) => {
    setScriptToSubmit(analysis);
    setSubmitConfirmOpen(true);
  }

  const confirmSubmitForReview = async () => {
    if (!scriptToSubmit) return;

    setSubmitting(true);
    try {
      // 1. Get all student's classes
      const { data: studentClasses, error: classError } = await supabase
        .from('class_students')
        .select('class_id')
        .eq('student_id', user?.id);

      if (classError) throw classError;

      if (!studentClasses || studentClasses.length === 0) {
        toast({
          title: "No Classes Found",
          description: "You are not enrolled in any classes. Please contact your administrator.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      const classIds = studentClasses.map(c => c.class_id);

      // 2. Get all teachers from these classes
      const { data: classTeachers, error: teacherError } = await supabase
        .from('class_teachers')
        .select('teacher_id, class_id')
        .in('class_id', classIds);

      if (teacherError) throw teacherError;

      if (!classTeachers || classTeachers.length === 0) {
        toast({
          title: "No Teachers Found",
          description: "No teachers found in your classes. Please contact your administrator.",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      // 3. Deduplicate teachers (pick first class for each teacher)
      const teacherMap = new Map<string, string>();
      classTeachers.forEach(ct => {
        if (!teacherMap.has(ct.teacher_id)) {
          teacherMap.set(ct.teacher_id, ct.class_id);
        }
      });

      const uniqueTeachers = Array.from(teacherMap.entries()).map(([teacher_id, class_id]) => ({
        teacher_id,
        class_id
      }));

      console.log(`Submitting to ${uniqueTeachers.length} unique teachers`);

      // 4. Update script status to submitted
      const { error: updateError } = await supabase
        .from('script_analyses')
        .update({
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', scriptToSubmit.id);

      if (updateError) throw updateError;

      // 5. Create script_reviews for each unique teacher
      const reviewsToInsert = uniqueTeachers.map(ct => ({
        script_id: scriptToSubmit.id,
        teacher_id: ct.teacher_id,
        class_id: ct.class_id,
        feedback: null,
        show_ai_result: false,
        reviewed_at: null
      }));

      const { error: reviewError } = await supabase
        .from('script_reviews')
        .insert(reviewsToInsert);

      if (reviewError) throw reviewError;

      // 6. Create notifications for all unique teachers
      const notificationsToInsert = uniqueTeachers.map(ct => ({
        user_id: ct.teacher_id,
        script_id: scriptToSubmit.id,
        type: 'submission',
        message: `New script submission: "${scriptToSubmit.title}" from ${user?.email}`,
        is_read: false
      }));

      const { error: notifError } = await supabase
        .from('script_notifications')
        .insert(notificationsToInsert);

      if (notifError) throw notifError;

      toast({
        title: "Script Submitted! 🎉",
        description: "Your script has been sent to your teachers for review.",
        variant: "default"
      });

      setSubmitConfirmOpen(false);
      setScriptToSubmit(null);
      await fetchAnalyses();
      setActiveTab('submissions');

    } catch (error) {
      console.error('Error submitting script:', error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "Failed to submit script",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }

  const deleteAnalysis = async (analysisId: string) => {
    try {
      const analysisToDelete = analyses.find(a => a.id === analysisId);

      // Only allow deletion of drafts
      if (analysisToDelete?.status !== 'draft') {
        toast({
          title: "Cannot Delete",
          description: "You can only delete draft scripts. Submitted scripts cannot be deleted.",
          variant: "destructive"
        });
        return;
      }

      if (analysisToDelete?.script_url) {
        try {
          const urlParts = analysisToDelete.script_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `${user?.id}/${fileName}`;

          await supabase.storage
            .from('scripts')
            .remove([filePath]);
        } catch (storageError) {
          console.warn('Failed to delete file from storage:', storageError);
        }
      }

      const { error } = await supabase
        .from('script_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw new Error(`Delete error: ${error.message}`);

      if (selectedAnalysis?.id === analysisId) {
        setSelectedAnalysis(null);
      }

      await fetchAnalyses();

      toast({
        title: "Analysis Deleted",
        description: "Script analysis and associated files have been removed",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Delete Error",
        description: error instanceof Error ? error.message : "Failed to delete analysis",
        variant: "destructive"
      });
    }
  }

  const getStatusBadge = (analysis: ScriptAnalysis) => {
    switch (analysis.status) {
      case 'draft':
        return (
          <Badge variant="outline" className="bg-gray-50">
            <FileText className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        );
      case 'submitted':
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'reviewed':
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        );
      default:
        return null;
    }
  }

  const hasAnyTeacherShownAI = (reviews: ScriptReview[]) => {
    return reviews?.some(review => review.show_ai_result) || false;
  }

  const getAnalysisToDisplay = (analysis: ScriptAnalysis): string | null => {
    if (!analysis.script_reviews || analysis.script_reviews.length === 0) {
      return analysis.analysis_result;
    }

    // Find a review that has show_ai_result enabled and has custom_analysis_result
    const reviewWithCustomAnalysis = analysis.script_reviews.find(
      review => review.show_ai_result && review.custom_analysis_result
    );

    if (reviewWithCustomAnalysis?.custom_analysis_result) {
      return reviewWithCustomAnalysis.custom_analysis_result;
    }

    // Otherwise return the original AI result
    return analysis.analysis_result;
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  const draftAnalyses = analyses.filter(a => a.status === 'draft');
  const submittedAnalyses = analyses.filter(a => a.status === 'submitted' || a.status === 'reviewed');

  return (
    <AuthGuard allowedRoles={['student', 'teacher']}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Film className="h-8 w-8 text-blue-600" />
                Script Analyzer
              </h1>
              <p className="mt-2 text-gray-600">
                Upload and analyze your scripts with AI-powered agent
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {analyses.length} Total Scripts
              </Badge>
              <Badge variant="outline" className="text-sm bg-green-50 text-green-700">
                {submittedAnalyses.length} Submitted
              </Badge>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'submissions')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">
                <Sparkles className="h-4 w-4 mr-2" />
                New Analysis
              </TabsTrigger>
              <TabsTrigger value="submissions">
                <Eye className="h-4 w-4 mr-2" />
                My Submissions ({submittedAnalyses.length})
              </TabsTrigger>
            </TabsList>

            {/* NEW ANALYSIS TAB */}
            <TabsContent value="new" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - New Analysis */}
                <div className="lg:col-span-1">
                  <Card className="border-2 border-dashed border-gray-200 hover:border-blue-300 transition-colors">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                        New Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="title">Script Title</Label>
                        <Input
                          id="title"
                          value={scriptTitle}
                          onChange={(e) => setScriptTitle(e.target.value)}
                          placeholder="Enter script title"
                          className="mt-1"
                          disabled={analyzing || isUploading}
                        />
                      </div>

                      <div>
                        <Label htmlFor="scriptType">Type of Script</Label>
                        <select
                          id="scriptType"
                          value={scriptType}
                          onChange={e => setScriptType(e.target.value)}
                          className="mt-1 w-full border rounded px-2 py-2 text-gray-900"
                          disabled={analyzing || isUploading}
                        >
                          {SCRIPT_TYPES.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label>Upload Script File</Label>
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.docx,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={analyzing || isUploading}
                          />
                          <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                            disabled={analyzing || isUploading}
                          >
                            {isUploading ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            {isUploading ? 'Uploading...' : 'Choose File'}
                          </Button>
                          <p className="text-xs text-gray-500 mt-1">
                            Supports PDF file (Max 10MB)
                          </p>
                          {uploadProgress > 0 && (
                            <div className="mt-2">
                              <Progress value={uploadProgress} className="h-2" />
                              <p className="text-xs text-gray-500 mt-1">
                                {isUploading ? `Uploading... ${uploadProgress}%` : 'Upload complete!'}
                              </p>
                            </div>
                          )}
                          {scriptUrl && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                              <FileUp className="h-3 w-3" />
                              <span>File uploaded successfully</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(scriptUrl, '_blank')}
                                className="h-auto p-0 text-blue-600 hover:text-blue-800"
                              >
                                <Link className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {analysisProgress && (
                        <Alert className="bg-blue-50 border-blue-200">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <AlertDescription>
                            <div className="space-y-2">
                              <p className="text-blue-800">{analysisProgress.message}</p>
                              <Progress value={analysisProgress.progress} className="h-2" />
                              <div className="text-xs text-blue-600">
                                Progress: {analysisProgress.progress}%
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button
                        onClick={processScriptAnalysis}
                        disabled={analyzing || isUploading || !scriptTitle.trim() || !scriptUrl}
                        className="w-full"
                      >
                        {analyzing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        {analyzing ? 'Processing...' : 'Analyze Script'}
                      </Button>
                    </CardContent>
                  </Card>

                </div>

                {/* Right Panel - Analysis Results */}
                <div className="lg:col-span-2">
                  {selectedAnalysis && selectedAnalysis.status === 'draft' ? (
                    <div className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span>{selectedAnalysis.title} - Analysis</span>
                              {selectedAnalysis.script_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(selectedAnalysis.script_url, '_blank')}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Link className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {selectedAnalysis.analysis_result && (
                                <>
                                  <Button
                                    onClick={() => setDraftResultModalOpen(true)}
                                    variant="outline"
                                    className="bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200"
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Result
                                  </Button>
                                  <Button
                                    onClick={() => handleSubmitForReview(selectedAnalysis)}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                  >
                                    <Send className="h-4 w-4 mr-2" />
                                    Submit for Review
                                  </Button>
                                </>
                              )}
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <Bell className="h-5 w-5 text-blue-600" />
                            <AlertDescription>
                              <div className="space-y-3">
                                <div>
                                  <p className="text-blue-900 font-semibold">
                                    Ready to Submit!
                                  </p>
                                  <p className="text-blue-800 text-sm mt-1">
                                    Your script has been analyzed and is ready for teacher review.
                                    Click "Submit for Review" to send it to your teachers.
                                    You'll receive notifications on your dashboard when they provide feedback.
                                  </p>
                                </div>
                                <Button
                                  onClick={() => setDraftResultModalOpen(true)}
                                  variant="outline"
                                  className="w-full bg-white hover:bg-gray-50"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Analysis Result
                                </Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <Card className="h-96 flex items-center justify-center">
                      <div className="text-center">
                        <Film className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-medium text-gray-900 mb-2">
                          No Script Selected
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Upload a new script or select a draft to view analysis.
                        </p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* MY SUBMISSIONS TAB */}
            <TabsContent value="submissions" className="space-y-6">
              {submittedAnalyses.length === 0 ? (
                <Card className="p-12">
                  <div className="text-center">
                    <Film className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No Submissions Yet
                    </h3>
                    <p className="text-gray-600">
                      Analyze a script and submit it for teacher review.
                    </p>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-6">
                  {submittedAnalyses.map((analysis) => {
                    const reviewedCount = analysis.script_reviews?.filter(r => r.reviewed_at)?.length || 0;
                    const totalReviews = analysis.script_reviews?.length || 0;
                    const showAIResult = hasAnyTeacherShownAI(analysis.script_reviews || []);

                    return (
                      <Card key={analysis.id} className="border-2">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">{analysis.title}</h3>
                                {getStatusBadge(analysis)}
                                {analysis.script_url && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(analysis.script_url, '_blank')}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Link className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  Submitted: {analysis.submitted_at && format(new Date(analysis.submitted_at), 'PPp')}
                                </div>
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Reviews: {reviewedCount}/{totalReviews}
                                </div>
                              </div>
                            </div>
                            {showAIResult && getAnalysisToDisplay(analysis) && (
                              <Button
                                onClick={() => {
                                  setSelectedAnalysis(analysis);
                                  setDraftResultModalOpen(true);
                                }}
                                variant="outline"
                                className="ml-4 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border-purple-200"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View AI Result
                              </Button>
                            )}
                          </div>

                          {/* Teacher Reviews */}
                          {analysis.script_reviews && analysis.script_reviews.length > 0 && (
                            <div className="space-y-3 mb-4">
                              <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Teacher Feedback
                              </h4>
                              {analysis.script_reviews
                                .filter(review => review.reviewed_at)
                                .map((review) => (
                                  <div key={review.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Award className="h-4 w-4 text-blue-600" />
                                        <span className="font-medium text-blue-900">
                                          {review.teacher.full_name}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                          {review.class.name}
                                        </Badge>
                                      </div>
                                      <span className="text-xs text-gray-600">
                                        {review.reviewed_at && format(new Date(review.reviewed_at), 'PPp')}
                                      </span>
                                    </div>
                                    {review.feedback && (
                                      <p className="text-sm text-gray-700 mt-2 italic">
                                        "{review.feedback}"
                                      </p>
                                    )}
                                  </div>
                                ))}

                              {reviewedCount === 0 && (
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 text-center">
                                  <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                                  <p className="text-sm text-yellow-800">
                                    Your script is under review by {totalReviews} teacher{totalReviews !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}



                          {!showAIResult && reviewedCount > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 text-center">
                              <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                AI analysis results are hidden by your teachers
                              </p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Submit Confirmation Dialog */}
        <Dialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Script for Review?</DialogTitle>
              <DialogDescription>
                Your script "{scriptToSubmit?.title}" will be sent to all teachers in your classes for review.
                You won't be able to edit or delete it after submission.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitConfirmOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={confirmSubmitForReview} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Draft Analysis Result Modal */}
        {/* Submit Confirmation Dialog */}
        <Dialog open={submitConfirmOpen} onOpenChange={setSubmitConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit Script for Review?</DialogTitle>
              <DialogDescription>
                Your script "{scriptToSubmit?.title}" will be sent to all teachers in your classes for review.
                You won't be able to edit or delete it after submission.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSubmitConfirmOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={confirmSubmitForReview} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Draft Analysis Result Modal */}
        <Dialog open={draftResultModalOpen} onOpenChange={setDraftResultModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                AI Analysis Result - {selectedAnalysis?.title}
                {selectedAnalysis && selectedAnalysis.script_reviews?.some(r => r.show_ai_result && r.custom_analysis_result) && (
                  <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                    <Award className="h-3 w-3 mr-1" />
                    Teacher Customized
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Comprehensive AI-powered analysis of your script
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 pr-4 max-h-[calc(90vh-180px)] overflow-y-auto">
              {selectedAnalysis && (
                <ScriptAnalysisDisplay
                  analysisResult={getAnalysisToDisplay(selectedAnalysis)}
                  type={selectedAnalysis.type}
                />
              )}
            </ScrollArea>
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setDraftResultModalOpen(false)}>
                Close
              </Button>
              {selectedAnalysis && selectedAnalysis.status === 'draft' && (
                <Button
                  onClick={() => {
                    setDraftResultModalOpen(false);
                    handleSubmitForReview(selectedAnalysis);
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Review
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}

export default ScriptAnalyzer