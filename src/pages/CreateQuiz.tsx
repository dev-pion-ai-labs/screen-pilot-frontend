"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import {
    Users,
    Plus,
    Sparkles,
    ArrowLeft,
    Calendar as CalendarIcon,
    Target,
    GraduationCap,
    Loader2,
    CheckCircle,
    BookOpen,
    Clock,
    ArrowRight,
    FileText,
    Save,
    UserPlus,
    Edit3,
    RotateCcw,
    Eye,
    MessageSquare,
    AlertCircle,
    RefreshCw,
    Brain,
    Trophy,
    Timer,
    ListChecks,
    Zap,
    Settings,
    Award
} from "lucide-react"
import { format } from "date-fns"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { agentsPostJson } from "@/lib/agentsApi"

// Semester syllabus (reusing from CreateAssignment)
const semester1Syllabus = {
    introductionToDirection: {
        topic: "Introduction to Direction",
        subtopics: [
            "Film Analysis",
            "Different approaches to shoot and types of film",
            "Case studies of Filmmakers and their approach",
            "Case studies of Filmmakers in historical perspective",
            "Writing Actuality Report",
            "Film Diary (Analysis of films, director and scripts, thoughts, ideas/stories,scenes, photographs)"
        ]
    },
    visualStorytellingAndCollaboration: {
        topic: "Visual Storytelling and Collaboration",
        subtopics: [
            "Introduction to visual storytelling (Composition, Cutting, Closeup, Continuity, Camera Angle)",
            "Recreating a Painting",
            "Collaboration with Camera, Edit and Sound",
            "Turning Actualities into stories (Writing on observation)",
            "Trip to closed public space (e.g. Library, Museum)",
            "Trip to an open public space (e.g. Park, Market place, Bus stop)"
        ]
    },
    principlesOfContinuity: {
        topic: "Principles of Continuity",
        subtopics: [
            "Decoupage (cutting scripts and planning visual for cinematic connection) and Continuity",
            "Aspects of continuity",
            "Time and Space in films",
            "Scene analysis of Classical Hollywood films and contemporary films"
        ]
    },
    conceptIdeationAndResearch: {
        topic: "Concept, Ideation & Research",
        subtopics: [
            "Types of stories",
            "Developing a concept",
            "Usage of VFX elements",
            "Oral narrative skills",
            "Creative Writing (Personal Memoir, Descriptive Writing)",
            "Reading and Analysis of short stories"
        ]
    },
    theoriesAndFormatsOfScriptwriting: {
        topic: "Theories and Formats of Scriptwriting",
        subtopics: [
            "History of Storytelling",
            "Screenplay writing - Overview and Process",
            "Elements of a screenplay",
            "Premise, Plot, Treatment, Characters, Conflict",
            "Screenwriting Softwares",
            "Introductions to Story structures  - I (Three-Act Structure, 5 Act Structure)",
            "Creating simple screenplays using 3 act structure"
        ]
    }
}

