// "use client"

// import { AuthGuard } from "@/components/AuthGuard"
// import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Progress } from "@/components/ui/progress"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { 
//   Phone, 
//   PhoneOff, 
//   Mic, 
//   MicOff, 
//   Volume2, 
//   VolumeX,
//   Brain,
//   Sparkles,
//   MessageSquare,
//   Trophy,
//   Clock,
//   Target,
//   BookOpen,
//   Zap,
//   HeartHandshake,
//   Star
// } from "lucide-react"
// import { useState, useEffect, useRef } from "react"
// import { motion, AnimatePresence } from "framer-motion"
// import Vapi from "@vapi-ai/web"


// const vapi = new Vapi("33f65907-5a8c-4fdc-a248-664d0967216f")

// export default function AIMentorPage() {
//   const [isCallActive, setIsCallActive] = useState(false)
//   const [isMuted, setIsMuted] = useState(false)
//   const [isSpeakerOn, setIsSpeakerOn] = useState(true)
//   const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
//   const [transcript, setTranscript] = useState<Array<{role: string, text: string, timestamp: Date}>>([])
//   const [callDuration, setCallDuration] = useState(0)
//   const [mentorStats, setMentorStats] = useState({
//     sessionsCompleted: 12,
//     averageRating: 4.8,
//     totalMinutes: 145,
//     topicsDiscussed: ["Math", "Study Tips", "Exam Prep"]
//   })
//   const [isListening, setIsListening] = useState(false)
//   const callIntervalRef = useRef<NodeJS.Timeout>()
//   const transcriptEndRef = useRef<HTMLDivElement>(null)

//   useEffect(() => {
//     vapi.on("call-start", () => {
//       setConnectionStatus("connected")
//       setIsCallActive(true)
//       startCallTimer()
//     })

//     vapi.on("call-end", () => {
//       setConnectionStatus("disconnected")
//       setIsCallActive(false)
//       stopCallTimer()
//       updateMentorStats()
//     })

//     vapi.on("speech-start", () => {
//       setIsListening(true)
//     })

//     vapi.on("speech-end", () => {
//       setIsListening(false)
//     })

//     vapi.on("message", (message) => {
//       if (message.type === "transcript" && message.transcript) {
//         setTranscript(prev => [...prev, {
//           role: message.role === "assistant" ? "AI Mentor" : "You",
//           text: message.transcript,
//           timestamp: new Date()
//         }])
//       }
//     })

//     vapi.on("error", (error) => {
//       console.error("Vapi error:", error)
//       setConnectionStatus("disconnected")
//     })

//     return () => {
//       vapi.stop()
//       stopCallTimer()
//     }
//   }, [])

//   useEffect(() => {
//     transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
//   }, [transcript])

//   const startCallTimer = () => {
//     callIntervalRef.current = setInterval(() => {
//       setCallDuration(prev => prev + 1)
//     }, 1000)
//   }

//   const stopCallTimer = () => {
//     if (callIntervalRef.current) {
//       clearInterval(callIntervalRef.current)
//     }
//     setCallDuration(0)
//   }

//   const updateMentorStats = () => {
//     setMentorStats(prev => ({
//       ...prev,
//       sessionsCompleted: prev.sessionsCompleted + 1,
//       totalMinutes: prev.totalMinutes + Math.floor(callDuration / 60)
//     }))
//   }

//   const formatDuration = (seconds: number) => {
//     const mins = Math.floor(seconds / 60)
//     const secs = seconds % 60
//     return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
//   }

//   const startCall = async () => {
//     setConnectionStatus("connecting")
//     try {
//       await vapi.start("0b36eadb-ae94-4a97-b1fb-90b7128f3630")
//     } catch (error) {
//       console.error("Failed to start call:", error)
//       setConnectionStatus("disconnected")
//     }
//   }

//   const endCall = () => {
//     vapi.stop()
//   }

//   const toggleMute = () => {
//     if (isCallActive) {
//       setIsMuted(!isMuted)
//       vapi.setMuted(!isMuted)
//     }
//   }

//   const toggleSpeaker = () => {
//     setIsSpeakerOn(!isSpeakerOn)
//   }

//   return (
//     <AuthGuard allowedRoles={["student"]}>
//       <ModernDashboardLayout>
//         <div className="space-y-6">
//           <motion.div
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
//               AI Mentor
//             </h1>
//             <p className="text-muted-foreground">Your personal AI study companion available 24/7</p>
//           </motion.div>

