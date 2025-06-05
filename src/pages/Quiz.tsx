import { JSX } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Bot,
  User,
  Loader2,
  ArrowUp,
  Menu,
  Brain,
  Sparkles,
  Zap,
  Plus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { useQuizChats } from "@/hooks/useQuizChats";
import { QuizRenderer } from "@/components/QuizRenderer";
import { QuizSidebar } from "@/components/QuizSidebar";
import { toast } from "sonner";

// Types
interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: string;
}

interface QuizData {
  questions?: QuizQuestion[];
  score?: number;
  totalQuestions?: number;
  topics?: string[];
  results?: any[];
}

interface Message {
  id: string;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  isError?: boolean;
  isQuiz?: boolean;
  quizData?: QuizData;
}

interface QuizAnswers {
  [questionId: number]: string;
}

// Relevance API Configuration
const RELEVANCE_CONFIG = {
  agent: {
    endpoint: "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
    authorization:
      "5cc7752400a6-4648-b47b-04fc92b47cae:sk-ZGE1MzAyMzctYTkxZS00NzA4LTk5NDctOWI1Nzc0ZmIzMTY4",
    agent_id: "f57ea786-ad54-4fe5-9d9c-b78b701ad6a1",
  },
  region: "d7b62b",
  project: "5cc7752400a6-4648-b47b-04fc92b47cae",
};

