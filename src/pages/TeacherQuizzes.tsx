"use client"

import React, { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/integrations/supabase/client"
import {
    ArrowLeft,
    Calendar as CalendarIcon,
    Search,
    Plus,
    Eye,
    Trash2,
    Users,
    Clock,
    Trophy,
    BarChart3,
    Filter,
    ChevronDown,
    Loader2,
    BookOpen,
    Target,
    TrendingUp
} from "lucide-react"
import { format, subDays, isAfter, isBefore } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Link } from "react-router-dom"

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
    class_name?: string
    total_students?: number
    submitted_count?: number
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
    student_name?: string
    student_semester?: number
}

interface StudentResult {
    student_id: string
    student_name: string
    student_semester: number
    score?: number
    total_points?: number
    status: 'submitted' | 'pending'
    submitted_at?: string
    time_taken?: number
}

type ViewState = 'dashboard' | 'quiz-detail'
type DateFilter = 'all' | '7days' | '30days' | '90days' | 'custom'

// Chart colors
const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Date Filter Component
const DateFilterSelect = ({ value, onChange, customRange, onCustomRangeChange }) => {
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    return (
        <div className="flex items-center gap-2">
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="w-40">
                    <SelectValue placeholder="Date filter" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="7days">Last 7 days</SelectItem>
                    <SelectItem value="30days">Last 30 days</SelectItem>
                    <SelectItem value="90days">Last 90 days</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
            </Select>

            {value === 'custom' && (
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-64 justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {customRange.from && customRange.to
                                ? `${format(customRange.from, "MMM dd")} - ${format(customRange.to, "MMM dd")}`
                                : "Pick date range"
                            }
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="range"
                            selected={customRange}
                            onSelect={onCustomRangeChange}
                            numberOfMonths={2}
                        />
                    </PopoverContent>
                </Popover>
            )}
        </div>
    )
}