//           <div className="grid gap-6 lg:grid-cols-3">
//             <div className="lg:col-span-2 space-y-6">
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.95 }}
//                 animate={{ opacity: 1, scale: 1 }}
//                 transition={{ duration: 0.5, delay: 0.1 }}
//               >
//                 <Card className="overflow-hidden border-2 border-blue-100 dark:border-blue-900">
//                   <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
//                     <div className="flex items-center justify-between">
//                       <div>
//                         <CardTitle className="flex items-center gap-2">
//                           <Brain className="h-5 w-5 text-blue-600" />
//                           Voice Chat with AI Mentor
//                         </CardTitle>
//                         <CardDescription>
//                           Click start to begin your personalized mentoring session
//                         </CardDescription>
//                       </div>
//                       {isCallActive && (
//                         <Badge variant="secondary" className="animate-pulse">
//                           <Clock className="h-3 w-3 mr-1" />
//                           {formatDuration(callDuration)}
//                         </Badge>
//                       )}
//                     </div>
//                   </CardHeader>
//                   <CardContent className="p-6">
//                     {/* Call Status */}
//                     <div className="text-center mb-8">
//                       <AnimatePresence mode="wait">
//                         {connectionStatus === "connected" && (
//                           <motion.div
//                             initial={{ opacity: 0, scale: 0.8 }}
//                             animate={{ opacity: 1, scale: 1 }}
//                             exit={{ opacity: 0, scale: 0.8 }}
//                             className="space-y-4"
//                           >
//                             <div className="relative inline-block">
//                               <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-1">
//                                 <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
//                                   <Brain className="h-16 w-16 text-blue-600" />
//                                 </div>
//                               </div>
//                               {isListening && (
//                                 <motion.div
//                                   className="absolute inset-0 rounded-full border-4 border-blue-400"
//                                   animate={{ scale: [1, 1.2, 1] }}
//                                   transition={{ duration: 1.5, repeat: Infinity }}
//                                 />
//                               )}
//                             </div>
//                             <p className="text-lg font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-2">
//                               <Sparkles className="h-5 w-5" />
//                               AI Mentor is {isListening ? "listening" : "ready"}
//                             </p>
//                           </motion.div>
//                         )}
//                         {connectionStatus === "connecting" && (
//                           <motion.div
//                             initial={{ opacity: 0 }}
//                             animate={{ opacity: 1 }}
//                             exit={{ opacity: 0 }}
//                             className="space-y-4"
//                           >
//                             <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
//                               <div className="animate-spin">
//                                 <Brain className="h-16 w-16 text-gray-400" />
//                               </div>
//                             </div>
//                             <p className="text-muted-foreground">Connecting to your AI Mentor...</p>
//                           </motion.div>
//                         )}
//                         {connectionStatus === "disconnected" && !isCallActive && (
//                           <motion.div
//                             initial={{ opacity: 0 }}
//                             animate={{ opacity: 1 }}
//                             exit={{ opacity: 0 }}
//                             className="space-y-4"
//                           >
//                             <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
//                               <Brain className="h-16 w-16 text-gray-400" />
//                             </div>
//                             <p className="text-muted-foreground">Ready to start mentoring session</p>
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </div>

//                     <div className="flex justify-center gap-4">
//                       {!isCallActive ? (
//                         <Button
//                           size="lg"
//                           onClick={startCall}
//                           disabled={connectionStatus === "connecting"}
//                           className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
//                         >
//                           <Phone className="h-5 w-5 mr-2" />
//                           Start Call
//                         </Button>
//                       ) : (
//                         <>
//                           <Button
//                             size="lg"
//                             variant={isMuted ? "secondary" : "outline"}
//                             onClick={toggleMute}
//                           >
//                             {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
//                           </Button>
//                           <Button
//                             size="lg"
//                             variant={isSpeakerOn ? "outline" : "secondary"}
//                             onClick={toggleSpeaker}
//                           >
//                             {isSpeakerOn ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
//                           </Button>
//                           <Button
//                             size="lg"
//                             variant="destructive"
//                             onClick={endCall}
//                           >
//                             <PhoneOff className="h-5 w-5 mr-2" />
//                             End Call
//                           </Button>
//                         </>
//                       )}
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>

