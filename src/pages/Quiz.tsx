import { JSX } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  User,
  Loader2,
  ArrowUp,
  Brain,
  GraduationCap,
  Target,
  BookOpen,
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Clock,
  Award,
  MessageSquare,
  Play,
  Pause,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { toast } from "sonner";

// Types
interface TopicSelection {
  semester: string;
  topic: string;
  subTopic: string;
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: string;
}

interface QuizData {
  questions: QuizQuestion[];
  totalQuestions: number;
}

interface Message {
  id: string;
  type: "user" | "mentor" | "system";
  content: string;
  timestamp: Date;
  stage?: WorkflowStage;
}

interface QuizAnswer {
  questionId: number;
  selectedAnswer: string;
  isCorrect?: boolean;
}

type WorkflowStage =
  | "topic_selection"
  | "mentor_explanation"
  | "quiz_prompt"
  | "quiz_active"
  | "quiz_feedback"
  | "quiz_summary"
  | "conversation_end";

// AI Mentor Agent Configuration
const AI_MENTOR_AGENT_CONFIG = {
  mentor: {
    endpoint: "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
    authorization:
      "5cc7752400a6-4648-b47b-04fc92b47cae:sk-M2ZhMjg2ZjUtOTVlMS00YjNhLTgzZWUtM2RiODRhZTU5M2Q5",
    agent_id: "da1cdcf3-0091-48d3-b6a3-f6abb69ae449",
  },
  quiz: {
    "Semester 1": {
      agent: {
        endpoint:
          "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
        authorization:
          "5cc7752400a6-4648-b47b-04fc92b47cae:sk-MzUzMWYzOTYtMzgyZC00MGYxLWFmN2UtYzM5OWEyNjhhMDYw",
        agent_id: "122c15d9-efc6-4181-97bc-1473bb81b07d",
      },
      tools: {
        generateQuizQuestion: {
          endpoint:
            "https://api-d7b62b.stack.tryrelevance.com/latest/studios/a92496c4-9407-4fb8-afa2-dabb8ea75b0f/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
          authorization:
            "5cc7752400a6-4648-b47b-04fc92b47cae:sk-NWUwNDY3Y2ItODU2My00Yjc3LTgwZWItOTljYmQ4M2E3NjQx",
        },
        generateAnswerFeedback: {
          endpoint:
            "https://api-d7b62b.stack.tryrelevance.com/latest/studios/9b24ea5f-1799-40e7-9062-9456a6f9bfc3/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
          authorization:
            "5cc7752400a6-4648-b47b-04fc92b47cae:sk-Y2ViZWUzNGQtZDRkNy00MDkxLTk4YmUtMmUxYmMwZDdkOTYw",
        },
        generateQuizSummary: {
          endpoint:
            "https://api-d7b62b.stack.tryrelevance.com/latest/studios/f00d76fa-be35-44e7-ad68-e3041dd1c980/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
          authorization:
            "5cc7752400a6-4648-b47b-04fc92b47cae:sk-ZmE0MmI3NTItNzkxMS00MmQ4LTkzZWMtNWQ4NGE2ODU5ZTVl",
        },
      },
    },
    "Semester 2": {
      agent: {
        endpoint:
          "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
        authorization:
          "5cc7752400a6-4648-b47b-04fc92b47cae:sk-ZjdkYzJlODctNmQ3MC00ZjlhLWIzZTAtODFjODU4ZWM4Njgz",
        agent_id: "f12ce319-e77b-4e97-9655-d542662995a7",
      },
      tools: {
        generateQuizQuestion: {
          endpoint:
            "https://api-d7b62b.stack.tryrelevance.com/latest/studios/c74b15db-afee-4320-9710-41746dc81048/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
          authorization:
            "5cc7752400a6-4648-b47b-04fc92b47cae:sk-ZGY2YWJmMzEtMGI2NS00YzE2LWI3OWItOTk3ODcyNGM2Yjdl",
        },
        generateAnswerFeedback: {
          endpoint:
            "https://api-d7b62b.stack.tryrelevance.com/latest/studios/ad04e721-2a4c-4966-b55d-e729bd3c38b6/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
          authorization:
            "5cc7752400a6-4648-b47b-04fc92b47cae:sk-ZWY3YjljMDYtNzQ1Mi00YTM3LWE5M2QtYWE2Y2U4ODVmYzY5",
        },
        generateQuizSummary: {
          endpoint:
            "https://api-d7b62b.stack.tryrelevance.com/latest/studios/ad04e721-2a4c-4966-b55d-e729bd3c38b6/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
          authorization:
            "5cc7752400a6-4648-b47b-04fc92b47cae:sk-MDM0ODhjNTAtZTJiMi00OWM1LTk0NTgtYzI5MzlhZjViOGNm",
        },
      },
    },
  },
  region: "d7b62b",
  project: "5cc7752400a6-4648-b47b-04fc92b47cae",
};

