import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import Chat from "./pages/Chat";
import AIMentor from "./pages/AIMentor";
import Quiz from "./pages/AIMentorNew";
import ScriptAnalyzer from "./pages/ScriptAnalyzer";
import AssignmentDetail from "./pages/AssignmentDetail";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import AdminSettings from "./pages/AdminSettings";
import AdminAssignClass from "./pages/AdminAssignClass";
import TeacherAssignment from "./pages/TeacherAssignment";
import TeacherStudentSubmission from "./pages/TeacherStudentSubmission";
import TeacherStudents from "./pages/TeacherStudents";
import TeacherClasses from "./pages/TeacherClasses";
import StudentAssignments from "./pages/StudentAssignments";
import CreateAssignment from "./pages/CreateAssignment";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CreateQuiz from "./pages/CreateQuiz";
import StudentQuizzes from "./pages/StudentQuizzes";
import TeacherQuizzes from "./pages/TeacherQuizzes";
import CreateNotes from "./pages/CreateNotes";
import TeacherNotes from "./pages/TeacherNotes";
import StudentNotes from "./pages/StudentNotes";
import Glossary from "./pages/Glossary";
import ExploreBeyondSyllabus from "./pages/ExploreBeyondSyllabus";
import TeacherScriptSubmissions from "./pages/TeacherScriptSubmissions";
import StudentWorkMonitoring from "./pages/StudentWorkMonitoring";
import TeacherGrading from "./pages/TeacherGrading";
import TeacherReportCard from "./pages/TeacherReportCard";
import StudentReportCard from "./pages/StudentReportCard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/assignments" element={<StudentAssignments />} />



            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/assign-class" element={<AdminAssignClass />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/teacher/create-assignment" element={<CreateAssignment />} />
            <Route path="/teacher/classes" element={<TeacherClasses />} />
            <Route path="/teacher/assignments" element={<TeacherAssignment />} />
            <Route path="/teacher/student-submission" element={<TeacherStudentSubmission />} />
            <Route path="/teacher/script-submissions" element={<TeacherScriptSubmissions />} />
            <Route path="/teacher/students" element={<TeacherStudents />} />
            <Route path="/teacher/student-work" element={<StudentWorkMonitoring />} />
            <Route path="/teacher/grading" element={<TeacherGrading />} />
            <Route path="/teacher/report-card" element={<TeacherReportCard />} />
            <Route path="/student/report-card" element={<StudentReportCard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/old-ai-mentor" element={<AIMentor />} />
            <Route path="/ai-mentor" element={<Quiz />} />
            <Route path="/student/quizzes" element={<StudentQuizzes />} />
            <Route path="/teacher/create-quiz" element={<CreateQuiz />} />
            <Route path="/teacher/quiz" element={<TeacherQuizzes />} />
            <Route path="/teacher/create-notes" element={<CreateNotes />} />
            <Route path="/teacher/notes" element={<TeacherNotes />} />
            <Route path="/teacher/glossary" element={<Glossary />} />
            <Route path="/student/glossary" element={<Glossary />} />
            <Route path="/student/notes" element={<StudentNotes />} />
            <Route path="/student/explore-beyond-syllabus" element={<ExploreBeyondSyllabus />} />
            <Route path="/script-analyzer" element={<ScriptAnalyzer />} />
            <Route path="/assignment/:id" element={<AssignmentDetail />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
