// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardFooter,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Link } from "react-router-dom";
// import {
//   BookOpen,
//   ChevronRight,
//   GraduationCap,
//   BarChart,
//   Users,
//   Award,
//   FileText,
//   Lightbulb,
//   MessageCircle,
//   TrendingUp,
//   Shield,
//   Clapperboard,
//   PenTool,
//   Brain,
// } from "lucide-react";

// export default function Home() {
//   return (
//     <div className="min-h-screen flex flex-col">
//       <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sticky top-0 z-50">
//         <div className="container mx-auto flex justify-between items-center">
//           <div className="flex items-center ">
//             <img
//               src="/logo.png"
//               alt="Screen Pilot AI Mentorship Interface"
//               className="h-12 w-16"
//             />
//             <div className="flex items-center gap-2">
//               <span className="text-2xl font-bold -ml-2">Screen Pilot</span>
//               <span className="text-sm bg-white/20 px-2 py-1 rounded-full">
//                 ACFM
//               </span>
//             </div>
//           </div>
//           <nav className="hidden md:flex items-center gap-8"></nav>
//           <div className="flex gap-4">
//             <Link to="/login">
//               <Button
//                 variant="outline"
//                 className="bg-white text-purple-600 hover:bg-white/90 border-white"
//               >
//                 Login
//               </Button>
//             </Link>
//             <Link to="/signup">
//               <Button className="bg-white text-purple-600 hover:bg-white/90">
//                 Get Started
//               </Button>
//             </Link>
//           </div>
//         </div>
//       </header>

//       <main className="flex-1">
//         <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-24 overflow-hidden">
//           <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1600')] opacity-10 bg-cover bg-center"></div>
//           <div className="container mx-auto px-4 relative z-10">
//             <div className="grid md:grid-cols-2 gap-12 items-center">
//               <div className="space-y-8">
//                 <div className="space-y-4">
//                   <h1 className="text-5xl md:text-7xl font-bold leading-tight">
//                     AI-Powered
//                     <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
//                       Screenwriting
//                     </span>
//                     Mentorship
//                   </h1>
//                   <p className="text-xl text-white/90 max-w-lg leading-relaxed">
//                     Transform your creative writing journey with personalized AI
//                     mentorship that encourages creativity, builds confidence,
//                     and guides you toward becoming a skilled screenwriter and
//                     director.
//                   </p>
//                 </div>

//                 <div className="flex flex-wrap gap-4">
//                   <Link to="/login">
//                     <Button
//                       size="lg"
//                       className="bg-white text-purple-600 hover:bg-white/90 shadow-lg"
//                     >
//                       Start Your Journey
//                       <ChevronRight className="ml-2 h-5 w-5" />
//                     </Button>
//                   </Link>
//                 </div>
//               </div>
//               <div className="hidden md:block">
//                 <div className="relative">
//                   <img
//                     src="https://emeritus.org/wp-content/uploads/2023/10/2-768x402.png?height=400&width=600"
//                     // src="https://emeritus.org/wp-content/uploads/2023/10/2-768x402.png?height=400&width=600"
//                     alt="Screen Pilot AI Mentorship Interface"
//                     className="rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
//                   />
//                   <div className="absolute -bottom-6 -left-6 bg-white text-purple-600 p-4 rounded-lg shadow-lg">
//                     <div className="flex items-center gap-2">
//                       <MessageCircle className="h-5 w-5" />
//                       <span className="font-semibold">AI Mentor Active</span>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Three Modules Section */}
//         <section className="py-20 bg-gray-50">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-16">
//               <h2 className="text-4xl md:text-5xl font-bold mb-6">
//                 Three Powerful Modules
//               </h2>
//               <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//                 Screen Pilot serves students, faculty, and administrators with
//                 specialized tools designed for screenwriting and direction
//                 education at ACFM.
//               </p>
//             </div>

//             <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
//               <Card className="border-2 hover:border-purple-400 transition-all hover:shadow-xl group">
//                 <CardHeader className="text-center pb-4">
//                   <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
//                     <GraduationCap className="h-8 w-8 text-white" />
//                   </div>
//                   <CardTitle className="text-2xl">Student Module</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <p className="text-gray-600 text-center">
//                     AI-powered mentorship for screenwriting with personalized
//                     feedback and progress tracking.
//                   </p>
//                   <ul className="space-y-2 text-sm">
//                     <li className="flex items-center gap-2">
//                       <FileText className="h-4 w-4 text-purple-600" />
//                       Upload scripts for AI analysis
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <MessageCircle className="h-4 w-4 text-purple-600" />
//                       Receive encouraging feedback
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <TrendingUp className="h-4 w-4 text-purple-600" />
//                       Track writing progress over semesters
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <Award className="h-4 w-4 text-purple-600" />
//                       Version control for scripts
//                     </li>
//                   </ul>
//                 </CardContent>
//               </Card>