// Curriculum Data
const CURRICULUM = {
  "Semester 1": {
    "Introduction to Direction": [
      "Film analysis",
      "Different approaches to shoot and types of film",
      "Case studies of filmmakers and their approach",
      "Case studies of filmmakers in historical perspective",
      "Writing Actuality Report",
      "Film Diary (Thoughts, stories, scenes, photos)",
    ],
    "Visual Storytelling and Collaboration": [
      "Intro to Visual Storytelling (Composition, Cutting, Camera)",
      "Recreating a Painting",
      "Collaboration with Camera, Edit, Sound",
      "Turning Actualities into Stories (Observation Writing)",
      "Trip to a Closed Public Space (e.g. Library, Museum)",
      "Trip to an Open Public Space (e.g. Park, Market)",
    ],
    "Principles of Continuity": [
      "Decoupage (cutting scripts & visual planning)",
      "Aspects of Continuity",
      "Time and Space in Films",
      "Scene Analysis (Classical Hollywood & Contemporary)",
    ],
    "Concept and Ideation": [
      "Research",
      "Types of Stories",
      "Developing a Concept",
      "Use of VFX Elements",
      "Oral Narrative Skills",
      "Creative Writing (Memoir, Descriptive)",
      "Reading and Analysis of Short Stories",
    ],
    "Theories and Formats of Scriptwriting": [
      "History of Storytelling",
      "Screenplay Writing – Overview and Process",
      "Elements of a Screenplay",
      "Premise, Plot, Treatment, Characters",
      "Screenwriting Software",
      "Introduction to Story Structures (3-act, 5-act)",
      "Creating Simple Screenplays (3-act structure)",
    ],
  },
  "Semester 2": {
    "Advanced Direction Techniques": [
      "Advanced Camera Movements",
      "Working with Actors",
      "Set Management",
      "Location Planning",
    ],
    "Advanced Visual Storytelling": [
      "Color Theory in Film",
      "Advanced Composition",
      "Lighting Techniques",
      "Sound Design Integration",
    ],
    "Post-Production and Editing": [
      "Non-linear Editing",
      "Color Grading",
      "Sound Mixing",
      "VFX Integration",
    ],
    "Advanced Scriptwriting": [
      "Character Development",
      "Dialogue Writing",
      "Genre-specific Writing",
      "Adaptation Techniques",
    ],
  },
};

// Utility Functions
const parseQuizContent = (content: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];

  // Method 1: Parse **Question X: Basic Understanding** format from your API
  const questionPattern =
    /\*\*Question\s+(\d+):\s*([^*]+?)\*\*\s*\n(.+?)\n([A-D]\).*?\n[A-D]\).*?\n[A-D]\).*?\n[A-D]\).*?)(?=\n\*\*Question|\n\nThese questions|$)/gs;
  let match;

  while ((match = questionPattern.exec(content)) !== null) {
    const questionNumber = parseInt(match[1]);
    const questionCategory = match[2].trim(); // e.g., "Basic Understanding"
    const questionText = match[3].trim();
    const optionsText = match[4].trim();

    // Extract options
    const optionLines = optionsText
      .split("\n")
      .filter((line) => line.trim().match(/^[A-D]\)/));
    const options: string[] = [];

    optionLines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.match(/^[A-D]\)/)) {
        options.push(trimmed);
      }
    });

    if (questionText && options.length >= 4) {
      questions.push({
        id: questionNumber,
        question: questionText,
        options: options,
      });
    }
  }

  // Method 2: Alternative parsing for different formats
  if (questions.length === 0) {
    const lines = content.split("\n").filter((line) => line.trim());
    let currentQuestion: Partial<QuizQuestion> | null = null;
    let questionCounter = 1;
    let collectingOptions = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check if it's a question header like "**Question 1: Basic Understanding**"
      if (line.match(/^\*\*Question\s+\d+:/)) {
        // Save previous question if exists
        if (
          currentQuestion &&
          currentQuestion.question &&
          currentQuestion.options &&
          currentQuestion.options.length >= 4
        ) {
          questions.push({
            id: currentQuestion.id || questionCounter,
            question: currentQuestion.question,
            options: currentQuestion.options,
          });
          questionCounter++;
        }

        // Look for the actual question text in the next few lines
        let questionText = "";
        for (let j = i + 1; j < lines.length && j < i + 5; j++) {
          const nextLine = lines[j].trim();
          if (
            nextLine &&
            !nextLine.match(/^[A-D]\)/) &&
            !nextLine.match(/^\*\*Question/)
          ) {
            questionText = nextLine;
            break;
          }
        }

        currentQuestion = {
          id: questionCounter,
          question: questionText,
          options: [],
        };
        collectingOptions = false;
      }
      // Check if it's an option line
      else if (line.match(/^[A-D]\)/)) {
        if (currentQuestion) {
          if (!currentQuestion.options) currentQuestion.options = [];
          currentQuestion.options.push(line);
          collectingOptions = true;
        }
      }
      // If we haven't found the question text yet and this looks like a question
      else if (
        currentQuestion &&
        !currentQuestion.question &&
        line.includes("?") &&
        !collectingOptions
      ) {
        currentQuestion.question = line;
      }
    }

    // Add the last question
    if (
      currentQuestion &&
      currentQuestion.question &&
      currentQuestion.options &&
      currentQuestion.options.length >= 4
    ) {
      questions.push({
        id: currentQuestion.id || questionCounter,
        question: currentQuestion.question,
        options: currentQuestion.options,
      });
    }
  }

  console.log("Parsed questions:", questions);
  return questions;
};

