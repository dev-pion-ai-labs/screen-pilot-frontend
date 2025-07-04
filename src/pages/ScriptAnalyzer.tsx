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
  Link
} from 'lucide-react';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import ScriptAnalysisDisplay from '@/components/ScriptAnalysisDisplay';




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

  useEffect(() => {
    if (user) {
      fetchAnalyses()
    }
  }, [user])

  const fetchAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('script_analyses')
        .select('*')
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



  // Async polling for n8n job status (if your n8n workflow returns jobId and needs polling)
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



  // Trigger Agent Analysis with polling
  
  const triggerScriptAnalysis = async (scriptTitle: string, scriptUrl: string, scriptType: string) => {
    try {
      if (!scriptUrl) throw new Error('No script file URL provided to agent.');
      const payload = {
        "Type": scriptType,
        "file_url": scriptUrl
      };
      console.log("payload",payload);
      
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
      // If n8n returns a jobId, poll for result
      if (result.jobId) {
        return await pollN8nJobResult(result.jobId);
      }
      // else assume result is already in response
      return result.result || result.output || result;
    } catch (error) {
      console.error('Agent Trigger Error:', error);
      throw error;
    }
  };




  const uploadFileToSupabase = async (file: File): Promise<string> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('scripts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
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

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
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
      // Upload file to Supabase storage
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
      // Save the script analysis to database first
      const analysisData = {
        user_id: user?.id,
        title: scriptTitle,
        type: scriptType,
        script_content: '', // No content, only file
        script_url: scriptUrl,
        analysis_result: null
      };

      const { data: dbResult, error: dbError } = await supabase
        .from('script_analyses')
        .insert([analysisData])
        .select()
        .single();

      if (dbError) throw new Error(`Database error: ${dbError.message}`);

      setAnalysisProgress({ step: 'processing', progress: 40, message: 'Agent processing script file...' });

      // Trigger the agent with only the script_url
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

      // Save the full agent result as-is
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
        description: "Your script has been analyzed by the AI agent.",
        variant: "default"
      });

      // Refresh the analyses list and select new analysis
      await fetchAnalyses();
      setSelectedAnalysis({ ...dbResult, analysis_result: analysisResult, script_content: '' });

      // Clear the input form
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

  const deleteAnalysis = async (analysisId: string) => {
    try {
      // Get the analysis to check for script_url
      const analysisToDelete = analyses.find(a => a.id === analysisId);

      // Delete from storage if there's a script_url
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

      // Delete from database
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 60) return <AlertCircle className="h-4 w-4 text-yellow-600" />
    return <AlertCircle className="h-4 w-4 text-red-600" />
  }


  if (loading) {
    return (
      <AuthGuard allowedRoles={['student', 'teacher']}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

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
                {analyses.length} Scripts Analyzed
              </Badge>

            </div>
          </div>

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
                  {/* NEW: Script Type Dropdown */}
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

                  <div>
                    <Label htmlFor="content">Or Paste Script Content</Label>
                    <Textarea
                      id="content"
                      value={scriptContent}
                      onChange={(e) => setScriptContent(e.target.value)}
                      placeholder="Paste your script content here... (or will be auto-filled from uploaded PDF)"
                      className="min-h-32 mt-1"
                      disabled={analyzing || isUploading}
                    />
                    {scriptContent && (
                      <p className="text-xs text-gray-500 mt-1">
                        {scriptContent.length} characters
                      </p>
                    )}
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
                    disabled={analyzing || isUploading || !scriptTitle.trim() || (!scriptContent.trim() && !scriptUrl)}
                    className="w-full"
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {analyzing ? 'Processing...' : 'Analyze Script'}
                  </Button>

                  {analyzing && (
                    <div className="text-xs text-blue-600 text-center bg-blue-50 p-2 rounded">
                      AI Agent pipeline: {scriptUrl ? 'PDF Extract → ' : ''}Agent Analysis → Generate Report
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Previous Analyses */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Previous Analyses ({analyses.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {analyses.map((analysis) => (
                        <div
                          key={analysis.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedAnalysis?.id === analysis.id
                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                            : 'hover:bg-gray-50'
                            }`}
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className="flex-1"
                              onClick={() => setSelectedAnalysis(analysis)}
                            >
                              <div className="font-medium text-sm truncate">{analysis.title}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(analysis.created_at).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                {analysis.analysis_result?.overall_score && (
                                  <Badge variant="outline" className="text-xs">
                                    <Star className="h-3 w-3 mr-1" />
                                    {analysis.analysis_result.overall_score}
                                  </Badge>
                                )}
                                {analysis.script_url && (
                                  <Badge variant="outline" className="text-xs">
                                    <Link className="h-3 w-3 mr-1" />
                                    File
                                  </Badge>
                                )}
                                {analysis.analysis_result?.agent_processed && (
                                  <Badge variant="outline" className="text-xs bg-green-50">
                                    AI Agent
                                  </Badge>
                                )}
                                {analysis.analysis_result?.api_fallback && (
                                  <Badge variant="outline" className="text-xs bg-yellow-50">
                                    Fallback
                                  </Badge>
                                )}
                                {analysis.analysis_result?.extracted_content && (
                                  <Badge variant="outline" className="text-xs bg-purple-50">
                                    PDF Extracted
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnalysis(analysis.id);
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {analyses.length === 0 && (
                        <div className="text-center py-8">
                          <Film className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">
                            No analyses yet. Upload a script to get started.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Analysis Results */}
            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <div className="space-y-6">
                  {/* Analysis Results */}
                  {selectedAnalysis.analysis_result && (
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
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                      <ScriptAnalysisDisplay analysisResult={selectedAnalysis.analysis_result} />

                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Film className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      No Script Selected
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload a new script or select a previous analysis to get started.
                    </p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>• Upload PDF file</p>

                      <p>• Get AI-powered agent analysis</p>


                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>


        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}

export default ScriptAnalyzer

