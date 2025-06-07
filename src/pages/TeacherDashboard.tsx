"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/integrations/supabase/client"
import {
  BookOpen,
  Users,
  FileText,
  Plus,
  Sparkles,
  Calendar,
  Target,
  GraduationCap,
  Clock,
  User,
  Loader2,
  Paperclip,
  ArrowUp,
  TrendingUp,
  CheckCircle,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface Assignment {
  id: string
  title: string
  description: string
  due_date: string
  submissions: any[]
}

interface Message {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: Date
  isError?: boolean
  isFile?: boolean
  fileName?: string
  fileSize?: number
  aiResponse?: any
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

const isSafari = () => {
  const ua = navigator.userAgent.toLowerCase()
  return ua.indexOf("safari") !== -1 && ua.indexOf("chrome") === -1
}

const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

const safeFetch = (url: string, options: RequestInit): Promise<Response> => {
  const safariOptions = {
    ...options,
    mode: "cors" as RequestMode,
    credentials: "omit" as RequestCredentials,
    headers: {
      ...options.headers,
      "User-Agent": navigator.userAgent,
    },
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Request timeout")), 30000)
  })

  return Promise.race([fetch(url, safariOptions), timeoutPromise])
}

const smartDelay = (ms: number): Promise<void> => {
  const delayTime = isSafari() || isIOS() ? ms * 1.5 : ms
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "undefined") {
      let start: number
      const step = (timestamp: number) => {
        if (!start) start = timestamp
        if (timestamp - start >= delayTime) {
          resolve()
        } else {
          requestAnimationFrame(step)
        }
      }
      requestAnimationFrame(step)
    } else {
      setTimeout(resolve, delayTime)
    }
  })
}

const RELEVANCE_CONFIG = {
  agent: {
    endpoint: "https://api-d7b62b.stack.tryrelevance.com/latest/agents/trigger",
    authorization: "5cc7752400a6-4648-b47b-04fc92b47cae:sk-NmM2YzQ1N2ItM2Q0ZC00NTQ3LTg2YzYtZTU4NjQ3ODkxYWVj",
    agent_id: "42219033-a9cd-4dca-97b2-a1f2c73ebb64",
  },
  tools: {
    generateAssignment: {
      endpoint:
        "https://api-d7b62b.stack.tryrelevance.com/latest/studios/01eebbab-522a-4c36-9baa-bc97bc7d2e89/trigger_webhook",
      authorization: "5cc7752400a6-4648-b47b-04fc92b47cae:sk-OTliYjJlMGMtOTEzOC00MTQwLTlhN2QtZmQzZDI2ZTUzOWU1",
    },
    runPythonCode: {
      endpoint:
        "https://api-d7b62b.stack.tryrelevance.com/latest/studios/e43078da-1071-4681-8677-02b2cb1d77cf/trigger_webhook",
      authorization: "5cc7752400a6-4648-b47b-04fc92b47cae:sk-MTY3NWNhYmYtOWEwNi00ZjVkLWJjYmEtNjY1OWE1MTA4MmY4",
    },
  },
  region: "d7b62b",
  project: "5cc7752400a6-4648-b47b-04fc92b47cae",
}

