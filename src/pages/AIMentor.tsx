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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Brain, Sparkles, MessageSquare, Clock } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Vapi from "@vapi-ai/web"

const vapi = new Vapi("33f65907-5a8c-4fdc-a248-664d0967216f")

export default function AIMentorPage() {
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected")
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string; timestamp: Date }>>([])
  const [callDuration, setCallDuration] = useState(0)
  const [mentorStats, setMentorStats] = useState({
    sessionsCompleted: 12,
    averageRating: 4.8,
    totalMinutes: 145,
    topicsDiscussed: ["Math", "Study Tips", "Exam Prep"],
  })
  const [isListening, setIsListening] = useState(false)
  const callIntervalRef = useRef<NodeJS.Timeout>()
  const transcriptEndRef = useRef<HTMLDivElement>(null)

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
      updateMentorStats()
    })

    vapi.on("speech-start", () => {
      setIsListening(true)
    })

    vapi.on("speech-end", () => {
      setIsListening(false)
    })

    vapi.on("message", (message) => {
      if (message.type === "transcript" && message.transcript) {
        setTranscript((prev) => [
          ...prev,
          {
            role: message.role === "assistant" ? "AI Mentor" : "You",
            text: message.transcript,
            timestamp: new Date(),
          },
        ])
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

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [transcript])

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

  const updateMentorStats = () => {
    setMentorStats((prev) => ({
      ...prev,
      sessionsCompleted: prev.sessionsCompleted + 1,
      totalMinutes: prev.totalMinutes + Math.floor(callDuration / 60),
    }))
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

  const toggleMute = () => {
    if (isCallActive) {
      setIsMuted(!isMuted)
      vapi.setMuted(!isMuted)
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn)
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 -m-6 p-6">
          <div className="space-y-8">
            {/* Header with floating animation */}
            <motion.div
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{
                  background: [
                    "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                    "linear-gradient(45deg, #8b5cf6, #ec4899)",
                    "linear-gradient(45deg, #ec4899, #3b82f6)",
                  ],
                }}
                transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="inline-block p-1 rounded-2xl"
              >
                <h1 className="text-5xl font-black tracking-tight bg-white dark:bg-slate-900 px-8 py-4 rounded-xl">
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    AI MENTOR
                  </span>
                </h1>
              </motion.div>
              <p className="text-xl text-slate-600 dark:text-slate-300 font-medium">
                Your personal AI study companion • Available 24/7
              </p>
            </motion.div>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                {/* Main Call Interface */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <Card className="overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-900 dark:to-blue-950">
                    <CardHeader className="relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10" />
                      <motion.div
                        className="absolute inset-0 opacity-30"
                        animate={{
                          background: [
                            "radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 50%)",
                            "radial-gradient(circle at 40% 50%, #ec4899 0%, transparent 50%)",
                          ],
                        }}
                        transition={{ duration: 8, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      <div className="relative z-10 flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-3 text-2xl">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            >
                              <Brain className="h-8 w-8 text-blue-600" />
                            </motion.div>
                            Voice Chat with AI Mentor
                          </CardTitle>
                          <CardDescription className="text-lg mt-2">
                            Experience the future of personalized learning
                          </CardDescription>
                        </div>
                        {isCallActive && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className="text-lg px-4 py-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              {formatDuration(callDuration)}
                            </Badge>
                          </motion.div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      {/* Enhanced Call Status */}
                      <div className="text-center mb-12">
                        <AnimatePresence mode="wait">
                          {connectionStatus === "connected" && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.5 }}
                              className="space-y-6"
                            >
                              <div className="relative inline-block">
                                <motion.div
                                  className="w-40 h-40 rounded-full p-2"
                                  animate={{
                                    background: [
                                      "linear-gradient(45deg, #3b82f6, #8b5cf6)",
                                      "linear-gradient(45deg, #8b5cf6, #ec4899)",
                                      "linear-gradient(45deg, #ec4899, #06b6d4)",
                                      "linear-gradient(45deg, #06b6d4, #3b82f6)",
                                    ],
                                  }}
                                  transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                >
                                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 flex items-center justify-center shadow-inner">
                                    <motion.div
                                      animate={{
                                        scale: isListening ? [1, 1.1, 1] : 1,
                                        rotate: [0, 360],
                                      }}
                                      transition={{
                                        scale: { duration: 1, repeat: Number.POSITIVE_INFINITY },
                                        rotate: { duration: 10, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                                      }}
                                    >
                                      <Brain className="h-20 w-20 text-blue-600" />
                                    </motion.div>
                                  </div>
                                </motion.div>
                                {isListening && (
                                  <>
                                    <motion.div
                                      className="absolute inset-0 rounded-full border-4 border-blue-400/50"
                                      animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] }}
                                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                                    />
                                    <motion.div
                                      className="absolute inset-0 rounded-full border-4 border-purple-400/50"
                                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                                    />
                                  </>
                                )}
                              </div>
                              <motion.p
                                className="text-2xl font-bold text-green-600 dark:text-green-400 flex items-center justify-center gap-3"
                                animate={{ opacity: [0.7, 1, 0.7] }}
                                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                              >
                                <Sparkles className="h-6 w-6" />
                                AI Mentor is {isListening ? "listening..." : "ready to help"}
                                <Sparkles className="h-6 w-6" />
                              </motion.p>
                            </motion.div>
                          )}
                          {connectionStatus === "connecting" && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="space-y-6"
                            >
                              <div className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-800 dark:to-purple-800 flex items-center justify-center">
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                >
                                  <Brain className="h-20 w-20 text-blue-600" />
                                </motion.div>
                              </div>
                              <p className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                                Connecting to your AI Mentor...
                              </p>
                            </motion.div>
                          )}
                          {connectionStatus === "disconnected" && !isCallActive && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="space-y-6"
                            >
                              <motion.div
                                className="w-40 h-40 mx-auto rounded-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                <Brain className="h-20 w-20 text-slate-500" />
                              </motion.div>
                              <p className="text-xl font-semibold text-slate-600 dark:text-slate-400">
                                Ready to start your mentoring journey
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Enhanced Control Buttons */}
                      <div className="flex justify-center gap-6">
                        {!isCallActive ? (
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button
                              size="lg"
                              onClick={startCall}
                              disabled={connectionStatus === "connecting"}
                              className="text-xl px-8 py-4 h-auto bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-xl border-0"
                            >
                              <Phone className="h-6 w-6 mr-3" />
                              Start Call
                            </Button>
                          </motion.div>
                        ) : (
                          <div className="flex gap-4">
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                size="lg"
                                variant={isMuted ? "secondary" : "outline"}
                                onClick={toggleMute}
                                className="h-14 w-14 rounded-full shadow-lg"
                              >
                                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                size="lg"
                                variant={isSpeakerOn ? "outline" : "secondary"}
                                onClick={toggleSpeaker}
                                className="h-14 w-14 rounded-full shadow-lg"
                              >
                                {isSpeakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}
                              </Button>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                              <Button
                                size="lg"
                                variant="destructive"
                                onClick={endCall}
                                className="h-14 px-6 rounded-full shadow-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                              >
                                <PhoneOff className="h-6 w-6 mr-2" />
                                End Call
                              </Button>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Enhanced Transcript */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                        Live Conversation
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="h-80 overflow-y-auto space-y-4 p-6 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-xl border">
                        {transcript.length === 0 ? (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-center text-slate-500 dark:text-slate-400 text-lg">
                              🎙️ Start a call to see the magic happen
                            </p>
                          </div>
                        ) : (
                          transcript.map((entry, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: entry.role === "You" ? 50 : -50 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.5 }}
                              className={`flex ${entry.role === "You" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[85%] p-4 rounded-2xl shadow-lg ${
                                  entry.role === "You"
                                    ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                }`}
                              >
                                <p className="font-semibold mb-2 text-sm opacity-80">{entry.role}</p>
                                <p className="leading-relaxed">{entry.text}</p>
                              </div>
                            </motion.div>
                          ))
                        )}
                        <div ref={transcriptEndRef} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>

              {/* Enhanced Sidebar */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <Sparkles className="h-6 w-6 text-purple-600" />
                        Pro Tips
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          "Be specific about what you need help with",
                          "Don't hesitate to ask follow-up questions",
                          "Take notes during your sessions",
                          "Practice what you learn right away",
                        ].map((tip, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            className="flex items-start gap-3 p-3 rounded-lg bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm"
                          >
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: index * 0.5 }}
                              className="text-purple-500 mt-1"
                            >
                              ✨
                            </motion.div>
                            <span className="text-sm leading-relaxed">{tip}</span>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
