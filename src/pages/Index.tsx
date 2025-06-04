import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  GraduationCap,
  BarChart,
  Users,
  Award,
  FileText,
  Lightbulb,
  MessageCircle,
  TrendingUp,
  Shield,
  Clapperboard,
  PenTool,
  Brain,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center ">
            <img
              src="/logo.png"
              alt="Screen Pilot AI Mentorship Interface"
              className="h-12 w-16"
            />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold -ml-2">Screen Pilot</span>
              <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
                ACFM
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8"></nav>
          <div className="flex gap-4">
            <Link to="/login">
              <Button
                variant="outline"
                className="bg-white text-purple-600 hover:bg-white/90 border-white"
              >
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-white text-purple-600 hover:bg-white/90">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1600')] opacity-10 bg-cover bg-center"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                    AI-Powered
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                      Screenwriting
                    </span>
                    Mentorship
                  </h1>
                  <p className="text-xl text-white/90 max-w-lg leading-relaxed">
                    Transform your creative writing journey with personalized AI
                    mentorship that encourages creativity, builds confidence,
                    and guides you toward becoming a skilled screenwriter and
                    director.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Link to="/login">
                    <Button
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
                    >
                      Start Your Journey
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <img
                    src="https://emeritus.org/wp-content/uploads/2023/10/2-768x402.png?height=400&width=600"
                    // src="https://emeritus.org/wp-content/uploads/2023/10/2-768x402.png?height=400&width=600"
                    alt="Screen Pilot AI Mentorship Interface"
                    className="rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-white text-purple-600 p-4 rounded-lg shadow-lg">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      <span className="font-semibold">AI Mentor Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three Modules Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Three Powerful Modules
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Screen Pilot serves students, faculty, and administrators with
                specialized tools designed for screenwriting and direction
                education at ACFM.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <Card className="border-2 hover:border-purple-400 transition-all hover:shadow-xl group">
                <CardHeader className="text-center pb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Student Module</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-center">
                    AI-powered mentorship for screenwriting with personalized
                    feedback and progress tracking.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Upload scripts for AI analysis
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-purple-600" />
                      Receive encouraging feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-purple-600" />
                      Track writing progress over semesters
                    </li>
                    <li className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-600" />
                      Version control for scripts
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-400 transition-all hover:shadow-xl group">
                <CardHeader className="text-center pb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <BookOpen className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Faculty Module</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-center">
                    Create assignments, review submissions, and track student
                    progress across the curriculum.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <PenTool className="h-4 w-4 text-purple-600" />
                      Create syllabus-based assignments
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-purple-600" />
                      Review AI-generated feedback
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Track class performance
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Generate assessment reports
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-400 transition-all hover:shadow-xl group">
                <CardHeader className="text-center pb-4">
                  <div className="bg-gradient-to-br from-pink-500 to-red-600 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Admin Module</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-center">
                    Comprehensive system management, user oversight, and
                    platform analytics.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-600" />
                      Manage users and roles
                    </li>
                    <li className="flex items-center gap-2">
                      <BarChart className="h-4 w-4 text-purple-600" />
                      View system usage stats
                    </li>
                    <li className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-purple-600" />
                      Security and compliance
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-purple-600" />
                      Export platform reports
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <Lightbulb className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-4xl font-bold mb-6">
                  Patty McGee's Mentorship Philosophy
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Our AI mentorship is built on the foundation of "Feedback That
                  Moves Writers Forward" - encouraging creativity over criticism
                  and helping students grow into confident, reflective creators.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 mt-12">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
                  <h3 className="text-2xl font-bold mb-4 text-purple-800">
                    Encouraging Growth
                  </h3>
                  <p className="text-gray-700">
                    Focus on strengths and potential rather than just pointing
                    out weaknesses. Our AI mentor acts as both a writing coach
                    and life coach.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
                  <h3 className="text-2xl font-bold mb-4 text-purple-800">
                    Goal-Centered Feedback
                  </h3>
                  <p className="text-gray-700">
                    Provide actionable, specific guidance that helps students
                    understand their writing journey and next steps for
                    improvement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-6">
                Comprehensive Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need for screenwriting education, from AI-powered
                feedback to comprehensive progress tracking.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Brain,
                  title: "AI Script Analysis",
                  description:
                    "Advanced AI analyzes structure, dialogue, character development, and pacing in your scripts.",
                },
                {
                  icon: MessageCircle,
                  title: "Conversational Mentoring",
                  description:
                    "Chat-style interface for natural, encouraging feedback sessions with your AI mentor.",
                },
                {
                  icon: TrendingUp,
                  title: "3-Year Progress Tracking",
                  description:
                    "Monitor growth across 6 semesters with detailed analytics and visual timelines.",
                },
                {
                  icon: Users,
                  title: "Multi-Track Support",
                  description:
                    "Specialized tools for both screenwriting and direction tracks at ACFM.",
                },
                {
                  icon: FileText,
                  title: "Assignment Management",
                  description:
                    "Faculty can create, distribute, and grade syllabus-aligned assignments seamlessly.",
                },
                {
                  icon: Shield,
                  title: "Secure & Compliant",
                  description:
                    "GDPR and FERPA compliant with encrypted storage for all student work and data.",
                },
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="border-2 hover:border-purple-400 transition-all hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your Writing?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Join ACFM students and faculty who are already using Screen Pilot
              to enhance their screenwriting and direction education.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-white/90"
                >
                  Get Started Today
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clapperboard className="h-6 w-6" />
                <h3 className="text-xl font-bold">Screen Pilot</h3>
              </div>
              <p className="text-gray-400 mb-4">
                AI-powered screenwriting mentorship for Annapurna College of
                Film and Media students.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Modules</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/modules/student"
                    className="text-gray-400 hover:text-white"
                  >
                    Student Module
                  </Link>
                </li>
                <li>
                  <Link
                    to="/modules/faculty"
                    className="text-gray-400 hover:text-white"
                  >
                    Faculty Module
                  </Link>
                </li>
                <li>
                  <Link
                    to="/modules/admin"
                    className="text-gray-400 hover:text-white"
                  >
                    Admin Module
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/documentation"
                    className="text-gray-400 hover:text-white"
                  >
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link
                    to="/support"
                    className="text-gray-400 hover:text-white"
                  >
                    Support
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tutorials"
                    className="text-gray-400 hover:text-white"
                  >
                    Tutorials
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-400 hover:text-white"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-gray-400 hover:text-white"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/security"
                    className="text-gray-400 hover:text-white"
                  >
                    Security
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2025 Screen Pilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
