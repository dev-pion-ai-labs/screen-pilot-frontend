
import { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  FileText,
  Upload,
  Send,
  Loader2,
  Bot,
  User,
  Paperclip,
  Download,
  Star
} from 'lucide-react';

interface Analysis {
  id: string;
  script_content: string;
  analysis_result: any;
  created_at: string;
  script_url?: string;
}

interface Message {
  id: number;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  isError?: boolean;
  isFile?: boolean;
  fileName?: string;
  fileSize?: number;
}

export default function ScriptAnalyzerPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: Message = {
      id: 1,
      type: 'agent',
      content: `Welcome to the Script Analyzer! 📝

I can help you analyze your scripts and provide detailed feedback on:
• Structure and formatting
• Character development
• Dialogue quality
• Pacing and flow
• Industry standards compliance

Upload a script file or paste your content to get started.`,
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
    fetchAnalyses();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchAnalyses = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('script_analyses')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching analyses:', error);
    }
  };

  const saveScript = async (content: string, fileName?: string): Promise<string | null> => {
    if (!profile) return null;

    try {
      const timestamp = new Date().toISOString();
      const scriptFileName = fileName || `script_${timestamp.replace(/[:.]/g, '-')}.txt`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('scripts')
        .upload(`${profile.id}/${scriptFileName}`, content, {
          contentType: 'text/plain',
          upsert: false
        });

      if (error) throw error;
      
      return data.path;
    } catch (error) {
      console.error('Error saving script:', error);
      toast({
        title: "Error",
        description: "Failed to save script",
        variant: "destructive"
      });
      return null;
    }
  };

  const saveAnalysis = async (scriptContent: string, analysisResult: any, scriptUrl?: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('script_analyses')
        .insert({
          user_id: profile.id,
          script_content: scriptContent,
          analysis_result: analysisResult,
          script_url: scriptUrl
        });

      if (error) throw error;
      await fetchAnalyses();
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  };

  const analyzeScript = async (content: string, fileName?: string) => {
    setIsLoading(true);

    try {
      // Save script to storage first
      const scriptUrl = await saveScript(content, fileName);

      // Simulate AI analysis (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysisResult = {
        overall_score: Math.floor(Math.random() * 30) + 70,
        strengths: [
          "Strong character development",
          "Engaging dialogue",
          "Clear story structure"
        ],
        improvements: [
          "Consider tightening the second act",
          "Some scenes could benefit from more visual description",
          "Character motivations could be clearer"
        ],
        technical_notes: [
          "Proper screenplay format maintained",
          "Good use of action lines",
          "Appropriate scene transitions"
        ]
      };

      // Save analysis
      await saveAnalysis(content, analysisResult, scriptUrl);

      const analysisMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: `✅ **Script Analysis Complete**

**Overall Score: ${analysisResult.overall_score}/100**

**Strengths:**
${analysisResult.strengths.map(s => `• ${s}`).join('\n')}

**Areas for Improvement:**
${analysisResult.improvements.map(i => `• ${i}`).join('\n')}

**Technical Notes:**
${analysisResult.technical_notes.map(n => `• ${n}`).join('\n')}

Your script has been saved and analyzed. Feel free to ask specific questions about any aspect of your script!`,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, analysisMessage]);
      
      toast({
        title: "Analysis Complete",
        description: "Your script has been analyzed and saved",
      });

    } catch (error) {
      console.error('Error analyzing script:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: 'agent',
        content: 'Sorry, I encountered an error while analyzing your script. Please try again.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');

    // Check if this is a script to analyze
    if (inputMessage.length > 100 && inputMessage.includes('FADE IN')) {
      await analyzeScript(inputMessage);
    } else {
      // Regular conversation
      setIsLoading(true);
      setTimeout(() => {
        const agentMessage: Message = {
          id: Date.now() + 1,
          type: 'agent',
          content: `I understand you want to discuss: "${inputMessage}". Please upload a script file or paste script content for detailed analysis. I can help with formatting, structure, character development, and industry standards.`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, agentMessage]);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx', '.fountain'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a script file (.txt, .pdf, .doc, .docx, .fountain)",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size should be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    try {
      const text = await file.text();

      const uploadMessage: Message = {
        id: Date.now(),
        type: 'user',
        content: `Uploaded script: ${file.name}`,
        timestamp: new Date(),
        isFile: true,
        fileName: file.name,
        fileSize: file.size,
      };

      setMessages(prev => [...prev, uploadMessage]);
      
      // Auto-analyze the uploaded script
      await analyzeScript(text, file.name);

    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Error",
        description: "Error reading file. Please try again.",
        variant: "destructive"
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AuthGuard allowedRoles={['student']}>
      <ModernDashboardLayout>
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Sidebar - Analysis History */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Script History
                </CardTitle>
                <CardDescription>
                  Your previous analyses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-20rem)]">
                  <div className="space-y-3">
                    {analyses.map((analysis) => (
                      <div key={analysis.id} className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Script Analysis</span>
                          <Badge variant="outline" className="text-xs">
                            {analysis.analysis_result?.overall_score || 'N/A'}/100
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                    {analyses.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-8">
                        No analyses yet. Upload a script to get started!
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="col-span-9">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Script Analyzer AI
                </CardTitle>
                <CardDescription>
                  Upload your script for detailed analysis and feedback
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4 max-w-4xl">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.type === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.type === 'agent' && (
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.isError
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-gray-100'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          {message.isFile && (
                            <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                              <FileText className="h-3 w-3" />
                              {message.fileName} ({Math.round((message.fileSize || 0) / 1024)}KB)
                            </div>
                          )}
                          <div className="text-xs opacity-60 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing your script...
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Textarea
                        placeholder="Paste your script here or ask questions about script analysis..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="resize-none pr-12"
                        rows={3}
                        disabled={isLoading}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute right-2 bottom-2 h-8 w-8"
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="h-12 w-12 rounded-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.doc,.docx,.fountain"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>📝 Upload script files or paste content for analysis</span>
                    <span>Max 10MB</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
