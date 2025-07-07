"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { AssignmentsShimmer } from "@/components/AssignmentsShimmer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Calendar,
  Clock,
  Upload,
  Eye,
  CheckCircle,
  FileText,
  Loader2,
  X,
  Send,
  AlertCircle,
  Target,
  TrendingUp,
  Award,
  Filter,
  Search,
  Download,
  GraduationCap,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Brain,
  Star,
} from "lucide-react";
import { format, isAfter } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- RelevanceAI Config ---
const N8N_ASSIGNMENT_EVALUATOR_ENDPOINT = "https://vijiteshnaik.app.n8n.cloud/webhook/6d51e44c-1b35-4ba3-931a-aecc10f6293e";


interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  topic: string;
  difficulty: string;
  created_at: string;
  ai_generated_content: any;
  submissions?: Submission[];
}

interface Submission {
  id: string;
  status: string;
  submission_date: string;
  ai_evaluation: any;
  teacher_grade: number | null;
  teacher_feedback: string | null;
  file_name: string | null;
  file_path: string | null;
  grade: number | null;
  ai_feedback?: any;
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: string;
  semester?: number;
  created_at: string;
  updated_at: string;
}





// --- Helper: Parse AI Evaluation Result ---
function parseAIFeedback(aiResult: any) {
  console.log("[AI Feedback] Starting to parse AI feedback");
  console.log(
    "[AI Feedback] Raw AI Result:",
    JSON.stringify(aiResult, null, 2)
  );

  let parsed = aiResult;
  let rawText = "";
  let totalScore = null;

  // Handle the new N8N response format
  if (aiResult?.output) {
    console.log("[AI Feedback] Found output field from N8N agent");
    rawText = aiResult.output;
    parsed = {
      rawText: rawText,
      threadId: aiResult.threadId || null
    };
  } else if (aiResult?.raw) {
    console.log("[AI Feedback] Found raw field, attempting to parse");
    let raw = aiResult.raw;
    if (typeof raw === "string" && raw.startsWith("```json")) {
      console.log("[AI Feedback] Found JSON code block, cleaning up");
      raw = raw.replace(/```json|```/g, "").trim();
    }
    try {
      parsed = JSON.parse(raw);
      console.log("[AI Feedback] Successfully parsed raw JSON");
    } catch (e) {
      console.warn(
        "[AI Feedback] Not valid JSON, extracting from raw Markdown"
      );
      rawText = raw;
      parsed = {
        rawText: raw,
        Score: raw.match(/Score:\s*(\d+)/)?.[1] || null,
        "Overall Grade": raw.match(/Grade:\s*(\w+)/)?.[1] || null,
        "Constructive Feedback": {
          Strengths: extractSection(raw, "Strengths"),
          "Areas for Improvement": extractSection(raw, "Areas for Improvement"),
          Recommendations: extractSection(raw, "Recommendations"),
        },
        "Faculty Progress Summary": {
          "Academic Integrity": extractLineValue(raw, "Academic Integrity"),
          Status: extractLineValue(raw, "Status"),
          "Red Flags": extractLineValue(raw, "Red Flags"),
        },
      };
    }
  } else {
    rawText = JSON.stringify(aiResult, null, 2);
  }

  // Parse the new format with markdown table
  if (rawText && (rawText.includes("## 📊 Rubric-Based Scoring") || rawText.includes("📊 **Rubric-Based Scoring") || rawText.includes(":bar_chart: **Rubric-Based Scoring"))) {
    console.log("[AI Feedback] Parsing new N8N format with rubric table");
    
    // Extract total score from the table - handle both numbers and XX
    const totalMatchNumeric = rawText.match(/\|\s*\*\*Total\*\*\s*\|\s*\d+\s*\|\s*(\d+)\s*\|/);
    if (totalMatchNumeric) {
      totalScore = parseInt(totalMatchNumeric[1]);
      console.log("✅ Found Total AI Grade (numeric):", totalScore);
    } else {
      const totalMatchXX = rawText.match(/\|\s*\*\*Total\*\*\s*\|\s*\d+\s*\|\s*(XX)\s*\|/);
      if (totalMatchXX) {
        console.log("⚠️ Total score is XX (not graded yet)");
        totalScore = null;
      }
    }
    
    // Extract individual criteria scores and comments
    const rubricItems = [];
    const criteriaMatches = rawText.matchAll(/\|\s*([^|]+?)\s*\|\s*(\d+|XX)\s*\|\s*(\d+|XX)\s*\|\s*([^|]+?)\s*\|/g);
    
    console.log("🔍 All table matches found:", Array.from(criteriaMatches));
    const criteriaMatches2 = rawText.matchAll(/\|\s*([^|]+?)\s*\|\s*(\d+|XX)\s*\|\s*(\d+|XX)\s*\|\s*([^|]+?)\s*\|/g);
    
    for (const match of criteriaMatches2) {
      const criterion = match[1].trim();
      const weightageStr = match[2].trim();
      const scoreStr = match[3].trim();
      const comment = match[4].trim();
      
      // Parse values, handling XX as 0 for display purposes
      const weightage = weightageStr === "XX" ? 0 : parseInt(weightageStr);
      const score = scoreStr === "XX" ? 0 : parseInt(scoreStr);
      
      console.log("🔍 Processing row:", { criterion, weightage, score, comment });
      
      // Skip the header row and total row
      if (criterion !== "Criteria" && criterion !== "**Total**" && 
          !criterion.toLowerCase().includes("criteria")) {
        rubricItems.push({
          criterion,
          weightage,
          score,
          comment,
          isGraded: scoreStr !== "XX" // Track if this item is actually graded
        });
        console.log("✅ Added rubric item:", { criterion, weightage, score, isGraded: scoreStr !== "XX" });
      } else {
        console.log("⏭️ Skipped row:", criterion);
      }
    }
    
    console.log("📊 Final rubric items:", rubricItems);
    
    // Extract feedback sections - handle both new and old formats
    let summaryFeedback = "";
    let areasForImprovement = "";
    let recommendations = "";
    
    // Try the exact format from the console output (using unicode flag for emojis)
    const summaryMatch = rawText.match(/🧾 \*\*Summary Feedback\*\*:\s*\n([\s\S]+?)(?=🎓|$)/u);
    if (summaryMatch) {
      summaryFeedback = summaryMatch[1].trim();
      console.log("✅ Found Summary Feedback:", summaryFeedback);
    }
    
    const guidanceMatch = rawText.match(/🎓 \*\*Lecturer's Guidance\*\*:\s*\n([\s\S]+?)(?=$)/u);
    if (guidanceMatch) {
      const lecturerGuidance = guidanceMatch[1].trim();
      console.log("✅ Found Lecturer's Guidance:", lecturerGuidance);
      // The entire guidance section can be used as areas for improvement/recommendations
      areasForImprovement = lecturerGuidance;
      recommendations = lecturerGuidance;
    }
    
    // Try parsing the format from your example (bullet points with sections)
    if (!summaryFeedback) {
      // Look for: * **Strengths**: 
      const strengthsMatch = rawText.match(/\*\s*\*\*Strengths\*\*:\s*\n([^*]+?)(?=\n\*\s*\*\*|##|$)/s) || 
                            rawText.match(/\*\s*\*\*Strengths\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s);
      summaryFeedback = strengthsMatch ? strengthsMatch[1].trim() : "";
    }
    
    if (!areasForImprovement) {
      // Look for: * **Areas for Improvement**: 
      const directAreasMatch = rawText.match(/\*\s*\*\*Areas for Improvement\*\*:\s*\n([^*]+?)(?=\n\*\s*\*\*|##|$)/s) || 
                               rawText.match(/\*\s*\*\*Areas for Improvement\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s);
      areasForImprovement = directAreasMatch ? directAreasMatch[1].trim() : "";
    }
    
    if (!recommendations) {
      // Look for various recommendation patterns
      const patterns = [
        /\*\s*\*\*Recommendations\*\*:\s*\n([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
        /\*\s*\*\*Recommendations\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
        /\*\s*\*\*Improvement Suggestions\*\*:\s*\n([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
        /\*\s*\*\*Improvement Suggestions\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s
      ];
      
      for (const pattern of patterns) {
        const match = rawText.match(pattern);
        if (match) {
          recommendations = match[1].trim();
          break;
        }
      }
    }
    
    parsed = {
      rawText: rawText,
      threadId: aiResult.threadId || null,
      Score: totalScore,
      "Overall Grade": totalScore ? getGradeFromScore(totalScore) : null,
      "Constructive Feedback": {
        Strengths: summaryFeedback,
        "Areas for Improvement": areasForImprovement,
        Recommendations: recommendations,
      },
      "Rubric Items": rubricItems,
      "Faculty Progress Summary": {
        "Academic Integrity": "Clean", // Default assumption
        Status: "Evaluated",
        "Red Flags": "None",
      },
    };
  }

  // NEW: Add parsing for Summary Feedback and Lecturer's Guidance (if not already parsed above)
  if (rawText && !parsed["Constructive Feedback"]?.Strengths) {
    console.log("[AI Feedback] Trying to parse Summary Feedback sections");
    
    // Extract Summary Feedback
    const summaryMatch = rawText.match(/🧾 \*\*Summary Feedback\*\*:\s*\n([\s\S]+?)(?=🎓|$)/u);
    if (summaryMatch) {
      const summaryText = summaryMatch[1].trim();
      console.log("✅ Found Summary Feedback:", summaryText);
      
      if (!parsed["Constructive Feedback"]) {
        parsed["Constructive Feedback"] = {};
      }
      parsed["Constructive Feedback"].Strengths = summaryText;
    }
    
    // Extract Lecturer's Guidance
    const guidanceMatch = rawText.match(/🎓 \*\*Lecturer's Guidance\*\*:\s*\n([\s\S]+?)(?=$)/u);
    if (guidanceMatch) {
      const guidanceText = guidanceMatch[1].trim();
      console.log("✅ Found Lecturer's Guidance:", guidanceText);
      
      if (!parsed["Constructive Feedback"]) {
        parsed["Constructive Feedback"] = {};
      }
      parsed["Constructive Feedback"]["Areas for Improvement"] = guidanceText;
      parsed["Constructive Feedback"].Recommendations = guidanceText;
    }
  }

  const get = (obj: any, path: string, fallback: any = null) =>
    path
      .split(".")
      .reduce(
        (res, key) => (res && res[key] !== undefined ? res[key] : fallback),
        obj
      );

  const result = {
    ai_grade: String(get(parsed, "Score") || totalScore || ""),
    ai_overall_grade: get(parsed, "Overall Grade") || "",
    ai_strengths: get(parsed, "Constructive Feedback.Strengths") || "",
    ai_areas_for_improvement:
      get(parsed, "Constructive Feedback.Areas for Improvement") || "",
    ai_recommendations:
      get(parsed, "Constructive Feedback.Recommendations") || "",
    ai_rubric_breakdown: JSON.stringify(
      get(parsed, "Rubric Items") || get(parsed, "Rubric-Based Breakdown") || {}
    ),
    ai_academic_integrity:
      get(parsed, "Faculty Progress Summary.Academic Integrity") || "",
    ai_status: get(parsed, "Faculty Progress Summary.Status") || "",
    ai_red_flags: get(parsed, "Faculty Progress Summary.Red Flags") || "",
    ai_feedback: JSON.stringify(parsed, null, 2),
    ai_evaluation: parsed,
    grade: get(parsed, "Score") || null,
  };

  console.log("[AI Feedback] Parsed result:", {
    hasGrade: !!result.ai_grade,
    hasOverallGrade: !!result.ai_overall_grade,
    hasStrengths: !!result.ai_strengths,
    hasAreasForImprovement: !!result.ai_areas_for_improvement,
    hasRecommendations: !!result.ai_recommendations,
    hasRubricBreakdown: !!result.ai_rubric_breakdown,
    hasAcademicIntegrity: !!result.ai_academic_integrity,
    hasStatus: !!result.ai_status,
    hasRedFlags: !!result.ai_red_flags,
  });

  return result;
}

// Helper function to convert score to grade
function getGradeFromScore(score: number): string {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

// 🔧 Helper to extract sections like "Strengths", "Recommendations"
function extractSection(text: string, sectionTitle: string): string {
  const regex = new RegExp(
    `\\*\\*${sectionTitle}\\*\\*:\\s*([\\s\\S]*?)(\\n\\*\\*|\\n##|\\n$)`
  );
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

// 🔧 Helper to extract single-line entries like "Academic Integrity: Clean"
function extractLineValue(text: string, label: string): string {
  const regex = new RegExp(`${label}:\\s*(.*)`);
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

// Helper function to get grade color based on score
const getGradeColor = (score: number) => {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-blue-600";
  if (score >= 70) return "text-yellow-600";
  if (score >= 60) return "text-orange-600";
  return "text-red-600";
};



// Helper to format assignment description - preserves all content
// Helper to format assignment description - fixed to handle all cases properly
const formatAssignmentDescription = (description: string) => {
  if (!description) return null;

  // Process the text line by line
  const lines = description.split("\n");
  const elements = [];
  let currentParagraph = [];
  let inList = false;
  let listItems = [];
  let listType = null;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Check if this is a markdown header line (starts with #, ##, ###, etc.)
    if (trimmedLine.match(/^#{1,6}\s+/)) {
      // Save any pending paragraph
      if (currentParagraph.length > 0) {
        elements.push(
          <p
            key={`para-${elements.length}`}
            className="text-gray-700 leading-relaxed mb-4"
          >
            {currentParagraph.join(" ")}
          </p>
        );
        currentParagraph = [];
      }

      const headerLevel = trimmedLine.match(/^(#{1,6})/)?.[1].length || 1;
      const headerText = trimmedLine.replace(/^#{1,6}\s*/, "");

      // Create different header styles based on level
      if (headerLevel === 1) {
        elements.push(
          <h1
            key={`h1-${index}`}
            className="text-3xl font-bold text-gray-900 mt-8 mb-4"
          >
            {headerText}
          </h1>
        );
      } else if (headerLevel === 2) {
        elements.push(
          <h2
            key={`h2-${index}`}
            className="text-2xl font-bold text-gray-900 mt-6 mb-3"
          >
            {headerText}
          </h2>
        );
      } else {
        elements.push(
          <h3
            key={`h3-${index}`}
            className="text-xl font-bold text-gray-900 mt-6 mb-3"
          >
            {headerText}
          </h3>
        );
      }
    }
    // Check if line contains **bold text**
    else if (trimmedLine.includes("**")) {
      // Check if it's a header (ends with :)
      if (trimmedLine.match(/\*\*[^*]+:\*\*/)) {
        // Save any pending content
        if (currentParagraph.length > 0) {
          elements.push(
            <p
              key={`para-${elements.length}`}
              className="text-gray-700 leading-relaxed mb-4"
            >
              {currentParagraph.join(" ")}
            </p>
          );
          currentParagraph = [];
        }

        // Add the header
        elements.push(
          <h4 key={`h4-${index}`} className="font-bold text-gray-900 mt-4 mb-2">
            {trimmedLine.replace(/\*\*/g, "")}
          </h4>
        );
      } else {
        // It's inline bold text - add to current paragraph
        currentParagraph.push(trimmedLine);
      }
    }
    // Check if it's a bullet point (handle both - and *)
    else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
      if (!inList) {
        // Save any pending paragraph
        if (currentParagraph.length > 0) {
          elements.push(
            <p
              key={`para-${elements.length}`}
              className="text-gray-700 leading-relaxed mb-4"
            >
              {formatInlineText(currentParagraph.join(" "))}
            </p>
          );
          currentParagraph = [];
        }
        inList = true;
        listType = "bullet";
        listItems = [];
      }
      listItems.push(trimmedLine.substring(2));
    }
    // Check if it's a numbered list
    else if (trimmedLine.match(/^\d+\.\s/)) {
      if (!inList) {
        // Save any pending paragraph
        if (currentParagraph.length > 0) {
          elements.push(
            <p
              key={`para-${elements.length}`}
              className="text-gray-700 leading-relaxed mb-4"
            >
              {formatInlineText(currentParagraph.join(" "))}
            </p>
          );
          currentParagraph = [];
        }
        inList = true;
        listType = "numbered";
        listItems = [];
      }
      const content = trimmedLine.replace(/^\d+\.\s*/, "");
      listItems.push(content);
    }
    // Check if it's a table row (contains | characters)
    else if (trimmedLine.includes("|") && trimmedLine.split("|").length > 2) {
      // Save any pending content
      if (currentParagraph.length > 0) {
        elements.push(
          <p
            key={`para-${elements.length}`}
            className="text-gray-700 leading-relaxed mb-4"
          >
            {formatInlineText(currentParagraph.join(" "))}
          </p>
        );
        currentParagraph = [];
      }
      if (inList && listItems.length > 0) {
        // End any pending list
        if (listType === "bullet") {
          elements.push(
            <ul
              key={`ul-${elements.length}`}
              className="list-disc pl-6 space-y-2 mb-4"
            >
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-700">
                  {formatInlineText(item)}
                </li>
              ))}
            </ul>
          );
        } else {
          elements.push(
            <ol
              key={`ol-${elements.length}`}
              className="list-decimal pl-6 space-y-2 mb-4"
            >
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-700">
                  {formatInlineText(item)}
                </li>
              ))}
            </ol>
          );
        }
        listItems = [];
        inList = false;
      }

      // Parse table - collect all table rows starting from current line
      const tableRows = [];
      let currentLineIndex = index;
      
      // Check if this is a header separator line (contains only |, -, and spaces)
      const isHeaderSeparator = trimmedLine.match(/^[\|\-\s]+$/);
      
      // Start collecting table rows from current position
      while (currentLineIndex < lines.length) {
        const tableLine = lines[currentLineIndex].trim();
        if (tableLine.includes("|") && tableLine.split("|").length > 2) {
          // Skip header separator lines
          if (!tableLine.match(/^[\|\-\s]+$/)) {
            const cells = tableLine.split("|").map(cell => cell.trim()).filter(cell => cell);
            if (cells.length > 0) {
              tableRows.push(cells);
            }
          }
          currentLineIndex++;
        } else {
          break;
        }
      }
      
      // Skip the lines we've already processed
      lines.splice(index + 1, currentLineIndex - index - 1);
      
      if (tableRows.length > 0) {
        elements.push(
          <div key={`table-${elements.length}`} className="mb-6 overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow-sm">
              <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <tr>
                  {tableRows[0].map((header, i) => (
                    <th key={i} className="px-4 py-3 text-left text-sm font-semibold text-gray-800 border-b border-gray-300">
                      {formatInlineText(header)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.slice(1).map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-4 py-3 text-sm text-gray-700 border-b border-gray-200">
                        {formatInlineText(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }
    // Empty line - might signal end of list or paragraph
    else if (trimmedLine === "") {
      if (inList && listItems.length > 0) {
        // End the list
        if (listType === "bullet") {
          elements.push(
            <ul
              key={`ul-${elements.length}`}
              className="list-disc pl-6 space-y-2 mb-4"
            >
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-700">
                  {formatInlineText(item)}
                </li>
              ))}
            </ul>
          );
        } else {
          elements.push(
            <ol
              key={`ol-${elements.length}`}
              className="list-decimal pl-6 space-y-2 mb-4"
            >
              {listItems.map((item, i) => (
                <li key={i} className="text-gray-700">
                  {formatInlineText(item)}
                </li>
              ))}
            </ol>
          );
        }
        listItems = [];
        inList = false;
      } else if (currentParagraph.length > 0) {
        elements.push(
          <p
            key={`para-${elements.length}`}
            className="text-gray-700 leading-relaxed mb-4"
          >
            {formatInlineText(currentParagraph.join(" "))}
          </p>
        );
        currentParagraph = [];
      }
    }
    // Regular text
    else {
      if (inList) {
        // This might be continuation of the last list item
        if (
          listItems.length > 0 &&
          !trimmedLine.match(/^\d+\.\s/) &&
          !trimmedLine.startsWith("* ")
        ) {
          listItems[listItems.length - 1] += " " + trimmedLine;
        }
      } else {
        currentParagraph.push(trimmedLine);
      }
    }
  });

  // Handle any remaining content
  if (inList && listItems.length > 0) {
    if (listType === "bullet") {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="list-disc pl-6 space-y-2 mb-4"
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-700">
              {formatInlineText(item)}
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol
          key={`ol-${elements.length}`}
          className="list-decimal pl-6 space-y-2 mb-4"
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-gray-700">
              {formatInlineText(item)}
            </li>
          ))}
        </ol>
      );
    }
  } else if (currentParagraph.length > 0) {
    elements.push(
      <p
        key={`para-${elements.length}`}
        className="text-gray-700 leading-relaxed mb-4"
      >
        {formatInlineText(currentParagraph.join(" "))}
      </p>
    );
  }

  return <div className="space-y-2">{elements}</div>;
};

// Helper to format inline text with bold support
const formatInlineText = (text: string) => {
  if (!text) return text;

  // Split by ** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-gray-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

// --- Main Component ---
export default function StudentAssignments() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submissionStep, setSubmissionStep] = useState<"upload" | "submitting">(
    "upload"
  );
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("latest");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Fetch assignments + submissions ---
  useEffect(() => {
    if (user && (profile as Profile)?.semester) fetchAssignments();
    // eslint-disable-next-line
  }, [user, profile]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data: enrollments, error } = await supabase
        .from("assignment_enrollments")
        .select(
          `
          assignment_id,
          assignments (
            id,
            title,
            description,
            due_date,
            total_points,
            topic,
            difficulty,
            created_at,
            ai_generated_content,
            submissions (
              id,
              status,
              submission_date,
              ai_evaluation,
              teacher_grade,
              teacher_feedback,
              file_name,
              file_path,
              grade,
              ai_feedback,
               ai_feedback_show 
            )
          )
        `
        )
        .eq("student_id", user?.id);

      if (error) throw error;

      const assignmentsData =
        enrollments?.map((enrollment) => ({
          ...enrollment.assignments,
          submissions:
            enrollment.assignments?.submissions?.filter(
              (sub: any) => sub && typeof sub === "object"
            ) || [],
        })) || [];
      setAssignments(assignmentsData);
    } catch (e) {
      toast({
        title: "Error loading assignments",
        description: (e as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- File upload handler ---
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF, DOCX, or TXT file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File size should be less than 10MB",
        variant: "destructive",
      });
      return;
    }
    setSelectedFile(file);
  };

  // --- Upload to Supabase Storage ---
  const uploadFileToSupabase = async (
    file: File,
    studentId: string,
    assignmentId: string
  ): Promise<{ filePath: string; publicUrl: string }> => {
    const timestamp = Date.now();
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `${studentId}/${assignmentId}_${timestamp}_${safeFileName}`;
    const { data, error } = await supabase.storage
      .from("assignment-submissions")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("assignment-submissions")
      .getPublicUrl(filePath);
    return { filePath, publicUrl: urlData.publicUrl };
  };



 const callN8nAgent = async (criteria: string, subtopic: string, file_url: string) => {
  const payload = {
    criteria,
    subtopic,
    file_url
  };
  const response = await fetch(N8N_ASSIGNMENT_EVALUATOR_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`N8N Agent error: ${response.status}`);
  }
  return await response.json();
};

  // --- Submission Handler ---
  const handleSubmitAssignment = async (): Promise<void> => {
    if (!selectedAssignment || !selectedFile || !user || !profile) return;
    setSubmissionStep("submitting");
    try {
      // 1. Upload file
      const { filePath, publicUrl } = await uploadFileToSupabase(
        selectedFile,
        user.id,
        selectedAssignment.id
      );
      // 2. Extract content (for AI eval)
      
      // 3. Get AI evaluation
      
      const aiResult = await callN8nAgent(
  selectedAssignment.ai_generated_content, // criteria
  selectedAssignment.title,               // subtopic
  publicUrl                               // file_url
);

      console.log("AI Evaluation Result:", aiResult);
      // 4. Parse AI result
      const aiData = parseAIFeedback(aiResult);
      // 5. Insert to submissions (all fields)
      console.log("AI DATA ", aiData);

      const submissionId = uuidv4();
      const now = new Date().toISOString();

      const submissionPayload = {
        id: submissionId,
        assignment_id: selectedAssignment.id,
        student_id: user.id,
        script_url: publicUrl,
        file_path: filePath,
        file_name: selectedFile.name,
        submission_date: now,
        ai_feedback: JSON.parse(aiData.ai_feedback), // Store as JSON object
        grade: aiData.grade,
        ai_evaluation: aiData.ai_evaluation, // Store complete evaluation as JSON
        status: "submitted",
        created_at: now,
        updated_at: now,
      };

      console.log(
        "SUBMISSION PAYLOAD:",
        JSON.stringify(submissionPayload, null, 2)
      );
      console.log(
        "Assignment ai_generated_content:",
        selectedAssignment.ai_generated_content
      );
      console.log("Additional notes from student:", additionalNotes);

      const { error: insertErr } = await supabase
        .from("submissions")
        .insert([submissionPayload]);
      if (insertErr) throw insertErr;
      toast({
        title: "Assignment submitted! 🎉",
        description: "AI evaluation and feedback attached.",
      });
      setSubmitDialogOpen(false);
      setSelectedFile(null);
      setSubmissionStep("upload");
      setAdditionalNotes("");
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      setSubmissionStep("upload");
    }
  };

  const resetSubmission = (): void => {
    setSelectedFile(null);
    setSubmissionStep("upload");
    setAdditionalNotes("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- UI helpers ---
  const getSubmissionStatus = (assignment: Assignment | null) => {
    if (!assignment) return "not_submitted";
    const submission = assignment.submissions?.[0];
    if (!submission) return "not_submitted";
    return submission.status;
  };

  const getSubmissionBadge = (assignment: Assignment) => {
    const status = getSubmissionStatus(assignment);
    const isOverdue = isAfter(new Date(), new Date(assignment.due_date));
    switch (status) {
      case "submitted":
        return (
          <Badge className="bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Submitted
          </Badge>
        );
      case "graded":
        return (
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <Award className="h-3 w-3 mr-1" />
            Graded
          </Badge>
        );
      default:
        return isOverdue ? (
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        ) : (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return (
          <Badge className="bg-gradient-to-r from-green-400 to-emerald-400 text-white border-0">
            Easy
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
            Medium
          </Badge>
        );
      case "hard":
        return (
          <Badge className="bg-gradient-to-r from-red-400 to-pink-400 text-white border-0">
            Hard
          </Badge>
        );
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  // Filter and Sort assignments
  const filteredAndSortedAssignments = assignments
    .filter((assignment) => {
      const matchesSearch =
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.topic.toLowerCase().includes(searchTerm.toLowerCase());
      const status = getSubmissionStatus(assignment);
      const matchesFilter = filterStatus === "all" || status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "latest":
          // Sort by created date, newest first
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "due_date_nearest":
          // Sort by due date, nearest first
          return (
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          );
        case "due_date_farthest":
          // Sort by due date, farthest first
          return (
            new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
          );
        default:
          return 0;
      }
    });

  // Statistics
  const submittedCount = assignments.filter(
    (a) =>
      getSubmissionStatus(a) === "submitted" ||
      getSubmissionStatus(a) === "graded"
  ).length;
  const pendingCount = assignments.filter(
    (a) => getSubmissionStatus(a) === "not_submitted"
  ).length;
  const gradedCount = assignments.filter(
    (a) => getSubmissionStatus(a) === "graded"
  ).length;
  const completionRate =
    assignments.length > 0
      ? Math.round((submittedCount / assignments.length) * 100)
      : 0;

  const [dots, setDots] = useState("");

  // Animated dots effect
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(dotsInterval);
  }, []);

  // --- Main render ---
  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <ModernDashboardLayout>
          <AssignmentsShimmer />
        </ModernDashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto space-y-8 p-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                My Assignments
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Semester {(profile as Profile)?.semester} assignments and
                submissions
              </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    Total Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">
                    {assignments.length}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    Submitted
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">
                    {submittedCount}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">
                    {pendingCount}
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-600/10"></div>
                <CardHeader className="relative pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    Completion Rate
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-gray-900">
                    {completionRate}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-2xl border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Available Assignments
                </h2>

                {/* Filters */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Search assignments..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white/80 backdrop-blur-sm"
                      />
                    </div>
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white/80 backdrop-blur-sm">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="not_submitted">Pending</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="graded">Graded</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-56 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 bg-white/80 backdrop-blur-sm">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="due_date_nearest">
                        <div className="flex items-center">
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Due Date (Nearest First)
                        </div>
                      </SelectItem>
                      <SelectItem value="due_date_farthest">
                        <div className="flex items-center">
                          <ArrowDown className="h-4 w-4 mr-2" />
                          Due Date (Farthest First)
                        </div>
                      </SelectItem>
                      <SelectItem value="latest">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          Latest Assignment
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-6">
                {filteredAndSortedAssignments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BookOpen className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {assignments.length === 0
                        ? "No assignments yet"
                        : "No assignments match your search"}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      {assignments.length === 0
                        ? "New assignments will appear here when your teachers create them."
                        : "Try adjusting your search terms or filters."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {filteredAndSortedAssignments.map((assignment) => {
                      const status = getSubmissionStatus(assignment);
                      const isOverdue = isAfter(
                        new Date(),
                        new Date(assignment.due_date)
                      );
                      const submission = assignment.submissions?.[0];

                      return (
                        <Card
                          key={assignment.id}
                          className="border-0 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {assignment.title}
                                  </h3>
                                  {getSubmissionBadge(assignment)}
                                  {getDifficultyBadge(assignment.difficulty)}
                                </div>
                                <p className="text-gray-600 mb-4 line-clamp-2">
                                  {assignment.description ||
                                    assignment.ai_generated_content}
                                </p>
                                <div className="flex items-center gap-6 text-sm">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded">
                                      <Calendar className="h-3 w-3 text-white" />
                                    </div>
                                    <span
                                      className={
                                        isOverdue
                                          ? "text-red-600 font-medium"
                                          : "text-gray-600"
                                      }
                                    >
                                      Due:{" "}
                                      {format(
                                        new Date(assignment.due_date),
                                        "MMM dd, yyyy"
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded">
                                      <Target className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-gray-600">
                                      {assignment.total_points} points
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-gradient-to-r from-emerald-500 to-green-500 rounded">
                                      <BookOpen className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-gray-600">
                                      {assignment.topic}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-3 ml-6">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    console.log("VIEW DETAILS - Assignment Data:", assignment);
                                    setSelectedAssignment(assignment);
                                  }}
                                  className="hover:bg-blue-50 border-blue-200"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </Button>
                                {status === "not_submitted" && (
                                  <Button
                                    onClick={() => {
                                      setSelectedAssignment(assignment);
                                      setSubmitDialogOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Submit Work
                                  </Button>
                                )}
                                {submission?.file_path && (
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      // Download submission file
                                      const link = document.createElement("a");
                                      link.href = submission.file_path!;
                                      link.download =
                                        submission.file_name || "submission";
                                      link.click();
                                    }}
                                    className="hover:bg-green-50 border-green-200"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Submission Info */}
                            {submission && (
                              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">
                                      Submitted
                                    </span>
                                  </div>
                                  <span className="text-sm text-green-600">
                                    {format(
                                      new Date(submission.submission_date),
                                      "MMM dd, yyyy 'at' h:mm a"
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* View/Submit Dialog */}
            <Dialog
              open={!!selectedAssignment || submitDialogOpen}
              onOpenChange={() => {
                setSelectedAssignment(null);
                setSubmitDialogOpen(false);
                setSelectedFile(null);
                setSubmissionStep("upload");
              }}
            >
              <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
                <DialogHeader className="border-b pb-4">
                  <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {selectedAssignment?.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                  {/* Assignment Description with better formatting */}
                  {/* Assignment Description with better formatting */}
                  <div className="mb-6">
                    {/* Basic Description */}
                    {selectedAssignment?.description && (
                      <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Assignment Overview
                        </h3>
                        {formatAssignmentDescription(
                          selectedAssignment.description
                        )}
                      </div>
                    )}

                    {/* AI Generated Content - Detailed Assignment Brief */}
                    {selectedAssignment?.ai_generated_content && (
                      <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                        <h3 className="text-lg font-semibold text-blue-800 mb-3">
                          Detailed Assignment Brief
                        </h3>
                        {formatAssignmentDescription(
                          selectedAssignment.ai_generated_content
                        )}
                      </div>
                    )}

                    {/* Due date and points */}
                    <div className="flex justify-between items-center mt-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">
                          <span className="font-medium">Due:</span>{" "}
                          {selectedAssignment &&
                            format(
                              new Date(selectedAssignment.due_date),
                              "MMMM d, yyyy"
                            )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span className="text-gray-600">
                          <span className="font-medium">Points:</span>{" "}
                          {selectedAssignment?.total_points}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Due Date
                        </span>
                      </div>
                      <span className="text-lg font-bold text-blue-900">
                        {selectedAssignment &&
                          format(new Date(selectedAssignment.due_date), "PPP")}
                      </span>
                    </div>
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">
                          Total Points
                        </span>
                      </div>
                      <span className="text-lg font-bold text-purple-900">
                        {selectedAssignment?.total_points}
                      </span>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-emerald-600" />
                        <span className="text-sm font-medium text-emerald-800">
                          Topic
                        </span>
                      </div>
                      <span className="text-lg font-bold text-emerald-900">
                        {selectedAssignment?.topic}
                      </span>
                    </div>
                  </div>

                  {/* Submission Display */}
                  {selectedAssignment?.submissions &&
                    selectedAssignment.submissions.length > 0 && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200 mb-6">
                        <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Your Submission
                        </h3>
                        {selectedAssignment.submissions.map((submission) => (
                          <div key={submission.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-green-700">
                                Submitted Successfully
                              </span>
                              <span className="text-sm text-green-600">
                                {format(
                                  new Date(submission.submission_date),
                                  "PPp"
                                )}
                              </span>
                            </div>

                            {/* Teacher Grade and Feedback Section */}
                            {(submission.teacher_grade !== null ||
                              submission.teacher_feedback) && (
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <Award className="h-5 w-5 text-indigo-600" />
                                  <h4 className="font-bold text-indigo-800">
                                    Teacher Evaluation
                                  </h4>
                                </div>

                                {submission.teacher_grade !== null && (
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="bg-white/80 rounded-lg px-4 py-2">
                                      <span className="text-sm font-medium text-gray-600">
                                        Teacher Grade:{" "}
                                      </span>
                                      <span className="text-2xl font-bold text-indigo-700">
                                        {submission.teacher_grade}/100
                                      </span>
                                    </div>
                                    <Badge
                                      className={`${
                                        submission.teacher_grade >= 90
                                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                                          : submission.teacher_grade >= 80
                                          ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                                          : submission.teacher_grade >= 70
                                          ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                                          : submission.teacher_grade >= 60
                                          ? "bg-gradient-to-r from-orange-500 to-red-500"
                                          : "bg-gradient-to-r from-red-500 to-pink-500"
                                      } text-white border-0`}
                                    >
                                      {submission.teacher_grade >= 90
                                        ? "Excellent"
                                        : submission.teacher_grade >= 80
                                        ? "Good"
                                        : submission.teacher_grade >= 70
                                        ? "Satisfactory"
                                        : submission.teacher_grade >= 60
                                        ? "Pass"
                                        : "Fail"}
                                    </Badge>
                                  </div>
                                )}

                                {submission.teacher_feedback && (
                                  <div className="bg-white/60 rounded-lg p-3">
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                      Teacher Feedback:
                                    </div>
                                    <div className="text-sm text-gray-800 italic">
                                      "{submission.teacher_feedback}"
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {!submission.ai_feedback_show && submission.ai_feedback && (
  <div className="mt-4 text-sm text-gray-500 italic">
    The AI feedback for this submission is currently hidden by your teacher.
  </div>
)}


                            {/* AI Feedback and Rubric Section */}
                            {submission.ai_feedback_show && (

                            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200 mt-4">
                              <div className="flex items-center gap-2 mb-4">
                                <Brain className="h-5 w-5 text-cyan-600" />
                                <h4 className="font-bold text-cyan-800">
                                  Detailed Feedback & Assessment
                                </h4>
                              </div>

                              {/* Rubric Breakdown */}
                              {(() => {
                                const parseRubricFromSubmission = (submission: any) => {
                                  // First check if we have rubric items directly in ai_evaluation
                                  if (submission.ai_evaluation?.["Rubric Items"]) {
                                    return submission.ai_evaluation["Rubric Items"];
                                  }

                                  // Then check ai_feedback
                                  if (submission.ai_feedback?.["Rubric Items"]) {
                                    return submission.ai_feedback["Rubric Items"];
                                  }

                                  // Fallback to parsing rawText if available
                                  let rawText = "";
                                  if (submission.ai_evaluation?.rawText) {
                                    rawText = submission.ai_evaluation.rawText;
                                  } else if (submission.ai_feedback?.rawText) {
                                    rawText = submission.ai_feedback.rawText;
                                  } else if (typeof submission.ai_evaluation === 'string') {
                                    rawText = submission.ai_evaluation;
                                  } else if (typeof submission.ai_feedback === 'string') {
                                    rawText = submission.ai_feedback;
                                  }

                                  if (!rawText) {
                                    return null;
                                  }

                                  // Parse new rubric table format - handle both numeric scores and "XX" placeholders
                                  const rubricItems = [];
                                  const criteriaMatches = rawText.matchAll(/\|\s*([^|]+?)\s*\|\s*(\d+|XX)\s*\|\s*(\d+|XX)\s*\|\s*([^|]+?)\s*\|/g);
                                  
                                  for (const match of criteriaMatches) {
                                    const criterion = match[1].trim();
                                    const weightageStr = match[2].trim();
                                    const scoreStr = match[3].trim();
                                    const comment = match[4].trim();
                                    
                                    // Skip the header row and total row
                                    if (criterion !== "Criteria" && criterion !== "**Total**" && 
                                        !criterion.toLowerCase().includes("criteria")) {
                                      
                                      const weightage = weightageStr === "XX" ? 0 : parseInt(weightageStr);
                                      const score = scoreStr === "XX" ? 0 : parseInt(scoreStr);
                                      
                                      rubricItems.push({
                                        criterion,
                                        weightage,
                                        score,
                                        maxScore: weightage || 20, // Use weightage as max score, fallback to 20
                                        assessment: comment,
                                      });
                                    }
                                  }

                                  return rubricItems.length > 0 ? rubricItems : null;
                                };

                                const rubricItems = parseRubricFromSubmission(submission);

                                return rubricItems ? (
                                  <div className="mb-4">
                                    <h5 className="font-semibold text-cyan-700 mb-3 flex items-center gap-2">
                                      <Target className="h-4 w-4" />
                                      Detailed Rubric Assessment
                                    </h5>
                                    <div className="space-y-3">
                                      {rubricItems.map((item, index) => (
                                        <div
                                          key={index}
                                          className="bg-white/60 rounded-lg p-3"
                                        >
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <span className="font-medium text-gray-800 text-sm">
                                                {item.criterion?.replace(/\*\*/g, '') || item.criterion}
                                              </span>
                                              
                                            </div>
                                            

                                          </div>
                                          <div className="text-sm text-gray-600 mb-1">
                                             {item.comment}
                                          </div>
                                          <p className="text-xs text-gray-700">
                                            {item.assessment}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null;
                              })()}

                              {/* AI Feedback Sections */}
                              {(() => {
                                const getFeedbackData = (submission: any) => {
                                  let strengths = "";
                                  let areasForImprovement = "";
                                  let recommendations = "";

                                  // First try to get data from ai_evaluation
                                  if (submission.ai_evaluation) {
                                    const evalData = submission.ai_evaluation;
                                    if (evalData["Constructive Feedback"]) {
                                      const feedback = evalData["Constructive Feedback"];
                                      strengths = feedback.Strengths || "";
                                      areasForImprovement = feedback["Areas for Improvement"] || "";
                                      recommendations = feedback.Recommendations || "";
                                    }
                                  }

                                  // Fallback to ai_feedback if ai_evaluation doesn't have the data
                                  if (!strengths && !areasForImprovement && !recommendations && submission.ai_feedback) {
                                    const feedbackData = submission.ai_feedback;
                                    
                                    if (feedbackData["Constructive Feedback"]) {
                                      const feedback = feedbackData["Constructive Feedback"];
                                      strengths = feedback.Strengths || "";
                                      areasForImprovement = feedback["Areas for Improvement"] || "";
                                      recommendations = feedback.Recommendations || "";
                                    } else if (feedbackData.rawText) {
                                      // Parse from rawText using multiple patterns
                                      const rawText = feedbackData.rawText;

                                      // Try multiple patterns for strengths
                                      const strengthsPatterns = [
                                        /\*\s*\*\*Strengths\*\*:\s*\n([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
                                        /\*\s*\*\*Strengths\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
                                        /\*\*Strengths\*\*:\s*([^*]+?)(?=\n\*\*|$)/
                                      ];
                                      
                                      for (const pattern of strengthsPatterns) {
                                        const match = rawText.match(pattern);
                                        if (match) {
                                          strengths = match[1].trim();
                                          break;
                                        }
                                      }

                                      // Try multiple patterns for areas for improvement
                                      const areasPatterns = [
                                        /\*\s*\*\*Areas for Improvement\*\*:\s*\n([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
                                        /\*\s*\*\*Areas for Improvement\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
                                        /\*\*Areas for Improvement\*\*:\s*([^*]+?)(?=\n\*\*|$)/
                                      ];
                                      
                                      for (const pattern of areasPatterns) {
                                        const match = rawText.match(pattern);
                                        if (match) {
                                          areasForImprovement = match[1].trim();
                                          break;
                                        }
                                      }

                                      // Try multiple patterns for recommendations
                                      const recommendationsPatterns = [
                                        /\*\s*\*\*Recommendations\*\*:\s*\n([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
                                        /\*\s*\*\*Recommendations\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s,
                                        /\*\*Recommendations\*\*:\s*([^*]+?)(?=\n\*\*|$)/
                                      ];
                                      
                                      for (const pattern of recommendationsPatterns) {
                                        const match = rawText.match(pattern);
                                        if (match) {
                                          recommendations = match[1].trim();
                                          break;
                                        }
                                      }
                                    }
                                  }

                                  // Add fallback for direct text parsing if nothing found yet
                                  if (!strengths && !areasForImprovement && !recommendations) {
                                    let directText = "";
                                    if (typeof submission.ai_feedback === 'string') {
                                      directText = submission.ai_feedback;
                                    } else if (typeof submission.ai_evaluation === 'string') {
                                      directText = submission.ai_evaluation;
                                    }
                                    
                                    if (directText) {
                                      // Try the exact format from the feedback
                                      const summaryMatch = directText.match(/🧾 \*\*Summary Feedback\*\*:\s*\n([\s\S]+?)(?=🎓|$)/u);
                                      if (summaryMatch) {
                                        strengths = summaryMatch[1].trim();
                                      }
                                      
                                      const guidanceMatch = directText.match(/🎓 \*\*Lecturer's Guidance\*\*:\s*\n([\s\S]+?)(?=$)/u);
                                      if (guidanceMatch) {
                                        areasForImprovement = guidanceMatch[1].trim();
                                        recommendations = guidanceMatch[1].trim();
                                      }

                                      // Fallback patterns
                                      if (!strengths) {
                                        const strengthsMatch = directText.match(/\*\s*\*\*Strengths\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s);
                                        if (strengthsMatch) {
                                          strengths = strengthsMatch[1].trim();
                                        }
                                      }

                                      if (!areasForImprovement) {
                                        const areasMatch = directText.match(/\*\s*\*\*Areas for Improvement\*\*:\s*([^*]+?)(?=\n\*\s*\*\*|##|$)/s);
                                        if (areasMatch) {
                                          areasForImprovement = areasMatch[1].trim();
                                        }
                                      }
                                    }
                                  }
                                  
                                  return {
                                    strengths: strengths || "",
                                    areasForImprovement: areasForImprovement || "",
                                    recommendations: recommendations || "",
                                  };
                                };

                                const feedbackData = getFeedbackData(submission);

                                return feedbackData.strengths ||
                                  feedbackData.areasForImprovement ||
                                  feedbackData.recommendations ? (
                                  <div className="space-y-4">
                                    {feedbackData.strengths && (
                                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                          </div>
                                          <h6 className="font-bold text-blue-800 text-sm">
                                            📝 Summary Feedback
                                          </h6>
                                        </div>
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                          {feedbackData.strengths}
                                        </p>
                                      </div>
                                    )}

                                    {feedbackData.areasForImprovement && (
                                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-200 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg">
                                            <AlertCircle className="w-4 h-4 text-white" />
                                          </div>
                                          <h6 className="font-bold text-orange-800 text-sm">
                                            🎯 Areas for Improvement
                                          </h6>
                                        </div>
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                          {feedbackData.areasForImprovement}
                                        </p>
                                      </div>
                                    )}

                                    {feedbackData.recommendations && (
                                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200 shadow-sm">
                                        <div className="flex items-center gap-3 mb-3">
                                          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                            <Star className="w-4 h-4 text-white" />
                                          </div>
                                          <h6 className="font-bold text-purple-800 text-sm">
                                            ⭐ Recommendations
                                          </h6>
                                        </div>
                                        <p className="text-sm text-gray-800 leading-relaxed">
                                          {feedbackData.recommendations}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : null;
                              })()}
                            </div>
                            )} {/* end of AI Feedback and Rubric Section */}

                            {/* File Download Section */}
                            {/* last line of div */}
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Submission Form */}
                  {selectedAssignment &&
                    getSubmissionStatus(selectedAssignment) ===
                      "not_submitted" &&
                    submitDialogOpen && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                        <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                          <Upload className="h-5 w-5" />
                          Submit Your Work
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Upload File (txt / pdf / docx)
                            </label>
                            <Input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.docx,.txt"
                              onChange={handleFileUpload}
                              disabled={submissionStep === "submitting"}
                              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                            />
                            {selectedFile && (
                              <div className="flex items-center gap-2 mt-2 p-2 bg-white/80 rounded-lg">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium">
                                  {selectedFile.name}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={resetSubmission}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>

                          
                        </div>
                      </div>
                    )}
                </div>

                <>
                  {/* Loading state above footer */}
                  {submissionStep === "submitting" && (
                    <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
                          <Brain className="animate-pulse h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900 text-sm">
                            Processing Your Submission
                          </p>
                          <p className="text-xs text-blue-700">
                            Our AI agent is analyzing your work • Expected time:
                            30-90 seconds
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DialogFooter with consistent button sizes */}
                  <DialogFooter className="flex justify-between items-center gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitDialogOpen(false);
                        setSelectedAssignment(null);
                        resetSubmission();
                      }}
                      disabled={submissionStep === "submitting"}
                      className="px-4 py-2 h-auto text-sm" // Consistent small size
                    >
                      Close
                    </Button>

                    {submissionStep === "upload" &&
                      selectedFile &&
                      submitDialogOpen && (
                        <Button
                          onClick={handleSubmitAssignment}
                          className="flex items-center gap-2 px-4 py-2 h-auto text-sm bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                        >
                          <Send className="h-4 w-4" />
                          Submit Assignment
                        </Button>
                      )}
                  </DialogFooter>
                </>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