//               <motion.div
//                 initial={{ opacity: 0, y: 20 }}
//                 animate={{ opacity: 1, y: 0 }}
//                 transition={{ duration: 0.5, delay: 0.2 }}
//               >
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <MessageSquare className="h-5 w-5" />
//                       Conversation Transcript
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <div className="h-64 overflow-y-auto space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
//                       {transcript.length === 0 ? (
//                         <p className="text-center text-muted-foreground">
//                           Start a call to see the conversation transcript
//                         </p>
//                       ) : (
//                         transcript.map((entry, index) => (
//                           <motion.div
//                             key={index}
//                             initial={{ opacity: 0, x: entry.role === "You" ? 20 : -20 }}
//                             animate={{ opacity: 1, x: 0 }}
//                             className={`flex ${entry.role === "You" ? "justify-end" : "justify-start"}`}
//                           >
//                             <div className={`max-w-[80%] p-3 rounded-lg ${
//                               entry.role === "You" 
//                                 ? "bg-blue-100 dark:bg-blue-900 text-right" 
//                                 : "bg-gray-200 dark:bg-gray-800"
//                             }`}>
//                               <p className="text-sm font-medium mb-1">{entry.role}</p>
//                               <p className="text-sm">{entry.text}</p>
//                             </div>
//                           </motion.div>
//                         ))
//                       )}
//                       <div ref={transcriptEndRef} />
//                     </div>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>

//             <div className="space-y-6">
//               {/* Mentor Stats */}
//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.5, delay: 0.3 }}
//               >

//               </motion.div>

//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.5, delay: 0.4 }}
//               >
                
//               </motion.div>

//               <motion.div
//                 initial={{ opacity: 0, x: 20 }}
//                 animate={{ opacity: 1, x: 0 }}
//                 transition={{ duration: 0.5, delay: 0.5 }}
//               >
//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="flex items-center gap-2">
//                       <Sparkles className="h-5 w-5 text-purple-500" />
//                       Tips for Better Sessions
//                     </CardTitle>
//                   </CardHeader>
//                   <CardContent>
//                     <ul className="space-y-2 text-sm">
//                       <li className="flex items-start gap-2">
//                         <span className="text-green-500 mt-0.5">•</span>
//                         <span>Be specific about what you need help with</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <span className="text-green-500 mt-0.5">•</span>
//                         <span>Don't hesitate to ask follow-up questions</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <span className="text-green-500 mt-0.5">•</span>
//                         <span>Take notes during your sessions</span>
//                       </li>
//                       <li className="flex items-start gap-2">
//                         <span className="text-green-500 mt-0.5">•</span>
//                         <span>Practice what you learn right away</span>
//                       </li>
//                     </ul>
//                   </CardContent>
//                 </Card>
//               </motion.div>
//             </div>
//           </div>
//         </div>
//       </ModernDashboardLayout>
//     </AuthGuard>
//   )
// }

"use client"

import { AuthGuard } from "@/components/AuthGuard"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Brain, Sparkles, Clock, Zap, Stars, Waves } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Vapi from "@vapi-ai/web"

const vapi = new Vapi("33f65907-5a8c-4fdc-a248-664d0967216f")

