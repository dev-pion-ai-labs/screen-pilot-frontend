/* eslint-disable @typescript-eslint/no-explicit-any */
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
  | "help_decision"
  | "chat_mode"
  | "quiz_prompt"
  | "quiz_active"
  | "quiz_feedback"
  | "quiz_summary"
  | "conversation_end";

// API Response Types
interface AgentResponse {
  job_info?: {
    job_id: string;
    studio_id?: string;
    conversation_id?: string;
  };
}

interface AgentResult {
  success: boolean;
  content?: string;
  conversationId?: string;
  error?: string;
}

interface QuizResponse {
  answer?: string;
  output?: string;
}

// AI Mentor Agent Configuration - Updated for n8n
const AI_MENTOR_AGENT_CONFIG = {
  mentor: {
    "Semester 1": {
      endpoint:
        "https://vijiteshnaik.app.n8n.cloud/webhook/f9303923-e4c7-4790-b667-b765b823eccb/chat",
    },
    "Semester 2": {
      endpoint:
        "https://vijiteshnaik.app.n8n.cloud/webhook/f9303923-e4c7-4790-b667-b765b823eccb/chat",
    },
  },
  quiz: {
    "Semester 1": {
      endpoint:
        "https://vijiteshnaik.app.n8n.cloud/webhook/97354b0e-7edd-46f3-b80f-49fbd3e0150c/chat",
    },
    "Semester 2": {
      endpoint:
        "https://vijiteshnaik.app.n8n.cloud/webhook/97354b0e-7edd-46f3-b80f-49fbd3e0150c/chat",
    },
  },
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
      "Film Diary (Analysis of films, director and scripts, thoughts, ideas/stories,scenes, photographs)",
    ],
    "Visual Storytelling and Collaboration": [
      "Introduction to visual storytelling (Composition, Cutting, Closeup, Continuity, Camera Angle)",
      "Recreating a Painting",
      "Collaboration with Camera, Edit and Sound",
      "Turning Actualities into Stories (Observation Writing)",
      "Trip to a Closed Public Space (e.g. Library, Museum)",
      "Trip to an open public space (e.g. Park, Market place, Bus stop)",
    ],
    "Principles of Continuity": [
      "Decoupage (cutting scripts and planning visual for cinematic connection) and Continuity",
      "Aspects of Continuity",
      "Time and Space in Films",
      "Scene analysis of Classical Hollywood films and contemporary films",
    ],
    "Concept and Ideation": [
      "Research",
      "Types of Stories",
      "Developing a Concept",
      "Use of VFX Elements",
      "Oral Narrative Skills",
      "Creative Writing (Personal Memoir, Descriptive Writing)",
      "Reading and Analysis of Short Stories",
    ],
    "Theories and Formats of Scriptwriting": [
      "History of Storytelling",
      "Screenplay Writing – Overview and Process",
      "Elements of a Screenplay",
      "Premise, Plot, Treatment, Characters, Conflict",
      "Screenwriting Software",
      "Introductions to Story structures  - I (Three-Act Structure, 5 Act Structure)",
      "Creating simple screenplays using 3 act structure",
    ],
  },
  "Semester 2": {
    "Staging and Blocking": [
      "Understanding the concept of staging and blocking",
      "Types of staging and blocking",
      "Usage of props and space",
      "I, A, L, C, S patterns",
      "Blocking for VFX",
    ],
    "Working with Actors": [
      "Staging a scene with actors",
      "Exercise on Improvisation",
      "Styles of acting",
      "Difference between stage and film acting",
      "Working with Virtual/Digital Actors : Possibilities and Limitations",
    ],
    "Scene Analysis": [
      "Dialogue – Acting - Composition-Staging and Blocking along with use of Visualization tools like",
      "Traditional/Digital Storyboards and AI tools for mood boards",
    ],
    "Dialogue writing and Story Structures": [
      "Dialogue, monologue and conversation",
      "Types of dialogue",
      "Writing effective dialogue",
      "Dialogue through observation",
      "Dialogue in a situation",
      "Story Structures II (Hero’s Journey, Dan Harmon Story Circle)",
      "Creating effective story conflicts",
    ],
    "Rhythm and Pace": [
      "Usage of Edit, Sound and BGM from Director’s Point of View",
      "Tonalities of Dialogue",
      "Space and Action Dynamics",
    ],
  },
};