const semester2Syllabus = {
    stagingAndBlocking: {
        topic: "Staging and Blocking",
        subtopics: [
            "Understanding the concept of staging and blocking",
            "Types of staging and blocking",
            "Usage of props and space",
            "I, A, L, C, S patterns",
            "Blocking for VFX"
        ]
    },
    workingWithActors: {
        topic: "Working with Actors",
        subtopics: [
            "Staging a scene with actors",
            "Exercise on Improvisation",
            "Styles of acting",
            "Difference between stage and film acting",
            "Working with Virtual/Digital Actors : Possibilities & Limitations"
        ]
    },
    sceneAnalysis: {
        topic: "Scene Analysis",
        subtopics: [
            "Dialogue – Acting - Composition-Staging and Blocking along with use of Visualization tools like",
            "Traditional/Digital Storyboards & AI tools for mood boards"
        ]
    },
    dialogueWritingAndStoryStructures: {
        topic: "Dialogue Writing & Story Structures",
        subtopics: [
            "Dialogue, monologue and conversation",
            "Types of dialogue",
            "Writing effective dialogue",
            "Dialogue through observation",
            "Dialogue in a situation",
            "Story Structures II (Hero's Journey, Dan Harmon Story Circle)",
            "Creating effective story conflicts"
        ]
    },
    rhythmAndPace: {
        topic: "Rhythm and Pace",
        subtopics: [
            "Usage of Edit, Sound and BGM from Director's Point of View",
            "Tonalities of Dialogue",
            "Space and Action Dynamics"
        ]
    }
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

interface Class {
    id: string;
    name: string;
    semester: number;
    created_at: string;
    updated_at: string;
}

interface TeacherClass extends Class {
    student_count?: number;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correct_option_id: number;
    Correct_answer_explanation: string;
}

interface GeneratedQuiz {
    title: string;
    topic: string;
    subtopic: string;
    questions: QuizQuestion[];
    totalQuestions: number;
    timeLimit: number;
    totalPoints: number;
    revisionHistory: Array<{
        version: number;
        questions: QuizQuestion[];
        revisionRequest?: string;
        timestamp: Date;
    }>;
}

type WorkflowState =
    | 'form'
    | 'generating'
    | 'reviewing'
    | 'editing-questions'
    | 'requesting-changes'
    | 'regenerating'
    | 'saving'
    | 'enrolling'
    | 'complete'

const ClassCard = ({ classItem, isSelected, onSelect, studentCount }) => (
    <Card
        className={cn(
            "cursor-pointer transition-all duration-300 hover:shadow-xl group relative overflow-hidden border-2",
            isSelected
                ? "ring-2 ring-purple-500 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 shadow-xl transform scale-[1.02] border-purple-300"
                : "hover:ring-2 hover:ring-purple-200 bg-white border-gray-200 hover:border-purple-200"
        )}
        onClick={() => onSelect(classItem)}
    >
        {isSelected && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2 shadow-lg">
                <CheckCircle className="h-4 w-4 text-white" />
            </div>
        )}

        <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className={cn(
                        "text-lg font-bold mb-3 transition-colors",
                        isSelected ? "text-purple-700" : "text-gray-900 group-hover:text-purple-600"
                    )}>
                        {classItem.name}
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                        <Badge
                            variant={isSelected ? "default" : "secondary"}
                            className={cn(
                                "font-semibold px-3 py-1",
                                isSelected && "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                            )}
                        >
                            <GraduationCap className="h-3 w-3 mr-1" />
                            Semester {classItem.semester}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="h-4 w-4" />
                        <span className="font-medium">{studentCount || 0} Students</span>
                    </div>
                </div>
            </div>

            <div className="text-xs text-gray-500 border-t pt-3">
                Created {new Date(classItem.created_at).toLocaleDateString()}
            </div>

            {isSelected && (
                <div className="mt-4 flex items-center gap-2 text-sm text-purple-600 font-semibold bg-white/70 rounded-lg p-2">
                    <CheckCircle className="h-4 w-4" />
                    Selected for quiz creation
                </div>
            )}
        </CardContent>
    </Card>
);

const QuestionCard = ({ question, index, onEdit, onDelete, isEditing = false }) => {
    const [editedQuestion, setEditedQuestion] = useState({
        question: question.question,
        options: [...question.options],
        correct_option_id: question.correct_option_id,
        Correct_answer_explanation: question.Correct_answer_explanation
    });

    const handleSave = () => {
        onEdit(index, editedQuestion);
    };

    const handleCancel = () => {
        setEditedQuestion({
            question: question.question,
            options: [...question.options],
            correct_option_id: question.correct_option_id,
            Correct_answer_explanation: question.Correct_answer_explanation
        });
    };

    return (
        <Card className="border-2 border-gray-200 hover:border-blue-300 transition-all duration-200">
            <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Question {index + 1}
                    </Badge>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => onEdit(index, null)}>
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDelete(index)} className="text-red-500 hover:text-red-700">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <Label>Question</Label>
                            <Textarea
                                value={editedQuestion.question}
                                onChange={(e) => setEditedQuestion(prev => ({ ...prev, question: e.target.value }))}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Options</Label>
                            {editedQuestion.options.map((option, optIndex) => (
                                <div key={optIndex} className="flex items-center gap-2 mt-2">
                                    <Badge variant={editedQuestion.correct_option_id === optIndex ? "default" : "outline"}>
                                        {String.fromCharCode(65 + optIndex)}
                                    </Badge>
                                    <Input
                                        value={option}
                                        onChange={(e) => {
                                            const newOptions = [...editedQuestion.options];
                                            newOptions[optIndex] = e.target.value;
                                            setEditedQuestion(prev => ({ ...prev, options: newOptions }));
                                        }}
                                        className="flex-1"
                                    />
                                    <Button
                                        size="sm"
                                        variant={editedQuestion.correct_option_id === optIndex ? "default" : "outline"}
                                        onClick={() => setEditedQuestion(prev => ({ ...prev, correct_option_id: optIndex }))}
                                    >
                                        Correct
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div>
                            <Label>Explanation</Label>
                            <Textarea
                                value={editedQuestion.Correct_answer_explanation}
                                onChange={(e) => setEditedQuestion(prev => ({ ...prev, Correct_answer_explanation: e.target.value }))}
                                className="mt-1"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleSave} size="sm">Save</Button>
                            <Button onClick={handleCancel} variant="outline" size="sm">Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="font-semibold text-gray-900 leading-relaxed">
                            {question.question}
                        </div>

                        <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                                <div
                                    key={optIndex}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-lg border",
                                        question.correct_option_id === optIndex
                                            ? "bg-green-50 border-green-200 text-green-800"
                                            : "bg-gray-50 border-gray-200"
                                    )}
                                >
                                    <Badge
                                        variant={question.correct_option_id === optIndex ? "default" : "outline"}
                                        className={question.correct_option_id === optIndex ? "bg-green-600" : ""}
                                    >
                                        {String.fromCharCode(65 + optIndex)}
                                    </Badge>
                                    <span className="flex-1">{option}</span>
                                    {question.correct_option_id === optIndex && (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                </div>
                            ))}
                        </div>

                        {question.Correct_answer_explanation && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-blue-800 mb-1">Explanation:</div>
                                <div className="text-sm text-blue-700">{question.Correct_answer_explanation}</div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default function CreateQuiz() {
    const navigate = useNavigate()
    const { profile } = useAuth()
    const { toast } = useToast()
    const [loading, setLoading] = useState(true)
    const [workflowState, setWorkflowState] = useState<WorkflowState>('form')

    // Form state
    const [classes, setClasses] = useState<TeacherClass[]>([])
    const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null)
    const [selectedTopic, setSelectedTopic] = useState<string>("")
    const [selectedSubtopic, setSelectedSubtopic] = useState<string>("")
    const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
    const [availableTopics, setAvailableTopics] = useState<any>({})
    const [availableSubtopics, setAvailableSubtopics] = useState<string[]>([])

    // Quiz workflow state
    const [currentQuiz, setCurrentQuiz] = useState<GeneratedQuiz | null>(null)
    const [revisionRequest, setRevisionRequest] = useState<string>("")
    const [finalQuizId, setFinalQuizId] = useState<string | null>(null)
    const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null)

    // Calendar state
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    useEffect(() => {
        fetchTeacherClasses()
    }, [])

    // Update available topics when class is selected
    useEffect(() => {
        if (selectedClass) {
            const syllabus = selectedClass.semester === 1 ? semester1Syllabus : semester2Syllabus
            setAvailableTopics(syllabus)
            setSelectedTopic("")
            setSelectedSubtopic("")
            setAvailableSubtopics([])
        }
    }, [selectedClass])

    // Update available subtopics when topic is selected
    useEffect(() => {
        if (selectedTopic && availableTopics[selectedTopic]) {
            setAvailableSubtopics(availableTopics[selectedTopic].subtopics)
            setSelectedSubtopic("")
        }
    }, [selectedTopic, availableTopics])

    const fetchTeacherClasses = async () => {
        try {
            const { data: classesData, error } = await supabase
                .from('class_teachers')
                .select(`
          class_id,
          classes:class_id (
            id,
            name,
            semester,
            created_at,
            updated_at
          )
        `)
                .eq('teacher_id', (profile as Profile)?.id)

            if (error) throw error

            const classesWithCount = await Promise.all(
                classesData.map(async (item) => {
                    const { count } = await supabase
                        .from('class_students')
                        .select('*', { count: 'exact', head: true })
                        .eq('class_id', item.class_id)

                    return {
                        ...item.classes,
                        student_count: count
                    }
                })
            )

            setClasses(classesWithCount)
        } catch (error) {
            console.error('Error fetching classes:', error)
            toast({
                title: "Error",
                description: "Failed to load classes",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const callQuizAgent = async (subtopic: string) => {
        const result = await agentsPostJson<{ output: string }>(
            "/api/quizzes/generate",
            { subtopic: subtopic.toLowerCase() },
        );

        try {
            // Parse the JSON string from output
            const parsedOutput = JSON.parse(result.output);
            return parsedOutput.all_questions;
        } catch (parseError) {
            console.error("Failed to parse API response:", result);
            throw new Error("Invalid response format from quiz generation API");
        }
    };

    const generateQuiz = async (isRevision = false) => {
        try {
            let questions: QuizQuestion[];

            if (isRevision && currentQuiz) {
                // For revision, regenerate with the same subtopic
                questions = await callQuizAgent(currentQuiz.subtopic);
            } else {
                // Initial generation
                questions = await callQuizAgent(selectedSubtopic);
            }

            const timeLimit = questions.length * 1; // 1 minute per question
            const totalPoints = questions.length; // 1 point per question

            const newQuiz = {
                title: selectedSubtopic,
                topic: availableTopics[selectedTopic]?.topic || selectedTopic,
                subtopic: selectedSubtopic,
                questions,
                totalQuestions: questions.length,
                timeLimit,
                totalPoints,
                revisionHistory: currentQuiz
                    ? [
                        ...currentQuiz.revisionHistory,
                        {
                            version: currentQuiz.revisionHistory.length + 1,
                            questions,
                            revisionRequest: isRevision ? revisionRequest : undefined,
                            timestamp: new Date(),
                        },
                    ]
                    : [
                        {
                            version: 1,
                            questions,
                            timestamp: new Date(),
                        },
                    ],
            };

            setCurrentQuiz(newQuiz);
            setRevisionRequest("");
            setWorkflowState("reviewing");

            toast({
                title: isRevision ? "Quiz Regenerated Successfully!" : "Quiz Generated Successfully!",
                description: `Generated ${questions.length} questions with ${timeLimit} minutes time limit.`,
            });

            return true;
        } catch (error) {
            console.error("Quiz Generation Error:", error);
            toast({
                title: isRevision ? "Regeneration Failed" : "Generation Failed",
                description: error instanceof Error ? error.message : "Unknown error occurred",
                variant: "destructive",
            });
            setWorkflowState(isRevision ? "reviewing" : "form");
            return false;
        }
    };

    const handleInitialGeneration = async () => {
        if (!selectedClass || !selectedSubtopic || !dueDate) {
            toast({
                title: "Form Incomplete",
                description: "Please fill in all required fields",
                variant: "destructive"
            })
            return
        }

        setWorkflowState('generating')
        await generateQuiz(false)
    }

    const handleRevisionRequest = async () => {
        if (!revisionRequest.trim()) {
            toast({
                title: "Revision Request Required",
                description: "Please describe what changes you'd like to make",
                variant: "destructive"
            })
            return
        }

        setWorkflowState('regenerating')
        await generateQuiz(true)
    }

    const handleEditQuestion = (index: number, editedQuestion: QuizQuestion | null) => {
        if (editedQuestion && currentQuiz) {
            const updatedQuestions = [...currentQuiz.questions];
            updatedQuestions[index] = editedQuestion;
            setCurrentQuiz({
                ...currentQuiz,
                questions: updatedQuestions
            });
            setEditingQuestionIndex(null);
            toast({
                title: "Question Updated",
                description: "Question has been updated successfully",
            });
        } else {
            setEditingQuestionIndex(editingQuestionIndex === index ? null : index);
        }
    };

    const handleDeleteQuestion = (index: number) => {
        if (currentQuiz && currentQuiz.questions.length > 1) {
            const updatedQuestions = currentQuiz.questions.filter((_, i) => i !== index);
            const newTimeLimit = updatedQuestions.length * 1;
            const newTotalPoints = updatedQuestions.length;

            setCurrentQuiz({
                ...currentQuiz,
                questions: updatedQuestions,
                totalQuestions: updatedQuestions.length,
                timeLimit: newTimeLimit,
                totalPoints: newTotalPoints
            });

            toast({
                title: "Question Deleted",
                description: "Question has been removed from the quiz",
            });
        } else {
            toast({
                title: "Cannot Delete",
                description: "Quiz must have at least one question",
                variant: "destructive"
            });
        }
    };

    const saveQuizToDatabase = async (): Promise<string | null> => {
        try {
            console.log("Saving quiz to database...")

            // Save quiz
            const quizData = {
                title: currentQuiz!.title,
                description: `Quiz for ${currentQuiz!.subtopic} in ${currentQuiz!.topic}`,
                teacher_id: (profile as Profile)?.id,
                class_id: selectedClass?.id,
                topic: currentQuiz!.topic,
                subtopic: currentQuiz!.subtopic,
                semester: selectedClass?.semester,
                due_date: dueDate?.toISOString(),
                time_limit_minutes: currentQuiz!.timeLimit,
                total_points: currentQuiz!.totalPoints,
                status: 'published',
                ai_generated_content: { all_questions: currentQuiz!.questions },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }

            const { data: quizResult, error: quizError } = await supabase
                .from('quizzes')
                .insert([quizData])
                .select()
                .single()

            if (quizError) throw quizError

            // Save questions
            const questionsData = currentQuiz!.questions.map((question, index) => ({
                quiz_id: quizResult.id,
                question_text: question.question,
                options: question.options,
                correct_option_id: question.correct_option_id,
                explanation: question.Correct_answer_explanation,
                points: 1,
                order_index: index,
                created_at: new Date().toISOString()
            }));

            const { error: questionsError } = await supabase
                .from('quiz_questions')
                .insert(questionsData)

            if (questionsError) throw questionsError

            console.log("Quiz saved successfully:", quizResult)
            return quizResult.id
        } catch (error) {
            console.error("Error saving quiz:", error)
            throw error
        }
    }

    const enrollStudentsInQuiz = async (quizId: string): Promise<boolean> => {
        try {
            console.log("Enrolling students in quiz...")

            const { data: students, error: studentsError } = await supabase
                .from('class_students')
                .select('student_id')
                .eq('class_id', selectedClass?.id)

            if (studentsError) throw studentsError

            if (!students || students.length === 0) {
                console.log("No students found in class")
                return false
            }

            const enrollmentData = students.map(student => ({
                quiz_id: quizId,
                student_id: student.student_id,
                assigned_at: new Date().toISOString(),
                status: 'assigned'
            }))

            const { error: enrollmentError } = await supabase
                .from('quiz_enrollments')
                .insert(enrollmentData)

            if (enrollmentError) throw enrollmentError

            console.log("Students enrolled successfully")
            return true
        } catch (error) {
            console.error("Error enrolling students:", error)
            throw error
        }
    }

    const handleSaveQuiz = async () => {
        setWorkflowState('saving')

        try {
            const quizId = await saveQuizToDatabase()

            if (quizId) {
                setFinalQuizId(quizId)
                setWorkflowState('enrolling')

                const enrollmentSuccess = await enrollStudentsInQuiz(quizId)

                if (enrollmentSuccess) {
                    setWorkflowState('complete')
                    toast({
                        title: "Quiz Created Successfully!",
                        description: `Quiz saved and assigned to ${selectedClass?.student_count || 0} students`,
                    })
                } else {
                    toast({
                        title: "Quiz Saved",
                        description: "Quiz saved but no students were enrolled (no students in class)",
                    })
                    setWorkflowState('complete')
                }
            }
        } catch (error) {
            console.error("Save Quiz Error:", error)
            toast({
                title: "Save Failed",
                description: error instanceof Error ? error.message : "Failed to save quiz",
                variant: "destructive"
            })
            setWorkflowState('reviewing')
        }
    }

    const resetWorkflow = () => {
        setWorkflowState('form')
        setCurrentQuiz(null)
        setRevisionRequest("")
        setFinalQuizId(null)
        setSelectedClass(null)
        setSelectedTopic("")
        setSelectedSubtopic("")
        setDueDate(undefined)
        setEditingQuestionIndex(null)
    }

    const isFormValid = selectedClass && selectedSubtopic && dueDate
    const progressSteps = [
        { completed: !!selectedClass, label: "Class" },
        { completed: !!selectedTopic, label: "Topic" },
        { completed: !!selectedSubtopic, label: "Subtopic" },
        { completed: !!dueDate, label: "Due Date" },
    ]

    if (loading) {
        return (
            <AuthGuard allowedRoles={["teacher"]}>
                <ModernDashboardLayout>
                    <div className="flex items-center justify-center min-h-[400px]">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                            <p className="text-gray-600">Loading classes...</p>
                        </div>
                    </div>
                </ModernDashboardLayout>
            </AuthGuard>
        )
    }

    return (
        <AuthGuard allowedRoles={["teacher"]}>
            <ModernDashboardLayout>
                <div className="max-w-6xl mx-auto space-y-8">
                    <div>
                        <Button
                            variant="ghost"
                            onClick={() => navigate("/teacher/quiz")}
                            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Quizzes
                        </Button>
                    </div>
                    {/* Enhanced Header */}
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                                <Brain className="h-8 w-8 text-purple-600" />
                            </div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Smart Quiz Creator
                            </h1>
                        </div>
                        <p className="text-gray-600 max-w-3xl mx-auto text-lg">
                            {workflowState === 'form' && "Create intelligent quizzes with AI-powered question generation tailored to your curriculum"}
                            {workflowState === 'generating' && "Our AI is crafting personalized quiz questions for your students..."}
                            {workflowState === 'reviewing' && "Review and customize your AI-generated quiz before publishing"}
                            {workflowState === 'editing-questions' && "Fine-tune individual questions to match your teaching objectives"}
                            {workflowState === 'requesting-changes' && "Request specific modifications to improve your quiz"}
                            {workflowState === 'regenerating' && "Regenerating quiz with your requested improvements..."}
                            {workflowState === 'saving' && "Finalizing your quiz and preparing for deployment..."}
                            {workflowState === 'enrolling' && "Automatically enrolling students and setting up quiz access..."}
                            {workflowState === 'complete' && "Quiz successfully created and deployed to your students!"}
                        </p>
                    </div>

                    {/* Enhanced Workflow Progress Indicator */}
                    <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-purple-600" />
                                    Quiz Creation Progress
                                </h3>
                                <Badge
                                    variant={workflowState === 'complete' ? 'default' : 'secondary'}
                                    className={cn(
                                        "px-4 py-2 font-semibold",
                                        workflowState === 'complete'
                                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                                            : "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                                    )}
                                >
                                    {workflowState === 'form' && '📝 Configuration'}
                                    {workflowState === 'generating' && '🤖 AI Generation'}
                                    {workflowState === 'reviewing' && '👁️ Review & Customize'}
                                    {workflowState === 'editing-questions' && '✏️ Editing Questions'}
                                    {workflowState === 'requesting-changes' && '💬 Requesting Changes'}
                                    {workflowState === 'regenerating' && '🔄 Regenerating'}
                                    {workflowState === 'saving' && '💾 Saving Quiz'}
                                    {workflowState === 'enrolling' && '👥 Enrolling Students'}
                                    {workflowState === 'complete' && '✅ Complete'}
                                </Badge>
                            </div>

                            {workflowState === 'form' && (
                                <div className="flex flex-wrap items-center gap-4">
                                    {progressSteps.map((step, index) => (
                                        <div key={step.label} className="flex items-center">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300",
                                                step.completed
                                                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg"
                                                    : "bg-gray-200 text-gray-500"
                                            )}>
                                                {step.completed ? (
                                                    <CheckCircle className="h-5 w-5" />
                                                ) : (
                                                    index + 1
                                                )}
                                            </div>
                                            <span className={cn(
                                                "ml-3 text-sm font-semibold",
                                                step.completed ? "text-purple-700" : "text-gray-500"
                                            )}>
                                                {step.label}
                                            </span>
                                            {index < progressSteps.length - 1 && (
                                                <ArrowRight className="h-5 w-5 text-gray-400 mx-4" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {workflowState !== 'form' && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {workflowState === 'generating' || workflowState === 'regenerating' ? (
                                            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                                        ) : workflowState === 'reviewing' || workflowState === 'requesting-changes' || workflowState === 'editing-questions' ? (
                                            <Eye className="h-6 w-6 text-blue-600" />
                                        ) : workflowState === 'saving' || workflowState === 'enrolling' ? (
                                            <Save className="h-6 w-6 text-green-600" />
                                        ) : workflowState === 'complete' ? (
                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                        ) : null}
                                        <span className="text-sm font-semibold text-gray-700">
                                            {workflowState === 'generating' && 'AI is generating quiz questions...'}
                                            {workflowState === 'reviewing' && 'Quiz ready for review and customization'}
                                            {workflowState === 'editing-questions' && 'Editing individual questions'}
                                            {workflowState === 'requesting-changes' && 'Waiting for your feedback'}
                                            {workflowState === 'regenerating' && 'AI is regenerating quiz questions...'}
                                            {workflowState === 'saving' && 'Saving quiz to database...'}
                                            {workflowState === 'enrolling' && 'Enrolling students...'}
                                            {workflowState === 'complete' && 'Quiz successfully created!'}
                                        </span>
                                    </div>
                                    {currentQuiz && (
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                <ListChecks className="h-3 w-3 mr-1" />
                                                {currentQuiz.totalQuestions} Questions
                                            </Badge>
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                <Timer className="h-3 w-3 mr-1" />
                                                {currentQuiz.timeLimit} min
                                            </Badge>
                                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                                <Trophy className="h-3 w-3 mr-1" />
                                                {currentQuiz.totalPoints} pts
                                            </Badge>
                                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                                v{currentQuiz.revisionHistory.length}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Form Configuration */}
                    {workflowState === 'form' && (
                        <>
                            {/* Step 1: Class Selection */}
                            <Card className="shadow-xl border-2 border-gray-200">
                                <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                                            <GraduationCap className="h-7 w-7 text-purple-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-bold">Step 1: Select Your Class</CardTitle>
                                            <CardDescription className="text-lg">Choose the class you want to create a quiz for</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        {classes.map((classItem) => (
                                            <ClassCard
                                                key={classItem.id}
                                                classItem={classItem}
                                                isSelected={selectedClass?.id === classItem.id}
                                                onSelect={setSelectedClass}
                                                studentCount={classItem.student_count}
                                            />
                                        ))}
                                    </div>
                                    {classes.length === 0 && (
                                        <div className="text-center py-12 text-gray-500">
                                            <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                            <h3 className="text-xl font-semibold mb-2">No Classes Assigned</h3>
                                            <p>Please contact your administrator to assign classes to your account.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Steps 2-4: Quiz Configuration */}
                            {selectedClass && (
                                <Card className="shadow-xl border-2 border-gray-200">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                                                    <Target className="h-7 w-7 text-blue-600" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-2xl font-bold">Quiz Configuration</CardTitle>
                                                    <CardDescription className="text-lg">
                                                        Set up your quiz details for <span className="font-semibold text-blue-600">{selectedClass.name}</span>
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-1">
                                                    <GraduationCap className="h-4 w-4 mr-1" />
                                                    Semester {selectedClass.semester}
                                                </Badge>
                                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                                                    <Users className="h-4 w-4 mr-1" />
                                                    {selectedClass.student_count || 0} Students
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 space-y-8">
                                        <div className="grid gap-8 lg:grid-cols-2">
                                            {/* Step 2: Topic Selection */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 rounded-lg">
                                                        <BookOpen className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <Label className="text-lg font-bold text-gray-800">Step 2: Select Topic</Label>
                                                </div>
                                                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                                                    <SelectTrigger className="h-14 text-lg border-2 border-gray-200 hover:border-blue-300 transition-colors">
                                                        <SelectValue placeholder="Choose a topic from the curriculum..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(availableTopics).map(([key, value]) => (
                                                            <SelectItem key={key} value={key} className="py-4">
                                                                <div>
                                                                    <div className="font-semibold text-base">{value.topic}</div>
                                                                    <div className="text-sm text-gray-500 mt-1">
                                                                        {value.subtopics.length} subtopics available
                                                                    </div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Step 3: Subtopic Selection */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <FileText className="h-5 w-5 text-green-600" />
                                                    </div>
                                                    <Label className="text-lg font-bold text-gray-800">Step 3: Select Subtopic</Label>
                                                </div>
                                                <Select
                                                    value={selectedSubtopic}
                                                    onValueChange={setSelectedSubtopic}
                                                    disabled={!selectedTopic}
                                                >
                                                    <SelectTrigger className="h-14 text-lg border-2 border-gray-200 hover:border-green-300 transition-colors">
                                                        <SelectValue placeholder={selectedTopic ? "Choose a subtopic..." : "Select topic first"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableSubtopics.map((subtopic, index) => (
                                                            <SelectItem key={index} value={subtopic} className="py-4">
                                                                <div className="max-w-md">
                                                                    <div className="font-semibold text-sm leading-relaxed">{subtopic}</div>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Step 4: Due Date */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-100 rounded-lg">
                                                        <Clock className="h-5 w-5 text-orange-600" />
                                                    </div>
                                                    <Label className="text-lg font-bold text-gray-800">Step 4: Set Due Date</Label>
                                                </div>
                                                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            className={cn(
                                                                "h-14 w-full justify-start text-left font-semibold text-lg border-2 border-gray-200 hover:border-orange-300 transition-colors",
                                                                !dueDate && "text-muted-foreground"
                                                            )}
                                                        >
                                                            <CalendarIcon className="mr-3 h-5 w-5" />
                                                            {dueDate ? format(dueDate, "PPP") : "Pick a due date"}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-auto p-0" align="start">
                                                        <Calendar
                                                            mode="single"
                                                            selected={dueDate}
                                                            onSelect={(date) => {
                                                                setDueDate(date)
                                                                setIsCalendarOpen(false)
                                                            }}
                                                            disabled={(date) => date < new Date()}
                                                            initialFocus
                                                        />
                                                    </PopoverContent>
                                                </Popover>
                                            </div>

                                            {/* Generate Button */}
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-purple-100 rounded-lg">
                                                        <Zap className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <Label className="text-lg font-bold text-gray-800">AI Quiz Generation</Label>
                                                </div>
                                                <Button
                                                    onClick={handleInitialGeneration}
                                                    disabled={!isFormValid}
                                                    className="h-14 w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                                                >
                                                    <Brain className="h-6 w-6 mr-3" />
                                                    Generate Smart Quiz
                                                </Button>
                                                <p className="text-sm text-gray-500 text-center">
                                                    AI will create personalized questions based on your curriculum
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quiz Summary Preview */}
                                        {isFormValid && (
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6 mt-8">
                                                <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
                                                    <CheckCircle className="h-6 w-6" />
                                                    Quiz Preview
                                                </h4>
                                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 text-sm">
                                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                                        <span className="font-semibold text-gray-700 block mb-1">Class & Students</span>
                                                        <span className="text-gray-900 font-medium">{selectedClass.name}</span>
                                                        <div className="text-gray-600 text-xs mt-1">{selectedClass.student_count || 0} students will receive this quiz</div>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                                        <span className="font-semibold text-gray-700 block mb-1">Topic & Focus</span>
                                                        <span className="text-gray-900 font-medium">{availableTopics[selectedTopic]?.topic}</span>
                                                        <div className="text-gray-600 text-xs mt-1 truncate">{selectedSubtopic}</div>
                                                    </div>
                                                    <div className="bg-white rounded-lg p-4 border border-green-200">
                                                        <span className="font-semibold text-gray-700 block mb-1">Schedule</span>
                                                        <span className="text-gray-900 font-medium">{dueDate && format(dueDate, "MMM dd, yyyy")}</span>
                                                        <div className="text-gray-600 text-xs mt-1">Semester {selectedClass.semester} curriculum</div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex items-center gap-4 text-xs text-green-700 bg-white/70 rounded-lg p-3">
                                                    <div className="flex items-center gap-1">
                                                        <Brain className="h-4 w-4" />
                                                        <span>AI will generate relevant questions</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Timer className="h-4 w-4" />
                                                        <span>1 minute per question time limit</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Award className="h-4 w-4" />
                                                        <span>1 point per question scoring</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    )}

                    {/* Generation State */}
                    {workflowState === 'generating' && (
                        <Card className="shadow-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
                            <CardContent className="pt-8">
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="relative mb-8">
                                        <Loader2 className="h-20 w-20 animate-spin text-purple-600" />
                                        <Brain className="h-8 w-8 text-purple-400 absolute -top-2 -right-2 animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-purple-800 mb-3">Generating Your Quiz</h3>
                                    <p className="text-purple-600 text-center max-w-lg text-lg mb-6">
                                        Our AI is analyzing <strong>{selectedSubtopic}</strong> and creating personalized questions
                                        for your Semester {selectedClass?.semester} students.
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 text-center">
                                            <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                                            <div className="text-sm font-semibold text-gray-800">Curriculum Analysis</div>
                                            <div className="text-xs text-gray-600">Reviewing syllabus content</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 text-center">
                                            <ListChecks className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                            <div className="text-sm font-semibold text-gray-800">Question Generation</div>
                                            <div className="text-xs text-gray-600">Creating relevant MCQs</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-purple-200 text-center">
                                            <Award className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                            <div className="text-sm font-semibold text-gray-800">Quality Check</div>
                                            <div className="text-xs text-gray-600">Ensuring accuracy</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Review Quiz */}
                    {workflowState === 'reviewing' && currentQuiz && (
                        <div className="space-y-6">
                            {/* Quiz Overview */}
                            <Card className="shadow-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                                                <Eye className="h-7 w-7 text-blue-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-bold text-blue-800">Review Your Quiz</CardTitle>
                                                <CardDescription className="text-lg text-blue-600">
                                                    Customize questions and settings before publishing to students
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 px-3 py-2">
                                            Version {currentQuiz.revisionHistory.length}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Quiz Stats */}
                                    <div className="grid gap-4 md:grid-cols-4">
                                        <div className="bg-white rounded-xl p-4 border-2 border-blue-200 text-center">
                                            <ListChecks className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-blue-800">{currentQuiz.totalQuestions}</div>
                                            <div className="text-sm text-blue-600 font-medium">Questions</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border-2 border-green-200 text-center">
                                            <Timer className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-green-800">{currentQuiz.timeLimit}</div>
                                            <div className="text-sm text-green-600 font-medium">Minutes</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border-2 border-purple-200 text-center">
                                            <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-purple-800">{currentQuiz.totalPoints}</div>
                                            <div className="text-sm text-purple-600 font-medium">Points</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 border-2 border-orange-200 text-center">
                                            <Users className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-orange-800">{selectedClass?.student_count || 0}</div>
                                            <div className="text-sm text-orange-600 font-medium">Students</div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                        <Button
                                            onClick={() => setWorkflowState('editing-questions')}
                                            variant="outline"
                                            className="flex-1 h-12 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                                        >
                                            <Edit3 className="h-5 w-5 mr-2" />
                                            Edit Questions
                                        </Button>
                                        <Button
                                            onClick={() => setWorkflowState('requesting-changes')}
                                            variant="outline"
                                            className="flex-1 h-12 border-2 border-orange-300 text-orange-700 hover:bg-orange-50 font-semibold"
                                        >
                                            <RefreshCw className="h-5 w-5 mr-2" />
                                            Regenerate Quiz
                                        </Button>
                                        <Button
                                            onClick={handleSaveQuiz}
                                            className="flex-1 h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold"
                                        >
                                            <Save className="h-5 w-5 mr-2" />
                                            Publish Quiz
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Questions Preview */}
                            <Card className="shadow-lg border-2 border-gray-200">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <FileText className="h-6 w-6 text-gray-700" />
                                        Quiz Questions Preview
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 max-h-96 overflow-y-auto">
                                    {currentQuiz.questions.map((question, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                                    Q{index + 1}
                                                </Badge>
                                                <Button variant="ghost" size="sm" onClick={() => setWorkflowState('editing-questions')}>
                                                    <Edit3 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="font-medium text-gray-900 mb-3">{question.question}</div>
                                            <div className="space-y-1">
                                                {question.options.map((option, optIndex) => (
                                                    <div
                                                        key={optIndex}
                                                        className={cn(
                                                            "flex items-center gap-2 p-2 rounded text-sm",
                                                            question.correct_option_id === optIndex
                                                                ? "bg-green-100 text-green-800 font-medium"
                                                                : "bg-white text-gray-700"
                                                        )}
                                                    >
                                                        <Badge variant={question.correct_option_id === optIndex ? "default" : "outline"} className="text-xs">
                                                            {String.fromCharCode(65 + optIndex)}
                                                        </Badge>
                                                        <span>{option}</span>
                                                        {question.correct_option_id === optIndex && (
                                                            <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Edit Questions */}
                    {workflowState === 'editing-questions' && currentQuiz && (
                        <div className="space-y-6">
                            {/* Header */}
                            <Card className="shadow-lg border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                                                <Edit3 className="h-7 w-7 text-orange-600" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl font-bold text-orange-800">Edit Quiz Questions</CardTitle>
                                                <CardDescription className="text-lg text-orange-600">
                                                    Customize individual questions to match your teaching objectives
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setWorkflowState('reviewing')}
                                            variant="outline"
                                            className="border-orange-300 text-orange-700 hover:bg-orange-50"
                                        >
                                            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                                            Back to Review
                                        </Button>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Questions Editor */}
                            <div className="space-y-4">
                                {currentQuiz.questions.map((question, index) => (
                                    <QuestionCard
                                        key={index}
                                        question={question}
                                        index={index}
                                        onEdit={handleEditQuestion}
                                        onDelete={handleDeleteQuestion}
                                        isEditing={editingQuestionIndex === index}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Request Changes */}
                    {workflowState === 'requesting-changes' && (
                        <Card className="shadow-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                                        <MessageSquare className="h-7 w-7 text-orange-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-bold text-orange-800">Request Quiz Changes</CardTitle>
                                        <CardDescription className="text-lg text-orange-600">
                                            Describe what modifications you'd like the AI to make
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-white rounded-xl p-6 border-2 border-orange-200">
                                    <Label className="text-lg font-bold text-orange-800 mb-4 block">
                                        What changes would you like to make?
                                    </Label>
                                    <Textarea
                                        value={revisionRequest}
                                        onChange={(e) => setRevisionRequest(e.target.value)}
                                        placeholder="Describe your requested changes. For example:
• Make questions more challenging
• Focus more on practical applications
• Add questions about recent developments
• Reduce difficulty level for beginners
• Include more scenario-based questions
• Change the question format or style"
                                        className="min-h-[140px] resize-none border-2 border-orange-200 focus:border-orange-400 focus:ring-orange-400 text-base"
                                    />
                                </div>

                                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
                                    <div className="flex items-start gap-4">
                                        <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-semibold mb-2">Tips for effective revision requests:</p>
                                            <ul className="space-y-1 text-amber-700">
                                                <li>• Be specific about the type of changes you want</li>
                                                <li>• Mention difficulty level preferences</li>
                                                <li>• Include any specific topics to emphasize or avoid</li>
                                                <li>• The AI will generate completely new questions based on your feedback</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        onClick={() => setWorkflowState('reviewing')}
                                        variant="outline"
                                        className="flex-1 h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                                    >
                                        <ArrowRight className="h-5 w-5 mr-2 rotate-180" />
                                        Back to Review
                                    </Button>
                                    <Button
                                        onClick={handleRevisionRequest}
                                        disabled={!revisionRequest.trim()}
                                        className="flex-1 h-12 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold"
                                    >
                                        <RefreshCw className="h-5 w-5 mr-2" />
                                        Regenerate Quiz
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Regenerating State */}
                    {workflowState === 'regenerating' && (
                        <Card className="shadow-xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                            <CardContent className="pt-8">
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="relative mb-8">
                                        <Loader2 className="h-20 w-20 animate-spin text-orange-600" />
                                        <RefreshCw className="h-8 w-8 text-orange-400 absolute -top-2 -right-2 animate-pulse" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-orange-800 mb-3">Regenerating Your Quiz</h3>
                                    <p className="text-orange-600 text-center max-w-lg text-lg mb-6">
                                        Our AI is incorporating your feedback and creating an improved version...
                                    </p>
                                    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-orange-200 max-w-md">
                                        <div className="text-sm text-gray-600">
                                            <div className="font-semibold text-orange-800 mb-3">Your revision request:</div>
                                            <div className="italic text-gray-700 bg-gray-50 rounded-lg p-3 border">
                                                "{revisionRequest}"
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Saving/Enrolling States */}
                    {(workflowState === 'saving' || workflowState === 'enrolling') && (
                        <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                            <CardContent className="pt-8">
                                <div className="flex flex-col items-center justify-center py-16">
                                    <div className="relative mb-8">
                                        <Loader2 className="h-20 w-20 animate-spin text-green-600" />
                                        {workflowState === 'saving' ? (
                                            <Save className="h-8 w-8 text-green-400 absolute -top-2 -right-2 animate-pulse" />
                                        ) : (
                                            <UserPlus className="h-8 w-8 text-green-400 absolute -top-2 -right-2 animate-pulse" />
                                        )}
                                    </div>
                                    <h3 className="text-2xl font-bold text-green-800 mb-3">
                                        {workflowState === 'saving' ? 'Publishing Quiz' : 'Enrolling Students'}
                                    </h3>
                                    <p className="text-green-600 text-center max-w-lg text-lg mb-6">
                                        {workflowState === 'saving'
                                            ? 'Saving your quiz to the database and preparing for deployment...'
                                            : `Automatically enrolling ${selectedClass?.student_count || 0} students and setting up quiz access...`
                                        }
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 text-center">
                                            <Save className="h-6 w-6 text-green-600 mx-auto mb-2" />
                                            <div className="text-sm font-semibold text-gray-800">Database Storage</div>
                                            <div className="text-xs text-gray-600">Saving quiz & questions</div>
                                        </div>
                                        <div className="bg-white rounded-xl p-4 shadow-sm border border-green-200 text-center">
                                            <UserPlus className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                                            <div className="text-sm font-semibold text-gray-800">Student Enrollment</div>
                                            <div className="text-xs text-gray-600">Setting up access</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Success State */}
                    {workflowState === 'complete' && currentQuiz && (
                        <Card className="shadow-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                                        <CheckCircle className="h-8 w-8 text-green-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-3xl font-bold text-green-800">Quiz Created Successfully!</CardTitle>
                                        <CardDescription className="text-lg text-green-600">
                                            Your quiz has been published and assigned to all students in the class
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    <div className="bg-white rounded-xl p-6 border-2 border-green-200 text-center">
                                        <FileText className="h-10 w-10 text-green-600 mx-auto mb-3" />
                                        <div className="text-lg font-bold text-gray-900">{currentQuiz.title}</div>
                                        <div className="text-sm text-gray-600 mt-1">Quiz Title</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 border-2 border-blue-200 text-center">
                                        <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                                        <div className="text-lg font-bold text-gray-900">{selectedClass?.name}</div>
                                        <div className="text-sm text-gray-600 mt-1">Class</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 border-2 border-purple-200 text-center">
                                        <Trophy className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                                        <div className="text-lg font-bold text-gray-900">{selectedClass?.student_count || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Students Enrolled</div>
                                    </div>
                                    <div className="bg-white rounded-xl p-6 border-2 border-orange-200 text-center">
                                        <CalendarIcon className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                                        <div className="text-lg font-bold text-gray-900">{format(dueDate!, "MMM dd")}</div>
                                        <div className="text-sm text-gray-600 mt-1">Due Date</div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                                    <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2 text-lg">
                                        <Award className="h-6 w-6" />
                                        Quiz Summary
                                    </h4>
                                    <div className="grid gap-4 md:grid-cols-3 text-center">
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                                            <ListChecks className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-blue-800">{currentQuiz.totalQuestions}</div>
                                            <div className="text-sm text-blue-600 font-medium">Questions Generated</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                                            <Timer className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-green-800">{currentQuiz.timeLimit}</div>
                                            <div className="text-sm text-green-600 font-medium">Minutes Allowed</div>
                                        </div>
                                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg p-4 border border-purple-200">
                                            <Trophy className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                            <div className="text-2xl font-bold text-purple-800">{currentQuiz.totalPoints}</div>
                                            <div className="text-sm text-purple-600 font-medium">Total Points</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl p-6 border-2 border-green-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2 text-sm text-green-700">
                                                <UserPlus className="h-5 w-5" />
                                                <span className="font-medium">Students automatically enrolled</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-blue-700">
                                                <Eye className="h-5 w-5" />
                                                <span className="font-medium">Quiz visible to students</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-purple-700">
                                                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                                                    Final Version {currentQuiz.revisionHistory.length}
                                                </Badge>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={resetWorkflow}
                                            variant="outline"
                                            className="border-2 border-green-300 text-green-700 hover:bg-green-50 font-semibold"
                                        >
                                            <Plus className="h-5 w-5 mr-2" />
                                            Create Another Quiz
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Enhanced Instructions Card */}
                    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-start gap-6">
                                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                                    <Brain className="h-8 w-8 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-blue-900 mb-4 text-xl">Smart Quiz Creation Workflow</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-blue-800">
                                                <div className="w-3 h-3 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                                                <span><strong>Configure:</strong> Select class, topic, and due date</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-blue-800">
                                                <div className="w-3 h-3 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
                                                <span><strong>Generate:</strong> AI creates curriculum-aligned questions</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-blue-800">
                                                <div className="w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
                                                <span><strong>Review:</strong> Preview and customize generated content</span>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 text-sm text-blue-800">
                                                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full"></div>
                                                <span><strong>Edit:</strong> Modify questions and explanations as needed</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-blue-800">
                                                <div className="w-3 h-3 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full"></div>
                                                <span><strong>Regenerate:</strong> Request AI improvements if needed</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-blue-800">
                                                <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full"></div>
                                                <span><strong>Publish:</strong> Auto-deploy to students with notifications</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex items-center gap-4 p-4 bg-white/70 rounded-lg border border-blue-200">
                                        <Timer className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Auto-calculated: 1 minute per question time limit</span>
                                        <Award className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">Fair scoring: 1 point per question</span>
                                        <Users className="h-5 w-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-800">One attempt per student</span>
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