export default function AIMentorPage() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [callDuration, setCallDuration] = useState(0)
  const [isListening, setIsListening] = useState(false)
  const [currentMessage, setCurrentMessage] = useState("")
  const callIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    vapi.on("call-start", () => {
      setConnectionStatus("connected")
      setIsCallActive(true)
      startCallTimer()
    })

    vapi.on("call-end", () => {
      setConnectionStatus("disconnected")
      setIsCallActive(false)
      stopCallTimer()
      setCurrentMessage("")
    })

    vapi.on("speech-start", () => {
      setIsListening(true)
    })

    vapi.on("speech-end", () => {
      setIsListening(false)
    })

    vapi.on("message", (message) => {
      if (message.type === "transcript" && message.transcript) {
        if (message.role === "assistant") {
          setCurrentMessage(message.transcript)
        }
      }
    })

    vapi.on("error", (error) => {
      console.error("Vapi error:", error)
      setConnectionStatus("disconnected")
    })

    return () => {
      vapi.stop()
      stopCallTimer()
    }
  }, [])

  const startCallTimer = () => {
    callIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1)
    }, 1000)
  }

  const stopCallTimer = () => {
    if (callIntervalRef.current) {
      clearInterval(callIntervalRef.current)
    }
    setCallDuration(0)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startCall = async () => {
    setConnectionStatus("connecting")
    try {
      await vapi.start("0b36eadb-ae94-4a97-b1fb-90b7128f3630")
    } catch (error) {
      console.error("Failed to start call:", error)
      setConnectionStatus("disconnected")
    }
  }

  const endCall = () => {
    vapi.stop()
  }

  // const toggleMute = () => {
  //   if (isCallActive) {
  //     const newMutedState = !isMuted
  //     setIsMuted(newMutedState)
  //     vapi.setMuted(newMutedState)
  //   }
  // }

  // const toggleSpeaker = () => {
  //   setIsSpeakerOn(!isSpeakerOn)
  // }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-blue-950 dark:via-purple-950 dark:to-pink-950 -m-6 p-6 overflow-hidden relative">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"
              animate={{
                x: [0, 100, 0],
                y: [0, -50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              className="absolute top-40 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"
              animate={{
                x: [0, -80, 0],
                y: [0, 60, 0],
                scale: [1.2, 1, 1.2],
              }}
              transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-400/10 rounded-full blur-3xl"
              animate={{
                x: [0, 120, 0],
                y: [0, -80, 0],
                scale: [1, 1.3, 1],
              }}
              transition={{ duration: 30, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto space-y-12">
            {/* Enhanced Header */}
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="text-center space-y-6"
            >
              <motion.div
                className="inline-flex items-center gap-4 p-2 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl border border-white/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  animate={{
                    rotate: 360,
                    background: [
                      "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                      "linear-gradient(45deg, #8b5cf6, #ec4899)",
                      "linear-gradient(45deg, #ec4899, #06b6d4)",
                      "linear-gradient(45deg, #06b6d4, #3b82f6)",
                    ],
                  }}
                  transition={{
                    rotate: { duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                    background: { duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                  }}
                  className="p-4 rounded-full"
                >
                  <Brain className="h-12 w-12 text-white" />
                </motion.div>
                <div className="pr-6">
                  <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    AI MENTOR
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 font-medium">Your intelligent study companion</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Main Interface */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Card className="border-0 shadow-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-12">
                  {/* Status Display */}
                  <div className="text-center mb-16">
                    <AnimatePresence mode="wait">
                      {connectionStatus === "connected" && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="space-y-8"
                        >
                          {/* AI Avatar */}
                          <div className="relative inline-block">
                            <motion.div
                              className="w-48 h-48 rounded-full p-1 relative overflow-hidden"
                              animate={{
                                background: [
                                  "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                                  "linear-gradient(45deg, #8b5cf6, #ec4899)",
                                  "linear-gradient(45deg, #ec4899, #06b6d4)",
                                  "linear-gradient(45deg, #06b6d4, #10b981)",
                                  "linear-gradient(45deg, #10b981, #3b82f6)",
                                ],
                              }}
                              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                <motion.div
                                  animate={{
                                    scale: isListening ? [1, 1.1, 1] : 1,
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: isListening ? Number.POSITIVE_INFINITY : 0,
                                    ease: "easeInOut",
                                  }}
                                >
                                  <Brain className="h-24 w-24 text-blue-600" />
                                </motion.div>

                                {/* Listening Animation */}
                                {isListening && (
                                  <>
                                    {[...Array(3)].map((_, i) => (
                                      <motion.div
                                        key={i}
                                        className="absolute inset-0 rounded-full border-2 border-blue-400/30"
                                        animate={{
                                          scale: [1, 1.5, 2],
                                          opacity: [0.6, 0.3, 0],
                                        }}
                                        transition={{
                                          duration: 2,
                                          repeat: Number.POSITIVE_INFINITY,
                                          delay: i * 0.4,
                                          ease: "easeOut",
                                        }}
                                      />
                                    ))}
                                  </>
                                )}
                              </div>
                            </motion.div>

                            {/* Floating Elements */}
                            <motion.div
                              className="absolute -top-4 -right-4"
                              animate={{
                                y: [0, -10, 0],
                                rotate: [0, 10, 0],
                              }}
                              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                            >
                              <Sparkles className="h-8 w-8 text-yellow-500" />
                            </motion.div>
                            <motion.div
                              className="absolute -bottom-4 -left-4"
                              animate={{
                                y: [0, 10, 0],
                                rotate: [0, -10, 0],
                              }}
                              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                            >
                              <Zap className="h-8 w-8 text-purple-500" />
                            </motion.div>
                          </div>

                          {/* Status Text */}
                          <div className="space-y-4">
                            <motion.div
                              animate={{ opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                              className="flex items-center justify-center gap-3"
                            >
                              <Stars className="h-6 w-6 text-green-500" />
                              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {isListening ? "I'm listening..." : "Ready to help you learn"}
                              </span>
                              <Stars className="h-6 w-6 text-green-500" />
                            </motion.div>

                            {/* Current Message Display */}
                            {currentMessage && (
                              <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="max-w-2xl mx-auto py-1 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-2xl border border-blue-200 dark:border-blue-800"
                              >
                                <p className="text-sm leading-relaxed text-center">{currentMessage}</p>
                              </motion.div>
                            )}

                            {/* Call Duration */}
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-green-100 dark:bg-green-900 rounded-full"
                            >
                              <Clock className="h-5 w-5 text-green-600" />
                              <span className="text-lg font-semibold text-green-800 dark:text-green-200">
                                {formatDuration(callDuration)}
                              </span>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}

                      {connectionStatus === "connecting" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          <div className="w-48 h-48 mx-auto rounded-full bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 flex items-center justify-center relative overflow-hidden">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <Brain className="h-24 w-24 text-blue-600" />
                            </motion.div>

                            {/* Loading Rings */}
                            {[...Array(3)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="absolute inset-0 rounded-full border-4 border-blue-400/20"
                                animate={{
                                  scale: [1, 1.2, 1],
                                  opacity: [0.3, 0.7, 0.3],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Number.POSITIVE_INFINITY,
                                  delay: i * 0.3,
                                }}
                              />
                            ))}
                          </div>
                          <motion.p
                            animate={{ opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                            className="text-2xl font-bold text-blue-600 dark:text-blue-400"
                          >
                            Connecting to your AI Mentor...
                          </motion.p>
                        </motion.div>
                      )}

                      {connectionStatus === "disconnected" && !isCallActive && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-8"
                        >
                          <motion.div
                            className="w-48 h-48 mx-auto rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center relative overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <Brain className="h-24 w-24 text-slate-500" />

                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-slate-400/20"
                              animate={{
                                scale: [1, 1.1, 1],
                                opacity: [0.2, 0.4, 0.2],
                              }}
                              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                            />
                          </motion.div>
                          <div className="space-y-4">
                            <p className="text-2xl font-bold text-slate-600 dark:text-slate-400">
                              Ready to unlock your potential
                            </p>
                            <p className="text-lg text-slate-500 dark:text-slate-500">
                              Start a conversation and let's learn together
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex justify-center">
                    {!isCallActive ? (
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="relative">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 blur-xl opacity-50"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        />
                        <Button
                          size="lg"
                          onClick={startCall}
                          disabled={connectionStatus === "connecting"}
                          className="relative text-xl px-12 py-6 h-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-2xl border-0 rounded-full"
                        >
                          <Phone className="h-7 w-7 mr-4" />
                          Start Learning Session
                        </Button>
                      </motion.div>
                    ) : (
                      <div className="flex gap-6">
                        {/* <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            size="lg"
                            variant={isMuted ? "secondary" : "outline"}
                            onClick={toggleMute}
                            className="h-16 w-16 rounded-full shadow-xl border-2"
                          >
                            {isMuted ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
                          </Button>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            size="lg"
                            variant={isSpeakerOn ? "outline" : "secondary"}
                            onClick={toggleSpeaker}
                            className="h-16 w-16 rounded-full shadow-xl border-2"
                          >
                            {isSpeakerOn ? <Volume2 className="h-7 w-7" /> : <VolumeX className="h-7 w-7" />}
                          </Button>
                        </motion.div> */}
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            size="lg"
                            variant="destructive"
                            onClick={endCall}
                            className="h-16 px-8 rounded-full shadow-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 border-0"
                          >
                            <PhoneOff className="h-7 w-7 mr-3" />
                            End Session
                          </Button>
                        </motion.div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Floating Action Hints */}
            {!isCallActive && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 1 }}
                className="text-center space-y-4"
              >
                <div className="flex justify-center gap-8 text-sm text-slate-500 dark:text-slate-400">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Waves className="h-4 w-4" />
                    <span>Voice Powered</span>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                    className="flex items-center gap-2"
                  >
                    <Brain className="h-4 w-4" />
                    <span>AI Enhanced</span>
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 1 }}
                    className="flex items-center gap-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>24/7 Available</span>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
