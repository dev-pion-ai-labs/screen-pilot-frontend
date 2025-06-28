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
const RELEVANCE_CONFIG = {
  agent: {
    endpoint: "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
    authorization:
      "5cc7752400a6-4648-b47b-04fc92b47cae:sk-OGIxMWJiMzAtMTk5Ni00Nzk3LTk5MTYtZTFmZTI4NzIzNTNj",
    agent_id: "6c425902-6090-4781-b8de-df38ff3f26fb",
  },
  extractPdf: {
    endpoint:
      "https://api-d7b62b.stack.tryrelevance.com/latest/studios/5a6eaca2-6e92-4557-a299-c0e2bbbac201/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
    authorization:
      "5cc7752400a6-4648-b47b-04fc92b47cae:sk-OTJkZGIzNzYtMGU5Yi00MDY4LTk2NjEtM2JkODE4NjM4M2Jk",
  },
  extractDocx: {
    endpoint:
      "https://api-d7b62b.stack.tryrelevance.com/latest/studios/aa26fd47-2966-428c-b542-cb40e608357a/trigger_webhook?project=5cc7752400a6-4648-b47b-04fc92b47cae",
    authorization:
      "5cc7752400a6-4648-b47b-04fc92b47cae:sk-OWQzMGE4MTUtMjVmOS00Nzk5LWJkNzEtZDdjOWRkOWJmZGRm",
  },
  region: "d7b62b",
};

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  total_points: number;
  topic: string;
  difficulty: string;
  created_at: string;
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
  ai_grade?: any;
  ai_overall_grade?: any;
  ai_strengths?: string | null;
  ai_areas_for_improvement?: string | null;
  ai_recommendations?: string | null;
  ai_rubric_breakdown?: string | null;
  ai_academic_integrity?: string | null;
  ai_status?: string | null;
  ai_red_flags?: string | null;
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

