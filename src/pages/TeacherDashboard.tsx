"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
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
  id: number
  type: "user" | "agent"
  content: string
  timestamp: Date
  isError?: boolean
  isFile?: boolean
  fileName?: string
  fileSize?: number
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

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      id: 1,
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
        .eq("teacher_id", profile?.id)
        .order("created_at", { ascending: false })

      setAssignments(assignmentsData || [])
    } catch (error) {
      console.error("Error fetching assignments:", error)
    } finally {
      setLoading(false)
    }
  }

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

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

  const callRelevanceAgent = async (message: string, conversationId: string | null = null): Promise<any> => {
    const payload: any = {
      message: { role: "user", content: message },
      agent_id: RELEVANCE_CONFIG.agent.agent_id,
    }

    if (conversationId) {
      payload.conversation_id = conversationId
    }

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
        throw new Error(`API Error: ${response.status} - ${response.statusText}`)
      }

      const result = await response.json()

      if (isSafari()) {
        console.log("Safari - Agent Response:", result)
      }

      return result
    } catch (error) {
      console.error("Safari - Agent Call Error:", error)
      throw error
    }
  }

  const pollAgentResponse = async (jobInfo: any): Promise<any> => {
    const maxAttempts = isSafari() ? 25 : 20
    let attempts = 0
    const baseDelay = 3000

    while (attempts < maxAttempts) {
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
          throw new Error(`Polling failed: ${response.status} - ${response.statusText}`)
        }

        const status = await response.json()

        if (isSafari()) {
          console.log(`Safari - Polling attempt ${attempts + 1}:`, status)
        }

        for (const update of status.updates || []) {
          if (update.type === "chain-success") {
            let content = "Task completed successfully."

            if (update.output) {
              try {
                if (update.output.output && update.output.output.answer) {
                  content = String(update.output.output.answer)
                } else if (update.output.answer && typeof update.output.answer === "string") {
                  content = update.output.answer
                } else if (typeof update.output === "string") {
                  content = update.output
                } else if (update.output.output && typeof update.output.output === "string") {
                  content = update.output.output
                } else if (update.output.result && typeof update.output.result === "string") {
                  content = update.output.result
                } else {
                  if (isSafari()) {
                    console.log("Safari - Raw output object:", update.output)
                  }

                  if (update.output.answer) {
                    content = String(update.output.answer)
                  } else if (update.output.prompt) {
                    content = String(update.output.prompt)
                  } else if (update.output.result) {
                    content = String(update.output.result)
                  } else if (update.output.text) {
                    content = String(update.output.text)
                  } else if (update.output.response) {
                    content = String(update.output.response)
                  } else {
                    content = `AI Response:\n${JSON.stringify(update.output, null, 2)}`
                  }
                }
              } catch (parseError) {
                console.error("Safari - Output parsing error:", parseError)
                content = "Response received but could not be parsed properly."
              }
            }

            return {
              success: true,
              content: String(content),
              conversationId: jobInfo.conversation_id,
            }
          }
          if (update.type === "chain-error") {
            return {
              success: false,
              error: update.error || "An error occurred during processing.",
            }
          }
        }

        attempts++

        const delay = isSafari() ? baseDelay * 1.5 : baseDelay
        const adaptiveDelay = Math.min(delay + attempts * 500, 10000)

        await smartDelay(adaptiveDelay)
      } catch (error) {
        console.error(`Safari - Polling error on attempt ${attempts + 1}:`, error)
        attempts++

        const errorDelay = isSafari() ? 5000 : 3000
        await smartDelay(errorDelay)
      }
    }

    return {
      success: false,
      error: `Request timed out after ${maxAttempts} attempts. Please try again.`,
    }
  }

  const handleSendMessage = async (): Promise<void> => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now(),
      type: "user",
      content: inputMessage,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")
    setIsLoading(true)

    try {
      const agentResponse = await callRelevanceAgent(inputMessage, conversationId)

      if (agentResponse.job_info) {
        const result = await pollAgentResponse(agentResponse.job_info)

        if (result.success) {
          let messageContent: string
          if (typeof result.content === "string") {
            messageContent = result.content
          } else if (typeof result.content === "object" && result.content !== null) {
            messageContent = JSON.stringify(result.content, null, 2)
          } else {
            messageContent = String(result.content || "Task completed successfully.")
          }

          const agentMessage: Message = {
            id: Date.now() + 1,
            type: "agent",
            content: messageContent,
            timestamp: new Date(),
          }

          setMessages((prev) => [...prev, agentMessage])
          setConversationId(result.conversationId)
        } else {
          const errorMessage: Message = {
            id: Date.now() + 1,
            type: "agent",
            content: String(result.error || "An error occurred during processing."),
            timestamp: new Date(),
            isError: true,
          }
          setMessages((prev) => [...prev, errorMessage])
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "agent",
        content: "I'm sorry, but I encountered an error. Please try again.",
        timestamp: new Date(),
        isError: true,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

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
      alert("Please upload a supported file type")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB")
      return
    }

    try {
      const text = await file.text()

      const uploadMessage: Message = {
        id: Date.now(),
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
      alert("Error reading file. Please try again.")
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
                    {getGreeting()}, {profile?.full_name?.split(" ")[0] || "Teacher"}!
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
          </div>

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
                        Your intelligent teaching companion for creating assignments, running code, and managing educational content.
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
                            Processing...
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
                          placeholder="Ask AI Assistant Manager anything about assignments, code, or teaching..."
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          onKeyPress={handleKeyPress}
                          className="resize-none border-gray-300 focus:border-purple-500 pr-12"
                          rows={3}
                          disabled={isLoading}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute right-2 bottom-2 h-8 w-8"
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        {isLoading ? (
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
                      <span>✨ Send new message to AI Assistant</span>
                      <span>Help</span>
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
