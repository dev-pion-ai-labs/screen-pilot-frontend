
import { JSX } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Send,
  Bot,
  User,
  Upload,
  FileText,
  Loader2,
  Plus,
  MessageCircle,
  CheckCircle,
  Paperclip,
  ArrowUp,
  Menu,
  Brain,
  Trophy,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

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
  id: number;
  type: "user" | "agent";
  content: string;
  timestamp: Date;
  isError?: boolean;
  isQuiz?: boolean;
  quizData?: QuizData;
}

interface Task {
  id: string;
  title: string;
  timestamp: Date;
  status: "active" | "completed";
  messageCount: number;
  quizScore?: string;
}

interface QuizAnswers {
  [questionId: number]: string;
}

const RELEVANCE_CONFIG = {
  agent: {
    endpoint: "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
    authorization:
      "5cc7752400a6-4648-b47b-04fc92b47cae:sk-ZGE1MzAyMzctYTkxZS00NzA4LTk5NDctOWI1Nzc0ZmIzMTY4",
    agent_id: "f57ea786-ad54-4fe5-9d9c-b78b701ad6a1",
  },
  tools: {
    generateQuizSummary: {
      endpoint:
        "https://api-d7b62b.stack.tryrelevance.com/latest/studios/a92496c4-9407-4fb8-afa2-dabb8ea75b0f/trigger_webhook",
      authorization:
        "5cc7752400a6-4648-b47b-04fc92b47cae:sk-NjUyNTcyMmQtOGE5Mi00NGY1LWEwMDktNTRkNmE3MjNmN2Ri",
    },
    tool2: {
      endpoint:
        "https://api-d7b62b.stack.tryrelevance.com/latest/studios/9b24ea5f-1799-40e7-9062-9456a6f9bfc3/trigger_webhook",
      authorization:
        "5cc7752400a6-4648-b47b-04fc92b47cae:sk-ZDE2YzIwY2EtODA3Yy00YzQyLTkzOTYtOTRlNjVkMzczNTdm",
    },
    tool3: {
      endpoint:
        "https://api-d7b62b.stack.tryrelevance.com/latest/studios/a92496c4-9407-4fb8-afa2-dabb8ea75b0f/trigger_webhook",
      authorization:
        "5cc7752400a6-4648-b47b-04fc92b47cae:sk-NzMzOGZhZTktMTRhOC00M2IxLWI5NTQtODcxZGVlNDgyNTU3",
    },
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
          const optionMatch = line.match(/^-\s*([A-D]\).*)/);
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
          const optionMatch = line.match(/^\s*-\s*([A-D]\).*)/);
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