//               <Card className="border-2 hover:border-purple-400 transition-all hover:shadow-xl group">
//                 <CardHeader className="text-center pb-4">
//                   <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
//                     <BookOpen className="h-8 w-8 text-white" />
//                   </div>
//                   <CardTitle className="text-2xl">Faculty Module</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <p className="text-gray-600 text-center">
//                     Create assignments, review submissions, and track student
//                     progress across the curriculum.
//                   </p>
//                   <ul className="space-y-2 text-sm">
//                     <li className="flex items-center gap-2">
//                       <PenTool className="h-4 w-4 text-purple-600" />
//                       Create syllabus-based assignments
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <BarChart className="h-4 w-4 text-purple-600" />
//                       Review AI-generated feedback
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <Users className="h-4 w-4 text-purple-600" />
//                       Track class performance
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <FileText className="h-4 w-4 text-purple-600" />
//                       Generate assessment reports
//                     </li>
//                   </ul>
//                 </CardContent>
//               </Card>

//               <Card className="border-2 hover:border-purple-400 transition-all hover:shadow-xl group">
//                 <CardHeader className="text-center pb-4">
//                   <div className="bg-gradient-to-br from-pink-500 to-red-600 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
//                     <Shield className="h-8 w-8 text-white" />
//                   </div>
//                   <CardTitle className="text-2xl">Admin Module</CardTitle>
//                 </CardHeader>
//                 <CardContent className="space-y-4">
//                   <p className="text-gray-600 text-center">
//                     Comprehensive system management, user oversight, and
//                     platform analytics.
//                   </p>
//                   <ul className="space-y-2 text-sm">
//                     <li className="flex items-center gap-2">
//                       <Users className="h-4 w-4 text-purple-600" />
//                       Manage users and roles
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <BarChart className="h-4 w-4 text-purple-600" />
//                       View system usage stats
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <Shield className="h-4 w-4 text-purple-600" />
//                       Security and compliance
//                     </li>
//                     <li className="flex items-center gap-2">
//                       <FileText className="h-4 w-4 text-purple-600" />
//                       Export platform reports
//                     </li>
//                   </ul>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         </section>

//         <section className="py-20 bg-white">
//           <div className="container mx-auto px-4">
//             <div className="max-w-4xl mx-auto text-center">
//               <div className="mb-8">
//                 <Lightbulb className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
//                 <h2 className="text-4xl font-bold mb-6">
//                   Patty McGee's Mentorship Philosophy
//                 </h2>
//                 <p className="text-xl text-gray-600 leading-relaxed">
//                   Our AI mentorship is built on the foundation of "Feedback That
//                   Moves Writers Forward" - encouraging creativity over criticism
//                   and helping students grow into confident, reflective creators.
//                 </p>
//               </div>

//               <div className="grid md:grid-cols-2 gap-8 mt-12">
//                 <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-2xl">
//                   <h3 className="text-2xl font-bold mb-4 text-purple-800">
//                     Encouraging Growth
//                   </h3>
//                   <p className="text-gray-700">
//                     Focus on strengths and potential rather than just pointing
//                     out weaknesses. Our AI mentor acts as both a writing coach
//                     and life coach.
//                   </p>
//                 </div>
//                 <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-2xl">
//                   <h3 className="text-2xl font-bold mb-4 text-purple-800">
//                     Goal-Centered Feedback
//                   </h3>
//                   <p className="text-gray-700">
//                     Provide actionable, specific guidance that helps students
//                     understand their writing journey and next steps for
//                     improvement.
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         <section className="py-20 bg-gray-50">
//           <div className="container mx-auto px-4">
//             <div className="text-center mb-16">
//               <h2 className="text-4xl font-bold mb-6">
//                 Comprehensive Features
//               </h2>
//               <p className="text-xl text-gray-600 max-w-3xl mx-auto">
//                 Everything you need for screenwriting education, from AI-powered
//                 feedback to comprehensive progress tracking.
//               </p>
//             </div>

