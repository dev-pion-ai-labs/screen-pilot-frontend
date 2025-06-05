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

  const questionBlocks = content
    .split(/---+/)
    .filter(
      (block) =>
        block.trim() &&
        (block.includes("Question") || block.includes("**Question"))
    );

  if (questionBlocks.length > 0) {
    questionBlocks.forEach((block, index) => {
      const lines = block
        .trim()
        .split("\n")
        .filter((line) => line.trim());

      let questionText = "";
      let questionTitle = "";
      let options: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.includes("**Question") && line.includes(":**")) {
          questionTitle = line;
          continue;
        }

        if (
          questionTitle &&
          !questionText &&
          line &&
          !line.match(/^-\s*[A-D]\)/) &&
          !line.includes("**Question") &&
          line.length > 10
        ) {
          questionText = line;
          continue;
        }

        if (line.match(/^-\s*[A-D]\)/)) {
          const optionMatch = line.match(/^-\s*([A-D]\).*/);
          if (optionMatch) {
            options.push(optionMatch[1]);
          }
        }
      }

      if (questionText && options.length >= 2) {
        questions.push({
          id: index + 1,
          question: questionText,
          options: options,
        });
      }
    });
  } else {
    const numberedQuestionPattern = /^\d+\.\s*\*\*Question \d+:/;
    const hasNumberedQuestions = content
      .split("\n")
      .some((line) => numberedQuestionPattern.test(line.trim()));

    if (hasNumberedQuestions) {
      const lines = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      let currentQuestion: Partial<QuizQuestion> | null = null;
      let questionId = 1;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (numberedQuestionPattern.test(line)) {
          if (
            currentQuestion &&
            currentQuestion.question &&
            currentQuestion.options
          ) {
            questions.push({
              id: currentQuestion.id || questionId - 1,
              question: currentQuestion.question,
              options: currentQuestion.options,
            });
          }

          currentQuestion = { id: questionId++, options: [] };
          continue;
        }

        if (
          currentQuestion &&
          !currentQuestion.question &&
          line &&
          !line.match(/^\s*-\s*[A-D]\)/) &&
          !line.includes("**Question") &&
          !line.match(/^\d+\./) &&
          line.length > 10
        ) {
          currentQuestion.question = line;
          continue;
        }

        if (currentQuestion && line.match(/^\s*-\s*[A-D]\)/)) {
          currentQuestion.options = currentQuestion.options || [];
          const optionMatch = line.match(/^\s*-\s*([A-D]\).*/);
          if (optionMatch) {
            currentQuestion.options.push(optionMatch[1]);
          }
        }
      }

      if (
        currentQuestion &&
        currentQuestion.question &&
        currentQuestion.options
      ) {
        questions.push({
          id: currentQuestion.id || questionId - 1,
          question: currentQuestion.question,
          options: currentQuestion.options,
        });
      }
    } else {
      const lines = content.split("\n");
      let currentQuestion: Partial<QuizQuestion> | null = null;
      let questionId = 1;

      for (const line of lines) {
        const trimmedLine = line.trim();

        if (
          trimmedLine.match(/\*\*Question \d+.*\*\*/) ||
          trimmedLine.match(/Question \d+:/)
        ) {
          if (
            currentQuestion &&
            currentQuestion.question &&
            currentQuestion.options
          ) {
            questions.push({
              id: questionId - 1,
              question: currentQuestion.question,
              options: currentQuestion.options,
            });
          }
          currentQuestion = { id: questionId++, options: [] };
          continue;
        }

        if (
          currentQuestion &&
          !currentQuestion.question &&
          trimmedLine &&
          !trimmedLine.match(/^[A-D]\)/) &&
          !trimmedLine.includes("Question") &&
          trimmedLine.length > 10
        ) {
          currentQuestion.question = trimmedLine;
          continue;
        }

        if (currentQuestion && trimmedLine.match(/^[A-D]\)/)) {
          currentQuestion.options = currentQuestion.options || [];
          currentQuestion.options.push(trimmedLine);
        }
      }

      if (
        currentQuestion &&
        currentQuestion.question &&
        currentQuestion.options
      ) {
        questions.push({
          id: questionId - 1,
          question: currentQuestion.question,
          options: currentQuestion.options,
        });
      }
    }
  }

  return questions;
};

export default function QuizPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

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
    } else if (currentChatId) {
      // Show welcome message for new chats
      const welcomeMessage: Message = {
        id: "welcome",
        type: "agent",
        content: `Welcome to Quizzy, the Quiz Master! 🧠✨

I'm your AI-powered quiz companion ready to help you test your knowledge across various subjects. Here's what I can do:

🎯 **Generate Custom Quizzes** - Create quizzes on any topic you want to study
📊 **Track Your Progress** - Monitor your performance and improvement over time  
🎓 **Subject-Specific Tests** - Focused quizzes on screenwriting, direction, film studies, and more
📈 **Performance Analytics** - Detailed feedback on your strengths and areas to improve

**How to get started:**
• Ask me to create a quiz on any topic
• Request a specific number of questions
• Tell me your difficulty preference (beginner, intermediate, advanced)
• Take practice tests for your upcoming exams

What subject would you like to be quizzed on today?`,
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
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

    toast.success("Quiz completed successfully!");
  };

  const handleQuizProgress = async (progress: { completed: number; total: number }): Promise<void> => {
    await updateChatProgress(progress.total, progress.completed, 0);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || isLoading) return;

    // Create new chat if none exists
    if (!currentChatId) {
      await createNewChat();
      return;
    }

    const userMessageContent = inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      // Save user message
      await saveMessage("user", userMessageContent);

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

          // Save agent message
          await saveMessage("assistant", messageContent, messageType, result.quizData);

          setConversationId(result.conversationId);

          // Extract topic if this is a quiz
          if (isQuiz && result.quizData?.questions) {
            const topic = userMessageContent.toLowerCase().includes("quiz on") 
              ? userMessageContent.split("quiz on")[1]?.trim() 
              : "General Knowledge";
            
            await updateChatProgress(
              result.quizData.questions.length,
              0,
              0,
              topic
            );
          }
        } else {
          await saveMessage("assistant", String(result.error || "An error occurred while generating quiz."), "text");
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      await saveMessage("assistant", "I'm sorry, but I encountered an error while generating your quiz. Please try again.", "text");
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
                        <span>Quizzy is generating your quiz...</span>
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
                      placeholder="Ask Quizzy to create a quiz on any topic..."
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
                    <span>🧠 Ask for quiz on any subject</span>
                    <span>📊 Track your progress</span>
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
