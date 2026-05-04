"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Loader2,
  PlayCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Timer,
  Calendar,
  Trophy,
  Search,
  X
} from "lucide-react"
import { format, isAfter } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Types (same as before)
interface Quiz {
  id: string
  title: string
  description: string
  topic: string
  subtopic: string
  semester: number
  due_date: string
  time_limit_minutes: number
  total_points: number
  status: string
  teacher_id: string
  class_id: string
  created_at: string
}

interface QuizQuestion {
  id: string
  quiz_id: string
  question_text: string
  options: string[]
  correct_option_id: number
  explanation: string
  points: number
  order_index: number
}

interface QuizSubmission {
  id: string
  quiz_id: string
  student_id: string
  answers: Record<string, number>
  score: number
  total_points: number
  time_taken_minutes: number
  started_at: string
  submitted_at: string
  status: string
}

// Timer Component
const QuizTimer = ({ timeLeft, onTimeUp }) => {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isLowTime = timeLeft <= 60

  useEffect(() => {
    if (timeLeft <= 0) onTimeUp()
  }, [timeLeft, onTimeUp])

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
      isLowTime ? "bg-red-100 text-red-800 animate-pulse" : "bg-blue-100 text-blue-800"
    )}>
      <Clock className="h-5 w-5" />
      <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
    </div>
  )
}