const formatText = (text: string): JSX.Element => {
  const parts = text.split(/(\*\*.*?\*\*)/);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={index} className="font-semibold text-gray-900">
              {boldText}
            </strong>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

interface QuizRendererProps {
  quizData: QuizData;
  onAnswerSubmit?: (answers: QuizAnswers) => void;
}

const QuizRenderer: React.FC<QuizRendererProps> = ({
  quizData,
  onAnswerSubmit,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<QuizAnswers>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleAnswerSelect = (questionId: number, answer: string): void => {
    if (submitted) return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = (): void => {
    setSubmitted(true);
    onAnswerSubmit?.(selectedAnswers);
  };

  const getTotalQuestions = (): number => {
    return quizData.questions?.length || 0;
  };

  const getAnsweredQuestions = (): number => {
    return Object.keys(selectedAnswers).length;
  };

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No quiz questions found. Please try asking for a quiz again.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">
                Interactive Quiz
              </h3>
              <p className="text-sm text-purple-600">
                {getTotalQuestions()} Questions • Answer all to submit
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-purple-700">
              Progress: {getAnsweredQuestions()}/{getTotalQuestions()}
            </div>
            <div className="w-24 bg-purple-200 rounded-full h-2 mt-1">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    (getAnsweredQuestions() / getTotalQuestions()) * 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {quizData.questions.map((q) => (
        <Card
          key={q.id}
          className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm font-semibold text-purple-700">
                  {q.id}
                </span>
              </div>
              <div className="flex-1">
                <CardTitle className="text-base font-medium text-gray-900 leading-relaxed">
                  {formatText(q.question)}
                </CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {q.options.map((option, index) => {
                const optionLetter = option.charAt(0);
                const optionText = option.substring(3).trim();
                const isSelected = selectedAnswers[q.id] === optionLetter;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(q.id, optionLetter)}
                    disabled={submitted}
                    className={cn(
                      "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                      "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
                      isSelected
                        ? "bg-purple-50 border-purple-300 shadow-sm"
                        : "border-gray-200 hover:border-gray-300",
                      submitted && "cursor-not-allowed opacity-75"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-colors flex-shrink-0 mt-0.5",
                          isSelected
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "border-gray-300 text-gray-600 hover:border-purple-300"
                        )}
                      >
                        {optionLetter}
                      </div>
                      <div className="text-sm text-gray-800 flex-1 leading-relaxed">
                        {formatText(optionText)}
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {!submitted && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleSubmit}
            disabled={getAnsweredQuestions() !== getTotalQuestions()}
            className={cn(
              "bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-base font-medium",
              getAnsweredQuestions() === getTotalQuestions()
                ? "shadow-lg hover:shadow-xl"
                : "opacity-50 cursor-not-allowed"
            )}
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Submit Quiz ({getAnsweredQuestions()}/{getTotalQuestions()})
          </Button>
        </div>
      )}

      {submitted && (
        <div className="text-center py-6 bg-green-50 rounded-lg border border-green-200">
          <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Quiz Submitted!
          </h3>
          <p className="text-green-600">
            Your answers have been recorded. Great work!
          </p>
        </div>
      )}
    </div>
  );
};

export default function QuizPage(): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const welcomeMessage: Message = {
      id: 1,
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

    const initialTasks: Task[] = [
      {
        id: "greeting",
        title: "Welcome Quiz",
        timestamp: new Date(Date.now() - 3600000),
        status: "completed",
        messageCount: 1,
        quizScore: "Welcome",
      },
      {
        id: "film-quiz",
        title: "Film Studies Quiz",
        timestamp: new Date(Date.now() - 28800000),
        status: "completed",
        messageCount: 8,
        quizScore: "8/10",
      },
    ];

    setMessages([welcomeMessage]);
    setTasks(initialTasks);
    setActiveTask("greeting");
  }, []);

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
              } else if (
                update.output.output &&
                typeof update.output.output === "string"
              ) {
                content = update.output.output;
              } else if (
                update.output.result &&
                typeof update.output.result === "string"
              ) {
                content = update.output.result;
              } else {
                console.log("Received quiz response:", update.output);

                if (update.output.answer) {
                  content = String(update.output.answer);
                } else if (update.output.prompt) {
                  content = String(update.output.prompt);
                } else if (update.output.result) {
                  content = String(update.output.result);
                } else {
                  content = `Quiz Response:\n${JSON.stringify(
                    update.output,
                    null,
                    2
                  )}`;
                }
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
  const createNewTask = (): void => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: "New Quiz",
      timestamp: new Date(),
      status: "active",
      messageCount: 0,
    };

    setTasks((prev) => [newTask, ...prev]);
    setActiveTask(newTask.id);
    setMessages([]);
    setConversationId(null);
    setInputMessage("");
  };

  const handleQuizAnswerSubmit = (answers: QuizAnswers): void => {
    console.log("Quiz answers submitted:", answers);

    const resultMessage: Message = {
      id: Date.now(),
      type: "agent",
      content: `Quiz completed! 🎉\n\nYour answers have been submitted:\n${Object.entries(
        answers
      )
        .map(([qId, answer]) => `Question ${qId}: ${answer}`)
        .join(
          "\n"
        )}\n\nGreat work! Ask me for another quiz or topic to continue learning.`,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, resultMessage]);
  };

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const agentResponse = await callRelevanceAgent(
        inputMessage,
        conversationId
      );

      if (agentResponse.job_info) {
        const result = await pollAgentResponse(agentResponse.job_info);

        if (result.success) {
          let messageContent: string;
          if (typeof result.content === "string") {
            messageContent = result.content;
          } else if (
            typeof result.content === "object" &&
            result.content !== null
          ) {
            messageContent = JSON.stringify(result.content, null, 2);
          } else {
            messageContent = String(
              result.content || "Quiz generated successfully."
            );
          }

          const agentMessage: Message = {
            id: Date.now() + 1,
            type: "agent",
            content: messageContent,
            timestamp: new Date(),
            isQuiz:
              result.isQuiz || inputMessage.toLowerCase().includes("quiz"),
            quizData: result.quizData,
          };

          setMessages((prev) => [...prev, agentMessage]);
          setConversationId(result.conversationId);
        } else {
          const errorMessage: Message = {
            id: Date.now() + 1,
            type: "agent",
            content: String(
              result.error || "An error occurred while generating quiz."
            ),
            timestamp: new Date(),
            isError: true,
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "agent",
        content:
          "I'm sorry, but I encountered an error while generating your quiz. Please try again.",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}m`;
    return "now";
  };

  return (
    <AuthGuard allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="flex h-[calc(100vh-4rem)] bg-gray-50">
          {/* Sidebar */}
          <div
            className={cn(
              "bg-white border-r transition-all duration-300",
              sidebarOpen ? "w-72" : "w-0 overflow-hidden"
            )}
          >
            <div className="p-4 border-b">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Quizzy</h3>
                  <p className="text-sm text-gray-500">Quiz Master</p>
                </div>
              </div>

              <Button
                onClick={createNewTask}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Quiz
              </Button>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">All Quizzes</span>
                <Badge variant="secondary">{tasks.length}</Badge>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-600">Completed</span>
                <Badge variant="secondary">
                  {tasks.filter((t) => t.status === "completed").length}
                </Badge>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Recent
                </h4>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => setActiveTask(task.id)}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer border",
                      activeTask === task.id
                        ? "bg-purple-50 border-purple-200"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {task.status === "completed" ? (
                        <Trophy className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <Target className="h-4 w-4 text-purple-500" />
                      )}
                      <span className="text-sm font-medium">{task.title}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(task.timestamp)}
                      </span>
                      {task.quizScore && (
                        <Badge variant="outline" className="text-xs">
                          {task.quizScore}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Chat */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Link to="/student/dashboard">
                  <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-lg font-semibold">Interactive Quiz</h1>
                  <p className="text-sm text-gray-600">
                    Test your knowledge with AI-powered quizzes
                  </p>
                </div>
              </div>
            </div>

            {/* Agent Info */}
            <div className="p-4 bg-purple-50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-medium">Quizzy, the Quiz Master</h2>
                  <p className="text-sm text-gray-600">
                    Generates custom quizzes, tracks performance, and provides
                    detailed analytics for your learning journey.
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-3xl mx-auto space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.type === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type === "agent" && (
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Brain className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg p-3",
                        message.type === "user"
                          ? "bg-purple-600 text-white ml-12"
                          : message.isError
                          ? "bg-red-50 border border-red-200"
                          : "bg-white border"
                      )}
                    >
                      <div className="whitespace-pre-wrap text-sm">
                        {message.isQuiz && message.quizData?.questions ? (
                          <div>
                            <div className="mb-4 font-medium text-purple-700">
                              📝 Quiz Ready! Answer the questions below:
                            </div>
                            <QuizRenderer
                              quizData={message.quizData}
                              onAnswerSubmit={handleQuizAnswerSubmit}
                            />
                          </div>
                        ) : (
                          message.content
                        )}
                      </div>
                      {message.isQuiz && !message.quizData?.questions && (
                        <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                          <Trophy className="h-3 w-3" />
                          Quiz Generated
                        </div>
                      )}
                      <div className="text-xs opacity-60 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {message.type === "user" && (
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating quiz...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t p-4 bg-white">
              <div className="max-w-3xl mx-auto">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Ask Quizzy to create a quiz on any topic..."
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="resize-none border-gray-300 focus:border-purple-500 pr-12"
                      rows={3}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="h-12 w-12 rounded-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                  <span>🧠 Ask for quiz on any subject</span>
                  <span>Help</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