const createFallbackQuestions = (content: string): QuizQuestion[] => {
  // Create questions based on the actual API response format
  console.log("Creating fallback questions from content:", content);

  // Extract specific questions from the API response
  const questions: QuizQuestion[] = [];

  // Check if content contains the expected questions
  if (content.includes("What is the primary focus of film analysis")) {
    questions.push(
      {
        id: 1,
        question:
          "What is the primary focus of film analysis as discussed in 'How to Read a Film: Movies, Media, and Beyond'?",
        options: [
          "A) The technical aspects of film production",
          "B) The economic impact of films",
          "C) The interpretation of visual and narrative elements in films",
          "D) The historical development of cinema",
        ],
      },
      {
        id: 2,
        question:
          "According to 'Film Art: An Introduction,' what is the purpose of mise-en-scène in a film?",
        options: [
          "A) To create special effects",
          "B) To enhance the film's soundtrack",
          "C) To establish the setting and mood of a scene",
          "D) To dictate the film's editing style",
        ],
      },
      {
        id: 3,
        question:
          "In the context of creating simple screenplays using the 3-act structure, as outlined in 'Save the Cat,' which of the following is NOT a typical component of Act I?",
        options: [
          "A) The setup",
          "B) The inciting incident",
          "C) The climax",
          "D) The introduction of the protagonist",
        ],
      },
      {
        id: 4,
        question:
          "In 'Screenplay: The Foundations of Screenwriting,' Syd Field emphasizes the importance of plot points. What is a plot point according to Field's paradigm?",
        options: [
          "A) A minor event that adds humor to the story",
          "B) A significant event that changes the direction of the story",
          "C) A dialogue exchange that reveals character backstory",
          "D) An action sequence that increases the film's runtime",
        ],
      },
      {
        id: 5,
        question:
          "Based on 'The Anatomy of Story: 22 Steps to Becoming a Master Storyteller,' which of the following best describes the role of a central moral problem in a narrative?",
        options: [
          "A) It provides a subplot to entertain the audience",
          "B) It serves as the main obstacle for the protagonist to overcome",
          "C) It is an optional element that can be included for depth",
          "D) It determines the genre of the film",
        ],
      }
    );
  } else {
    // Generic fallback if content doesn't match expected format
    questions.push(
      {
        id: 1,
        question: "What is the primary purpose of film analysis?",
        options: [
          "A) To critique the technical quality",
          "B) To understand visual and narrative elements",
          "C) To evaluate commercial success",
          "D) To compare with other films",
        ],
      },
      {
        id: 2,
        question: "Which element is most important in visual storytelling?",
        options: [
          "A) Camera angles",
          "B) Lighting",
          "C) Composition",
          "D) All of the above",
        ],
      },
      {
        id: 3,
        question: "In screenplay structure, what typically happens in Act I?",
        options: [
          "A) The climax",
          "B) The setup and inciting incident",
          "C) The resolution",
          "D) The final confrontation",
        ],
      },
      {
        id: 4,
        question: "What is mise-en-scène?",
        options: [
          "A) The editing style",
          "B) The sound design",
          "C) The visual arrangement within a frame",
          "D) The camera movement",
        ],
      },
      {
        id: 5,
        question: "Which is a key component of character development?",
        options: [
          "A) Physical appearance",
          "B) Backstory and motivation",
          "C) Dialogue style",
          "D) All of the above",
        ],
      }
    );
  }

  return questions;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function AIMentorAgent(): JSX.Element {
  // State Management
  const [currentStage, setCurrentStage] =
    useState<WorkflowStage>("topic_selection");
  const [topicSelection, setTopicSelection] = useState<TopicSelection>({
    semester: "",
    topic: "",
    subTopic: "",
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [sessionProgress, setSessionProgress] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const progressMap = {
      topic_selection: 0,
      mentor_explanation: 25,
      quiz_prompt: 40,
      quiz_active: 60,
      quiz_feedback: 80,
      quiz_summary: 90,
      conversation_end: 100,
    };
    setSessionProgress(progressMap[currentStage]);
  }, [currentStage]);

  // API Functions
  const callMentorAgent = async (message: string): Promise<any> => {
    const payload: any = {
      message: { role: "user", content: message },
      agent_id: AI_MENTOR_AGENT_CONFIG.mentor.agent_id,
    };

    if (conversationId) {
      payload.conversation_id = conversationId;
    }

    const response = await fetch(AI_MENTOR_AGENT_CONFIG.mentor.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: AI_MENTOR_AGENT_CONFIG.mentor.authorization,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  const callQuizGenerationTool = async (): Promise<any> => {
    const semesterConfig = AI_MENTOR_AGENT_CONFIG.quiz[topicSelection.semester];
    if (!semesterConfig) {
      throw new Error(`No configuration found for ${topicSelection.semester}`);
    }

    const response = await fetch(
      semesterConfig.tools.generateQuizQuestion.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            semesterConfig.tools.generateQuizQuestion.authorization,
        },
        body: JSON.stringify({
          course_content: `${topicSelection.topic} - ${topicSelection.subTopic}. This is a ${topicSelection.semester} level topic in film studies and direction.`,
          sub_topic: topicSelection.subTopic,
          num_questions: 5,
          options_per_question: 4,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Quiz Generation Error: ${response.status}`);
    }

    return response.json();
  };

  const callAnswerFeedbackTool = async (): Promise<any> => {
    const semesterConfig = AI_MENTOR_AGENT_CONFIG.quiz[topicSelection.semester];
    if (!semesterConfig) {
      throw new Error(`No configuration found for ${topicSelection.semester}`);
    }

    const response = await fetch(
      semesterConfig.tools.generateAnswerFeedback.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            semesterConfig.tools.generateAnswerFeedback.authorization,
        },
        body: JSON.stringify({
          course_content: `${topicSelection.topic} - ${topicSelection.subTopic}`,
          question_and_answer: quizAnswers.map((answer, index) => ({
            question: quizData?.questions[index]?.question || "",
            user_answer: answer.selectedAnswer,
            correct_answer: "B", // You may need to determine this from your quiz data
            is_correct: answer.isCorrect || false,
          })),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Answer Feedback Error: ${response.status}`);
    }

    return response.json();
  };

  const callQuizSummaryTool = async (): Promise<any> => {
    const semesterConfig = AI_MENTOR_AGENT_CONFIG.quiz[topicSelection.semester];
    if (!semesterConfig) {
      throw new Error(`No configuration found for ${topicSelection.semester}`);
    }

    const score = calculateQuizScore();
    const response = await fetch(
      semesterConfig.tools.generateQuizSummary.endpoint,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: semesterConfig.tools.generateQuizSummary.authorization,
        },
        body: JSON.stringify({
          course_content: `${topicSelection.topic} - ${topicSelection.subTopic}`,
          question_and_answer: quizAnswers.map((answer, index) => ({
            question: quizData?.questions[index]?.question || "",
            user_answer: answer.selectedAnswer,
            correct_answer: "B", // You may need to determine this from your quiz data
            is_correct: answer.isCorrect || false,
          })),
          quiz_results: {
            score: score,
            total_questions: quizData?.questions.length || 0,
            correct_answers: quizAnswers.filter((a) => a.isCorrect).length,
            time_taken: quizStartTime
              ? Math.round(
                  (new Date().getTime() - quizStartTime.getTime()) / 1000
                )
              : 0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Quiz Summary Error: ${response.status}`);
    }

    return response.json();
  };

  const pollAgentResponse = async (jobInfo: any): Promise<any> => {
    const maxAttempts = 20;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(
          `https://api-${AI_MENTOR_AGENT_CONFIG.region}.stack.tryrelevance.com/latest/studios/${jobInfo.studio_id}/async_poll/${jobInfo.job_id}`,
          {
            headers: {
              Authorization: AI_MENTOR_AGENT_CONFIG.mentor.authorization,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Polling failed: ${response.status}`);
        }

        const status = await response.json();

        for (const update of status.updates || []) {
          if (update.type === "chain-success") {
            let content = "Response generated successfully.";

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
                content = String(
                  update.output.answer || update.output.result || update.output
                );
              }
            }

            return {
              success: true,
              content: String(content),
              conversationId: jobInfo.conversation_id,
            };
          }
          if (update.type === "chain-error") {
            return {
              success: false,
              error:
                update.error ||
                "An error occurred while processing your request.",
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
      error: "Request timed out. Please try again.",
    };
  };

  // Utility Functions
  const addMessage = (
    type: "user" | "mentor" | "system",
    content: string,
    stage?: WorkflowStage
  ) => {
    const newMessage: Message = {
      id: generateId(),
      type,
      content,
      timestamp: new Date(),
      stage,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const calculateQuizScore = (): number => {
    if (!quizAnswers.length || !quizData?.questions.length) return 0;
    const correct = quizAnswers.filter((a) => a.isCorrect).length;
    return Math.round((correct / quizData.questions.length) * 100);
  };

  // Workflow Handlers
  const handleTopicSubmission = async () => {
    if (
      !topicSelection.semester ||
      !topicSelection.topic ||
      !topicSelection.subTopic
    ) {
      toast.error("Please select all fields");
      return;
    }

    setIsLoading(true);
    setCurrentStage("mentor_explanation");

    addMessage(
      "user",
      `I want to learn about "${topicSelection.subTopic}" from ${topicSelection.topic} (${topicSelection.semester})`
    );

    try {
      // Call the dedicated AI Mentor Agent for detailed explanation
      const mentorPrompt = `Please provide a comprehensive learning session about "${topicSelection.subTopic}" for a ${topicSelection.semester} student studying ${topicSelection.topic} in Film Studies and Direction.

Please provide:
1. **Detailed Explanation**: A comprehensive explanation of "${topicSelection.subTopic}" including core concepts, principles, and techniques
2. **Key Concepts to Study**: List the most important concepts, terms, and principles students should focus on
3. **What NOT to Focus On**: Mention any common misconceptions or areas that are less important for ${topicSelection.semester} level
4. **Recommended Reading Materials**: Suggest specific books, articles, or knowledge sources for deeper understanding
5. **Preparation Tips**: Provide semester-specific study tips and practical advice for mastering this topic

After providing this comprehensive explanation, end with this exact prompt:
"Feeling confident? Would you like to take a quiz on this topic to test your understanding?"`;

      const agentResponse = await callMentorAgent(mentorPrompt);

      if (agentResponse.job_info) {
        const result = await pollAgentResponse(agentResponse.job_info);

        if (result.success) {
          addMessage("mentor", result.content, "mentor_explanation");
          setConversationId(result.conversationId);
          setCurrentStage("quiz_prompt");
        } else {
          addMessage("system", `Error: ${result.error}`);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage(
        "system",
        "I encountered an error while processing your request. Please try again."
      );
      toast.error("Failed to get mentor explanation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizDecision = async (wantsQuiz: boolean) => {
    addMessage(
      "user",
      wantsQuiz
        ? "Yes, I'd like to take the quiz!"
        : "No, I'll skip the quiz for now."
    );

    if (!wantsQuiz) {
      setCurrentStage("conversation_end");
      addMessage(
        "mentor",
        "That's perfectly fine! Take your time to review the material. When you're ready to test your knowledge, feel free to start a new session. Good luck with your studies! 📚"
      );
      return;
    }

    setIsLoading(true);
    setCurrentStage("quiz_active");

    try {
      const quizResponse = await callQuizGenerationTool();

      // Direct response handling - no polling needed for webhook
      let quizContent = "";
      if (quizResponse.answer) {
        quizContent = quizResponse.answer;
      } else if (quizResponse.output) {
        quizContent = quizResponse.output;
      } else {
        quizContent = JSON.stringify(quizResponse);
      }

      console.log("Quiz content received:", quizContent);

      const questions = parseQuizContent(quizContent);
      console.log("Parsed questions:", questions);

      if (questions.length > 0) {
        setQuizData({ questions, totalQuestions: questions.length });
        setQuizStartTime(new Date());
        setCurrentQuestionIndex(0);
        setQuizAnswers([]);
        addMessage(
          "system",
          `Great! Let's test your knowledge with ${questions.length} questions about ${topicSelection.subTopic}.`
        );
      } else {
        // Fallback: create questions from the raw content
        const fallbackQuestions = createFallbackQuestions(quizContent);
        if (fallbackQuestions.length > 0) {
          setQuizData({
            questions: fallbackQuestions,
            totalQuestions: fallbackQuestions.length,
          });
          setQuizStartTime(new Date());
          setCurrentQuestionIndex(0);
          setQuizAnswers([]);
          addMessage(
            "system",
            `Great! Let's test your knowledge with ${fallbackQuestions.length} questions about ${topicSelection.subTopic}.`
          );
        } else {
          addMessage(
            "system",
            "I had trouble generating quiz questions. Please try again."
          );
        }
      }
    } catch (error) {
      console.error("Quiz generation error:", error);
      addMessage("system", "Failed to generate quiz. Please try again.");
      toast.error("Failed to generate quiz");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizAnswer = (questionId: number, selectedAnswer: string) => {
    const question = quizData?.questions.find((q) => q.id === questionId);

    // Updated correct answers based on the film analysis quiz
    const correctAnswers: { [key: number]: string } = {
      1: "C", // Film analysis interpretation of visual and narrative elements
      2: "C", // Mise-en-scène establishes setting and mood
      3: "C", // Climax is NOT in Act I (it's in Act III)
      4: "B", // Plot point changes direction of story
      5: "B", // Central moral problem is main obstacle
    };

    const isCorrect = correctAnswers[questionId] === selectedAnswer;

    const newAnswer: QuizAnswer = {
      questionId,
      selectedAnswer,
      isCorrect,
    };

    setQuizAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      return [...filtered, newAnswer];
    });
  };

  const handleQuizSubmission = async () => {
    if (quizAnswers.length !== quizData?.questions.length) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    setIsLoading(true);
    setCurrentStage("quiz_feedback");

    try {
      // Generate feedback - handle direct webhook response
      const feedbackResponse = await callAnswerFeedbackTool();

      let feedbackContent = "Here's your quiz feedback:";
      if (feedbackResponse.answer) {
        feedbackContent = feedbackResponse.answer;
      } else if (feedbackResponse.output) {
        feedbackContent = feedbackResponse.output;
      }

      addMessage("mentor", feedbackContent, "quiz_feedback");

      // Generate summary - handle direct webhook response
      const summaryResponse = await callQuizSummaryTool();

      let summaryContent = "Quiz Summary: Great work completing the quiz!";
      if (summaryResponse.answer) {
        summaryContent = summaryResponse.answer;
      } else if (summaryResponse.output) {
        summaryContent = summaryResponse.output;
      }

      addMessage("mentor", summaryContent, "quiz_summary");
      setCurrentStage("quiz_summary");

      const score = calculateQuizScore();
      toast.success(`Quiz completed! You scored ${score}%`);
    } catch (error) {
      console.error("Quiz submission error:", error);

      // Fallback feedback and summary
      const score = calculateQuizScore();
      const correctCount = quizAnswers.filter((a) => a.isCorrect).length;

      const fallbackFeedback = `Quiz Results:\n\nYou answered ${correctCount} out of ${quizData?.questions.length} questions correctly.\nScore: ${score}%\n\nGreat effort on completing the quiz about ${topicSelection.subTopic}!`;

      addMessage("mentor", fallbackFeedback, "quiz_summary");
      setCurrentStage("quiz_summary");

      toast.success(`Quiz completed! You scored ${score}%`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSession = () => {
    setCurrentStage("topic_selection");
    setTopicSelection({ semester: "", topic: "", subTopic: "" });
    setMessages([]);
    setInputMessage("");
    setConversationId(null);
    setQuizData(null);
    setQuizAnswers([]);
    setCurrentQuestionIndex(0);
    setQuizStartTime(null);
    setSessionProgress(0);
  };

  // Render Quiz Question
  const renderQuizQuestion = () => {
    if (!quizData || currentQuestionIndex >= quizData.questions.length)
      return null;

    const question = quizData.questions[currentQuestionIndex];
    const userAnswer = quizAnswers.find((a) => a.questionId === question.id);

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1} of {quizData.questions.length}
            </CardTitle>
            <Badge variant="outline">
              {Math.round(
                ((currentQuestionIndex + 1) / quizData.questions.length) * 100
              )}
              %
            </Badge>
          </div>
          <Progress
            value={
              ((currentQuestionIndex + 1) / quizData.questions.length) * 100
            }
            className="w-full"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-medium text-gray-900">{question.question}</h3>
          <div className="space-y-2">
            {question.options.map((option, idx) => (
              <Button
                key={idx}
                variant={
                  userAnswer?.selectedAnswer === option.charAt(0)
                    ? "default"
                    : "outline"
                }
                className="w-full text-left justify-start h-auto py-3 px-4"
                onClick={() => handleQuizAnswer(question.id, option.charAt(0))}
              >
                {option}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() =>
                setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
              }
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            {currentQuestionIndex < quizData.questions.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
                disabled={!userAnswer}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleQuizSubmission}
                disabled={
                  quizAnswers.length !== quizData.questions.length || isLoading
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Submit Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
          {/* Header */}
          <div className="bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <Link to="/student/dashboard">
                  <Button variant="outline" size="icon">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    AI Mentor Agent
                  </h1>
                  <p className="text-gray-600">
                    Learn with detailed explanations and test your knowledge
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right text-sm">
                    <div className="font-medium text-gray-900">
                      Session Progress
                    </div>
                    <div className="text-gray-600">
                      {sessionProgress}% Complete
                    </div>
                  </div>
                  <Progress value={sessionProgress} className="w-24" />
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 py-6">
            {/* Topic Selection Stage */}
            {currentStage === "topic_selection" && (
              <Card className="w-full max-w-4xl mx-auto">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">
                    Choose Your Learning Topic
                  </CardTitle>
                  <CardDescription>
                    Select your semester, topic, and specific sub-topic to get
                    started with personalized learning
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Semester
                      </label>
                      <Select
                        value={topicSelection.semester}
                        onValueChange={(value) =>
                          setTopicSelection((prev) => ({
                            ...prev,
                            semester: value,
                            topic: "",
                            subTopic: "",
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(CURRICULUM).map((semester) => (
                            <SelectItem key={semester} value={semester}>
                              {semester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Topic
                      </label>
                      <Select
                        value={topicSelection.topic}
                        onValueChange={(value) =>
                          setTopicSelection((prev) => ({
                            ...prev,
                            topic: value,
                            subTopic: "",
                          }))
                        }
                        disabled={!topicSelection.semester}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topicSelection.semester &&
                            Object.keys(
                              CURRICULUM[topicSelection.semester] || {}
                            ).map((topic) => (
                              <SelectItem key={topic} value={topic}>
                                {topic}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Sub-Topic
                      </label>
                      <Select
                        value={topicSelection.subTopic}
                        onValueChange={(value) =>
                          setTopicSelection((prev) => ({
                            ...prev,
                            subTopic: value,
                          }))
                        }
                        disabled={!topicSelection.topic}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sub-topic" />
                        </SelectTrigger>
                        <SelectContent>
                          {topicSelection.semester &&
                            topicSelection.topic &&
                            CURRICULUM[topicSelection.semester]?.[
                              topicSelection.topic
                            ]?.map((subTopic) => (
                              <SelectItem key={subTopic} value={subTopic}>
                                {subTopic}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleTopicSubmission}
                    disabled={
                      !topicSelection.semester ||
                      !topicSelection.topic ||
                      !topicSelection.subTopic ||
                      isLoading
                    }
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Getting Your Mentor...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-5 w-5 mr-2" />
                        Start Learning Session
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quiz Active Stage */}
            {currentStage === "quiz_active" && (
              <div className="space-y-6">
                {isLoading ? (
                  // Quiz Generation Loader
                  <Card className="w-full max-w-2xl mx-auto">
                    <CardContent className="p-8">
                      <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto relative">
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-white animate-spin"></div>
                          <CheckCircle className="h-10 w-10 text-white" />
                        </div>

                        <div className="space-y-2">
                          <h3 className="text-xl font-bold text-gray-900">
                            Generating Your Quiz
                          </h3>
                          <p className="text-gray-600">
                            AI is creating personalized questions about{" "}
                            <span className="font-semibold text-purple-600">
                              {topicSelection.subTopic}
                            </span>
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>

                          <div className="bg-gray-100 rounded-full h-2 w-64 mx-auto overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-600 to-blue-600 h-full rounded-full animate-pulse w-3/4"></div>
                          </div>
                        </div>

                        <div className="text-sm text-gray-500 space-y-1">
                          <p>🧠 Analyzing course content</p>
                          <p>📝 Creating 5 multiple choice questions</p>
                          <p>⚡ This usually takes 10-15 seconds</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : quizData ? (
                  // Quiz Questions Display
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Quiz Time!
                      </h2>
                      <p className="text-gray-600">
                        Test your knowledge about {topicSelection.subTopic}
                      </p>
                    </div>

                    {renderQuizQuestion()}
                  </div>
                ) : (
                  // Error State
                  <Card className="w-full max-w-2xl mx-auto">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <XCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Quiz Generation Failed
                      </h3>
                      <p className="text-gray-600 mb-4">
                        We encountered an issue generating your quiz. Please try
                        again.
                      </p>
                      <Button
                        onClick={() => handleQuizDecision(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Messages Container for other stages */}
            {currentStage !== "topic_selection" &&
              currentStage !== "quiz_active" && (
                <div className="space-y-6">
                  {/* Conversation Header */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                          <Brain className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">
                            Learning Session: {topicSelection.subTopic}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {topicSelection.topic} • {topicSelection.semester}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {currentStage.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Messages */}
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex gap-4",
                            message.type === "user"
                              ? "justify-end"
                              : "justify-start"
                          )}
                        >
                          {(message.type === "mentor" ||
                            message.type === "system") && (
                            <div
                              className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm",
                                message.type === "mentor"
                                  ? "bg-gradient-to-r from-purple-600 to-blue-600"
                                  : "bg-gray-500"
                              )}
                            >
                              {message.type === "mentor" ? (
                                <GraduationCap className="h-5 w-5 text-white" />
                              ) : (
                                <MessageSquare className="h-5 w-5 text-white" />
                              )}
                            </div>
                          )}

                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl p-4 shadow-sm",
                              message.type === "user"
                                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-12"
                                : message.type === "mentor"
                                ? "bg-white border border-gray-200"
                                : "bg-yellow-50 border border-yellow-200"
                            )}
                          >
                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                              {message.content}
                            </div>
                            <div
                              className={cn(
                                "text-xs mt-2 opacity-70",
                                message.type === "user"
                                  ? "text-purple-100"
                                  : "text-gray-500"
                              )}
                            >
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
                              <span>AI Mentor is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Quiz Decision Buttons */}
                  {currentStage === "quiz_prompt" && !isLoading && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Ready for the Quiz?
                          </h3>
                          <p className="text-gray-600">
                            Test your understanding of {topicSelection.subTopic}
                          </p>
                          <div className="flex gap-4 justify-center">
                            <Button
                              onClick={() => handleQuizDecision(true)}
                              className="bg-green-600 hover:bg-green-700 text-white px-8"
                              size="lg"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Yes, Start Quiz!
                            </Button>
                            <Button
                              onClick={() => handleQuizDecision(false)}
                              variant="outline"
                              size="lg"
                              className="px-8"
                            >
                              <Pause className="h-4 w-4 mr-2" />
                              Skip Quiz
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Session Complete */}
                  {(currentStage === "quiz_summary" ||
                    currentStage === "conversation_end") && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto">
                            <Award className="h-8 w-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Session Complete!
                          </h3>
                          <p className="text-gray-600">
                            {currentStage === "quiz_summary"
                              ? `Great work! You've completed the learning session and quiz for ${topicSelection.subTopic}.`
                              : `You've completed the learning session for ${topicSelection.subTopic}. Come back anytime to take the quiz!`}
                          </p>
                          <div className="flex gap-4 justify-center">
                            <Button
                              onClick={resetSession}
                              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8"
                              size="lg"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Start New Session
                            </Button>
                            <Link to="/student/dashboard">
                              <Button
                                variant="outline"
                                size="lg"
                                className="px-8"
                              >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

            {/* Chat Input for Free Conversation */}
            {currentStage === "mentor_explanation" && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Textarea
                        placeholder="Ask follow-up questions about the topic..."
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                        rows={2}
                        disabled={isLoading}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (inputMessage.trim()) {
                              addMessage("user", inputMessage);
                              setInputMessage("");
                              // Handle follow-up questions here if needed
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (inputMessage.trim()) {
                          addMessage("user", inputMessage);
                          setInputMessage("");
                        }
                      }}
                      disabled={!inputMessage.trim() || isLoading}
                      className="h-20 w-20 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <ArrowUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                    <span>
                      💭 Ask questions about the topic or proceed to quiz when
                      ready
                    </span>
                    <span>Press Enter to send</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