const parseQuizContent = (content: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];

  // Split content by question markers
  const questionPattern = /(?:^|\n)(?:###\s*)?Question\s+(\d+):\s*\*?\*?(.*?)\*?\*?\s*\n((?:[A-D]\)[^\n]*\n?)*)/gm;
  let match;

  while ((match = questionPattern.exec(content)) !== null) {
    const questionNumber = parseInt(match[1]);
    const questionText = match[2].trim();
    const optionsText = match[3].trim();

    // Extract options
    const optionPattern = /([A-D])\)\s*([^\n]+)/g;
    const options: string[] = [];
    let optionMatch;

    while ((optionMatch = optionPattern.exec(optionsText)) !== null) {
      options.push(`${optionMatch[1]}) ${optionMatch[2].trim()}`);
    }

    if (questionText && options.length >= 2) {
      questions.push({
        id: questionNumber,
        question: questionText,
        options: options,
      });
    }
  }

  // Fallback: If the above pattern doesn't work, try alternative parsing
  if (questions.length === 0) {
    const lines = content.split('\n').filter(line => line.trim());
    let currentQuestion: Partial<QuizQuestion> | null = null;
    let questionCounter = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if it's a question line
      if (trimmedLine.match(/^(?:###\s*)?Question\s+\d+:/i) || 
          (trimmedLine.includes('**') && trimmedLine.includes('?'))) {
        
        // Save previous question if exists
        if (currentQuestion && currentQuestion.question && currentQuestion.options && currentQuestion.options.length >= 2) {
          questions.push({
            id: currentQuestion.id || questionCounter,
            question: currentQuestion.question,
            options: currentQuestion.options,
          });
          questionCounter++;
        }

        // Start new question
        const questionText = trimmedLine
          .replace(/^(?:###\s*)?Question\s+\d+:\s*/i, '')
          .replace(/\*\*/g, '')
          .trim();
        
        currentQuestion = {
          id: questionCounter,
          question: questionText,
          options: [],
        };
      }
      // Check if it's an option line
      else if (trimmedLine.match(/^[A-D]\)/)) {
        if (currentQuestion) {
          if (!currentQuestion.options) currentQuestion.options = [];
          currentQuestion.options.push(trimmedLine);
        }
      }
    }

    // Add the last question
    if (currentQuestion && currentQuestion.question && currentQuestion.options && currentQuestion.options.length >= 2) {
      questions.push({
        id: currentQuestion.id || questionCounter,
        question: currentQuestion.question,
        options: currentQuestion.options,
      });
    }
  }

  return questions;
};

const extractAnswersFromUserInput = (input: string): { [key: number]: string } => {
  const answers: { [key: number]: string } = {};
  
  // Pattern to match answers like "1B", "2C", etc.
  const answerPattern = /(\d+)([A-D])/g;
  let match;
  
  while ((match = answerPattern.exec(input)) !== null) {
    const questionNumber = parseInt(match[1]);
    const answer = match[2];
    answers[questionNumber] = answer;
  }
  
  return answers;
};

const calculateScore = (userAnswers: { [key: number]: string }, correctAnswers: { [key: number]: string }): number => {
  let correct = 0;
  const total = Object.keys(correctAnswers).length;
  
  for (const questionId in correctAnswers) {
    if (userAnswers[parseInt(questionId)] === correctAnswers[parseInt(questionId)]) {
      correct++;
    }
  }
  
  return Math.round((correct / total) * 100);
};

export default function QuizPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [currentQuizData, setCurrentQuizData] = useState<QuizData | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    chats,
    messages: dbMessages,
    currentChatId,
    createNewChat,
    saveMessage,
    updateChatProgress,
    loadChat,
    deleteChat,
    setLoading,
  } = useQuizChats();

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages from database when chat changes
  useEffect(() => {
    if (dbMessages.length > 0) {
      const formattedMessages: Message[] = dbMessages.map((msg) => ({
        id: msg.id,
        type: msg.role === "user" ? "user" : "agent",
        content: msg.content,
        timestamp: new Date(msg.created_at),
        isQuiz: msg.message_type === "quiz",
        quizData: msg.quiz_data,
      }));
      setMessages(formattedMessages);

      // Find the latest quiz data
      const latestQuiz = dbMessages
        .filter(msg => msg.message_type === "quiz" && msg.quiz_data)
        .pop();
      
      if (latestQuiz && latestQuiz.quiz_data) {
        setCurrentQuizData(latestQuiz.quiz_data as QuizData);
      }
    } else if (currentChatId) {
      setMessages([]);
      setCurrentQuizData(null);
    }
  }, [dbMessages, currentChatId]);

  // API Functions
  const callRelevanceAgent = async (
    message: string,
    conversationId: string | null = null
  ): Promise<any> => {
    const payload: any = {
      message: { role: "user", content: message },
      agent_id: RELEVANCE_CONFIG.agent.agent_id,
    };

    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    const response = await fetch(RELEVANCE_CONFIG.agent.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: RELEVANCE_CONFIG.agent.authorization,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  const pollAgentResponse = async (jobInfo: any): Promise<any> => {
    const maxAttempts = 20;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `https://api-${RELEVANCE_CONFIG.region}.stack.tryrelevance.com/latest/studios/${jobInfo.studio_id}/async_poll/${jobInfo.job_id}`,
          {
            headers: {
              Authorization: RELEVANCE_CONFIG.agent.authorization,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status}`);
        }

        const status = await response.json();

        for (const update of status.updates || []) {
          if (update.type === "chain-success") {
            let content = "Quiz generated successfully.";
            let isQuiz = false;
            let quizData: QuizData | undefined = undefined;

            if (update.output) {
              if (update.output.output && update.output.output.answer) {
                content = update.output.output.answer;
              } else if (
                update.output.answer &&
                typeof update.output.answer === "string"
              ) {
                content = update.output.answer;
              } else if (typeof update.output === "string") {
                content = update.output;
              } else {
                content = String(update.output.answer || update.output.result || update.output);
              }
            }

            content = String(content);

            if (
              content.includes("Question 1:") ||
              content.includes("**Question 1:**") ||
              (content.includes("Question") &&
                content.includes("A)") &&
                content.includes("B)"))
            ) {
              isQuiz = true;
              const questions = parseQuizContent(content);
              if (questions.length > 0) {
                quizData = { questions };
              }
            }

            return {
              success: true,
              content: content,
              conversationId: jobInfo.conversation_id,
              isQuiz,
              quizData,
            };
          }
          if (update.type === "chain-error") {
            return {
              success: false,
              error: update.error || "An error occurred while generating quiz.",
            };
          }
        }

        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    return {
      success: false,
      error: "Quiz generation timed out. Please try again.",
    };
  };

  // Handlers
  const handleCreateNewChat = async (): Promise<void> => {
    const chat = await createNewChat();
    if (chat) {
      setMessages([]);
      setConversationId(null);
      setInputMessage("");
      setCurrentQuizData(null);
    }
  };

  const handleLoadChat = async (chatId: string): Promise<void> => {
    await loadChat(chatId);
  };

  const handleDeleteChat = async (chatId: string): Promise<void> => {
    await deleteChat(chatId);
  };

  const handleQuizAnswerSubmit = async (answers: QuizAnswers): Promise<void> => {
    console.log("Quiz answers submitted:", answers);

    const totalQuestions = Object.keys(answers).length;
    const resultMessage = `Quiz completed! 🎉\n\nYour answers have been submitted:\n${Object.entries(
      answers
    )
      .map(([qId, answer]) => `Question ${qId}: ${answer}`)
      .join(
        "\n"
      )}\n\nGreat work! Ask me for another quiz or topic to continue learning.`;

    // Save the result message
    await saveMessage("assistant", resultMessage, "result");

    // Update chat progress
    await updateChatProgress(totalQuestions, totalQuestions, 0);

    // Clear current quiz data to allow new quiz
    setCurrentQuizData(null);

    toast.success("Quiz completed successfully!");
  };

  const handleQuizProgress = async (progress: { completed: number; total: number }): Promise<void> => {
    await updateChatProgress(progress.total, progress.completed, 0);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || isLoading) return;

    // Create new chat if none exists
    if (!currentChatId) {
      const newChat = await createNewChat();
      if (!newChat) {
        toast.error("Failed to create new chat session");
        return;
      }
    }

    const userMessageContent = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Save user message
      console.log("Saving user message:", userMessageContent);
      await saveMessage("user", userMessageContent);

      // Check if this is an answer submission to a quiz
      const extractedAnswers = extractAnswersFromUserInput(userMessageContent);
      const isAnswerSubmission = Object.keys(extractedAnswers).length > 0 && currentQuizData?.questions;

      if (isAnswerSubmission && currentQuizData?.questions) {
        const totalQuestions = currentQuizData.questions.length;
        const submittedAnswers = Object.keys(extractedAnswers).length;
        
        // Create a feedback message
        let feedbackMessage = `Great! You've submitted your answers.\n\n`;
        feedbackMessage += `**Your Answers:**\n`;
        
        currentQuizData.questions.forEach((question) => {
          const userAnswer = extractedAnswers[question.id];
          if (userAnswer) {
            feedbackMessage += `Question ${question.id}: ${userAnswer}\n`;
          }
        });
        
        feedbackMessage += `\nYou answered ${submittedAnswers} out of ${totalQuestions} questions.\n`;
        feedbackMessage += `\nThank you for completing the quiz! Feel free to ask for another quiz on any topic.`;

        // Save the feedback message
        await saveMessage("assistant", feedbackMessage, "result");

        // Update chat progress
        await updateChatProgress(totalQuestions, submittedAnswers, 0, "Quiz Completed");
        
        // Clear current quiz data
        setCurrentQuizData(null);
        
        toast.success("Quiz answers submitted successfully!");
      } else {
        // Regular message - send to AI agent
        const agentResponse = await callRelevanceAgent(
          userMessageContent,
          conversationId
        );

        if (agentResponse.job_info) {
          const result = await pollAgentResponse(agentResponse.job_info);

          if (result.success) {
            let messageContent = String(result.content || "Quiz generated successfully.");

            // Determine if this is a quiz
            const isQuiz = result.isQuiz || userMessageContent.toLowerCase().includes("quiz");
            const messageType = isQuiz ? "quiz" : "text";

            // Parse quiz content if it's a quiz
            let quizData: QuizData | undefined = undefined;
            if (isQuiz) {
              const questions = parseQuizContent(messageContent);
              if (questions.length > 0) {
                quizData = { questions };
                setCurrentQuizData(quizData);
              }
            }

            // Save agent message
            console.log("Saving agent message:", messageContent);
            await saveMessage("assistant", messageContent, messageType, quizData);

            setConversationId(result.conversationId);

            // Extract topic if this is a quiz
            if (isQuiz && quizData?.questions) {
              const topic = userMessageContent.toLowerCase().includes("quiz on")
                ? userMessageContent.split("quiz on")[1]?.trim()
                : userMessageContent.toLowerCase().includes("on")
                ? userMessageContent.split("on")[1]?.trim()
                : "General Knowledge";

              await updateChatProgress(
                quizData.questions.length,
                0,
                0,
                topic
              );
            }
          } else {
            await saveMessage("assistant", String(result.error || "An error occurred while generating quiz."), "text");
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      await saveMessage("assistant", "I'm sorry, but I encountered an error while processing your request. Please try again.", "text");
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
          {/* Sidebar */}
          <div
            className={cn(
              "bg-white border-r transition-all duration-300 shadow-sm",
              sidebarOpen ? "w-80" : "w-0 overflow-hidden"
            )}
          >
            <QuizSidebar
              chats={chats}
              activeChat={currentChatId}
              onCreateNew={handleCreateNewChat}
              onLoadChat={handleLoadChat}
              onDeleteChat={handleDeleteChat}
            />
          </div>

          {/* Main Chat */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="hover:bg-gray-100"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Link to="/student/dashboard">
                  <Button variant="outline" size="icon" className="hover:bg-gray-50">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex-1">
                  <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Interactive Quiz with Quizzy
                  </h1>
                  <p className="text-sm text-gray-600">
                    Test your knowledge with AI-powered quizzes and track your progress
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-600">AI Powered</span>
                </div>
              </div>
            </div>

            {/* Agent Info */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-purple-900">Quizzy, the Quiz Master</h2>
                  <p className="text-sm text-purple-700">
                    Generates custom quizzes, tracks performance, and provides detailed analytics for your learning journey.
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.length === 0 && !currentChatId && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to start your quiz journey?</h3>
                    <p className="text-gray-600 mb-4">Create a new quiz session and ask me to create a quiz on any topic you'd like to study!</p>
                    <Button 
                      onClick={handleCreateNewChat}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Start New Quiz Session
                    </Button>
                  </div>
                )}

                {messages.length === 0 && currentChatId && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to start your quiz journey?</h3>
                    <p className="text-gray-600 mb-4">Ask me to create a quiz on any topic you'd like to study!</p>
                    <div className="flex flex-wrap justify-center gap-2 text-sm">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">🧠 Film Studies</span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full">📚 Literature</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full">🔬 Science</span>
                      <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full">🎭 Screenwriting</span>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4",
                      message.type === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type === "agent" && (
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Brain className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl p-4 shadow-sm",
                        message.type === "user"
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-12"
                          : message.isError
                            ? "bg-red-50 border border-red-200 text-red-800"
                            : "bg-white border border-gray-200"
                      )}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.isQuiz && message.quizData?.questions ? (
                          <div>
                            <div className="mb-4 font-medium text-purple-700 flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Quiz Ready! Answer the questions below:
                            </div>
                            <QuizRenderer
                              quizData={message.quizData}
                              onAnswerSubmit={handleQuizAnswerSubmit}
                              onProgress={handleQuizProgress}
                            />
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      <div className={cn(
                        "text-xs mt-2 opacity-70",
                        message.type === "user" ? "text-purple-100" : "text-gray-500"
                      )}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {message.type === "user" && (
                      <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                        <User className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Quizzy is processing your request...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4 bg-white shadow-sm">
              <div className="max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder={
                        currentQuizData?.questions 
                          ? "Submit your answers (e.g., 1B, 2C, 3A, 4D, 5B)..." 
                          : "Ask Quizzy to create a quiz on any topic..."
                      }
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl pr-12"
                      rows={2}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="h-14 w-14 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ArrowUp className="h-5 w-5" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    {currentQuizData?.questions ? (
                      <span>📝 Submit answers in format: 1B, 2C, 3A...</span>
                    ) : (
                      <>
                        <span>🧠 Ask for quiz on any subject</span>
                        <span>📊 Track your progress</span>
                      </>
                    )}
                  </div>
                  <span>Press Enter to send</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