export default function TeacherDashboard() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Chat state with improvements
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  // New state for preventing loops and duplicates
  const [processedMessageIds, setProcessedMessageIds] = useState<Set<string>>(new Set())
  const [lastRequestTime, setLastRequestTime] = useState<number>(0)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  // State for assignment creation tracking
  const [currentSemester, setCurrentSemester] = useState<number | null>(null)
  const [currentTopic, setCurrentTopic] = useState<string | null>(null)
  const [currentDueDate, setCurrentDueDate] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Constants for rate limiting
  const MIN_REQUEST_INTERVAL = 2000 // 2 seconds
  const MAX_MESSAGE_LENGTH = 4000

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchAssignments()
  }, [])

  useEffect(() => {
    const welcomeMessage: Message = {
      id: `welcome_${Date.now()}`,
      type: "agent",
      content: `Welcome to AI Assistant Manager, your intelligent teaching companion!

I can help you with:
• Generating custom assignments and exercises
• Creating lesson plans and educational materials
• Running Python code for demonstrations
• Managing classroom activities and resources
• Providing teaching suggestions and best practices

Ask me anything or upload files to get started with your teaching tasks.`,
      timestamp: new Date(),
    }

    setMessages([welcomeMessage])
  }, [])

  const fetchAssignments = async () => {
    try {
      const { data: assignmentsData } = await supabase
        .from("assignments")
        .select(`
          *,
          submissions(*)
        `)
        .eq("teacher_id", (profile as Profile)?.id)
        .order("created_at", { ascending: false })

      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error("Error fetching assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to parse assignment data from AI response
  const parseAssignmentFromResponse = (content: string, semester: number | null, topic: string | null, dueDate: string | null) => {
    console.log('🔍 Parsing assignment with parameters:', {
      content: content.substring(0, 100) + '...',
      semester,
      topic,
      dueDate
    })

    let title = ''
    let description = content
    let parsedDueDate = dueDate

    // Extract title with more flexible patterns
    const titlePatterns = [
      /\*\*ASSIGNMENT TITLE\*\*:\s*(.+?)(?:\n|$)/i,
      /ASSIGNMENT TITLE:\s*(.+?)(?:\n|$)/i,
      /Assignment Title:\s*(.+?)(?:\n|$)/i,
      /Title:\s*(.+?)(?:\n|$)/i
    ]

    for (const pattern of titlePatterns) {
      const match = content.match(pattern)
      if (match) {
        title = match[1].trim()
        console.log('📝 Found title:', title)
        break
      }
    }

    // Extract description with more flexible patterns
    const descPatterns = [
      /\*\*ASSIGNMENT DESCRIPTION\*\*:\s*([\s\S]*?)(?:\*\*DUE DATE\*\*|$)/i,
      /ASSIGNMENT DESCRIPTION:\s*([\s\S]*?)(?:DUE DATE|$)/i,
      /Assignment Description:\s*([\s\S]*?)(?:Due Date|$)/i
    ]

    for (const pattern of descPatterns) {
      const match = content.match(pattern)
      if (match) {
        description = match[1].trim()
        console.log('📄 Found description length:', description.length)
        break
      }
    }

    // Extract due date from content if not already set
    const dueDatePatterns = [
      /\*\*DUE DATE\*\*:\s*(.+?)(?:\n|$)/i,
      /DUE DATE:\s*(.+?)(?:\n|$)/i,
      /Due Date:\s*(.+?)(?:\n|$)/i
    ]

    for (const pattern of dueDatePatterns) {
      const match = content.match(pattern)
      if (match && !parsedDueDate) {
        parsedDueDate = match[1].trim()
        console.log('📅 Found due date in content:', parsedDueDate)
        break
      }
    }

    // Format the due date if it exists
    let formattedDueDate = null
    if (parsedDueDate) {
      try {
        // Handle DD/MM/YYYY format
        const [day, month, year] = parsedDueDate.split(/[\/\-]/).map(num => parseInt(num, 10))
        if (day && month && year) {
          // Create date with proper month (0-based index)
          const date = new Date(year, month - 1, day)
          if (!isNaN(date.getTime())) {
            formattedDueDate = date.toISOString()
            console.log('📅 Formatted due date:', formattedDueDate)
          } else {
            console.log('⚠️ Invalid date values:', { day, month, year })
          }
        } else {
          console.log('⚠️ Invalid date format:', parsedDueDate)
        }
      } catch (error) {
        console.error('❌ Error formatting date:', error)
      }
    }

    // Ensure we have a valid due date
    if (!formattedDueDate) {
      // Set a default due date (30 days from now) if none provided
      const defaultDate = new Date()
      defaultDate.setDate(defaultDate.getDate() + 30)
      formattedDueDate = defaultDate.toISOString()
      console.log('📅 Using default due date:', formattedDueDate)
    }

    // Ensure we have a valid semester
    if (!semester) {
      console.log('⚠️ No semester provided, using current semester:', currentSemester)
      semester = currentSemester
    }

    const result = {
      title: title || 'AI Generated Assignment',
      description,
      dueDate: formattedDueDate,
      semester: semester || 1,
      topic: topic || '',
      aiGeneratedContent: content
    }

    console.log('✅ Final parsed assignment data:', result)
    return result
  }

  // Function to save assignment to database
  const saveAssignmentToDatabase = async (assignmentData: any) => {
    try {
      console.log('💾 Saving assignment with data:', assignmentData)

      // Ensure we have a valid semester
      if (!assignmentData.semester) {
        console.log('⚠️ No semester in assignment data, using current semester:', currentSemester)
        assignmentData.semester = currentSemester || 1
      }

      // Ensure we have a valid due date
      if (!assignmentData.dueDate) {
        const defaultDate = new Date()
        defaultDate.setDate(defaultDate.getDate() + 30)
        assignmentData.dueDate = defaultDate.toISOString()
        console.log('📅 Using default due date for database:', assignmentData.dueDate)
      }

      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            title: assignmentData.title,
            description: assignmentData.description,
            teacher_id: (profile as Profile)?.id,
            semester: assignmentData.semester,
            topic: assignmentData.topic,
            due_date: assignmentData.dueDate,
            total_points: 100,
            difficulty: 'medium',
            ai_generated_content: assignmentData.aiGeneratedContent,
            status: 'published'
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('❌ Error saving assignment:', error)
        throw error
      }

      console.log('✅ Assignment saved successfully:', data)

      toast({
        title: "Assignment Created Successfully!",
        description: `Assignment has been created and assigned to all Semester ${assignmentData.semester} students.`
      })

      // Refresh assignments list
      fetchAssignments()

      return data
    } catch (error) {
      console.error('❌ Error saving assignment:', error)
      toast({
        title: "Error",
        description: "Failed to save assignment. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Function to detect if response contains a complete assignment
  const isCompleteAssignment = (content: string) => {
    console.log('Checking if complete assignment:', content.substring(0, 200))

    const hasTitle = /\*\*ASSIGNMENT TITLE\*\*|ASSIGNMENT TITLE|Assignment Title/i.test(content)
    const hasDescription = /\*\*ASSIGNMENT DESCRIPTION\*\*|ASSIGNMENT DESCRIPTION|Assignment Description/i.test(content)
    const hasDueDate = /\*\*DUE DATE\*\*|DUE DATE|Due Date/i.test(content) || currentDueDate

    const isComplete = hasTitle && hasDescription && hasDueDate
    console.log('Assignment completeness check:', { hasTitle, hasDescription, hasDueDate, isComplete })

    return isComplete
  }

  // Function to extract semester from user message
  const extractSemesterFromMessage = (message: string) => {
    console.log('🔍 Extracting semester from message:', message);

    // Only match explicit semester selection, not any lone digit
    const explicitMatch = message.match(/\b(?:sem|semester)\s*(\d{1,2})\b/i);
    if (explicitMatch) {
      const semester = parseInt(explicitMatch[1]);
      console.log('📚 Found explicit semester match:', semester);
      if (semester >= 1 && semester <= 8) {
        return semester;
      }
    }

    // Don't fall back to lone digit or number in the message!
    // This prevents accidental semester detection from "Part 1", etc.

    console.log('❌ No valid semester found in message');
    return null;
  }

  // Function to extract topic from message
  const extractTopicFromMessage = (message: string) => {
    const topicPatterns = [
      /film and society part \d+/i,
      /introduction to direction & screenwriting part \d+/i,
      /film and society/i,
      /direction.*screenwriting/i
    ]

    for (const pattern of topicPatterns) {
      const match = message.match(pattern)
      if (match) {
        return match[0]
      }
    }
    return null
  }

  // Function to extract due date from message
  const extractDueDateFromMessage = (message: string) => {
    console.log('🔍 Starting due date extraction from message:', message)

    const datePatterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/
    ]

    console.log('📅 Testing date patterns:', datePatterns)

    for (const pattern of datePatterns) {
      const match = message.match(pattern)
      console.log('🔎 Testing pattern:', pattern, 'Match result:', match)

      if (match) {
        console.log('✅ Found matching date:', match[0])
        return match[0]
      }
    }

    console.log('❌ No date pattern matched in message')
    return null
  }

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Utility functions
  const getInitials = (name: string) => {
    if (!name) return "T"
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const getGreeting = () => {
    const hour = currentTime.getHours()
    if (hour < 12) return "Good Morning"
    if (hour < 17) return "Good Afternoon"
    return "Good Evening"
  }

  const getInspirationalMessage = () => {
    const messages = [
      "Inspiring the next generation of leaders!",
      "Great teachers make great students.",
      "Today is a perfect day to make a difference.",
      "Your guidance shapes the future.",
      "Teaching creates all other professions.",
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  // Message validation
  const isValidMessage = (content: string): boolean => {
    return content.trim().length > 0 && content.trim().length <= MAX_MESSAGE_LENGTH
  }

  // Generate unique message ID
  const generateMessageId = (prefix: string): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Process agent response with better error handling
  const processAgentResponse = (content: any): string => {
    if (typeof content === "string") {
      return content.trim()
    }

    if (typeof content === "object" && content !== null) {
      // Handle nested output structures
      if (content.output && content.output.answer) {
        return String(content.output.answer).trim()
      }
      if (content.answer) return String(content.answer).trim()
      if (content.response) return String(content.response).trim()
      if (content.result) return String(content.result).trim()
      if (content.text) return String(content.text).trim()
      if (content.message) return String(content.message).trim()
      if (content.output && typeof content.output === "string") {
        return content.output.trim()
      }

      // Check for other common response patterns
      if (content.data && typeof content.data === "string") {
        return content.data.trim()
      }

      // Avoid returning raw JSON unless it's a structured response
      const jsonStr = JSON.stringify(content, null, 2)
      if (jsonStr.length < 500) {
        return `Response: ${jsonStr}`
      }

      return "Task completed successfully."
    }

    const result = String(content || "Task completed.").trim()
    return result.length > 0 ? result : "Response received."
  }

  // Enhanced API call with better error handling and conversation ID extraction
  const callRelevanceAgent = async (message: string, conversationId: string | null = null): Promise<any> => {
    if (!message || message.trim().length === 0) {
      throw new Error("Message cannot be empty")
    }

    const cleanMessage = message.trim()
    if (cleanMessage.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Message too long")
    }

    const payload: any = {
      message: { role: "user", content: cleanMessage },
      agent_id: RELEVANCE_CONFIG.agent.agent_id,
    }

    // Only include conversation_id if it's valid and not empty
    if (conversationId && conversationId.trim().length > 0) {
      payload.conversation_id = conversationId.trim()
    }

    console.log("Sending payload:", JSON.stringify(payload, null, 2))

    try {
      const fetchFunction = isSafari() ? safeFetch : fetch
      const response = await fetchFunction(RELEVANCE_CONFIG.agent.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: RELEVANCE_CONFIG.agent.authorization,
          Accept: "application/json",
          ...(isSafari() && {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          }),
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("API Error Response:", errorText)
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()
      console.log("Full agent response received:", JSON.stringify(result, null, 2))

      return result
    } catch (error) {
      console.error("Agent Call Error:", error)
      throw error
    }
  }

  // Enhanced polling with circuit breaker and conversation ID extraction
  const pollAgentResponse = async (jobInfo: any): Promise<any> => {
    const maxAttempts = isSafari() ? 30 : 25
    let attempts = 0
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 3
    const baseDelay = 2000

    console.log("Starting polling for job:", jobInfo.job_id)
    console.log("Job info conversation_id:", jobInfo.conversation_id)

    while (attempts < maxAttempts && consecutiveErrors < maxConsecutiveErrors) {
      try {
        const pollUrl = `https://api-${RELEVANCE_CONFIG.region}.stack.tryrelevance.com/latest/studios/${jobInfo.studio_id}/async_poll/${jobInfo.job_id}`

        const fetchFunction = isSafari() ? safeFetch : fetch
        const response = await fetchFunction(pollUrl, {
          method: "GET",
          headers: {
            Authorization: RELEVANCE_CONFIG.agent.authorization,
            Accept: "application/json",
            ...(isSafari() && {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            }),
          },
        })

        if (!response.ok) {
          consecutiveErrors++
          throw new Error(`Polling failed: ${response.status} - ${response.statusText}`)
        }

        consecutiveErrors = 0
        const status = await response.json()

        console.log(`Polling attempt ${attempts + 1}:`, status.updates?.length || 0, "updates")
        console.log("Full status response:", status)

        for (const update of status.updates || []) {
          if (update.type === "chain-success") {
            console.log("Chain success:", update.output)

            let extractedConversationId = null

            if (update.conversation_id) {
              extractedConversationId = update.conversation_id
            } else if (jobInfo.conversation_id) {
              extractedConversationId = jobInfo.conversation_id
            } else if (status.conversation_id) {
              extractedConversationId = status.conversation_id
            } else if (update.output && update.output.conversation_id) {
              extractedConversationId = update.output.conversation_id
            }

            console.log("Extracted conversation ID:", extractedConversationId)

            return {
              success: true,
              content: update.output,
              conversationId: extractedConversationId,
            }
          }
          if (update.type === "chain-error") {
            console.error("Chain error:", update.error)
            return {
              success: false,
              error: update.error || "An error occurred during processing.",
            }
          }
        }

        attempts++
        const delay = Math.min(baseDelay + attempts * 300, 8000)
        await smartDelay(delay)

      } catch (error) {
        console.error(`Polling error on attempt ${attempts + 1}:`, error)
        attempts++
        consecutiveErrors++

        const errorDelay = Math.min(3000 + consecutiveErrors * 1000, 10000)
        await smartDelay(errorDelay)
      }
    }

    return {
      success: false,
      error: `Request timed out after ${maxAttempts} attempts or too many consecutive errors. Please try again.`,
    }
  }

  // Main message handler with assignment creation logic
  const handleSendMessage = useCallback(async (): Promise<void> => {
    // Early validation checks
    if (!inputMessage.trim() || isLoading || isProcessing) {
      console.log("Message rejected:", { empty: !inputMessage.trim(), loading: isLoading, processing: isProcessing })
      return
    }

    if (!isValidMessage(inputMessage)) {
      console.log("Invalid message length:", inputMessage.length)
      toast({
        title: "Invalid Message",
        description: "Message is too long or empty. Please try again.",
        variant: "destructive"
      })
      return
    }

    // Rate limiting
    const now = Date.now()
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      console.log("Rate limit hit:", { now, lastRequestTime, diff: now - lastRequestTime })
      toast({
        title: "Please wait",
        description: "Please wait a moment before sending another message.",
        variant: "destructive"
      })
      return
    }

    // Duplicate prevention
    const messageKey = `${inputMessage.trim()}_${Math.floor(now / 5000)}` // 5-second window
    if (processedMessageIds.has(messageKey)) {
      console.log("Duplicate message detected:", messageKey)
      return
    }

    // Lock processing
    setIsProcessing(true)
    setLastRequestTime(now)

    const messageId = generateMessageId("user")
    const currentInput = inputMessage.trim()

    // Extract information from user message
    console.log('🔍 Starting information extraction from message:', currentInput)

    const extractedSemester = extractSemesterFromMessage(currentInput)
    console.log('📚 Extracted semester:', extractedSemester)

    const extractedTopic = extractTopicFromMessage(currentInput)
    console.log('📝 Extracted topic:', extractedTopic)

    const extractedDueDate = extractDueDateFromMessage(currentInput)
    console.log('📅 Extracted due date:', extractedDueDate)

    // Update state with extracted information
    if (extractedSemester) {
      setCurrentSemester(extractedSemester)
      console.log('✅ Set current semester:', extractedSemester)
    }
    if (extractedTopic) {
      setCurrentTopic(extractedTopic)
      console.log('✅ Set current topic:', extractedTopic)
    }
    if (extractedDueDate) {
      setCurrentDueDate(extractedDueDate)
      console.log('✅ Set current due date:', extractedDueDate)
    } else {
      console.log('⚠️ No due date extracted from message')
    }

    const userMessage: Message = {
      id: messageId,
      type: "user",
      content: currentInput,
      timestamp: new Date(),
    }

    // Update UI immediately
    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    // Add to processed messages
    setProcessedMessageIds(prev => new Set([...prev, messageKey]))

    try {
      console.log("Sending message:", currentInput)
      console.log("Current conversation ID:", conversationId)

      const agentResponse = await callRelevanceAgent(currentInput, conversationId)
      console.log("Agent response structure:", agentResponse)

      if (agentResponse.job_info) {
        const result = await pollAgentResponse(agentResponse.job_info)
        console.log("Polling result:", result)

        if (result.success) {
          const messageContent = processAgentResponse(result.content)
          console.log("📝 Processed content:", messageContent)

          if (!messageContent || messageContent.trim().length === 0) {
            throw new Error("Empty response received")
          }

          const agentMessage: Message = {
            id: generateMessageId("agent"),
            type: "agent",
            content: messageContent,
            timestamp: new Date(),
            aiResponse: result.content
          }

          setMessages((prev) => [...prev, agentMessage])

          // Use the current semester if no new semester was extracted
          const semesterToUse = extractedSemester || currentSemester
          const topicToUse = extractedTopic || currentTopic
          const dueDateToUse = extractedDueDate || currentDueDate

          console.log('📊 Using values:', {
            semester: semesterToUse,
            topic: topicToUse,
            dueDate: dueDateToUse
          })

          // Check if this is a complete assignment and save it
          if (isCompleteAssignment(messageContent)) {
            const assignmentData = parseAssignmentFromResponse(
              messageContent,
              semesterToUse,
              topicToUse,
              dueDateToUse
            )
            console.log("📋 Complete assignment detected:", assignmentData)

            // Only save if we have all required data
            if (assignmentData.title && assignmentData.semester && assignmentData.topic) {
              console.log('💾 Saving assignment with data:', assignmentData)
              await saveAssignmentToDatabase(assignmentData)

              // Reset assignment creation state
              setCurrentSemester(null)
              setCurrentTopic(null)
              setCurrentDueDate(null)
              setConversationId(null)
              setInputMessage("")
            } else {
              console.log('⚠️ Assignment data incomplete:', assignmentData)
            }
          } else {
            console.log('ℹ️ Not a complete assignment, checking for partial data')
          }

          // Improved conversation ID handling
          if (result.conversationId) {
            const newConversationId = String(result.conversationId).trim()
            if (newConversationId.length > 0) {
              console.log("Setting conversation ID:", newConversationId)
              setConversationId(newConversationId)
            }
          } else if (agentResponse.conversation_id) {
            const fallbackConversationId = String(agentResponse.conversation_id).trim()
            if (fallbackConversationId.length > 0) {
              console.log("Using fallback conversation ID:", fallbackConversationId)
              setConversationId(fallbackConversationId)
            }
          }
        } else {
          throw new Error(result.error || "Processing failed")
        }
      } else {
        if (agentResponse.conversation_id) {
          const directConversationId = String(agentResponse.conversation_id).trim()
          if (directConversationId.length > 0) {
            console.log("Setting direct conversation ID:", directConversationId)
            setConversationId(directConversationId)
          }
        }
        throw new Error("No job info received from agent")
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error)
      const errorMessage: Message = {
        id: generateMessageId("agent"),
        type: "agent",
        content: `I'm sorry, but I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])

      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setIsProcessing(false)

      // Clean up old processed messages (keep only last 50)
      setProcessedMessageIds(prev => {
        const arr = Array.from(prev)
        if (arr.length > 50) {
          return new Set(arr.slice(-50))
        }
        return prev
      })
    }
  }, [inputMessage, isLoading, isProcessing, conversationId, processedMessageIds, lastRequestTime, toast, currentSemester, currentTopic, currentDueDate, profile])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0]
    if (!file) return

    const allowedTypes = [
      ".txt",
      ".js",
      ".ts",
      ".py",
      ".java",
      ".cpp",
      ".c",
      ".php",
      ".rb",
      ".go",
      ".rs",
      ".md",
      ".json",
      ".csv",
      ".xml",
    ]
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase()

    if (!allowedTypes.includes(fileExtension)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a supported file type",
        variant: "destructive"
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size should be less than 5MB",
        variant: "destructive"
      })
      return
    }

    try {
      const text = await file.text()

      const uploadMessage: Message = {
        id: generateMessageId("user"),
        type: "user",
        content: `Uploaded file: ${file.name}\n\n${text}`,
        timestamp: new Date(),
        isFile: true,
        fileName: file.name,
        fileSize: file.size,
      }

      setMessages((prev) => [...prev, uploadMessage])

      setTimeout(() => {
        setInputMessage(`Please help me with this file: ${file.name}`)
      }, 500)
    } catch (error) {
      toast({
        title: "File Error",
        description: "Error reading file. Please try again.",
        variant: "destructive"
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Function to reset conversation
  const resetConversation = () => {
    setConversationId(null)
    setProcessedMessageIds(new Set())
    setCurrentSemester(null)
    setCurrentTopic(null)
    setCurrentDueDate(null)
    toast({
      title: "Conversation Reset",
      description: "Starting a new conversation with the AI Assistant.",
    })
  }

  // Stats calculations
  const totalSubmissions = assignments.reduce((acc, assignment) => acc + assignment.submissions.length, 0)
  const pendingReviews = assignments.reduce(
    (acc, assignment) => acc + assignment.submissions.filter((sub) => sub.grade === null).length,
    0,
  )

  return (
    <AuthGuard allowedRoles={["teacher"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          {/* Enhanced Welcome Header */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 via-blue-500 to-indigo-600 p-8 text-white">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">
                    {getGreeting()}, {(profile as Profile)?.full_name?.split(" ")[0] || "Teacher"}!
                  </h1>
                  <p className="text-white/90 text-lg">{getInspirationalMessage()}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Teacher Dashboard
                </div>
              </div>
            </div>
            {/* Floating elements */}
            <div className="absolute top-4 right-4 opacity-20">
              <div className="flex gap-2">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-100"></div>
                <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-200"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-blue-50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Assignments</CardTitle>
                <div className="p-2 bg-blue-100 rounded-full">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{assignments.length}</div>
                <div className="flex items-center gap-1 text-xs text-blue-600 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Active assignments</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-green-50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Total Submissions</CardTitle>
                <div className="p-2 bg-green-100 rounded-full">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{totalSubmissions}</div>
                <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Student submissions</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-orange-50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Pending Reviews</CardTitle>
                <div className="p-2 bg-orange-100 rounded-full">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">{pendingReviews}</div>
                <div className="flex items-center gap-1 text-xs text-orange-600 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>Awaiting review</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Current Context</CardTitle>
                <div className="p-2 bg-purple-100 rounded-full">
                  <Target className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {currentSemester && (
                    <div className="text-xs text-purple-600">Sem: {currentSemester}</div>
                  )}
                  {currentTopic && (
                    <div className="text-xs text-purple-600">Topic: {currentTopic.substring(0, 20)}...</div>
                  )}
                  {currentDueDate && (
                    <div className="text-xs text-purple-600">Due: {currentDueDate}</div>
                  )}
                  {!currentSemester && !currentTopic && !currentDueDate && (
                    <div className="text-xs text-gray-400">No active context</div>
                  )}
                </div>
              </CardContent>
            </Card>


          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-4">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Manage Assignments</h3>
                <p className="text-gray-600 text-sm mb-4">View, edit, and track all your assignments</p>
                <Link to="/teacher/assignments">
                  <Button className="w-full">View Assignments</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">View Students</h3>
                <p className="text-gray-600 text-sm mb-4">Manage students and their progress</p>
                <Link to="/teacher/students">
                  <Button className="w-full">View Students</Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="p-3 bg-purple-100 rounded-full w-fit mx-auto mb-4">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Review Submissions</h3>
                <p className="text-gray-600 text-sm mb-4">Grade and provide feedback</p>
                <Link to="/teacher/assignments">
                  <Button className="w-full">Review Work</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Interface */}
          <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-full">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">AI Assignment Creator</CardTitle>
                  <CardDescription className="text-base">
                    Your intelligent teaching companion for creating assignments, running code, and managing educational
                    content
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden">
                {/* Agent Info */}
                <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-medium">AI Assistant Manager</h2>
                      <p className="text-sm text-gray-600">
                        Creates assignments automatically and saves them to your dashboard when complete.
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[400px] p-4">
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
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                        )}
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg p-3",
                            message.type === "user"
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white ml-12"
                              : message.isError
                                ? "bg-red-50 border border-red-200"
                                : "bg-white border"
                          )}
                        >
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                          {message.isFile && (
                            <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                              <FileText className="h-3 w-3" />
                              {message.fileName} (
                              {Math.round((message.fileSize || 0) / 1024)}KB)
                            </div>
                          )}
                          {isCompleteAssignment(message.content) && (
                            <div className="mt-2 p-2 bg-green-100 rounded text-xs text-green-800">
                              ✅ Assignment will be saved automatically
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
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div className="bg-white border rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {isProcessing ? "Processing your request..." : "Thinking..."}
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="border-t p-4 bg-white">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Textarea
                          placeholder="Ask AI Assistant Manager to create assignments with semester, topic, and due date..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="resize-none border-gray-300 focus:border-purple-500 pr-12"
                          rows={3}
                          disabled={isLoading || isProcessing}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute right-2 bottom-2 h-8 w-8"
                          disabled={isLoading || isProcessing}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading || isProcessing}
                        className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50"
                      >
                        {isLoading || isProcessing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowUp className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.js,.ts,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.md,.json,.csv,.xml"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <span>✨ AI will auto-save complete assignments</span>
                        {conversationId && (
                          <Badge variant="outline" className="text-xs">
                            Chat Active: {conversationId.substring(0, 8)}...
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isProcessing && (
                          <Badge variant="secondary" className="text-xs">
                            Processing...
                          </Badge>
                        )}
                        {conversationId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={resetConversation}
                            className="text-xs h-6 px-2"
                          >
                            Reset Chat
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