// Utility Functions
// DEPRECATED: parseQuizContent - no longer needed as we receive structured data from API
const parseQuizContent = (content: string): QuizQuestion[] => {
  const questions: QuizQuestion[] = [];

  // Method -3: Handle format "### Question X (Level)" with **question text** - CURRENT FORMAT
  const headerQuestionSections = content
    .split(/###\s*Question\s+\d+\s*\([^)]+\)/)
    .filter((section) => section.trim());

  if (headerQuestionSections.length > 1) {
    // Remove the first section (usually intro text)
    headerQuestionSections.shift();

    headerQuestionSections.forEach((section, index) => {
      // Find the actual question text (text between ** that ends with "?")
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      // Look for question text between ** markers
      const questionMatch = section.match(/\*\*([^*]+\?)\*\*/);

      if (questionMatch) {
        const questionText = questionMatch[1].trim();

        // Find option lines (start with "A)", "B)", etc.)
        const optionLines = lines.filter(
          (line) => line.match(/^[A-D]\)/) && !line.includes("Answer:")
        );

        if (optionLines.length >= 4) {
          const options = optionLines.slice(0, 4).map((opt) => opt.trim());

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using header question format in parseQuizContent:",
        questions
      );
      return questions;
    }
  }

  // Method -2: Handle format "1. **Question X: [Title]**" with actual question text - PREVIOUS FORMAT
  const questionSections = content
    .split(/\d+\.\s*\*\*Question\s+\d+:/)
    .filter((section) => section.trim());

  if (questionSections.length > 1) {
    // Remove the first section (usually intro text)
    questionSections.shift();

    questionSections.forEach((section, index) => {
      // Find the actual question text (line that ends with "?")
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      // Skip the title line and find the actual question
      const questionLine = lines.find(
        (line) =>
          line.includes("?") &&
          !line.includes("Answer:") &&
          !line.includes("**")
      );

      if (questionLine) {
        // Clean the question text
        const questionText = questionLine.replace(/^-\s*/, "").trim();

        // Find option lines (start with "- A)", "- B)", etc.)
        const optionLines = lines.filter(
          (line) => line.match(/^\s*-?\s*[A-D]\)/) && !line.includes("Answer:")
        );

        if (optionLines.length >= 4) {
          const options = optionLines
            .slice(0, 4)
            .map((opt) => opt.replace(/^\s*-?\s*/, "").trim());

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using numbered question format in parseQuizContent:",
        questions
      );
      return questions;
    }
  }

  // Method -1: Handle format "1. **Topic: [Topic Name]**" with question and options - PREVIOUS FORMAT
  // Split content by numbered topics and parse each section
  const topicSections = content
    .split(/\d+\.\s*\*\*Topic:/)
    .filter((section) => section.trim());

  if (topicSections.length > 1) {
    // Remove the first empty section
    topicSections.shift();

    topicSections.forEach((section, index) => {
      // Find the question text (line that ends with "?")
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      const questionLine = lines.find(
        (line) => line.includes("?") && !line.includes("Answer:")
      );

      if (questionLine) {
        // Clean the question text (remove leading dash if present)
        const questionText = questionLine.replace(/^-\s*/, "").trim();

        // Find option lines (start with "- A)", "- B)", etc.)
        const optionLines = lines.filter(
          (line) => line.match(/^-?\s*[A-D]\)/) && !line.includes("Answer:")
        );

        if (optionLines.length >= 4) {
          const options = optionLines
            .slice(0, 4)
            .map((opt) => opt.replace(/^-?\s*/, "").trim());

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using topic format in parseQuizContent:",
        questions
      );
      return questions;
    }
  }

  // Method 0: Handle format "#### Question X:" (without difficulty) - CURRENT FORMAT
  const currentFormatMatches = content.match(
    /#### Question \d+:\s*\n([^\n]+)\s*\n((?:- [A-D]\)[^\n]+\n?)+)/g
  );

  if (currentFormatMatches && currentFormatMatches.length > 0) {
    currentFormatMatches.forEach((match, index) => {
      // Extract question text - line after "#### Question X:"
      const questionMatch = match.match(/#### Question \d+:\s*\n([^\n]+)/);
      if (questionMatch) {
        const questionText = questionMatch[1].trim();

        // Skip if this line contains "Correct Answer" - it's not the actual question
        if (questionText.toLowerCase().includes("correct answer")) {
          return;
        }

        // Extract options - lines starting with "- A)", "- B)", etc.
        const optionMatches = match.match(/- ([A-D]\)[^\n]+)/g);

        if (optionMatches && optionMatches.length >= 4) {
          const options = optionMatches
            .slice(0, 4)
            .map((opt) => opt.replace(/^- /, ""));

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using current format in parseQuizContent:",
        questions
      );
      return questions;
    }
  }

  // Method 0b: Handle format "#### Question X (Difficulty)" - PREVIOUS FORMAT
  const prevFormatMatches = content.match(
    /#### Question \d+ \([^)]+\)\s*\n([^\n]+)\s*\n((?:- [A-D]\)[^\n]+\n?)+)/g
  );

  if (prevFormatMatches && prevFormatMatches.length > 0) {
    prevFormatMatches.forEach((match, index) => {
      // Extract question text - line after "#### Question X (Difficulty)"
      const questionMatch = match.match(
        /#### Question \d+ \([^)]+\)\s*\n([^\n]+)/
      );
      if (questionMatch) {
        const questionText = questionMatch[1].trim();

        // Extract options - lines starting with "- A)", "- B)", etc.
        const optionMatches = match.match(/- ([A-D]\)[^\n]+)/g);

        if (optionMatches && optionMatches.length >= 4) {
          const options = optionMatches
            .slice(0, 4)
            .map((opt) => opt.replace(/^- /, ""));

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using previous format in parseQuizContent:",
        questions
      );
      return questions;
    }
  }

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

// DEPRECATED: createFallbackQuestions - no longer needed as we receive structured data from API
const createFallbackQuestions = (content: string): QuizQuestion[] => {
  console.log("Creating fallback questions from content:", content);

  // Try to parse questions from the content string
  const questions: QuizQuestion[] = [];

  // Method -3: Handle format "### Question X (Level)" with **question text** - CURRENT FORMAT
  const headerQuestionSections = content
    .split(/###\s*Question\s+\d+\s*\([^)]+\)/)
    .filter((section) => section.trim());

  if (headerQuestionSections.length > 1) {
    // Remove the first section (usually intro text)
    headerQuestionSections.shift();

    headerQuestionSections.forEach((section, index) => {
      // Find the actual question text (text between ** that ends with "?")
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      // Look for question text between ** markers
      const questionMatch = section.match(/\*\*([^*]+\?)\*\*/);

      if (questionMatch) {
        const questionText = questionMatch[1].trim();

        // Find option lines (start with "A)", "B)", etc.)
        const optionLines = lines.filter(
          (line) => line.match(/^[A-D]\)/) && !line.includes("Answer:")
        );

        if (optionLines.length >= 4) {
          const options = optionLines.slice(0, 4).map((opt) => opt.trim());

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using header question format in fallback:",
        questions
      );
      return questions;
    }
  }

  // Method -2: Handle format "1. **Question X: [Title]**" with actual question text - PREVIOUS FORMAT
  const questionSections = content
    .split(/\d+\.\s*\*\*Question\s+\d+:/)
    .filter((section) => section.trim());

  if (questionSections.length > 1) {
    // Remove the first section (usually intro text)
    questionSections.shift();

    questionSections.forEach((section, index) => {
      // Find the actual question text (line that ends with "?")
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);

      // Skip the title line and find the actual question
      const questionLine = lines.find(
        (line) =>
          line.includes("?") &&
          !line.includes("Answer:") &&
          !line.includes("**")
      );

      if (questionLine) {
        // Clean the question text
        const questionText = questionLine.replace(/^-\s*/, "").trim();

        // Find option lines (start with "- A)", "- B)", etc.)
        const optionLines = lines.filter(
          (line) => line.match(/^\s*-?\s*[A-D]\)/) && !line.includes("Answer:")
        );

        if (optionLines.length >= 4) {
          const options = optionLines
            .slice(0, 4)
            .map((opt) => opt.replace(/^\s*-?\s*/, "").trim());

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using numbered question format in fallback:",
        questions
      );
      return questions;
    }
  }

  // Method -1: Handle format "1. **Topic: [Topic Name]**" with question and options - PREVIOUS FORMAT
  // Split content by numbered topics and parse each section
  const topicSections = content
    .split(/\d+\.\s*\*\*Topic:/)
    .filter((section) => section.trim());

  if (topicSections.length > 1) {
    // Remove the first empty section
    topicSections.shift();

    topicSections.forEach((section, index) => {
      // Find the question text (line that ends with "?")
      const lines = section
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line);
      const questionLine = lines.find(
        (line) => line.includes("?") && !line.includes("Answer:")
      );

      if (questionLine) {
        // Clean the question text (remove leading dash if present)
        const questionText = questionLine.replace(/^-\s*/, "").trim();

        // Find option lines (start with "- A)", "- B)", etc.)
        const optionLines = lines.filter(
          (line) => line.match(/^-?\s*[A-D]\)/) && !line.includes("Answer:")
        );

        if (optionLines.length >= 4) {
          const options = optionLines
            .slice(0, 4)
            .map((opt) => opt.replace(/^-?\s*/, "").trim());

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using topic format in fallback:",
        questions
      );
      return questions;
    }
  }

  // Method 0: Handle format "#### Question X:" (without difficulty) - CURRENT FORMAT
  const currentFormatMatches = content.match(
    /#### Question \d+:\s*\n([^\n]+)\s*\n((?:- [A-D]\)[^\n]+\n?)+)/g
  );

  if (currentFormatMatches && currentFormatMatches.length > 0) {
    currentFormatMatches.forEach((match, index) => {
      // Extract question text - line after "#### Question X:"
      const questionMatch = match.match(/#### Question \d+:\s*\n([^\n]+)/);
      if (questionMatch) {
        const questionText = questionMatch[1].trim();

        // Skip if this line contains "Correct Answer" - it's not the actual question
        if (questionText.toLowerCase().includes("correct answer")) {
          return;
        }

        // Extract options - lines starting with "- A)", "- B)", etc.
        const optionMatches = match.match(/- ([A-D]\)[^\n]+)/g);

        if (optionMatches && optionMatches.length >= 4) {
          const options = optionMatches
            .slice(0, 4)
            .map((opt) => opt.replace(/^- /, ""));

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using current format in fallback:",
        questions
      );
      return questions;
    }
  }

  // Method 0b: Handle format "#### Question X (Difficulty)" - PREVIOUS FORMAT
  const prevFormatMatches = content.match(
    /#### Question \d+ \([^)]+\)\s*\n([^\n]+)\s*\n((?:- [A-D]\)[^\n]+\n?)+)/g
  );

  if (prevFormatMatches && prevFormatMatches.length > 0) {
    prevFormatMatches.forEach((match, index) => {
      // Extract question text - line after "#### Question X (Difficulty)"
      const questionMatch = match.match(
        /#### Question \d+ \([^)]+\)\s*\n([^\n]+)/
      );
      if (questionMatch) {
        const questionText = questionMatch[1].trim();

        // Extract options - lines starting with "- A)", "- B)", etc.
        const optionMatches = match.match(/- ([A-D]\)[^\n]+)/g);

        if (optionMatches && optionMatches.length >= 4) {
          const options = optionMatches
            .slice(0, 4)
            .map((opt) => opt.replace(/^- /, ""));

          questions.push({
            id: index + 1,
            question: questionText,
            options: options,
          });
        }
      }
    });

    if (questions.length > 0) {
      console.log(
        "Parsed questions using previous format in fallback:",
        questions
      );
      return questions;
    }
  }

  // Method 1: Handle numbered format "1. **Question 1:**" with actual question text
  const numberedQuestionBlocks = content
    .split(/\d+\.\s*\*\*Question\s+\d+:\*\*/i)
    .filter((block) => block.trim());

  if (numberedQuestionBlocks.length > 1) {
    // Remove the first block (usually topic info)
    numberedQuestionBlocks.shift();

    numberedQuestionBlocks.forEach((block, index) => {
      if (block.trim()) {
        // Extract the actual question text (first meaningful line after the question header)
        const lines = block
          .trim()
          .split("\n")
          .filter((line) => line.trim());
        const questionText = lines[0]?.trim();

        if (questionText) {
          // Extract options - look for lines starting with - A), - B), etc.
          const optionMatches = block.match(/[-\s]*[A-D]\)\s*[^\n\r]+/g);

          if (optionMatches && optionMatches.length >= 4) {
            const options = optionMatches.slice(0, 4).map((opt) => {
              // Clean up the option text - remove leading dashes and spaces
              return opt.trim().replace(/^[-\s]*/, "");
            });

            questions.push({
              id: index + 1,
              question: questionText,
              options: options,
            });
          }
        }
      }
    });
  }
  // Method 2: Handle format "**Question X:**" with question text on next line
  else {
    const questionHeaderBlocks = content
      .split(/\*\*Question\s+\d+:\*\*/i)
      .filter((block) => block.trim());

    if (questionHeaderBlocks.length > 1) {
      // Remove the first block (usually empty or topic info)
      questionHeaderBlocks.shift();

      questionHeaderBlocks.forEach((block, index) => {
        if (block.trim()) {
          // Extract the actual question text (first meaningful line)
          const lines = block
            .trim()
            .split("\n")
            .filter((line) => line.trim());
          const questionText = lines[0]?.trim();

          if (questionText) {
            // Extract options - look for lines starting with - A), - B), etc.
            const optionMatches = block.match(/[-\s]*[A-D]\)\s*[^\n\r]+/g);

            if (optionMatches && optionMatches.length >= 4) {
              const options = optionMatches.slice(0, 4).map((opt) => {
                // Clean up the option text - remove leading dashes and spaces
                return opt.trim().replace(/^[-\s]*/, "");
              });

              questions.push({
                id: index + 1,
                question: questionText,
                options: options,
              });
            }
          }
        }
      });
    }
  }

  // Method 3: Handle format "### Question X:" with ** question ** (fallback)
  if (questions.length === 0) {
    const newFormatBlocks = content
      .split(/###\s*Question\s+\d+:\s*/i)
      .filter((block) => block.trim());

    if (newFormatBlocks.length > 1) {
      // Remove the first empty block
      newFormatBlocks.shift();

      newFormatBlocks.forEach((block, index) => {
        if (block.trim()) {
          // Extract question text (between ** and **)
          const questionMatch = block.match(/\*\*([^*]+)\*\*/);
          if (questionMatch) {
            const questionText = questionMatch[1].trim();

            // Extract options (A), B), C), D))
            const optionMatches = block.match(/[A-D]\)\s*[^\n\r]+/g);

            if (optionMatches && optionMatches.length >= 4) {
              const options = optionMatches
                .slice(0, 4)
                .map((opt) => opt.trim());

              questions.push({
                id: index + 1,
                question: questionText,
                options: options,
              });
            }
          }
        }
      });
    }
  }

  // Method 4: Handle old format "1. **" with "- a)" options (final fallback)
  if (questions.length === 0) {
    const questionBlocks = content
      .split(/\d+\.\s*\*\*/)
      .filter((block) => block.trim());

    questionBlocks.forEach((block, index) => {
      if (block.trim()) {
        // Extract question text (between ** and **)
        const questionMatch = block.match(/^([^*]+)\*\*/);
        if (questionMatch) {
          const questionText = questionMatch[1].trim();

          // Extract options - handle both formats: "- a)" and "A)"
          const optionMatches = block.match(/[-\s]*[a-dA-D]\)\s*[^\n-]+/g);

          if (optionMatches && optionMatches.length >= 4) {
            const options = optionMatches.slice(0, 4).map((opt) => {
              // Clean up the option text and format consistently
              const cleanOpt = opt.trim().replace(/^[-\s]*/, "");
              // Convert lowercase to uppercase for consistency
              return cleanOpt.replace(
                /^([a-d])\)/,
                (match, letter) => `${letter.toUpperCase()})`
              );
            });

            questions.push({
              id: index + 1,
              question: questionText,
              options: options,
            });
          }
        }
      }
    });
  }

  console.log("Parsed questions from content:", questions);
  return questions;
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Function to parse and format mentor response content
const formatMentorResponse = (content: string): string => {
  let formattedContent = content.trim();

  // Extract subtopic from the beginning
  const subtopicMatch = formattedContent.match(/^Subtopic:\s*(.+?)(?:\n|$)/);
  let subtopic = "";
  if (subtopicMatch) {
    subtopic = subtopicMatch[1].trim();
    formattedContent = formattedContent.replace(/^Subtopic:\s*.+?\n\n?/, "");
  }

  // Add subtopic header if found
  let result = "";
  if (subtopic) {
    result += `<div class="mb-6">
      <h1 class="text-3xl font-bold text-purple-800 mb-2 flex items-center gap-2">
        <span class="text-purple-600">🎬</span> ${subtopic}
      </h1>
      <div class="h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
    </div>`;
  }

  // Format main section headers (What is it about?, Study Guide & Exam Preparation:, etc.)
  formattedContent = formattedContent.replace(
    /^(What is it about\?|Study Guide & Exam Preparation:|Key Concepts:|Pro Tips:|Reference Materials:)\s*$/gm,
    (_match, header) => {
      const icons = {
        "What is it about?": "📖",
        "Study Guide & Exam Preparation:": "📚",
        "Key Concepts:": "💡",
        "Pro Tips:": "⭐",
        "Reference Materials:": "📚",
      };
      const icon = icons[header as keyof typeof icons] || "📋";
      return `<div class="mb-4 mt-6">
        <h2 class="text-xl font-bold text-purple-700 flex items-center gap-2 mb-3">
          <span>${icon}</span> ${header.replace(":", "")}
        </h2>
      </div>`;
    }
  );

  // Format numbered lists in main content (1. **Sound Effects**: ...)
  formattedContent = formattedContent.replace(
    /(\d+)\.\s*\*\*([^*]+)\*\*:\s*([^\n]+(?:\n(?!\d+\.)[^\n]*)*)/g,
    '<div class="mb-4 ml-4"><div class="flex items-start gap-3"><span class="bg-purple-100 text-purple-800 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mt-1">$1</span><div><h3 class="font-semibold text-purple-800 mb-1">$2</h3><p class="text-gray-700 leading-relaxed">$3</p></div></div></div>'
  );

  // Format bullet points with icons
  formattedContent = formattedContent.replace(
    /^\*\s*\*\*([^*]+)\*\*:\s*(.+)$/gm,
    '<div class="mb-3 ml-4 flex items-start gap-2"><span class="text-purple-600 mt-1">•</span><div><strong class="text-purple-800">$1:</strong> <span class="text-gray-700">$2</span></div></div>'
  );

  // Format simple bullet points
  formattedContent = formattedContent.replace(
    /^\*\s*(.+)$/gm,
    '<div class="mb-2 ml-4 flex items-start gap-2"><span class="text-purple-600 mt-1">•</span><span class="text-gray-700">$1</span></div>'
  );

  // Format dash bullet points (remove dash and add line break)
  formattedContent = formattedContent.replace(
    /^-\s*(.+)$/gm,
    '<div class="mb-2 ml-4" style="display: block;"><span class="text-gray-700">$1</span></div>'
  );

  // Format reference materials section specially
  formattedContent = formattedContent.replace(
    /Reference Materials:\s*\n([^\n]+(?:\n[^\n]+)*?)(?=\n\n|$)/g,
    (_match, materials) => {
      return `<div class="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-l-4 border-purple-500">
        <div class="text-purple-800 font-medium mb-2">📚 ${materials.trim()}</div>
      </div>`;
    }
  );

  // Format the final question
  formattedContent = formattedContent.replace(
    /Would you like help with any other part of this topic[^?]*\?/g,
    '<div class="mt-6 p-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg border border-purple-200"><div class="text-purple-700 font-medium text-center">$&</div></div>'
  );

  // Replace **text** with proper bold tags
  formattedContent = formattedContent.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="text-purple-800">$1</strong>'
  );

  // Add proper paragraph spacing for remaining content
  formattedContent = formattedContent.replace(
    /\n\n+/g,
    '</p><p class="mb-4 text-gray-700 leading-relaxed">'
  );
  formattedContent =
    '<p class="mb-4 text-gray-700 leading-relaxed">' +
    formattedContent +
    "</p>";

  // Clean up empty paragraphs and fix spacing
  formattedContent = formattedContent.replace(
    /<p class="mb-4 text-gray-700 leading-relaxed"><\/p>/g,
    ""
  );
  formattedContent = formattedContent.replace(
    /<\/p><p class="mb-4 text-gray-700 leading-relaxed"><div/g,
    "</p><div"
  );
  formattedContent = formattedContent.replace(/<\/div><\/p>/g, "</div>");

  return result + formattedContent;
};

// Function to parse and format quiz feedback
const formatQuizFeedback = (content: string): string => {
  if (!content || content.trim() === "") {
    return '<div class="text-gray-500">No feedback available.</div>';
  }

  const formattedContent = content;

  // Add main header
  let result =
    '<div class="mb-6"><h2 class="text-2xl font-bold text-purple-800 mb-2">📊 Quiz Feedback</h2><div class="h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div></div>';

  // Handle the new format with bold markdown: **Question X: [title]** followed by structured feedback
  const questionPattern =
    /\*\*Question\s+(\d+):\s*([^*]+?)\*\*\s*-\s*\*\*Your Answer:\*\*\s*([A-D])\s*-\s*\*\*Correct Answer:\*\*\s*([A-D])\s*(.*?)(?=\*\*Question\s+\d+:|---\s*Remember|$)/gs;

  let match: RegExpExecArray | null;
  let hasMatches = false;

  while ((match = questionPattern.exec(formattedContent)) !== null) {
    hasMatches = true;
    const [
      ,
      questionNum,
      questionTitle,
      userAnswer,
      correctAnswer,
      feedbackText,
    ] = match;

    const isAnswerCorrect = userAnswer === correctAnswer;

    // Parse the feedback text to extract different sections
    const cleanFeedbackText = feedbackText.trim();

    // Extract the main explanation/feedback (everything before any specific references)
    const explanationMatch = cleanFeedbackText.match(
      /^(.*?)(?:To further understand|You can learn more|For more insights|For further insights)/s
    );
    const explanation = explanationMatch
      ? explanationMatch[1].trim()
      : cleanFeedbackText;

    // Extract course material references
    const courseMaterialMatch = cleanFeedbackText.match(
      /(?:To further understand|You can learn more|For more insights|For further insights)(.*?)(?:Keep up|Keep practicing|Keep challenging|Keep exploring)/s
    );
    const courseMaterial = courseMaterialMatch
      ? courseMaterialMatch[1].trim()
      : "";

    // Extract encouragement
    const encouragementMatch = cleanFeedbackText.match(
      /(Keep up.*?|Keep practicing.*?|Keep challenging.*?|Keep exploring.*?)$/s
    );
    const encouragement = encouragementMatch
      ? encouragementMatch[1].trim()
      : "";

    const icon = isAnswerCorrect ? "✅" : "❌";
    const bgColor = isAnswerCorrect ? "bg-green-50" : "bg-red-50";
    const borderColor = isAnswerCorrect ? "border-green-200" : "border-red-200";
    const statusColor = isAnswerCorrect
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
    const status = isAnswerCorrect ? "Correct" : "Incorrect";

    result += `
      <div class="mb-6 ${bgColor} border ${borderColor} rounded-xl p-6 shadow-sm">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-2xl">${icon}</span>
          <h3 class="text-xl font-bold text-gray-800">Question ${questionNum}</h3>
          <span class="ml-auto px-3 py-1 rounded-full text-sm font-medium ${statusColor}">${status}</span>
        </div>
        
        <div class="mb-4">
          <div class="text-lg font-medium text-gray-900 mb-3">${questionTitle.trim()}</div>
        </div>
        
        <div class="mb-4 grid grid-cols-2 gap-4">
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-blue-600 font-medium">👤 Your Answer:</span>
              <span class="text-blue-800 font-bold text-lg">${userAnswer}</span>
            </div>
          </div>
          
          <div class="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center gap-2">
              <span class="text-green-600 font-medium">🎯 Correct Answer:</span>
              <span class="text-green-800 font-bold text-lg">${correctAnswer}</span>
            </div>
          </div>
        </div>
        
        ${
          explanation
            ? `
          <div class="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div class="flex items-start gap-2">
              <span class="text-purple-600 font-medium">💡 Explanation:</span>
              <div class="text-purple-800 leading-relaxed">${explanation}</div>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          courseMaterial
            ? `
          <div class="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-start gap-2">
              <span class="text-blue-600 font-medium">📚 Course Material:</span>
              <div class="text-blue-800 leading-relaxed">${courseMaterial}</div>
            </div>
          </div>
        `
            : ""
        }
        
        ${
          encouragement
            ? `
          <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-start gap-2">
              <span class="text-yellow-600 font-medium">🌟 Encouragement:</span>
              <div class="text-yellow-800 leading-relaxed">${encouragement}</div>
            </div>
          </div>
        `
            : ""
        }
      </div>
    `;
  }

  // If no matches found with the main pattern, try to handle it as a general feedback block
  if (!hasMatches) {
    // Handle final encouragement section
    const finalEncouragementMatch = formattedContent.match(
      /Remember,\s*every attempt.*$/s
    );
    if (finalEncouragementMatch) {
      result += `
        <div class="mt-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-3xl">🎉</span>
            <div>
              <h3 class="text-xl font-bold text-purple-800 mb-2">Keep Learning!</h3>
              <p class="text-purple-700 leading-relaxed">${finalEncouragementMatch[0].trim()}</p>
            </div>
          </div>
        </div>
      `;
    }

    // If still no proper formatting, return the content with basic markdown processing
    if (
      result.trim() ===
      '<div class="mb-6"><h2 class="text-2xl font-bold text-purple-800 mb-2">📊 Quiz Feedback</h2><div class="h-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div></div>'
    ) {
      // Process basic markdown and return formatted content
      let processedContent = formattedContent
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n\n/g, '</p><p class="mb-3">')
        .replace(/\n/g, "<br>");

      processedContent = '<p class="mb-3">' + processedContent + "</p>";
      result += `<div class="p-4 bg-gray-50 border border-gray-200 rounded-lg">${processedContent}</div>`;
    }
  } else {
    // Add final encouragement if it exists and we had matches
    const finalEncouragementMatch = formattedContent.match(
      /---\s*Remember,\s*every attempt.*$/s
    );
    if (finalEncouragementMatch) {
      const cleanEncouragement = finalEncouragementMatch[0]
        .replace(/^---\s*/, "")
        .trim();
      result += `
        <div class="mt-8 p-6 bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="text-3xl">🎉</span>
            <div>
              <h3 class="text-xl font-bold text-purple-800 mb-2">Keep Learning!</h3>
              <p class="text-purple-700 leading-relaxed">${cleanEncouragement}</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  return result;
};

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
      help_decision: 35,
      chat_mode: 45,
      quiz_prompt: 50,
      quiz_active: 70,
      quiz_feedback: 85,
      quiz_summary: 95,
      conversation_end: 100,
    };
    setSessionProgress(progressMap[currentStage]);
  }, [currentStage]);

  // Generate feedback from quiz questions when n8n returns questions instead of feedback
  const generateFeedbackFromQuestions = (allQuestions: any[]): string => {
    const wrongAnswers: string[] = [];

    // Find questions where user answered incorrectly
    quizData?.questions.forEach((question, index) => {
      const userAnswer = quizAnswers.find((a) => a.questionId === question.id);
      if (userAnswer && !userAnswer.isCorrect) {
        // Find the corresponding question in allQuestions
        const matchingQuestion = allQuestions[index];
        if (matchingQuestion && matchingQuestion.Correct_answer_explanation) {
          // Clean the explanation text
          const cleanExplanation =
            matchingQuestion.Correct_answer_explanation.replace(/【.*?】/g, "") // Remove citation markers
              .replace(/\s+/g, " ") // Clean multiple spaces
              .trim();

          wrongAnswers.push(
            `**🤔 ${question.question}**\n\n` +
              `❌ **Your answer:** ${userAnswer.selectedAnswer}\n` +
              `✅ **Correct answer:** ${question.correctAnswer}\n` +
              `💡 **Explanation:** ${cleanExplanation}\n`
          );
        }
      }
    });

    const correctCount = quizAnswers.filter((a) => a.isCorrect).length;
    const totalQuestions = quizData?.questions.length || 0;
    const score = Math.round((correctCount / totalQuestions) * 100);

    // Create beautiful header with emojis
    let feedback = `🎓 **Quiz Results: ${topicSelection.subTopic}**\n\n`;

    // Score section with visual indicators
    if (score >= 80) {
      feedback += `🎉 **Excellent! Your Score: ${correctCount}/${totalQuestions} (${score}%)**\n\n`;
    } else if (score >= 60) {
      feedback += `👍 **Good Job! Your Score: ${correctCount}/${totalQuestions} (${score}%)**\n\n`;
    } else if (score >= 40) {
      feedback += `💪 **Keep Going! Your Score: ${correctCount}/${totalQuestions} (${score}%)**\n\n`;
    } else {
      feedback += `📚 **Learning Opportunity! Your Score: ${correctCount}/${totalQuestions} (${score}%)**\n\n`;
    }

    if (wrongAnswers.length > 0) {
      
      feedback += wrongAnswers.join(
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n"
      );
    } else {
      feedback += `🎆 **Perfect Score!** You answered all questions correctly! Amazing work!\n\n`;
    }

    feedback += `\n🎯 **Keep up the fantastic work!** Continue practicing to master **${topicSelection.subTopic}**.\n\n`;
    feedback += `💡 **Tip:** Review the explanations above and practice similar questions to improve your understanding.`;

    return feedback;
  };

  // API Functions
  const callMentorAgent = async (message: string): Promise<unknown> => {
    // Get the appropriate mentor config based on selected semester
    const mentorConfig =
      AI_MENTOR_AGENT_CONFIG.mentor[
        topicSelection.semester as keyof typeof AI_MENTOR_AGENT_CONFIG.mentor
      ];

    if (!mentorConfig) {
      throw new Error(
        `No mentor configuration found for ${topicSelection.semester}`
      );
    }

    // Send subtopic as simple JSON object
    const response = await fetch(mentorConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chatInput: message }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    return response.json();
  };

  const callQuizGenerationTool = async (): Promise<{
    success: boolean;
    questions?: QuizQuestion[];
    error?: string;
  }> => {
    try {
      const semesterConfig =
        AI_MENTOR_AGENT_CONFIG.quiz[topicSelection.semester];
      if (!semesterConfig) {
        throw new Error(
          `No configuration found for ${topicSelection.semester}`
        );
      }

      // Send subtopic as simple JSON object
      const response = await fetch(semesterConfig.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chatInput: topicSelection.subTopic || "" }),
      });

      if (!response.ok) {
        throw new Error(`Quiz Generation Error: ${response.status}`);
      }

      const result = await response.json();

      console.log("Quiz generation response:", result);

      // Check if result.output is already a parsed array of questions
      if (Array.isArray(result.output)) {
        console.log("📋 Output is already an array:", result.output);
        return {
          success: true,
          questions: result.output,
        };
      }

      // Handle n8n response - check for output content
      if (result.output) {
        console.log("🎯 Raw quiz output:", result.output);
        console.log("🔍 Output type:", typeof result.output);

        // Check if output is already an object (not string)
        if (typeof result.output === "object" && result.output.all_questions) {
          console.log("📋 Output is already parsed object:", result.output);
          const parsedOutput = result.output;

          if (
            parsedOutput.all_questions &&
            Array.isArray(parsedOutput.all_questions)
          ) {
            const questions = parsedOutput.all_questions.map(
              (q: any, index: number) => ({
                id: index + 1,
                question: q.question,
                options: q.options || [],
                correctAnswer:
                  q.options && q.correct_option_id !== undefined
                    ? q.options[q.correct_option_id]
                    : undefined,
              })
            );

            console.log("✅ Converted questions from object:", questions);

            return {
              success: true,
              questions: questions,
            };
          }
        }

        // If it's a string, try to parse as JSON
        if (typeof result.output === "string") {
          try {
            // Clean up the string - remove markdown code blocks
            let cleanOutput = result.output.trim();

            // Remove ```json and ``` wrappers
            cleanOutput = cleanOutput.replace(/^```json\s*/, "");
            cleanOutput = cleanOutput.replace(/\s*```$/, "");
            cleanOutput = cleanOutput.trim();

            console.log("🧹 Cleaned output:", cleanOutput);

            const parsedOutput = JSON.parse(cleanOutput);
            console.log("📋 Parsed JSON output:", parsedOutput);

            // Check if it has all_questions array
            if (
              parsedOutput.all_questions &&
              Array.isArray(parsedOutput.all_questions)
            ) {
              const questions = parsedOutput.all_questions.map(
                (q: any, index: number) => ({
                  id: index + 1,
                  question: q.question,
                  options: q.options || [],
                  correctAnswer:
                    q.options && q.correct_option_id !== undefined
                      ? q.options[q.correct_option_id]
                      : undefined,
                })
              );

              console.log("✅ Converted questions from JSON:", questions);

              return {
                success: true,
                questions: questions,
              };
            }
          } catch (e) {
            console.log("❌ JSON parse failed:", e);
            console.log("❌ Raw output that failed:", result.output);

            return {
              success: false,
              error: "Quiz response format is invalid - not proper JSON",
            };
          }
        }
      }

      // Check if result has questions directly
      if (result.questions) {
        return {
          success: true,
          questions: result.questions,
        };
      }

      return {
        success: false,
        error: result.error || "Failed to generate quiz questions",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  };

  const callAnswerFeedbackTool = async (): Promise<unknown> => {
    const semesterConfig = AI_MENTOR_AGENT_CONFIG.quiz[topicSelection.semester];
    if (!semesterConfig) {
      throw new Error(`No configuration found for ${topicSelection.semester}`);
    }

    // Send subtopic as requested
    const payload = {
  chatInput: (topicSelection.subTopic || "").toString().toLowerCase(),
};


    console.log("📤 Sending quiz feedback payload:", payload);

    const response = await fetch(semesterConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Answer Feedback Error: ${response.status}`);
    }

    return response.json();
  };

  const callQuizSummaryTool = async (): Promise<unknown> => {
    const semesterConfig = AI_MENTOR_AGENT_CONFIG.quiz[topicSelection.semester];
    if (!semesterConfig) {
      throw new Error(`No configuration found for ${topicSelection.semester}`);
    }

    // Only send subtopic as requested
    const payload = {
  chatInput: (topicSelection.subTopic || "").toString().toLowerCase(),
};


    console.log("📤 Sending quiz summary payload:", payload);

    const response = await fetch(semesterConfig.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Quiz Summary Error: ${response.status}`);
    }

    return response.json();
  };

  // pollAgentResponse function removed as n8n returns responses directly without polling

  // Mentor Explanation Parsing Function
  const parseMentorExplanation = (text: string): string => {
    console.log("🔍 Starting mentor explanation parsing...");
    console.log("📝 Raw mentor text received:", text);

    // Clean up the text and format it nicely
    let formattedText = text;

    // Remove code language indicators and artifacts
    formattedText = formattedText.replace(/```vbnet\s*/g, "");
    formattedText = formattedText.replace(/```\s*/g, "");
    formattedText = formattedText.replace(/^vbnet\s*$/gm, "");
    formattedText = formattedText.replace(/^Copy\s*$/gm, "");
    formattedText = formattedText.replace(/^Edit\s*$/gm, "");
    formattedText = formattedText.replace(/^Copy\s+Edit\s*$/gm, "");

    // Remove any reference citations like 【4:0†Film Art_ An Introduction 10th Edition】
    formattedText = formattedText.replace(/【[^】]*】/g, "");

    // Remove "Would you like help" section and everything after it
    formattedText = formattedText.replace(/Would you like help.*$/s, "");

    // Remove "You can learn more using this knowledge source" section and everything after it
    formattedText = formattedText.replace(
      /You can learn more using this knowledge source.*$/s,
      ""
    );

    // Remove "Help Prompt:" section and everything after it
    formattedText = formattedText.replace(/Help Prompt:.*$/s, "");

    // Clean up extra whitespace and normalize line breaks
    formattedText = formattedText.replace(/\r\n/g, "\n");
    formattedText = formattedText.replace(/\r/g, "\n");
    formattedText = formattedText.replace(/^\s+|\s+$/g, "");

    console.log("🧹 After basic cleanup:", formattedText);

    // Just return the cleaned text with proper line breaks, preserving emojis and structure
    const lines = formattedText.split("\n");
    const cleanedLines: string[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) {
        cleanedLines.push("");
        continue;
      }

      // Keep emojis and format properly
      if (
        trimmedLine.includes("📖") ||
        trimmedLine.includes("📚") ||
        trimmedLine.includes("💡") ||
        trimmedLine.includes("⭐")
      ) {
        cleanedLines.push(trimmedLine);
        continue;
      }

      // Handle bullet points starting with -
      if (trimmedLine.startsWith("-")) {
        cleanedLines.push(trimmedLine);
        continue;
      }

      // Handle numbered items like "1.", "2.", etc.
      if (trimmedLine.match(/^\d+\./)) {
        cleanedLines.push(`- ${trimmedLine}`);
        continue;
      }

      // Regular lines
      cleanedLines.push(trimmedLine);
    }

    // Join everything back together
    let finalText = cleanedLines.join("\n");

    // Clean up excessive blank lines
    finalText = finalText.replace(/\n{3,}/g, "\n\n");
    finalText = finalText.replace(/^\n+|\n+$/g, "");

    console.log("✨ Formatted mentor explanation:", finalText);
    console.log("📊 Final text length:", finalText.length);

    return finalText;
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
      // Call the dedicated AI Mentor Agent - sending only the subtopic
      const response = await callMentorAgent(topicSelection.subTopic);

      // n8n returns data directly, no polling needed
      if (response && (response as any).output) {
        const parsedContent = parseMentorExplanation((response as any).output);
        const formattedContent = formatMentorResponse(parsedContent);
        addMessage("mentor", formattedContent, "mentor_explanation");

        if ((response as any).threadId) {
          setConversationId((response as any).threadId);
        }

        setCurrentStage("help_decision");
      } else {
        addMessage("system", "Error: Failed to get mentor explanation");
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

  const handleHelpDecision = async (needsHelp: boolean) => {
    if (!needsHelp) {
      // Send "no" to AI and proceed to quiz
      addMessage("user", "No, I'm ready for the quiz!");
      setIsLoading(true);

      try {
        await callMentorAgent("no");
        setCurrentStage("quiz_prompt");
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to process response");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Open chat mode
      addMessage("user", "Yes, I have some questions!");
      setCurrentStage("chat_mode");
      addMessage(
        "mentor",
        "Great! What would you like to know more about? Feel free to ask any questions about the topic."
      );
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!message.trim()) return;

    addMessage("user", message);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await callMentorAgent(message);

      // n8n returns data directly, no polling needed
      if (response && (response as any).output) {
        const parsedContent = parseMentorExplanation((response as any).output);
        const formattedContent = formatMentorResponse(parsedContent);
        addMessage("mentor", formattedContent, "chat_mode");

        if ((response as any).threadId) {
          setConversationId((response as any).threadId);
        }
      } else {
        addMessage("system", "Error: Failed to get response");
      }
    } catch (error) {
      console.error("Error:", error);
      addMessage(
        "system",
        "I encountered an error while processing your question. Please try again."
      );
      toast.error("Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndChat = () => {
    setCurrentStage("quiz_prompt");
    addMessage(
      "mentor",
      "Now that we've covered your questions, would you like to take a quiz to test your understanding?"
    );
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

      // Handle the new structured return type
      if (!quizResponse.success) {
        console.error("Quiz generation failed:", quizResponse.error);
        addMessage(
          "system",
          quizResponse.error || "Failed to generate quiz. Please try again."
        );
        toast.error("Failed to generate quiz");
        return;
      }

      if (quizResponse.questions && quizResponse.questions.length > 0) {
        // Direct use of the structured questions array
        const questions = quizResponse.questions;
        console.log("Quiz questions received:", questions);

        setQuizData({ questions, totalQuestions: questions.length });
        setQuizStartTime(new Date());
        setCurrentQuestionIndex(0);
        setQuizAnswers([]);
        addMessage(
          "system",
          `Great! Let's test your knowledge with ${questions.length} questions about ${topicSelection.subTopic}.`
        );
      } else {
        addMessage(
          "system",
          "I had trouble generating quiz questions. Please try again."
        );
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
    console.log(
      `handleQuizAnswer called with questionId: ${questionId}, selectedAnswer: "${selectedAnswer}"`
    );

    // Find the current question to get the correct answer
    const currentQuestion = quizData?.questions.find(
      (q) => q.id === questionId
    );
    const isCorrect = currentQuestion?.correctAnswer === selectedAnswer;

    const newAnswer: QuizAnswer = {
      questionId,
      selectedAnswer,
      isCorrect,
    };

    console.log("Storing answer:", newAnswer);
    console.log("Question correct answer:", currentQuestion?.correctAnswer);
    console.log("User selected:", selectedAnswer);
    console.log("Is correct:", isCorrect);

    setQuizAnswers((prev) => {
      const filtered = prev.filter((a) => a.questionId !== questionId);
      const updated = [...filtered, newAnswer];
      console.log("Updated quiz answers:", updated);
      return updated;
    });
  };

  const handleQuizSubmission = async () => {
    // Check if all questions have been answered
    if (
      !quizData?.questions ||
      quizAnswers.length !== quizData.questions.length
    ) {
      toast.error("Please answer all questions before submitting");
      return;
    }

    // Verify each question has a valid answer
    const missingAnswers = quizData.questions.filter(
      (question) =>
        !quizAnswers.find(
          (answer) => answer.questionId === question.id && answer.selectedAnswer
        )
    );

    if (missingAnswers.length > 0) {
      toast.error(
        `Please answer question ${missingAnswers[0].id} before submitting`
      );
      return;
    }

    setIsLoading(true);
    setCurrentStage("quiz_feedback");

    try {
      // Generate quiz result - single API call
      const quizResponse = await callAnswerFeedbackTool();

      console.log("📋 Quiz response:", quizResponse);

      let quizContent = "Here's your quiz result:";
      const quizResp = quizResponse as any;

      // Check if response contains quiz questions instead of feedback
      if (quizResp.output && typeof quizResp.output === "string") {
        try {
          const cleanOutput = quizResp.output
            .replace(/```json\s*/, "")
            .replace(/\s*```$/, "")
            .trim();
          const parsedOutput = JSON.parse(cleanOutput);

          if (parsedOutput.all_questions) {
            console.log(
              "⚠️ Received quiz questions instead of feedback, extracting correct answer explanations"
            );
            quizContent = generateFeedbackFromQuestions(
              parsedOutput.all_questions
            );
          } else {
            quizContent = quizResp.output;
          }
        } catch (e) {
          quizContent = quizResp.output;
        }
      } else if (quizResp.answer) {
        quizContent = quizResp.answer;
      } else if (quizResp.output) {
        quizContent = quizResp.output;
      }

      // Format and display the result once
      const formattedResult = formatQuizFeedback(quizContent);
      addMessage("mentor", formattedResult, "quiz_summary");
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
                  userAnswer?.selectedAnswer === option ? "default" : "outline"
                }
                className="w-full text-left justify-start h-auto py-3 px-4"
                onClick={() => handleQuizAnswer(question.id, option)}
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
                    AI Mentor
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
                            ]?.map((subTopic: string) => (
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
                            <div
                              className={cn(
                                "text-sm leading-relaxed",
                                message.type === "mentor"
                                  ? "prose prose-sm max-w-none"
                                  : "whitespace-pre-wrap"
                              )}
                              dangerouslySetInnerHTML={
                                message.type === "mentor"
                                  ? { __html: message.content }
                                  : undefined
                              }
                            >
                              {message.type !== "mentor"
                                ? message.content
                                : null}
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
                  {/* Help Decision */}
                  {currentStage === "help_decision" && !isLoading && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Need More Help?
                          </h3>
                          <p className="text-gray-600">
                            Would you like help with any other part of this
                            topic — like a different concept, format, or
                            sub-section?
                          </p>
                          <div className="flex gap-4 justify-center">
                            <Button
                              onClick={() => handleHelpDecision(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                              size="lg"
                            >
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Yes, I have questions
                            </Button>
                            <Button
                              onClick={() => handleHelpDecision(false)}
                              variant="outline"
                              size="lg"
                              className="px-8"
                            >
                              <Target className="h-4 w-4 mr-2" />
                              No, ready for quiz
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Chat Mode */}
                  {currentStage === "chat_mode" && !isLoading && (
                    <Card>
                      <CardContent className="p-6">
                        <div className="text-center space-y-4">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Ask Your Questions
                          </h3>
                          <p className="text-gray-600">
                            Feel free to ask any questions about{" "}
                            {topicSelection.subTopic}
                          </p>
                          <Button
                            onClick={handleEndChat}
                            className="bg-green-600 hover:bg-green-700 text-white px-8"
                            size="lg"
                          >
                            <Target className="h-4 w-4 mr-2" />
                            Finish Questions & Take Quiz
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

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
            {(currentStage === "mentor_explanation" ||
              currentStage === "chat_mode") && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Textarea
                        placeholder={
                          currentStage === "chat_mode"
                            ? "Ask your questions about the topic..."
                            : "Ask follow-up questions about the topic..."
                        }
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500 rounded-xl"
                        rows={2}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (inputMessage.trim()) {
                              if (currentStage === "chat_mode") {
                                handleChatMessage(inputMessage);
                              } else {
                                addMessage("user", inputMessage);
                                setInputMessage("");
                                // Handle follow-up questions here if needed
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        if (inputMessage.trim()) {
                          if (currentStage === "chat_mode") {
                            handleChatMessage(inputMessage);
                          } else {
                            addMessage("user", inputMessage);
                            setInputMessage("");
                          }
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
                      💭{" "}
                      {currentStage === "chat_mode"
                        ? "Ask any questions about the topic"
                        : "Ask questions about the topic or proceed to quiz when ready"}
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