//             <div className="grid md:grid-cols-3 gap-8">
//               {[
//                 {
//                   icon: Brain,
//                   title: "AI Script Analysis",
//                   description:
//                     "Advanced AI analyzes structure, dialogue, character development, and pacing in your scripts.",
//                 },
//                 {
//                   icon: MessageCircle,
//                   title: "Conversational Mentoring",
//                   description:
//                     "Chat-style interface for natural, encouraging feedback sessions with your AI mentor.",
//                 },
//                 {
//                   icon: TrendingUp,
//                   title: "3-Year Progress Tracking",
//                   description:
//                     "Monitor growth across 6 semesters with detailed analytics and visual timelines.",
//                 },
//                 {
//                   icon: Users,
//                   title: "Multi-Track Support",
//                   description:
//                     "Specialized tools for both screenwriting and direction tracks at ACFM.",
//                 },
//                 {
//                   icon: FileText,
//                   title: "Assignment Management",
//                   description:
//                     "Faculty can create, distribute, and grade syllabus-aligned assignments seamlessly.",
//                 },
//                 {
//                   icon: Shield,
//                   title: "Secure & Compliant",
//                   description:
//                     "GDPR and FERPA compliant with encrypted storage for all student work and data.",
//                 },
//               ].map((feature, index) => (
//                 <Card
//                   key={index}
//                   className="border-2 hover:border-purple-400 transition-all hover:shadow-lg"
//                 >
//                   <CardHeader>
//                     <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
//                       <feature.icon className="h-6 w-6 text-purple-600" />
//                     </div>
//                     <CardTitle>{feature.title}</CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <p className="text-gray-600">{feature.description}</p>
//                   </CardContent>
//                 </Card>
//               ))}
//             </div>
//           </div>
//         </section>

//         <section className="py-20 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
//           <div className="container mx-auto px-4 text-center">
//             <h2 className="text-4xl md:text-5xl font-bold mb-6">
//               Ready to Transform Your Writing?
//             </h2>
//             <p className="text-xl mb-8 max-w-2xl mx-auto">
//               Join ACFM students and faculty who are already using Screen Pilot
//               to enhance their screenwriting and direction education.
//             </p>
//             <div className="flex flex-wrap gap-4 justify-center">
//               <Link to="/login">
//                 <Button
//                   size="lg"
//                   className="bg-white text-purple-600 hover:bg-white/90"
//                 >
//                   Get Started Today
//                 </Button>
//               </Link>
//             </div>
//           </div>
//         </section>
//       </main>

//       <footer className="bg-gray-900 text-white py-12">
//         <div className="container mx-auto px-4">
//           <div className="grid md:grid-cols-4 gap-8">
//             <div>
//               <div className="flex items-center gap-2 mb-4">
//                 <Clapperboard className="h-6 w-6" />
//                 <h3 className="text-xl font-bold">Screen Pilot</h3>
//               </div>
//               <p className="text-gray-400 mb-4">
//                 AI-powered screenwriting mentorship for Annapurna College of
//                 Film and Media students.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-bold mb-4">Modules</h4>
//               <ul className="space-y-2">
//                 <li>
//                   <Link
//                     to="/modules/student"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Student Module
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/modules/faculty"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Faculty Module
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/modules/admin"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Admin Module
//                   </Link>
//                 </li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-bold mb-4">Resources</h4>
//               <ul className="space-y-2">
//                 <li>
//                   <Link
//                     to="/documentation"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Documentation
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/support"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Support
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/tutorials"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Tutorials
//                   </Link>
//                 </li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-bold mb-4">Legal</h4>
//               <ul className="space-y-2">
//                 <li>
//                   <Link
//                     to="/privacy"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Privacy Policy
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/terms"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Terms of Service
//                   </Link>
//                 </li>
//                 <li>
//                   <Link
//                     to="/security"
//                     className="text-gray-400 hover:text-white"
//                   >
//                     Security
//                   </Link>
//                 </li>
//               </ul>
//             </div>
//           </div>
//           <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
//             <p className="text-gray-400">
//               © 2025 Screen Pilot. All rights reserved.
//             </p>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }


