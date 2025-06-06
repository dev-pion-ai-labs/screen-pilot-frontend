
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthGuard } from '@/components/AuthGuard';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { ModernDashboardLayout } from '@/components/ModernDashboardLayout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  message: string;
  timestamp: string;
}

export default function Chat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const { data } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', profile?.id)
        .order('timestamp', { ascending: true });

      // Type cast the role to ensure it matches our Message interface
      const typedMessages: Message[] = (data || []).map(msg => ({
        ...msg,
        role: msg.role as 'user' | 'assistant'
      }));

      setMessages(typedMessages);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveMessage = async (role: 'user' | 'assistant', message: string) => {
    try {
      const { data } = await supabase
        .from('chats')
        .insert({
          user_id: profile?.id,
          role,
          message
        })
        .select()
        .single();

      if (data) {
        return {
          ...data,
          role: data.role as 'user' | 'assistant'
        } as Message;
      }
      return null;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  const callRelevanceAI = async (message: string) => {
    // Simulated RelevanceAI call - replace with actual API integration
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        const responses = [
          "I'm here to help you with your script analysis and writing. What specific aspect would you like to work on?",
          "That's a great question! Let me help you improve your script structure and flow.",
          "I can assist you with character development, dialogue, and narrative structure. What's your main focus?",
          "Based on your script, I suggest focusing on clarity and engagement. Would you like specific feedback?",
          "Great work! Here are some suggestions to enhance your script's impact and readability."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        resolve(randomResponse);
      }, 1500);
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    setLoading(true);

    // Save user message
    const savedUserMessage = await saveMessage('user', userMessage);
    if (savedUserMessage) {
      setMessages(prev => [...prev, savedUserMessage]);
    }

    try {
      // Call RelevanceAI (simulated)
      const aiResponse = await callRelevanceAI(userMessage);
      
      // Save AI response
      const savedAiMessage = await saveMessage('assistant', aiResponse);
      if (savedAiMessage) {
        setMessages(prev => [...prev, savedAiMessage]);
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loadingHistory) {
    return (
      <AuthGuard allowedRoles={['student']}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['student']}>
      <ModernDashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">AI Mentor Chat</h1>
            <p className="mt-2 text-gray-600">Get personalized guidance and feedback on your scripts</p>
          </div>

          <Card className="h-[600px] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                    <p className="text-gray-600">Ask me anything about script writing, structure, or get feedback on your work.</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        <p className={`text-xs mt-1 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {message.role === 'user' && (
                        <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm text-gray-600">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            <CardContent className="border-t p-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me about script writing, structure, or upload your work for feedback..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="resize-none"
                  rows={2}
                  disabled={loading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || loading}
                  size="icon"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
