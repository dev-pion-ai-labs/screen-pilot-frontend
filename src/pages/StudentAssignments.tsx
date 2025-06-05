"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import {
  FileText,
  Eye,
  Upload,
  CheckCircle,
  Clock,
  BookOpen,
  User,
  Search,
  AlertCircle,
  Star,
  Filter,
  SortAsc,
  GraduationCap,
  TrendingUp,
} from "lucide-react"

interface Assignment {
  id: string
  title: string
  subject: string
  teacherName: string
  dueDate: string
  description: string
  status: "pending" | "submitted" | "graded"
  submittedAt?: string
  grade?: number
  priority: "low" | "medium" | "high"
  estimatedTime: string
  points: number
}

// Enhanced dummy data
const dummyAssignments: Assignment[] = [
  {
    id: "1",
    title: "Character Analysis Essay",
    subject: "Acting Technique",
    teacherName: "Prof. Sarah Johnson",
    dueDate: "2024-04-15",
    description:
      "Write a detailed character analysis of a character from a play of your choice. Focus on their motivations, relationships, and character arc. Minimum 1000 words. Include references to at least 3 scholarly sources.",
    status: "pending",
    priority: "high",
    estimatedTime: "4-6 hours",
    points: 100,
  },
  {
    id: "2",
    title: "Monologue Performance",
    subject: "Voice & Movement",
    teacherName: "Prof. Michael Chen",
    dueDate: "2024-04-20",
    description:
      "Prepare and perform a 2-3 minute monologue from a contemporary play. Record your performance and submit the video. Focus on vocal projection and physical expression.",
    status: "submitted",
    submittedAt: "2024-04-18",
    priority: "medium",
    estimatedTime: "8-10 hours",
    points: 150,
  },
  {
    id: "3",
    title: "Scene Study Analysis",
    subject: "Character Study",
    teacherName: "Prof. Emily Rodriguez",
    dueDate: "2024-04-25",
    description:
      "Analyze a scene from 'A Streetcar Named Desire'. Focus on subtext, character objectives, and blocking possibilities. Create a detailed breakdown with staging notes.",
    status: "graded",
    submittedAt: "2024-04-22",
    grade: 92,
    priority: "medium",
    estimatedTime: "3-4 hours",
    points: 75,
  },
  {
    id: "4",
    title: "Improvisation Exercise Reflection",
    subject: "Acting Technique",
    teacherName: "Prof. Sarah Johnson",
    dueDate: "2024-04-12",
    description:
      "Write a reflection on your improvisation exercises from this week. Discuss what you learned and how you can apply these techniques to scripted work.",
    status: "pending",
    priority: "high",
    estimatedTime: "2-3 hours",
    points: 50,
  },
]

