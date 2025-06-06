import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/DashboardLayout';
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
import { 
  FileText, 
  Upload, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare,
  Film,
  Sparkles,
  Download,
  Save,
  RefreshCw
} from 'lucide-react';
import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ScriptAnalysis {
  id: string
  title: string
  script_content: string
  script_url?: string
  analysis_result: any
  chat_messages: any // Changed from ChatMessage[] to any to match Json type
  created_at: string
  updated_at: string
}

const ScriptAnalyzer = () => {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<ScriptAnalysis[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<ScriptAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [scriptContent, setScriptContent] = useState('')
  const [scriptTitle, setScriptTitle] = useState('')
  const [chatInput, setChatInput] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (user) {
      fetchAnalyses()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [selectedAnalysis?.chat_messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      let extractedText = ''
      
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ')
          extractedText += pageText + '\n'
        }
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        extractedText = result.value
      } else if (file.type === 'text/plain') {
        extractedText = await file.text()
      } else {
        throw new Error('Unsupported file type. Please upload PDF, Word, or text files.')
      }

      setScriptContent(extractedText)
      setScriptTitle(file.name.replace(/\.[^/.]+$/, ''))
      
      toast({
        title: "File uploaded successfully",
        description: `Extracted ${extractedText.length} characters from ${file.name}`
      })
    } catch (error) {
      console.error('Error processing file:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process file",
        variant: "destructive"
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const analyzeScript = async () => {
    if (!scriptContent.trim() || !scriptTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both script content and title",
        variant: "destructive"
      })
      return
    }

    setAnalyzing(true)
    try {
      // Save the script analysis to database first
      const { data: analysisData, error: dbError } = await supabase
        .from('script_analyses')
        .insert([
          {
            user_id: user?.id,
            title: scriptTitle,
            script_content: scriptContent,
            analysis_result: null,
            chat_messages: []
          }
        ])
        .select()
        .single()

      if (dbError) throw dbError

      // Call the AI analysis function (placeholder for now)
      const analysisResult = {
        summary: "Script analysis completed",
        themes: ["Character development", "Plot structure", "Dialogue"],
        suggestions: ["Consider strengthening the second act", "Develop supporting characters"],
        timestamp: new Date().toISOString()
      }

      // Update with analysis result
      const { error: updateError } = await supabase
        .from('script_analyses')
        .update({ analysis_result: analysisResult })
        .eq('id', analysisData.id)

      if (updateError) throw updateError

      toast({
        title: "Analysis Complete",
        description: "Your script has been analyzed successfully"
      })

      // Refresh the analyses list
      await fetchAnalyses()
      
      // Select the new analysis
      setSelectedAnalysis({ ...analysisData, analysis_result: analysisResult })
      
      // Clear the input form
      setScriptContent('')
      setScriptTitle('')

    } catch (error) {
      console.error('Error analyzing script:', error)
      toast({
        title: "Error",
        description: "Failed to analyze script",
        variant: "destructive"
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedAnalysis) return

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    }

    // Add user message to chat
    const currentMessages = Array.isArray(selectedAnalysis.chat_messages) 
      ? selectedAnalysis.chat_messages 
      : []
    
    const updatedMessages = [...currentMessages, newMessage]

    setChatLoading(true)
    setChatInput('')

    try {
      // Simulate AI response (replace with actual AI call)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Thank you for your question about the script. This is a simulated response based on the analysis.`,
        timestamp: new Date()
      }

      const finalMessages = [...updatedMessages, aiResponse]

      // Update the database with new messages
      const { error } = await supabase
        .from('script_analyses')
        .update({ 
          chat_messages: finalMessages as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedAnalysis.id)

      if (error) throw error

      // Update local state
      setSelectedAnalysis({
        ...selectedAnalysis,
        chat_messages: finalMessages as any
      })

      // Refresh analyses to update the message count
      await fetchAnalyses()

    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      })
    } finally {
      setChatLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard allowedRoles={['student', 'teacher']}>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={['student', 'teacher']}>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Film className="h-8 w-8 text-blue-600" />
                Script Analyzer
              </h1>
              <p className="mt-2 text-gray-600">
                Upload and analyze your scripts with AI-powered insights
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel - New Analysis */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
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
                    />
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
                      />
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        Supports PDF, DOCX, and TXT files
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="content">Or Paste Script Content</Label>
                    <Textarea
                      id="content"
                      value={scriptContent}
                      onChange={(e) => setScriptContent(e.target.value)}
                      placeholder="Paste your script content here..."
                      className="min-h-32"
                    />
                  </div>

                  <Button
                    onClick={analyzeScript}
                    disabled={analyzing || !scriptContent.trim() || !scriptTitle.trim()}
                    className="w-full"
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    {analyzing ? 'Analyzing...' : 'Analyze Script'}
                  </Button>
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
                  <div className="space-y-2">
                    {analyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        onClick={() => setSelectedAnalysis(analysis)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedAnalysis?.id === analysis.id
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-sm">{analysis.title}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {Array.isArray(analysis.chat_messages) ? analysis.chat_messages.length : 0} messages
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {analyses.length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        No analyses yet. Upload a script to get started.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Analysis Results & Chat */}
            <div className="lg:col-span-2">
              {selectedAnalysis ? (
                <div className="space-y-6">
                  {/* Analysis Results */}
                  {selectedAnalysis.analysis_result && (
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedAnalysis.title} - Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Summary</h4>
                          <p className="text-gray-700">
                            {selectedAnalysis.analysis_result.summary}
                          </p>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-2">Key Themes</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedAnalysis.analysis_result.themes?.map((theme: string, index: number) => (
                              <Badge key={index} variant="secondary">{theme}</Badge>
                            ))}
                          </div>
                        </div>

                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-2">Suggestions</h4>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {selectedAnalysis.analysis_result.suggestions?.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Chat Interface */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Script Discussion
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 w-full border rounded p-4 mb-4">
                        <div className="space-y-4">
                          {Array.isArray(selectedAnalysis.chat_messages) && selectedAnalysis.chat_messages.map((message: any) => (
                            <div
                              key={message.id}
                              className={`flex gap-2 ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-900'
                                }`}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {message.role === 'user' ? (
                                    <User className="h-4 w-4" />
                                  ) : (
                                    <Bot className="h-4 w-4" />
                                  )}
                                  <span className="text-xs opacity-75">
                                    {new Date(message.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-sm">{message.content}</p>
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-gray-100 rounded-lg p-3">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>
                      
                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask questions about your script..."
                          onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                          disabled={chatLoading}
                        />
                        <Button
                          onClick={sendChatMessage}
                          disabled={chatLoading || !chatInput.trim()}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Film className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Script Selected
                    </h3>
                    <p className="text-gray-600">
                      Upload a new script or select a previous analysis to get started.
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}

export default ScriptAnalyzer