// Quiz Analytics Component
const QuizAnalytics = ({ quiz, submissions, totalStudents }) => {
    const submissionRate = totalStudents > 0 ? (submissions.length / totalStudents) * 100 : 0

    // Score distribution data
    const scoreRanges = {}
    submissions.forEach(sub => {
        const percentage = Math.round((sub.score / sub.total_points) * 100)
        let range = ''
        if (percentage >= 90) range = '90-100%'
        else if (percentage >= 80) range = '80-89%'
        else if (percentage >= 70) range = '70-79%'
        else if (percentage >= 60) range = '60-69%'
        else range = 'Below 60%'

        scoreRanges[range] = (scoreRanges[range] || 0) + 1
    })

    const scoreData = Object.entries(scoreRanges).map(([range, count]) => ({
        range,
        count: count as number
    }))

    // Time analysis data
    const timeRanges = {}
    submissions.forEach(sub => {
        const minutes = sub.time_taken_minutes
        let range = ''
        if (minutes <= 2) range = '0-2 min'
        else if (minutes <= 5) range = '3-5 min'
        else if (minutes <= 10) range = '6-10 min'
        else range = '10+ min'

        timeRanges[range] = (timeRanges[range] || 0) + 1
    })

    const timeData = Object.entries(timeRanges).map(([range, count]) => ({
        range,
        count: count as number
    }))

    const averageScore = submissions.length > 0
        ? submissions.reduce((sum, sub) => sum + (sub.score / sub.total_points), 0) / submissions.length * 100
        : 0

    const averageTime = submissions.length > 0
        ? submissions.reduce((sum, sub) => sum + sub.time_taken_minutes, 0) / submissions.length
        : 0

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {submissions.length}/{totalStudents}
                        </div>
                        <div className="text-sm text-gray-600">Submissions</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {submissionRate.toFixed(1)}% completed
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {averageScore.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Avg Score</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {averageTime.toFixed(1)} min
                        </div>
                        <div className="text-sm text-gray-600">Avg Time</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {quiz.total_points}
                        </div>
                        <div className="text-sm text-gray-600">Total Points</div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5" />
                            Score Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {scoreData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={scoreData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#10b981" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                No submissions yet
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Time Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Time Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {timeData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={timeData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-500">
                                No submissions yet
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// Student Results Table Component
const StudentResultsTable = ({ results }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Results
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student Name</TableHead>
                                <TableHead>Semester</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead>Time Taken</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {results.map((result) => (
                                <TableRow key={result.student_id}>
                                    <TableCell className="font-medium">{result.student_name}</TableCell>
                                    <TableCell>Semester {result.student_semester}</TableCell>
                                    <TableCell>
                                        {result.status === 'submitted' ? (
                                            <span className="font-semibold text-green-600">
                                                {result.score}/{result.total_points}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={result.status === 'submitted' ? 'default' : 'secondary'}>
                                            {result.status === 'submitted' ? 'Submitted' : 'Pending'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {result.submitted_at ? format(new Date(result.submitted_at), "MMM dd, yyyy") : '-'}
                                    </TableCell>
                                    <TableCell>
                                        {result.time_taken ? `${result.time_taken} min` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}

// Main Component
export default function TeacherQuizzes() {
    const { profile } = useAuth()
    const { toast } = useToast()

    // State
    const [viewState, setViewState] = useState<ViewState>('dashboard')
    const [loading, setLoading] = useState(true)
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [classes, setClasses] = useState<any[]>([])
    const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([])

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedClass, setSelectedClass] = useState('all')
    const [dateFilter, setDateFilter] = useState<DateFilter>('all')
    const [customDateRange, setCustomDateRange] = useState<any>({ from: null, to: null })

    // Detail view state
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
    const [quizSubmissions, setQuizSubmissions] = useState<QuizSubmission[]>([])
    const [studentResults, setStudentResults] = useState<StudentResult[]>([])
    const [detailLoading, setDetailLoading] = useState(false)

    // Fetch teacher's classes
    const fetchClasses = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('class_teachers')
                .select(`
          class_id,
          classes:class_id (
            id,
            name,
            semester
          )
        `)
                .eq('teacher_id', profile?.id)

            if (error) throw error
            setClasses(data?.map(item => item.classes) || [])
        } catch (error) {
            console.error('Error fetching classes:', error)
        }
    }, [profile])

    // Fetch teacher's quizzes
    const fetchQuizzes = useCallback(async () => {
        try {
            setLoading(true)

            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .select(`
          *,
          classes:class_id (
            name
          )
        `)
                .eq('teacher_id', profile?.id)
                .order('created_at', { ascending: false })

            if (quizError) throw quizError

            // Get submission counts for each quiz
            const quizzesWithCounts = await Promise.all(
                quizData.map(async (quiz) => {
                    // Get total students in class
                    const { count: totalStudents } = await supabase
                        .from('class_students')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', quiz.class_id)

                    // Get submission count
                    const { count: submittedCount } = await supabase
                        .from('quiz_submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('quiz_id', quiz.id)

                    return {
                        ...quiz,
                        class_name: quiz.classes?.name,
                        total_students: totalStudents || 0,
                        submitted_count: submittedCount || 0
                    }
                })
            )

            setQuizzes(quizzesWithCounts)
        } catch (error) {
            console.error('Error fetching quizzes:', error)
            toast({
                title: "Error",
                description: "Failed to load quizzes",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }, [profile, toast])

    // Apply filters
    useEffect(() => {
        let filtered = [...quizzes]

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(quiz =>
                quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                quiz.topic.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Class filter
        if (selectedClass !== 'all') {
            filtered = filtered.filter(quiz => quiz.class_id === selectedClass)
        }

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date()
            let startDate: Date

            switch (dateFilter) {
                case '7days':
                    startDate = subDays(now, 7)
                    break
                case '30days':
                    startDate = subDays(now, 30)
                    break
                case '90days':
                    startDate = subDays(now, 90)
                    break
                case 'custom':
                    if (customDateRange.from && customDateRange.to) {
                        filtered = filtered.filter(quiz => {
                            const createdDate = new Date(quiz.created_at)
                            return isAfter(createdDate, customDateRange.from) && isBefore(createdDate, customDateRange.to)
                        })
                    }
                    break
            }

            if (dateFilter !== 'custom' && startDate) {
                filtered = filtered.filter(quiz => isAfter(new Date(quiz.created_at), startDate))
            }
        }

        setFilteredQuizzes(filtered)
    }, [quizzes, searchTerm, selectedClass, dateFilter, customDateRange])

    // Fetch quiz detail data
    const fetchQuizDetail = async (quiz: Quiz) => {
        try {
            setDetailLoading(true)
            setSelectedQuiz(quiz)
            setViewState('quiz-detail')

            // Get submissions with student info
            const { data: submissions, error: submissionsError } = await supabase
                .from('quiz_submissions')
                .select(`
          *,
          profiles:student_id (
            full_name,
            semester
          )
        `)
                .eq('quiz_id', quiz.id)

            if (submissionsError) throw submissionsError

            const submissionsWithStudentInfo = submissions.map(sub => ({
                ...sub,
                student_name: sub.profiles?.full_name,
                student_semester: sub.profiles?.semester
            }))

            setQuizSubmissions(submissionsWithStudentInfo)

            // Get all students in class for complete results
            const { data: classStudents, error: studentsError } = await supabase
                .from('class_students')
                .select(`
          student_id,
          profiles:student_id (
            full_name,
            semester
          )
        `)
                .eq('class_id', quiz.class_id)

            if (studentsError) throw studentsError

            // Combine submitted and pending students
            const results: StudentResult[] = classStudents.map(cs => {
                const submission = submissionsWithStudentInfo.find(sub => sub.student_id === cs.student_id)

                return {
                    student_id: cs.student_id,
                    student_name: cs.profiles?.full_name || 'Unknown',
                    student_semester: cs.profiles?.semester || 1,
                    score: submission?.score,
                    total_points: submission?.total_points,
                    status: submission ? 'submitted' : 'pending',
                    submitted_at: submission?.submitted_at,
                    time_taken: submission?.time_taken_minutes
                }
            })

            // Sort: submitted first, then by name
            results.sort((a, b) => {
                if (a.status !== b.status) {
                    return a.status === 'submitted' ? -1 : 1
                }
                return a.student_name.localeCompare(b.student_name)
            })

            setStudentResults(results)
        } catch (error) {
            console.error('Error fetching quiz detail:', error)
            toast({
                title: "Error",
                description: "Failed to load quiz details",
                variant: "destructive"
            })
        } finally {
            setDetailLoading(false)
        }
    }

    // Delete quiz with cascade
    const handleDeleteQuiz = async (quizId: string) => {
        try {
            // Delete in correct order to respect foreign key constraints
            await supabase.from('quiz_submissions').delete().eq('quiz_id', quizId)
            await supabase.from('quiz_enrollments').delete().eq('quiz_id', quizId)
            await supabase.from('quiz_questions').delete().eq('quiz_id', quizId)

            const { error } = await supabase.from('quizzes').delete().eq('id', quizId)
            if (error) throw error

            toast({
                title: "Quiz Deleted",
                description: "Quiz and all related data have been deleted successfully",
            })

            // Refresh quizzes
            fetchQuizzes()

            // If we're viewing the deleted quiz, go back to dashboard
            if (selectedQuiz?.id === quizId) {
                setViewState('dashboard')
            }
        } catch (error) {
            console.error('Error deleting quiz:', error)
            toast({
                title: "Delete Failed",
                description: "Failed to delete quiz",
                variant: "destructive"
            })
        }
    }

    useEffect(() => {
        if (profile) {
            fetchClasses()
            fetchQuizzes()
        }
    }, [profile, fetchClasses, fetchQuizzes])

    if (loading) {
        return (
            <AuthGuard allowedRoles={["teacher"]}>
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
        <AuthGuard allowedRoles={["teacher"]}>
            <ModernDashboardLayout>
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Dashboard View */}
                    {viewState === 'dashboard' && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
                                    <p className="text-gray-600 mt-1">Manage and analyze your quiz results</p>
                                </div>
                                <Link to={'/teacher/create-quiz'}>
                                <Button
                                    // onClick={() => window.location.href = '/teacher/create-quiz'}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create New Quiz
                                </Button>
                                </Link>
                            </div>

                            {/* Filters */}
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search quizzes..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>

                                        <Select value={selectedClass} onValueChange={setSelectedClass}>
                                            <SelectTrigger className="w-48">
                                                <SelectValue placeholder="Filter by class" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Classes</SelectItem>
                                                {classes.map(cls => (
                                                    <SelectItem key={cls.id} value={cls.id}>
                                                        {cls.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>

                                        <DateFilterSelect
                                            value={dateFilter}
                                            onChange={setDateFilter}
                                            customRange={customDateRange}
                                            onCustomRangeChange={setCustomDateRange}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Quizzes Table */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <BarChart3 className="h-5 w-5" />
                                        Your Quizzes ({filteredQuizzes.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Quiz Title</TableHead>
                                                    <TableHead>Class</TableHead>
                                                    <TableHead>Due Date</TableHead>
                                                    <TableHead>Students</TableHead>
                                                    <TableHead>Created</TableHead>
                                                    <TableHead>Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredQuizzes.map((quiz) => (
                                                    <TableRow key={quiz.id}>
                                                        <TableCell>
                                                            <div>
                                                                <div className="font-semibold">{quiz.title}</div>
                                                                <div className="text-sm text-gray-500">{quiz.topic}</div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{quiz.class_name}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(quiz.due_date), "MMM dd, yyyy")}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-semibold text-green-600">
                                                                    {quiz.submitted_count}/{quiz.total_students}
                                                                </span>
                                                                <span className="text-sm text-gray-500">submitted</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {format(new Date(quiz.created_at), "MMM dd, yyyy")}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => fetchQuizDetail(quiz)}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                    View Results
                                                                </Button>

                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This will permanently delete the quiz "{quiz.title}" and all related data including:
                                                                                <ul className="list-disc list-inside mt-2">
                                                                                    <li>All quiz questions</li>
                                                                                    <li>Student submissions ({quiz.submitted_count} submissions)</li>
                                                                                    <li>Student enrollments</li>
                                                                                </ul>
                                                                                This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleDeleteQuiz(quiz.id)}
                                                                                className="bg-red-600 hover:bg-red-700"
                                                                            >
                                                                                Delete Quiz
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>

                                        {filteredQuizzes.length === 0 && (
                                            <div className="text-center py-12">
                                                <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Quizzes Found</h3>
                                                <p className="text-gray-500 mb-4">
                                                    {searchTerm || selectedClass !== 'all' || dateFilter !== 'all'
                                                        ? 'Try adjusting your filters or search terms'
                                                        : 'Create your first quiz to get started'
                                                    }
                                                </p>
                                                <Link to={'/teacher/create-quiz'}>
                                                    <Button
                                                        //   onClick={() => window.location.href = '/teacher/create-quiz'}
                                                        variant="outline"
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Create Quiz
                                                    </Button>
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}

                    {/* Quiz Detail View */}
                    {viewState === 'quiz-detail' && selectedQuiz && (
                        <>
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setViewState('dashboard')}
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Back to Dashboard
                                    </Button>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">{selectedQuiz.title}</h1>
                                        <p className="text-gray-600">{selectedQuiz.class_name} • Due: {format(new Date(selectedQuiz.due_date), "MMM dd, yyyy")}</p>
                                    </div>
                                </div>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Quiz
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete "{selectedQuiz.title}" and all related data including:
                                                <ul className="list-disc list-inside mt-2">
                                                    <li>All quiz questions</li>
                                                    <li>Student submissions ({quizSubmissions.length} submissions)</li>
                                                    <li>Student enrollments</li>
                                                </ul>
                                                This action cannot be undone.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteQuiz(selectedQuiz.id)}
                                                className="bg-red-600 hover:bg-red-700"
                                            >
                                                Delete Quiz
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>

                            {detailLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Analytics */}
                                    <QuizAnalytics
                                        quiz={selectedQuiz}
                                        submissions={quizSubmissions}
                                        totalStudents={selectedQuiz.total_students || 0}
                                    />

                                    {/* Student Results */}
                                    <StudentResultsTable results={studentResults} />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </ModernDashboardLayout>
        </AuthGuard>
    )
}