export default function StudentAssignmentsPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>(dummyAssignments)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "graded">("all")
  const [sortBy, setSortBy] = useState<"dueDate" | "subject">("dueDate")

  const filteredAssignments = assignments
    .filter((assignment) => {
      const matchesSearch =
        assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assignment.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filter === "all" || assignment.status === filter
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      if (sortBy === "subject") {
        return a.subject.localeCompare(b.subject)
      }
      return 0
    })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const validTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, DOCX, or TXT file.",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to submit.",
        variant: "destructive",
      })
      return
    }

    if (selectedAssignment) {
      setAssignments(
        assignments.map((assignment) =>
          assignment.id === selectedAssignment.id
            ? { ...assignment, status: "submitted", submittedAt: new Date().toISOString() }
            : assignment,
        ),
      )

      toast({
        title: "Assignment submitted successfully! 🎉",
        description: "Your assignment has been submitted and is now under review.",
      })

      setSubmitDialogOpen(false)
      setSelectedFile(null)
    }
  }

  const getStatusBadge = (status: Assignment["status"]) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-medium">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case "submitted":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
            <CheckCircle className="w-3 h-3 mr-1" />
            Submitted
          </Badge>
        )
      case "graded":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-medium">
            <Star className="w-3 h-3 mr-1" />
            Graded
          </Badge>
        )
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getOverallProgress = () => {
    const total = assignments.length
    const completed = assignments.filter((a) => a.status === "graded").length
    return Math.round((completed / total) * 100)
  }

  const getTotalPoints = () => {
    const earned = assignments.filter((a) => a.grade).reduce((sum, a) => sum + (a.grade! * a.points) / 100, 0)
    const total = assignments.reduce((sum, a) => sum + a.points, 0)
    return { earned: Math.round(earned), total }
  }

  const overallProgress = getOverallProgress()
  const { earned, total } = getTotalPoints()

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="space-y-8">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Assignments
                </h1>
                <p className="text-muted-foreground text-lg">Track your progress and submit your work</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-700">
                        {assignments.filter((a) => a.status === "pending").length}
                      </div>
                      <div className="text-sm text-blue-600">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-700">
                        {assignments.filter((a) => a.status === "submitted").length}
                      </div>
                      <div className="text-sm text-green-600">Submitted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-700">
                        {assignments.filter((a) => a.status === "graded").length}
                      </div>
                      <div className="text-sm text-purple-600">Graded</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full md:w-80"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortBy(sortBy === "dueDate" ? "subject" : "dueDate")}
                className="flex items-center gap-2"
              >
                <SortAsc className="h-4 w-4" />
                Sort by {sortBy === "dueDate" ? "Due Date" : "Subject"}
              </Button>
            </div>
          </div>

          <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                All ({assignments.length})
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Pending ({assignments.filter((a) => a.status === "pending").length})
              </TabsTrigger>
              <TabsTrigger value="submitted" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Submitted ({assignments.filter((a) => a.status === "submitted").length})
              </TabsTrigger>
              <TabsTrigger value="graded" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Graded ({assignments.filter((a) => a.status === "graded").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAssignments.map((assignment) => {
              return (
                <Card
                  key={assignment.id}
                  className={cn(
                    "hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-l-4",
                    assignment.status === "graded" && "border-l-green-500 bg-green-50/30",
                    assignment.status === "submitted" && "border-l-blue-500 bg-blue-50/30",
                    assignment.status === "pending" && "border-l-gray-300",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-2 min-w-0 flex-1">
                        <CardTitle className="text-lg line-clamp-2 flex-1">{assignment.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{assignment.subject}</span>
                        </CardDescription>
                      </div>
                      <div className="flex flex-col gap-2 items-end">{getStatusBadge(assignment.status)}</div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{assignment.teacherName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <TrendingUp className="h-4 w-4 flex-shrink-0" />
                        <span>{assignment.points} pts</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className={cn(
                        "flex items-center gap-2 text-sm p-2 rounded",
                        getDaysUntilDue(assignment.dueDate) <= 3 && "bg-red-50 text-red-700",
                        getDaysUntilDue(assignment.dueDate) <= 7 && getDaysUntilDue(assignment.dueDate) > 3 && "bg-amber-50 text-amber-700",
                        getDaysUntilDue(assignment.dueDate) > 7 && "bg-blue-50 text-blue-700"
                      )}>
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>
                          Due: {new Date(assignment.dueDate).toLocaleDateString()} 
                          {getDaysUntilDue(assignment.dueDate) > 0 ? (
                            <span className="ml-1">({getDaysUntilDue(assignment.dueDate)} days left)</span>
                          ) : (
                            <span className="ml-1 font-medium">(Overdue)</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {assignment.submittedAt && (
                      <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                        <CheckCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Submitted: {new Date(assignment.submittedAt).toLocaleDateString()}</span>
                      </div>
                    )}

                    {assignment.grade && (
                      <div className="flex items-center gap-2 text-sm font-medium text-green-600 bg-green-50 p-2 rounded">
                        <Star className="h-4 w-4 flex-shrink-0" />
                        <span>
                          Grade: {assignment.grade}% ({((assignment.grade * assignment.points) / 100).toFixed(0)} pts)
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-4 border-t bg-gray-50/50">
                    <div className="flex justify-between w-full gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAssignment(assignment)
                          setViewDialogOpen(true)
                        }}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>

                      {assignment.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment)
                            setSubmitDialogOpen(true)
                          }}
                          className="flex-1"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Submit
                        </Button>
                      )}

                      {assignment.status === "submitted" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="flex-1 cursor-not-allowed bg-blue-50 text-blue-700 border-blue-200"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Submitted
                        </Button>
                      )}

                      {assignment.status === "graded" && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="flex-1 cursor-not-allowed bg-green-50 text-green-700 border-green-200"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Graded
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              )
            })}
          </div>

          {filteredAssignments.length === 0 && (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-600">No assignments found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              </div>
            </Card>
          )}

          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0 pb-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <DialogTitle className="text-3xl font-bold">{selectedAssignment?.title}</DialogTitle>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Badge variant="outline" className="text-base px-4 py-2 bg-blue-50 text-blue-700 border-blue-200">
                        <BookOpen className="w-4 h-4 mr-2" />
                        {selectedAssignment?.subject}
                      </Badge>
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{selectedAssignment?.teacherName}</span>
                      </div>
                      {selectedAssignment && (
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg text-base font-medium",
                          getDaysUntilDue(selectedAssignment.dueDate) <= 3 && "bg-red-50 text-red-700",
                          getDaysUntilDue(selectedAssignment.dueDate) <= 7 && getDaysUntilDue(selectedAssignment.dueDate) > 3 && "bg-amber-50 text-amber-700",
                          getDaysUntilDue(selectedAssignment.dueDate) > 7 && "bg-blue-50 text-blue-700"
                        )}>
                          <AlertCircle className="h-5 w-5" />
                          <span>
                            Due: {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                            {getDaysUntilDue(selectedAssignment.dueDate) > 0 ? (
                              <span className="ml-2">({getDaysUntilDue(selectedAssignment.dueDate)} days remaining)</span>
                            ) : (
                              <span className="ml-2 font-semibold">(Overdue)</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-6 space-y-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Assignment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-500">Points</div>
                        <div className="text-lg font-semibold">{selectedAssignment?.points} points</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-500">Estimated Time</div>
                        <div className="text-lg font-semibold">{selectedAssignment?.estimatedTime}</div>
                      </div>
                    </div>
                    <div className="prose prose-gray max-w-none">
                      <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-base">
                        {selectedAssignment?.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                {selectedAssignment?.status !== "pending" && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-800">
                        <CheckCircle className="h-5 w-5" />
                        Submission Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-sm text-green-600 font-medium">Submitted On</div>
                          <div className="text-lg font-bold text-green-800">
                            {selectedAssignment?.submittedAt &&
                              new Date(selectedAssignment.submittedAt).toLocaleDateString()}
                          </div>
                        </div>
                        {selectedAssignment?.status === "graded" && (
                          <div>
                            <div className="text-sm text-green-600 font-medium">Final Grade</div>
                            <div className="text-2xl font-bold text-green-800">{selectedAssignment.grade}%</div>
                            <div className="text-sm text-green-600">
                              ({((selectedAssignment.grade * selectedAssignment.points) / 100).toFixed(0)} out of{" "}
                              {selectedAssignment.points} points)
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter className="flex-shrink-0 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                  Close
                </Button>
                {selectedAssignment?.status === "pending" && (
                  <Button
                    onClick={() => {
                      setViewDialogOpen(false)
                      setSubmitDialogOpen(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Submit Assignment
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">Submit Assignment</DialogTitle>
                <DialogDescription className="text-base">
                  Upload your completed assignment for{" "}
                  <span className="font-semibold">{selectedAssignment?.title}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <Input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={handleFileChange}
                      className="hidden"
                      id="assignment-file"
                    />
                    <label htmlFor="assignment-file" className="cursor-pointer flex flex-col items-center gap-4">
                      <div className="p-4 bg-blue-100 rounded-full">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="space-y-2">
                        <div className="text-lg font-medium">
                          {selectedFile ? (
                            <span className="text-green-600">✓ {selectedFile.name}</span>
                          ) : (
                            "Click to upload your assignment"
                          )}
                        </div>
                        <div className="text-sm text-gray-500">Supported formats: PDF, DOCX, TXT (Max 10MB)</div>
                      </div>
                    </label>
                  </div>

                  {selectedFile && (
                    <Card className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div>
                            <div className="font-medium text-green-800">File Ready</div>
                            <div className="text-sm text-green-600">
                              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-6">
                <Button variant="outline" onClick={() => setSubmitDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={!selectedFile} className="bg-green-600 hover:bg-green-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Assignment
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}