"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/integrations/supabase/client"
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Brain,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Timer,
  Calendar,
  Trophy,
  BarChart3
} from "lucide-react"
import { format, isAfter } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Types
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

interface QuizEnrollment {
  id: string
  quiz_id: string
  student_id: string
  assigned_at: string
  status: 'assigned' | 'started' | 'completed' | 'overdue'
}

type ViewState = 'dashboard' | 'taking-quiz' | 'quiz-results' | 'quiz-history'

// Quiz Card Component
const QuizCard = ({ quiz, submission, onAction }) => {
    const isOverdue = isAfter(new Date(), new Date(quiz.due_date))
    const isCompleted = submission !== null && submission !== undefined
  
  const getStatus = () => {
    if (isCompleted) {
      return {
        label: 'COMPLETED',
        color: 'bg-green-100 border-green-300 text-green-800',
        dot: 'bg-green-500'
      }
    }
    if (isOverdue) {
      return {
        label: 'OVERDUE',
        color: 'bg-red-100 border-red-300 text-red-800',
        dot: 'bg-red-500'
      }
    }
    return {
      label: 'PENDING',
      color: 'bg-blue-100 border-blue-300 text-blue-800',
      dot: 'bg-blue-500'
    }
  }

  const status = getStatus()

  return (
    <Card 
      className={cn("cursor-pointer transition-all hover:shadow-md border-2", status.color)}
      onClick={() => onAction(quiz, isCompleted ? 'view' : 'start')}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("w-2 h-2 rounded-full", status.dot)}></div>
          <Badge variant="outline" className="text-xs font-semibold">
            {status.label}
          </Badge>
        </div>
        
        <h3 className="font-bold text-sm mb-2 line-clamp-2">{quiz.title}</h3>
        
        <div className="space-y-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            <span>{quiz.total_points} questions</span>
          </div>
          
          {isCompleted ? (
            <div className="flex items-center gap-1 font-semibold text-green-700">
              <Trophy className="h-3 w-3" />
              <span>Score: {submission?.score}/{submission?.total_points}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>Due {format(new Date(quiz.due_date), "MMM dd")}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            <span>{quiz.time_limit_minutes} min</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
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
    <Card className="border-2 border-gray-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-6">{question.question_text}</h3>
        
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
          <div className="mt-6">
            <Button
              variant="ghost"
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full justify-between"
            >
              <span>{showExplanation ? 'Hide' : 'Show'} Explanation</span>
              {showExplanation ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            
            {showExplanation && (
              <div className="mt-4 p-4 bg-blue-50 border rounded-lg">
                <p className="text-sm text-blue-800">{question.explanation}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Main Component
export default function StudentQuizzes() {
  const { profile } = useAuth()
  const { toast } = useToast()
  
  // State
  const [viewState, setViewState] = useState<ViewState>('dashboard')
  const [loading, setLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([])
  
  // Quiz taking state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  
  // Results state
  const [currentSubmission, setCurrentSubmission] = useState<QuizSubmission | null>(null)

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get student's quiz enrollments
      const { data: enrollments, error: enrollError } = await supabase
        .from('quiz_enrollments')
        .select('quiz_id')
        .eq('student_id', profile?.id)

      if (enrollError) throw enrollError

      const quizIds = enrollments?.map(e => e.quiz_id) || []
      
      if (quizIds.length > 0) {
        // Get quizzes
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .in('id', quizIds)
          .order('due_date', { ascending: true })

        if (quizError) throw quizError
        setQuizzes(quizData || [])

        // Get submissions
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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (viewState === 'taking-quiz' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [viewState, timeLeft])

  // Handle quiz actions
  const handleQuizAction = async (quiz: Quiz, action: 'start' | 'view') => {
    if (action === 'start') {
      await startQuiz(quiz)
    } else {
      await viewResults(quiz)
    }
  }

  const startQuiz = async (quiz: Quiz) => {
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
      setViewState('taking-quiz')

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

  const viewResults = async (quiz: Quiz) => {
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
      setViewState('quiz-results')
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

    try {
      // Calculate score
      let score = 0
      questions.forEach(question => {
        if (answers[question.id] === question.correct_option_id) {
          score += question.points
        }
      })

      const timeTaken = Math.round((new Date().getTime() - startTime.getTime()) / (1000 * 60))

      // Save submission
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

      // Update enrollment status
      await supabase
        .from('quiz_enrollments')
        .update({ status: 'completed' })
        .eq('quiz_id', activeQuiz.id)
        .eq('student_id', profile?.id)

      setCurrentSubmission(submission)
      setViewState('quiz-results')

      toast({
        title: "Quiz Submitted!",
        description: `You scored ${score}/${activeQuiz.total_points}`,
      })

      fetchData() // Refresh data
    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast({
        title: "Error",
        description: "Failed to submit quiz",
        variant: "destructive"
      })
    }
  }

  // Get stats
  const getStats = () => {
    const completed = submissions.length
    const pending = quizzes.length - completed
    const totalPoints = submissions.reduce((sum, s) => sum + s.score, 0)
    const avgScore = completed > 0 ? Math.round(totalPoints / completed * 10) / 10 : 0

    return { completed, pending, totalPoints, avgScore }
  }

  const stats = getStats()

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
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Sidebar - Quiz List */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    My Quizzes ({quizzes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[600px] px-4 pb-4">
                    <div className="space-y-3">
                      {quizzes.map(quiz => {
                        const submission = submissions.find(s => s.quiz_id === quiz.id)
                        return (
                          <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            submission={submission}
                            onAction={handleQuizAction}
                          />
                        )
                      })}
                      
                      {quizzes.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p>No quizzes assigned</p>
                        </div>
                      )}
                      
                      <div className="pt-4 border-t">
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={() => setViewState('quiz-history')}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View History
                        </Button>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              
              {/* Dashboard View */}
              {viewState === 'dashboard' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h1 className="text-3xl font-bold mb-2">Quiz Dashboard</h1>
                    <p className="text-gray-600">Track your quiz performance and progress</p>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{stats.avgScore}</div>
                        <div className="text-sm text-gray-600">Avg Score</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-600">{stats.totalPoints}</div>
                        <div className="text-sm text-gray-600">Total Points</div>
                      </CardContent>
                    </Card>
                    <Card className="text-center">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {submissions.slice(0, 3).map(submission => {
                          const quiz = quizzes.find(q => q.id === submission.quiz_id)
                          return (
                            <div key={submission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium">{quiz?.title}</div>
                                <div className="text-sm text-gray-600">
                                  {format(new Date(submission.submitted_at), "MMM dd, yyyy")}
                                </div>
                              </div>
                              <Badge className="bg-green-50 text-green-700">
                                {submission.score}/{submission.total_points}
                              </Badge>
                            </div>
                          )
                        })}
                        
                        {submissions.length === 0 && (
                          <p className="text-gray-500 text-center py-4">No quiz activity yet</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Taking Quiz View */}
              {viewState === 'taking-quiz' && activeQuiz && questions.length > 0 && (
                <div className="space-y-6">
                  {/* Quiz Header */}
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h1 className="text-2xl font-bold text-blue-900">{activeQuiz.title}</h1>
                          <p className="text-blue-700">{activeQuiz.topic}</p>
                        </div>
                        <QuizTimer timeLeft={timeLeft} onTimeUp={handleSubmitQuiz} />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-800">
                          Question {currentQuestionIndex + 1} of {questions.length}
                        </span>
                        <div className="w-48">
                          <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Current Question */}
                  <QuestionDisplay
                    question={questions[currentQuestionIndex]}
                    selectedAnswer={answers[questions[currentQuestionIndex].id]}
                    onAnswerSelect={handleAnswerSelect}
                  />

                  {/* Navigation */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <Button
                          variant="outline"
                          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                          disabled={currentQuestionIndex === 0}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Previous
                        </Button>
                        
                        <span className="text-sm text-gray-600">
                          Answered: {Object.keys(answers).length}/{questions.length}
                        </span>
                        
                        {currentQuestionIndex === questions.length - 1 ? (
                          <Button onClick={handleSubmitQuiz} className="bg-green-600 hover:bg-green-700">
                            Submit Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                            disabled={currentQuestionIndex === questions.length - 1}
                          >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Quiz Results View */}
              {viewState === 'quiz-results' && activeQuiz && currentSubmission && (
                <div className="space-y-6">
                  {/* Results Header */}
                  <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-green-800 mb-2">Quiz Complete!</h1>
                        <p className="text-green-700">{activeQuiz.title}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-3xl font-bold text-green-800">
                            {currentSubmission.score}/{currentSubmission.total_points}
                          </div>
                          <div className="text-sm text-green-600">Your Score</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-2xl font-bold text-green-800">
                            {currentSubmission.time_taken_minutes} min
                          </div>
                          <div className="text-sm text-green-600">Time Taken</div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-green-200">
                          <div className="text-lg font-bold text-green-800">
                            {format(new Date(currentSubmission.submitted_at), "MMM dd")}
                          </div>
                          <div className="text-sm text-green-600">Submitted</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Question Review */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Question Review
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {questions.map((question, index) => {
                        const studentAnswer = currentSubmission.answers[question.id]
                        const isCorrect = studentAnswer === question.correct_option_id
                        
                        return (
                          <div key={question.id}>
                            <div className="flex items-center gap-2 mb-3">
                              <Badge variant="outline">Q{index + 1}</Badge>
                              <Badge variant={isCorrect ? "default" : "destructive"}>
                                {isCorrect ? "Correct" : "Wrong"}
                              </Badge>
                            </div>
                            
                            <QuestionDisplay
                              question={question}
                              selectedAnswer={null}
                              onAnswerSelect={() => {}}
                              showResults={true}
                              studentAnswer={studentAnswer}
                            />
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>

                  {/* Back Button */}
                  <div className="text-center">
                    <Button variant="outline" onClick={() => setViewState('dashboard')}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              )}

              {/* Quiz History View */}
              {viewState === 'quiz-history' && (
                <div className="space-y-6">
                  <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h1 className="text-2xl font-bold text-purple-900">Quiz History</h1>
                          <p className="text-purple-700">Your complete performance record</p>
                        </div>
                        <Button variant="outline" onClick={() => setViewState('dashboard')}>
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-4">
                    {submissions.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-12 text-gray-500">
                            <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-semibold mb-2">No Quiz History</h3>
                            <p>Complete your first quiz to see results here</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      submissions
                        .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
                        .map(submission => {
                          const quiz = quizzes.find(q => q.id === submission.quiz_id)
                          if (!quiz) return null

                          return (
                            <Card key={submission.id} className="hover:shadow-md transition-shadow">
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="font-bold text-lg mb-2">{quiz.title}</h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{format(new Date(submission.submitted_at), "MMM dd, yyyy")}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Timer className="h-4 w-4" />
                                        <span>{submission.time_taken_minutes} min</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <BookOpen className="h-4 w-4" />
                                        <span>{quiz.topic}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-center">
                                      <div className="text-2xl font-bold text-green-600">
                                        {submission.score}/{submission.total_points}
                                      </div>
                                      <div className="text-sm text-gray-600">Score</div>
                                    </div>
                                    
                                    <Button
                                      variant="outline"
                                      onClick={() => handleQuizAction(quiz, 'view')}
                                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}