// --- Helper: Extract text from uploaded file (supports .txt, .pdf, .docx) ---
async function extractTextFromFile(
  file: File,
  publicUrl: string
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  console.log(
    `[File Processing] Starting extraction for file: ${file.name} (${ext})`
  );

  if (ext === "txt") {
    console.log("[TXT Processing] Reading text file directly");
    const text = await file.text();
    console.log(
      "[TXT Processing] Successfully read text file, length:",
      text.length
    );
    return text;
  }

  if (ext === "pdf") {
    console.log("[PDF Processing] Starting PDF extraction");
    console.log("[PDF Processing] File URL:", publicUrl);

    // Wait for storage availability
    console.log("[PDF Processing] Waiting for file availability...");
    await new Promise((res) => setTimeout(res, 2000));

    console.log("[PDF Processing] Sending request to PDF extraction API");
    const response = await fetch(RELEVANCE_CONFIG.extractPdf.endpoint, {
      method: "POST",
      headers: {
        Authorization: RELEVANCE_CONFIG.extractPdf.authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_url: publicUrl }),
    });

    if (!response.ok) {
      console.error("[PDF Processing] API Error:", {
        status: response.status,
        statusText: response.statusText,
      });
      throw new Error(
        `PDF extraction API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log(
      "[PDF Processing] Raw API Response:",
      JSON.stringify(data, null, 2)
    );

    // Check all possible response formats
    const possibleTexts = [
      data?.result?.text,
      data?.output,
      data?.data,
      data?.scanned_data,
      data?.text,
    ];

    console.log("[PDF Processing] Checking possible text fields:", {
      hasResultText: !!data?.result?.text,
      hasOutput: !!data?.output,
      hasData: !!data?.data,
      hasScannedData: !!data?.scanned_data,
      hasText: !!data?.text,
    });

    const extracted = possibleTexts.find(
      (v) => typeof v === "string" && v.trim().length > 0
    );

    if (extracted) {
      console.log(
        "[PDF Processing] Successfully extracted text, length:",
        extracted.length
      );
      return extracted;
    }

    console.error(
      "[PDF Processing] Failed to extract text. Response structure:",
      {
        hasResult: !!data?.result,
        hasOutput: !!data?.output,
        hasData: !!data?.data,
        hasScannedData: !!data?.scanned_data,
        hasText: !!data?.text,
      }
    );

    throw new Error(
      "❌ PDF appears to be image-based or contains no extractable text. Try uploading a searchable/text-based PDF instead."
    );
  }

  if (ext === "docx") {
    console.log("[DOCX Processing] Starting DOCX extraction");
    console.log("[DOCX Processing] File URL:", publicUrl);

    const response = await fetch(RELEVANCE_CONFIG.extractDocx.endpoint, {
      method: "POST",
      headers: {
        Authorization: RELEVANCE_CONFIG.extractDocx.authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ doc_url: publicUrl }),
    });

    const data = await response.json();
    console.log(
      "[DOCX Processing] Raw API Response:",
      JSON.stringify(data, null, 2)
    );

    if (data?.result?.text) {
      console.log("[DOCX Processing] Extracted from result.text");
      return data.result.text;
    }
    if (data?.output) {
      console.log("[DOCX Processing] Extracted from output");
      return data.output;
    }
    if (data?.text) {
      console.log("[DOCX Processing] Extracted from text");
      return data.text;
    }

    console.error(
      "[DOCX Processing] Failed to extract text. Response structure:",
      {
        hasResult: !!data?.result,
        hasOutput: !!data?.output,
      }
    );
    throw new Error("❌ Failed to extract text from DOCX.");
  }

  console.error("[File Processing] Unsupported file type:", ext);
  throw new Error("❌ Unsupported file type");
}

// Helper function to convert UTC to IST
const convertToIST = (utcDate: string): string => {
  const date = new Date(utcDate);

  // Add 5 hours and 30 minutes for IST
  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);

  // Format the date
  return format(istDate, "dd MMM yyyy, hh:mm a") + " IST";
};

// Alternative function if you want to use the browser's timezone
const convertToLocalTime = (utcDate: string): string => {
  const date = new Date(utcDate);

  // This will convert to IST if the user's browser is set to IST
  return (
    date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " IST"
  );
};

// --- Helper: Parse AI Evaluation Result ---
function parseAIFeedback(aiResult: any) {
  console.log("[AI Feedback] Starting to parse AI feedback");
  console.log(
    "[AI Feedback] Raw AI Result:",
    JSON.stringify(aiResult, null, 2)
  );

  let parsed = aiResult;

  if (aiResult?.raw) {
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
  }

  const get = (obj: any, path: string, fallback: any = null) =>
    path
      .split(".")
      .reduce(
        (res, key) => (res && res[key] !== undefined ? res[key] : fallback),
        obj
      );

  const result = {
    ai_grade: String(get(parsed, "Score") || ""),
    ai_overall_grade: get(parsed, "Overall Grade") || "",
    ai_strengths: get(parsed, "Constructive Feedback.Strengths") || "",
    ai_areas_for_improvement:
      get(parsed, "Constructive Feedback.Areas for Improvement") || "",
    ai_recommendations:
      get(parsed, "Constructive Feedback.Recommendations") || "",
    ai_rubric_breakdown: JSON.stringify(
      get(parsed, "Rubric-Based Breakdown") || {}
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

    // Check if this is a header line (starts with ### or **)
    if (trimmedLine.startsWith("###")) {
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

      elements.push(
        <h3
          key={`h3-${index}`}
          className="text-xl font-bold text-gray-900 mt-6 mb-3"
        >
          {trimmedLine.replace(/^###\s*/, "")}
        </h3>
      );
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
  const [sortBy, setSortBy] = useState<string>("due_date_nearest");
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
              grade
            )
          )
        `
        )
        .eq("student_id", user?.id);

      console.log("Full response:", { data: enrollments, error });
      console.log("Enrollments count:", enrollments?.length);

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

  // --- AI Evaluation (pass content & file URL) ---
  const callRelevanceAgent = async (
    assignmentTitle: string,
    studentName: string,
    additionalNotes: string,
    fileContent: string,
    fileUrl: string
  ): Promise<any> => {
    const message = `Assignment Title: ${assignmentTitle}
Student: ${studentName}
Notes from student: ${additionalNotes || "None"}
Assignment File URL: ${fileUrl}
Assignment Text Content:
${fileContent}
Please evaluate the assignment according to the assignment rubric, provide an overall grade and a rubric-based breakdown, and detailed feedback in JSON.`;
    const payload = {
      message: { role: "user", content: message },
      agent_id: RELEVANCE_CONFIG.agent.agent_id,
    };
    const response = await fetch(RELEVANCE_CONFIG.agent.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: RELEVANCE_CONFIG.agent.authorization,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`AI Agent error: ${response.status}`);
    const data = await response.json();
    // Poll for result
    if (data?.job_info?.studio_id && data?.job_info?.job_id) {
      return await pollAgentResponse(
        data.job_info.studio_id,
        data.job_info.job_id
      );
    } else {
      throw new Error("AI Agent did not return job info");
    }
  };

  const pollAgentResponse = async (
    studioId: string,
    jobId: string
  ): Promise<any> => {
    const maxAttempts = 20;
    let attempts = 0;
    while (attempts < maxAttempts) {
      const res = await fetch(
        `https://api-${RELEVANCE_CONFIG.region}.stack.tryrelevance.com/latest/studios/${studioId}/async_poll/${jobId}`,
        { headers: { Authorization: RELEVANCE_CONFIG.agent.authorization } }
      );
      if (!res.ok) throw new Error(`Polling failed: ${res.status}`);
      const status = await res.json();
      for (const update of status.updates || []) {
        if (update.type === "chain-success" && update.output) {
          let content = "";
          if (update.output.output && update.output.output.answer)
            content = update.output.output.answer;
          else if (typeof update.output === "string") content = update.output;
          else if (
            update.output.answer &&
            typeof update.output.answer === "string"
          )
            content = update.output.answer;
          else content = JSON.stringify(update.output, null, 2);
          // Try to parse JSON in response
          try {
            return typeof content === "string" && content.startsWith("{")
              ? JSON.parse(content)
              : { raw: content };
          } catch {
            return { raw: content };
          }
        }
        if (update.type === "chain-error")
          throw new Error(update.error || "AI evaluation failed");
      }
      attempts++;
      await new Promise((res) => setTimeout(res, 3000));
    }
    throw new Error("AI evaluation timed out");
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
      const fileContent = await extractTextFromFile(selectedFile, publicUrl);
      // 3. Get AI evaluation
      const aiResult = await callRelevanceAgent(
        selectedAssignment.title,
        profile.full_name,
        additionalNotes,
        fileContent,
        publicUrl
      );
      // 4. Parse AI result
      const aiData = parseAIFeedback(aiResult);
      // 5. Insert to submissions (all fields)
      console.log("AI DATA ", aiData);

      const submissionId = uuidv4();
      const now = new Date().toISOString();
      const { error: insertErr } = await supabase.from("submissions").insert([
        {
          id: submissionId,
          assignment_id: selectedAssignment.id,
          student_id: user.id,
          script_url: publicUrl,
          file_path: filePath,
          file_name: selectedFile.name,
          submission_date: now,
          ai_feedback: aiData.ai_feedback,
          grade: aiData.grade,
          ai_grade: aiData.ai_grade,
          ai_overall_grade: aiData.ai_overall_grade,
          ai_strengths: aiData.ai_strengths,
          ai_areas_for_improvement: aiData.ai_areas_for_improvement,
          ai_recommendations: aiData.ai_recommendations,
          ai_rubric_breakdown: aiData.ai_rubric_breakdown,
          ai_academic_integrity: aiData.ai_academic_integrity,
          ai_status: aiData.ai_status,
          ai_red_flags: aiData.ai_red_flags,
          ai_evaluation: aiData.ai_evaluation,
          status: "submitted",
          created_at: now,
          updated_at: now,
        },
      ]);
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
                                  {assignment.description}
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
                                  onClick={() =>
                                    setSelectedAssignment(assignment)
                                  }
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
                    <div className="bg-gray-50/50 rounded-xl p-6 border border-gray-100">
                      {formatAssignmentDescription(
                        selectedAssignment?.description || ""
                      )}
                    </div>

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
                              Upload File (Only TXT)
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

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Notes (Optional)
                            </label>
                            <Textarea
                              placeholder="Add any additional notes or comments about your submission..."
                              value={additionalNotes}
                              onChange={(e) =>
                                setAdditionalNotes(e.target.value)
                              }
                              rows={3}
                              className="border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                <DialogFooter className="flex gap-3 pt-4 border-t border-gray-100 mt-auto">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSubmitDialogOpen(false);
                      setSelectedAssignment(null);
                      resetSubmission();
                    }}
                    disabled={submissionStep === "submitting"}
                    className="px-6 py-3 h-auto"
                  >
                    Close
                  </Button>

                  {submissionStep === "upload" &&
                    selectedFile &&
                    submitDialogOpen && (
                      <Button
                        onClick={handleSubmitAssignment}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0 px-6 py-3 h-auto"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Submit Assignment
                      </Button>
                    )}

                  {submissionStep === "submitting" && (
                    <div className="flex items-center gap-2 px-6 py-3">
                      <Loader2 className="animate-spin h-5 w-5 text-blue-600" />
                      <span className="font-medium">
                        Submitting and evaluating...
                      </span>
                    </div>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