// Question Component
const QuestionDisplay = ({ question, selectedAnswer, onAnswerSelect, showResults = false, studentAnswer = null }) => {
  const [showExplanation, setShowExplanation] = useState(false)

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{question.question_text}</h3>

      <div className="space-y-3">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === index
          const isCorrect = question.correct_option_id === index
          const isStudentChoice = studentAnswer === index

          let cardStyle = "border-2 border-gray-200 hover:border-blue-300 bg-white"

          if (showResults) {
            if (isCorrect) {
              cardStyle = "border-2 border-green-300 bg-green-50"
            } else if (isStudentChoice && !isCorrect) {
              cardStyle = "border-2 border-red-300 bg-red-50"
            }
          } else if (isSelected) {
            cardStyle = "border-2 border-blue-500 bg-blue-50"
          }

          return (
            <div
              key={index}
              className={cn("p-4 rounded-lg cursor-pointer transition-all", cardStyle)}
              onClick={() => !showResults && onAnswerSelect(index)}
            >
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  showResults && isCorrect && "bg-green-600 text-white",
                  showResults && isStudentChoice && !isCorrect && "bg-red-600 text-white",
                  !showResults && isSelected && "bg-blue-600 text-white"
                )}>
                  {String.fromCharCode(65 + index)}
                </Badge>
                <span className="flex-1">{option}</span>
                {showResults && isCorrect && <CheckCircle className="h-5 w-5 text-green-600" />}
                {showResults && isStudentChoice && !isCorrect && <AlertTriangle className="h-5 w-5 text-red-600" />}
              </div>
            </div>
          )
        })}
      </div>

      {showResults && question.explanation && (
        <div className="mt-4">
          <Button
            variant="ghost"
            onClick={() => setShowExplanation(!showExplanation)}
            className="w-full justify-between"
          >
            <span>{showExplanation ? 'Hide' : 'Show'} Explanation</span>
            {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showExplanation && (
            <div className="mt-3 p-4 bg-blue-50 border rounded-lg">
              <p className="text-sm text-blue-800">{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Main Component
export default function StudentQuizzes() {
  const { profile } = useAuth()
  const { toast } = useToast()

  // State
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false)
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)

  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)

  // Results state
  const [currentSubmission, setCurrentSubmission] = useState<QuizSubmission | null>(null)

  // Submission guards: ref blocks the timer/button race even before the
  // state update flushes; state drives the disabled UI.
  const isSubmittingRef = useRef(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitHandlerRef = useRef<() => void>(() => {})

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)

      const { data: enrollments, error: enrollError } = await supabase
        .from('quiz_enrollments')
        .select('quiz_id')
        .eq('student_id', profile?.id)

      if (enrollError) throw enrollError

      const quizIds = enrollments?.map(e => e.quiz_id) || []

      if (quizIds.length > 0) {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .in('id', quizIds)
          .order('created_at', { ascending: false })

        if (quizError) throw quizError
        setQuizzes(quizData || [])

        const { data: submissionData, error: submissionError } = await supabase
          .from('quiz_submissions')
          .select('*')
          .eq('student_id', profile?.id)

        if (submissionError) throw submissionError
        setSubmissions(submissionData || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "Failed to load quizzes",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [profile, toast])

  useEffect(() => {
    if (profile) fetchData()
  }, [profile, fetchData])

  // Timer effect — calls through a ref so the latest answers/questions are
  // always read; otherwise the closure captures stale state from when the
  // interval was first created.
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isQuizModalOpen && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            submitHandlerRef.current()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isQuizModalOpen, timeLeft])

  // Start Quiz
  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      const { data: questionsData, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true })

      if (error) throw error

      setActiveQuiz(quiz)
      setQuestions(questionsData || [])
      setCurrentQuestionIndex(0)
      setAnswers({})
      setTimeLeft(quiz.time_limit_minutes * 60)
      setStartTime(new Date())
      setIsQuizModalOpen(true)

      toast({
        title: "Quiz Started",
        description: `You have ${quiz.time_limit_minutes} minutes`,
      })
    } catch (error) {
      console.error('Error starting quiz:', error)
      toast({
        title: "Error",
        description: "Failed to start quiz",
        variant: "destructive"
      })
    }
  }

  // View Results
  const handleViewResults = async (quiz: Quiz) => {
    const submission = submissions.find(s => s.quiz_id === quiz.id)
    if (!submission) return

    try {
      const { data: questionsData, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quiz.id)
        .order('order_index', { ascending: true })

      if (error) throw error

      setActiveQuiz(quiz)
      setQuestions(questionsData || [])
      setCurrentSubmission(submission)
      setIsResultsModalOpen(true)
    } catch (error) {
      console.error('Error loading results:', error)
    }
  }

  const handleAnswerSelect = (optionIndex: number) => {
    const currentQuestion = questions[currentQuestionIndex]
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }))
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !startTime) return
    if (isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      let score = 0
      questions.forEach(question => {
        if (answers[question.id] === question.correct_option_id) {
          score += question.points
        }
      })

      const timeTaken = Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60))

      const { data: submission, error } = await supabase
        .from('quiz_submissions')
        .insert([{
          quiz_id: activeQuiz.id,
          student_id: profile?.id,
          answers,
          score,
          total_points: activeQuiz.total_points,
          time_taken_minutes: timeTaken,
          started_at: startTime.toISOString(),
          submitted_at: new Date().toISOString(),
          status: 'submitted'
        }])
        .select()
        .single()

      if (error) throw error

      await supabase
        .from('quiz_enrollments')
        .update({ status: 'completed' })
        .eq('quiz_id', activeQuiz.id)
        .eq('student_id', profile?.id)

      setCurrentSubmission(submission)
      setIsQuizModalOpen(false)
      setIsResultsModalOpen(true)

      toast({
        title: "Quiz Submitted!",
        description: `You scored ${score}/${activeQuiz.total_points}`,
      })

      fetchData()
    } catch (error) {
      console.error('Error submitting quiz:', error)
      // Allow another attempt if the network/db actually failed.
      isSubmittingRef.current = false
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Keep the timer's ref pointing at the freshest handler.
  useEffect(() => {
    submitHandlerRef.current = handleSubmitQuiz
  })

  // Reset the submission guard on each new attempt.
  useEffect(() => {
    if (isQuizModalOpen) {
      isSubmittingRef.current = false
      setIsSubmitting(false)
    }
  }, [isQuizModalOpen])

  // Get stats
  const getStats = () => {
    const completed = submissions.length
    const pending = quizzes.length - completed
    const totalScore = submissions.reduce((sum, s) => sum + s.score, 0)
    const totalPossible = submissions.reduce((sum, s) => sum + s.total_points, 0)
    const avgPercentage = totalPossible > 0 ? Math.round((totalScore / totalPossible) * 100) : 0

    return { completed, pending, avgPercentage }
  }

  const stats = getStats()

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(quiz =>
    quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quiz.topic.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <AuthGuard allowedRoles={["student"]}>
        <ModernDashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
              <p className="text-gray-600">Loading quizzes...</p>
            </div>
          </div>
        </ModernDashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">My Quizzes</h1>
            <p className="text-gray-600">Complete quizzes and track your performance</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-blue-600">{quizzes.length}</div>
                <div className="text-sm text-blue-700 font-medium">Total Quizzes</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-green-700 font-medium">Completed</div>
              </CardContent>
            </Card>
            <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-purple-600">{stats.avgPercentage}%</div>
                <div className="text-sm text-purple-700 font-medium">Average Score</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search quizzes by title or topic..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Quizzes Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Available Quizzes ({filteredQuizzes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quiz Title</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time Limit</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuizzes.map((quiz) => {
                      const submission = submissions.find(s => s.quiz_id === quiz.id)
                      const isCompleted = !!submission
                      const isOverdue = isAfter(new Date(), new Date(quiz.due_date))

                      return (
                        <TableRow key={quiz.id}>
                          <TableCell>
                            <div className="font-semibold">{quiz.title}</div>
                            <div className="text-sm text-gray-500">{quiz.description}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{quiz.topic}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-4 w-4 text-gray-400" />
                              {format(new Date(quiz.due_date), "MMM dd, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isCompleted ? (
                              <Badge className="bg-green-600">Completed</Badge>
                            ) : isOverdue ? (
                              <Badge variant="destructive">Overdue</Badge>
                            ) : (
                              <Badge className="bg-blue-600">Pending</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {isCompleted ? (
                              <div className="font-semibold text-green-700">
                                {submission.score}/{submission.total_points}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Timer className="h-4 w-4 text-gray-400" />
                              {quiz.time_limit_minutes} min
                            </div>
                          </TableCell>
                          <TableCell>
                            {isCompleted ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewResults(quiz)}
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Results
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleStartQuiz(quiz)}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                disabled={isOverdue}
                              >
                                <PlayCircle className="h-4 w-4 mr-2" />
                                Start Quiz
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>

                {filteredQuizzes.length === 0 && (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quizzes Found</h3>
                    <p className="text-gray-500">
                      {searchTerm ? 'Try adjusting your search terms' : 'No quizzes have been assigned to you yet'}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Taking Modal */}
          <Dialog open={isQuizModalOpen} onOpenChange={setIsQuizModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">{activeQuiz?.title}</h2>
                    <p className="text-sm text-gray-600">{activeQuiz?.topic}</p>
                  </div>
                  <QuizTimer timeLeft={timeLeft} onTimeUp={handleSubmitQuiz} />
                </DialogTitle>
              </DialogHeader>

              {questions.length > 0 && (
                <div className="space-y-6">
                  {/* Progress */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-gray-600">
                      Answered: {Object.keys(answers).length}/{questions.length}
                    </span>
                  </div>
                  <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />

                  {/* Question */}
                  <QuestionDisplay
                    question={questions[currentQuestionIndex]}
                    selectedAnswer={answers[questions[currentQuestionIndex].id]}
                    onAnswerSelect={handleAnswerSelect}
                  />

                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>

                    {currentQuestionIndex === questions.length - 1 ? (
                      <Button
                        onClick={handleSubmitQuiz}
                        disabled={isSubmitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {isSubmitting ? "Submitting..." : "Submit Quiz"}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                      >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Results Modal */}
          <Dialog open={isResultsModalOpen} onOpenChange={setIsResultsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-green-800">Quiz Results</h2>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="text-center bg-green-50 border-green-200">
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-green-700">
                            {currentSubmission?.score}/{currentSubmission?.total_points}
                          </div>
                          <div className="text-sm text-green-600">Score</div>
                        </CardContent>
                      </Card>
                      <Card className="text-center bg-blue-50 border-blue-200">
                        <CardContent className="pt-4">
                          <div className="text-2xl font-bold text-blue-700">
                            {currentSubmission?.time_taken_minutes} min
                          </div>
                          <div className="text-sm text-blue-600">Time Taken</div>
                        </CardContent>
                      </Card>
                      <Card className="text-center bg-purple-50 border-purple-200">
                        <CardContent className="pt-4">
                          <div className="text-lg font-bold text-purple-700">
                            {currentSubmission && Math.round((currentSubmission.score / currentSubmission.total_points) * 100)}%
                          </div>
                          <div className="text-sm text-purple-600">Percentage</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 mt-6">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Question Review
                </h3>

                {questions.map((question, index) => {
                  const studentAnswer = currentSubmission?.answers[question.id]
                  const isCorrect = studentAnswer === question.correct_option_id

                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Badge variant="outline">Question {index + 1}</Badge>
                        <Badge variant={isCorrect ? "default" : "destructive"} className={isCorrect ? "bg-green-600" : ""}>
                          {isCorrect ? "Correct" : "Incorrect"}
                        </Badge>
                        <span className="text-sm text-gray-600 ml-auto">{question.points} points</span>
                      </div>

                      <QuestionDisplay
                        question={question}
                        selectedAnswer={null}
                        onAnswerSelect={() => { }}
                        showResults={true}
                        studentAnswer={studentAnswer}
                      />
                    </div>
                  )
                })}
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}