import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronRight,
  Brain,
  Sparkles,
  Target,
  Zap,
  Rocket,
  Bot,
  ClipboardCheck,
  HelpCircle,
  Trophy,
  Gauge,
  Wand2,
  MessageSquare,
  BarChart3,
  Cpu,
  GraduationCapIcon,
  ClapperboardIcon as ChalkboardTeacher,
} from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white p-6 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
          <img
              src="/logo.png"
              alt="Screen Pilot AI Mentorship Interface"
              className="h-12 w-16"
            />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold -ml-2">Screen Pilot</span>
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">ACFM</Badge>
            </div>
          </div>
          <div className="flex gap-4">
            <a href="/login">
              <Button className="bg-white text-purple-600 hover:bg-white/90 shadow-lg">
                Get Started
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white py-24 overflow-hidden">
          <div className="absolute inset-0 bg-[url('/placeholder.svg?height=800&width=1600')] opacity-10 bg-cover bg-center"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-yellow-400/20 text-yellow-300 border-yellow-400/30">
                      <Zap className="h-3 w-3 mr-1" />
                      AI-Powered
                    </Badge>
                    <Badge className="bg-green-400/20 text-green-300 border-green-400/30">
                      <Rocket className="h-3 w-3 mr-1" />
                      Next-Gen Learning
                    </Badge>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                    Smart
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                      Screenwriting
                    </span>
                    Education
                  </h1>
                  <p className="text-xl text-white/90 max-w-lg leading-relaxed">
                    Revolutionary AI platform where teachers create intelligent assignments, students get instant
                    feedback, and learning becomes an interactive journey with personalized mentorship.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <a href="/login">
                    <Button
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all"
                    >
                      Start Your Journey
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </a>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="relative">
                  <img
                    src="https://emeritus.org/wp-content/uploads/2023/10/2-768x402.png"
                    alt="Screen Pilot AI Mentorship Interface"
                    className="rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
                  />
                  <div className="absolute -bottom-6 -left-6 bg-white text-purple-600 p-4 rounded-xl shadow-xl">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-green-500" />
                      <span className="font-semibold">AI Mentor Active</span>
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-gradient-to-r from-green-400 to-blue-500 text-white p-3 rounded-xl shadow-xl">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      <span className="text-sm font-medium">Grade: A+</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Features Overview */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-purple-100 text-purple-700 border-purple-200">
                <Cpu className="h-3 w-3 mr-1" />
                AI-Enhanced Learning
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Intelligent Teaching & Learning
              </h2>
              <p className="text-xl text-gray-600 max-w-4xl mx-auto">
                Experience the future of screenwriting education with AI that creates, analyzes, grades, and mentors -
                transforming how teachers teach and students learn.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
              {/* Teacher Module */}
              <Card className="border-2 border-blue-200 hover:border-blue-400 transition-all hover:shadow-2xl group bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <ChalkboardTeacher className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl text-blue-800">Teacher Hub</CardTitle>
                      <p className="text-blue-600 font-medium">AI-Powered Assignment Creation</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-purple-100 rounded-lg p-2">
                        <Wand2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">AI Assignment Generator</h4>
                        <p className="text-sm text-gray-600">
                          Create custom assignments with AI that automatically adapts to curriculum needs
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-green-100 rounded-lg p-2">
                        <Target className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Smart Distribution</h4>
                        <p className="text-sm text-gray-600">
                          AI automatically sends assignments to student dashboards with personalized instructions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-orange-100 rounded-lg p-2">
                        <BarChart3 className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Intelligent Grading</h4>
                        <p className="text-sm text-gray-600">
                          Review AI-generated grades and provide personalized feedback with rubric integration
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Module */}
              <Card className="border-2 border-purple-200 hover:border-purple-400 transition-all hover:shadow-2xl group bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl w-16 h-16 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                      <GraduationCapIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl text-purple-800">Student Dashboard</CardTitle>
                      <p className="text-purple-600 font-medium">AI-Enhanced Learning Experience</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-blue-100 rounded-lg p-2">
                        <Brain className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Script Analyzer</h4>
                        <p className="text-sm text-gray-600">
                          Advanced AI analyzes your scripts for structure, dialogue, and character development
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-green-100 rounded-lg p-2">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">AI Mentor Chat</h4>
                        <p className="text-sm text-gray-600">
                          24/7 AI mentor available for doubts, creative blocks, and writing guidance
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-yellow-100 rounded-lg p-2">
                        <HelpCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Quiz Generator</h4>
                        <p className="text-sm text-gray-600">
                          AI creates personalized quizzes based on your learning progress and weak areas
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-white rounded-xl shadow-sm">
                      <div className="bg-red-100 rounded-lg p-2">
                        <ClipboardCheck className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-800">Instant AI Grading</h4>
                        <p className="text-sm text-gray-600">
                          Submit assignments and receive immediate AI feedback with detailed rubrics
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* AI Features Showcase */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 border-purple-200">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by Advanced AI
              </Badge>
              <h2 className="text-4xl font-bold mb-6">Revolutionary Learning Features</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Experience cutting-edge AI technology that transforms traditional screenwriting education into an
                interactive, personalized learning journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Brain,
                  title: "Smart Script Analysis",
                  description:
                    "AI analyzes plot structure, character arcs, dialogue quality, and pacing with detailed insights.",
                  color: "from-blue-500 to-cyan-500",
                },
                {
                  icon: Bot,
                  title: "24/7 AI Mentor",
                  description:
                    "Always-available AI mentor for creative guidance, writing tips, and instant doubt resolution.",
                  color: "from-green-500 to-emerald-500",
                },
                {
                  icon: Gauge,
                  title: "Instant Feedback",
                  description: "Real-time grading and feedback on assignments with comprehensive rubric evaluation.",
                  color: "from-purple-500 to-pink-500",
                },
                {
                  icon: Target,
                  title: "Personalized Quizzes",
                  description: "AI generates custom quizzes based on individual learning patterns and progress.",
                  color: "from-orange-500 to-red-500",
                },
              ].map((feature, index) => (
                <Card key={index} className="border-2 hover:border-purple-300 transition-all hover:shadow-xl group">
                  <CardHeader className="text-center pb-4">
                    <div
                      className={`bg-gradient-to-r ${feature.color} rounded-2xl w-16 h-16 flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-center text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
