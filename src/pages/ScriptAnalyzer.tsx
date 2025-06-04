
import { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Star,
  Plus,
  Trash2,
  Eye,
  Calendar,
  MessageSquare
} from 'lucide-react';

interface ScriptAnalysis {
  id: string;
  title: string;
  script_content: string | null;
  script_url: string | null;
  analysis_result: any;
  chat_messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
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
  const [analyses, setAnalyses] = useState<ScriptAnalysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<ScriptAnalysis | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      fetchAnalyses();
    }
  }, [profile]);

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
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      const processedAnalyses = data?.map(analysis => ({
        ...analysis,
        chat_messages: Array.isArray(analysis.chat_messages) ? analysis.chat_messages : []
      })) || [];
      
      setAnalyses(processedAnalyses);
      
      // If no current analysis is selected and we have analyses, select the first one
      if (!currentAnalysis && processedAnalyses.length > 0) {
        loadAnalysis(processedAnalyses[0]);
      }
    } catch (error) {
      console.error('Error fetching analyses:', error);
    }
  };

  const loadAnalysis = (analysis: ScriptAnalysis) => {
    setCurrentAnalysis(analysis);
    setMessages(analysis.chat_messages || []);
  };

  const createNewAnalysis = async () => {
    if (!profile || !newChatTitle.trim()) return;

    try {
      const { data, error } = await supabase
        .from('script_analyses')
        .insert({
          user_id: profile.id,
          title: newChatTitle.trim(),
          chat_messages: []
        })
        .select()
        .single();

      if (error) throw error;

      const newAnalysis: ScriptAnalysis = {
        ...data,
        chat_messages: []
      };

      setAnalyses(prev => [newAnalysis, ...prev]);
      setCurrentAnalysis(newAnalysis);
      setMessages([]);
      setShowNewChatDialog(false);
      setNewChatTitle('');

      toast({
        title: "New Chat Created",
        description: "Your new script analysis chat is ready",
      });
    } catch (error) {
      console.error('Error creating analysis:', error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive"
      });
    }
  };

  const saveScript = async (content: string, fileName?: string): Promise<string | null> => {
    if (!profile) return null;

    try {
      const timestamp = new Date().toISOString();
      const scriptFileName = fileName || `script_${timestamp.replace(/[:.]/g, '-')}.txt`;
      
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

  const updateAnalysisMessages = async (newMessages: ChatMessage[]) => {
    if (!currentAnalysis) return;

    try {
      const { error } = await supabase
        .from('script_analyses')
        .update({
          chat_messages: newMessages,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAnalysis.id);

      if (error) throw error;

      // Update local state
      setCurrentAnalysis(prev => prev ? { ...prev, chat_messages: newMessages } : null);
      setAnalyses(prev => prev.map(analysis => 
        analysis.id === currentAnalysis.id 
          ? { ...analysis, chat_messages: newMessages, updated_at: new Date().toISOString() }
          : analysis
      ));
    } catch (error) {
      console.error('Error updating messages:', error);
    }
  };

  const analyzeScript = async (content: string, fileName?: string) => {
    if (!currentAnalysis) return;

    setIsLoading(true);

    try {
      const scriptUrl = await saveScript(content, fileName);

      // Simulate AI analysis (replace with actual AI service call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysisResult = {
        overall_score: Math.floor(Math.random() * 30) + 70,
        strengths: [
          "Strong character development and authentic dialogue",
          "Engaging story structure with clear three-act progression",
          "Visual storytelling techniques effectively employed"
        ],
        improvements: [
          "Consider tightening pacing in the second act",
          "Some scenes could benefit from more specific visual descriptions",
          "Character motivations could be clearer in key moments"
        ],
        technical_notes: [
          "Proper screenplay format maintained throughout",
          "Good use of action lines and scene descriptions",
          "Appropriate scene transitions and formatting"
        ],
        genre_analysis: "Drama/Thriller",
        estimated_runtime: "95-105 minutes",
        target_audience: "Young Adult to Adult"
      };

      // Update the analysis record with the result
      const { error: updateError } = await supabase
        .from('script_analyses')
        .update({
          script_content: content,
          script_url: scriptUrl,
          analysis_result: analysisResult
        })
        .eq('id', currentAnalysis.id);

      if (updateError) throw updateError;

      const analysisMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: `✅ **Script Analysis Complete**

**Overall Score: ${analysisResult.overall_score}/100** ⭐

**📈 Strengths:**
${analysisResult.strengths.map(s => `• ${s}`).join('\n')}

**🎯 Areas for Improvement:**
${analysisResult.improvements.map(i => `• ${i}`).join('\n')}

**🔧 Technical Notes:**
${analysisResult.technical_notes.map(n => `• ${n}`).join('\n')}

**📊 Analysis Details:**
• **Genre:** ${analysisResult.genre_analysis}
• **Estimated Runtime:** ${analysisResult.estimated_runtime}
• **Target Audience:** ${analysisResult.target_audience}

Your script has been analyzed and saved. Feel free to ask specific questions about any aspect of your script or request focused feedback on particular scenes!`,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, analysisMessage];
      setMessages(updatedMessages);
      await updateAnalysisMessages(updatedMessages);
      
      toast({
        title: "Analysis Complete",
        description: "Your script has been analyzed and saved",
      });

    } catch (error) {
      console.error('Error analyzing script:', error);
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'agent',
        content: 'Sorry, I encountered an error while analyzing your script. Please try again.',
        timestamp: new Date(),
        isError: true,
      };
      const updatedMessages = [...messages, errorMessage];
      setMessages(updatedMessages);
      await updateAnalysisMessages(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentAnalysis) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputMessage('');

    // Check if this is a script to analyze
    if (inputMessage.length > 100 && (inputMessage.includes('FADE IN') || inputMessage.includes('INT.') || inputMessage.includes('EXT.'))) {
      await analyzeScript(inputMessage);
    } else {
      // Regular conversation
      setIsLoading(true);
      setTimeout(async () => {
        const agentMessage: ChatMessage = {
          id: Date.now() + 1,
          type: 'agent',
          content: `I understand you want to discuss: "${inputMessage}". 

I can help you with:
📝 **Script Analysis** - Upload or paste your script for detailed feedback
🎭 **Character Development** - Discuss character arcs and motivations  
📖 **Story Structure** - Review plot progression and pacing
🎬 **Industry Standards** - Ensure your script meets professional formatting
✍️ **Dialogue Improvement** - Enhance character voices and conversations

Please upload a script file or paste script content for detailed analysis, or ask me specific questions about screenwriting techniques!`,
          timestamp: new Date(),
        };
        const finalMessages = [...updatedMessages, agentMessage];
        setMessages(finalMessages);
        await updateAnalysisMessages(finalMessages);
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentAnalysis) return;

    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx', '.fountain', '.fdx'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a script file (.txt, .pdf, .doc, .docx, .fountain, .fdx)",
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

      const uploadMessage: ChatMessage = {
        id: Date.now(),
        type: 'user',
        content: `📎 Uploaded script: ${file.name}`,
        timestamp: new Date(),
        isFile: true,
        fileName: file.name,
        fileSize: file.size,
      };

      const updatedMessages = [...messages, uploadMessage];
      setMessages(updatedMessages);
      await updateAnalysisMessages(updatedMessages);
      
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

  const deleteAnalysis = async (analysisId: string) => {
    try {
      const { error } = await supabase
        .from('script_analyses')
        .delete()
        .eq('id', analysisId);

      if (error) throw error;

      setAnalyses(prev => prev.filter(a => a.id !== analysisId));
      
      if (currentAnalysis?.id === analysisId) {
        const remainingAnalyses = analyses.filter(a => a.id !== analysisId);
        if (remainingAnalyses.length > 0) {
          loadAnalysis(remainingAnalyses[0]);
        } else {
          setCurrentAnalysis(null);
          setMessages([]);
        }
      }

      toast({
        title: "Analysis Deleted",
        description: "Script analysis has been removed",
      });
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to delete analysis",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  // Initialize with welcome message if no current analysis
  useEffect(() => {
    if (!currentAnalysis && analyses.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 1,
        type: 'agent',
        content: `Welcome to the Script Analyzer! 📝

I can help you analyze your scripts and provide detailed feedback on:
• **Structure and formatting** - Ensure industry-standard screenplay format
• **Character development** - Strengthen character arcs and motivations
• **Dialogue quality** - Improve character voices and conversations
• **Pacing and flow** - Optimize story rhythm and scene transitions
• **Industry standards compliance** - Meet professional requirements

**Getting Started:**
1. Create a new chat session for your script
2. Upload a script file or paste your content
3. Get detailed analysis and ask follow-up questions

Ready to improve your screenwriting? Let's get started! 🎬`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [currentAnalysis, analyses]);

  return (
    <AuthGuard allowedRoles={['student']}>
      <ModernDashboardLayout>
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
          {/* Left Sidebar - Analysis History */}
          <div className="col-span-3">
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Script Sessions
                    </CardTitle>
                    <CardDescription>
                      Your analysis history
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => setShowNewChatDialog(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showNewChatDialog && (
                  <div className="mb-4 p-3 border rounded-lg bg-gray-50">
                    <Input
                      placeholder="Enter chat title..."
                      value={newChatTitle}
                      onChange={(e) => setNewChatTitle(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && createNewAnalysis()}
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={createNewAnalysis} disabled={!newChatTitle.trim()}>
                        Create
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNewChatDialog(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  <div className="space-y-3">
                    {analyses.map((analysis) => (
                      <div 
                        key={analysis.id} 
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          currentAnalysis?.id === analysis.id 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => loadAnalysis(analysis)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium block truncate">
                              {analysis.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <MessageSquare className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">
                                {analysis.chat_messages?.length || 0} messages
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {analysis.analysis_result?.overall_score && (
                              <Badge variant="outline" className="text-xs">
                                {analysis.analysis_result.overall_score}/100
                              </Badge>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAnalysis(analysis.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {formatTimeAgo(analysis.updated_at)}
                        </div>
                      </div>
                    ))}
                    {analyses.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 mb-3">
                          No script analyses yet
                        </p>
                        <Button size="sm" onClick={() => setShowNewChatDialog(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Start Analysis
                        </Button>
                      </div>
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
                  {currentAnalysis && (
                    <Badge variant="outline" className="ml-2">
                      {currentAnalysis.title}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {currentAnalysis 
                    ? "Upload your script for detailed analysis and feedback"
                    : "Create a new chat session to start analyzing your scripts"
                  }
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
                {currentAnalysis ? (
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
                      accept=".txt,.pdf,.doc,.docx,.fountain,.fdx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>📝 Upload script files (.txt, .pdf, .doc, .docx, .fountain, .fdx) or paste content</span>
                      <span>Max 10MB</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-t p-4 text-center">
                    <p className="text-gray-500 mb-3">
                      Create a new chat session to start analyzing your scripts
                    </p>
                    <Button onClick={() => setShowNewChatDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Script Analysis
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
