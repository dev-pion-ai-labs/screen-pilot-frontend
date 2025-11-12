"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Compass, Eye, Frame, Scissors, Lightbulb, PenTool, ArrowRight, ArrowLeft, Target, Upload, History, Save, X, FileText, Image, Video, File } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

export default function ExploreBeyondSyllabus() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null)

  // Get student's semester from profile
  const semester = profile?.semester || 1

  // Dummy history data
  const historyData = [
    {
      id: "hist-1",
      topicId: "seeing-cinematically",
      topicTitle: "Seeing Cinematically",
      exerciseId: "sc-frame-ordinary",
      exerciseTitle: "Frame the Ordinary",
      notes: "Today I captured a photo of my morning coffee cup on the kitchen counter. The steam rising created a beautiful backlight effect. I would direct this scene with a close-up shot, shallow depth of field, keeping the background slightly blurred. The warm morning light from the window would be the key light source.",
      files: [
        { name: "morning-coffee.jpg", type: "image", url: "#" },
        { name: "lighting-notes.pdf", type: "pdf", url: "#" }
      ],
      savedAt: "2025-11-10T10:30:00Z"
    },
    {
      id: "hist-2",
      topicId: "frame-feel",
      topicTitle: "Frame & Feel",
      exerciseId: "ff-moodboard-generator",
      exerciseTitle: "Moodboard Generator",
      notes: "Created a moodboard expressing 'loneliness' using images of empty streets, single chairs, and cold color palettes. The composition focuses on negative space and isolation.",
      files: [
        { name: "loneliness-moodboard.png", type: "image", url: "#" },
        { name: "color-palette.png", type: "image", url: "#" }
      ],
      savedAt: "2025-11-09T15:45:00Z"
    },
    {
      id: "hist-3",
      topicId: "cut-connect",
      topicTitle: "Cut & Connect",
      exerciseId: "cc-edit-in-mind",
      exerciseTitle: "Edit in Your Mind",
      notes: "Watched the opening scene of 'Whiplash'. Identified 8 cuts in the first minute. The rhythm builds tension - starting with longer takes, then quick cuts during the drum solo. Would cut on the beat of the drums for maximum impact.",
      files: [
        { name: "scene-breakdown.docx", type: "document", url: "#" }
      ],
      savedAt: "2025-11-08T18:20:00Z"
    }
  ]

  const getFileIcon = (type: string) => {
    switch(type) {
      case 'image': return Image
      case 'video': return Video
      case 'pdf': return FileText
      case 'document': return File
      default: return File
    }
  }

  // Sync state with URL params
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    const exerciseParam = searchParams.get('exercise')

    if (topicParam) setSelectedTopic(topicParam)
    if (exerciseParam) setSelectedExerciseId(exerciseParam)
  }, [searchParams])

  // Semester 1 Topics
  const semester1Topics = [
    {
      id: "seeing-cinematically",
      title: "Seeing Cinematically",
      subtitle: "Unit I Extension: Introduction to Direction",
      description: "Train the director's eye through observation and film thinking",
      icon: Eye,
      color: "from-purple-500 to-indigo-500",
      exercises: [
        {
          id: "sc-frame-ordinary",
          title: "Frame the Ordinary",
          description: "Take a photo of a mundane moment and describe it as if it were a film scene.",
          purpose: "Deepens observation and cinematic language"
        },
        {
          id: "sc-directors-logbook",
          title: "Director's Logbook",
          description: "Write one paragraph daily describing something real you saw as if directing it.",
          purpose: "Builds daily observation habits"
        },
        {
          id: "sc-film-analysis",
          title: "Mini Film Analysis Prompts",
          description: "Choose any film scene you love. Break down shot types, rhythm, and emotion.",
          purpose: "Develops analytical skills"
        },
        {
          id: "sc-sound-to-image",
          title: "Sound-to-Image Challenge",
          description: "Record any 30-second sound. Imagine the visuals that fit it.",
          purpose: "Strengthens audio-visual thinking"
        },
        {
          id: "sc-perspective-swap",
          title: "Director's Perspective Swap",
          description: "Watch a short scene and rewrite it from the POV of a different character.",
          purpose: "Deepens empathy and perspective"
        }
      ]
    },
    {
      id: "frame-feel",
      title: "Frame & Feel",
      subtitle: "Unit II Extension: Visual Storytelling",
      description: "Experiment with composition, color, and emotion without cameras or complex gear",
      icon: Frame,
      color: "from-blue-500 to-cyan-500",
      exercises: [
        {
          id: "ff-moodboard-generator",
          title: "Moodboard Generator",
          description: "Create a digital collage expressing a tone — \"loneliness,\" \"chaos,\" \"hope.\"",
          purpose: "Visual literacy through creative exploration"
        },
        {
          id: "ff-lighting-mood",
          title: "Lighting Mood Test",
          description: "Capture the same face/object under three different lighting setups.",
          purpose: "Understanding lighting's emotional impact"
        },
        {
          id: "ff-silent-sequence",
          title: "Silent Sequence Challenge",
          description: "Make a 3-shot silent story expressing a feeling (e.g., jealousy, loss, excitement).",
          purpose: "Visual storytelling without dialogue"
        },
        {
          id: "ff-frame-hunt",
          title: "Frame Hunt",
          description: "Capture images showing each composition rule — rule of thirds, symmetry, depth, etc.",
          purpose: "Mastering composition fundamentals"
        }
      ]
    },
    {
      id: "cut-connect",
      title: "Cut & Connect",
      subtitle: "Unit III Extension: Continuity & Time",
      description: "Understand rhythm, continuity, and cinematic flow",
      icon: Scissors,
      color: "from-pink-500 to-rose-500",
      exercises: [
        {
          id: "cc-edit-in-mind",
          title: "Edit in Your Mind",
          description: "Watch a 1-minute clip. Mentally note where you'd cut and why.",
          purpose: "Teaches pacing and rhythm"
        },
        {
          id: "cc-time-jump",
          title: "Time Jump Experiment",
          description: "Write or storyboard a scene that skips time creatively (match cut, flash cut).",
          purpose: "Understanding creative transitions"
        },
        {
          id: "cc-continuity-detective",
          title: "Continuity Detective",
          description: "Pick a famous film scene, freeze it, and spot 3 continuity cues.",
          purpose: "Develops attention to detail"
        },
        {
          id: "cc-180-rule",
          title: "180° Rule Game",
          description: "Sketch two characters talking — experiment with camera placement breaking/preserving the axis.",
          purpose: "Mastering spatial continuity"
        }
      ]
    },
    {
      id: "story-spark",
      title: "Story Spark Lab",
      subtitle: "Unit IV Extension: Concept & Ideation",
      description: "Discover how stories grow from real experiences and imagination",
      icon: Lightbulb,
      color: "from-amber-500 to-orange-500",
      exercises: [
        {
          id: "ss-observation-to-idea",
          title: "Observation to Idea",
          description: "Turn a real-life event you witnessed this week into a story seed.",
          purpose: "Encourages creative independence"
        },
        {
          id: "ss-story-type-quiz",
          title: "Story Type Quiz",
          description: "Identify whether your idea fits mythic, realistic, or surreal structure.",
          purpose: "Understanding story archetypes"
        },
        {
          id: "ss-concept-sprint",
          title: "Concept Sprint",
          description: "In 10 minutes, write 3 story concepts that start from a single word (\"door,\" \"mirror,\" \"noise\").",
          purpose: "Quick ideation practice"
        },
        {
          id: "ss-emotion-to-scene",
          title: "Emotion-to-Scene Generator",
          description: "Choose one emotion → write a short 3-line scenario that expresses it through action only.",
          purpose: "Show don't tell technique"
        }
      ]
    },
    {
      id: "write-build",
      title: "Write & Build",
      subtitle: "Unit V Extension: Script & Story Structure",
      description: "Guide students to experiment with narrative form and structure",
      icon: PenTool,
      color: "from-green-500 to-emerald-500",
      exercises: [
        {
          id: "wb-story-skeleton",
          title: "Story Skeleton",
          description: "Write the 3-act breakdown of any short film you like.",
          purpose: "Understanding structure intuitively"
        },
        {
          id: "wb-plot-flip",
          title: "Plot Flip",
          description: "Take a well-known story (e.g., \"Cinderella\") and reimagine it with a different ending or POV.",
          purpose: "Creative reinterpretation skills"
        },
        {
          id: "wb-conflict-builder",
          title: "Conflict Builder",
          description: "Write 2 characters, 1 setting, 1 object — design a conflict in 5 lines.",
          purpose: "Building dramatic tension"
        },
        {
          id: "wb-flash-script",
          title: "Flash Script",
          description: "Write a 1-page script that begins after the climax has already happened.",
          purpose: "Non-linear storytelling practice"
        }
      ]
    },
    {
      id: "open-zone",
      title: "Open Zone",
      subtitle: "Free Exploration",
      description: "Independent creative tools you can access anytime",
      icon: Compass,
      color: "from-violet-500 to-purple-500",
      exercises: [
        {
          id: "oz-sound-journal",
          title: "Sound Journal",
          description: "Upload 10-second ambient clips; write what stories they inspire.",
          purpose: "Audio-visual imagination"
        },
        {
          id: "oz-visual-haiku",
          title: "Visual Haiku",
          description: "Capture 3 frames expressing a mood.",
          purpose: "Minimalist visual storytelling"
        },
        {
          id: "oz-mini-script",
          title: "Mini-Script Generator",
          description: "Screenpilot gives a random prompt (e.g., \"a locked door at dawn\") and student writes 5 lines.",
          purpose: "Quick creative response"
        },
        {
          id: "oz-film-reaction",
          title: "Film Reaction Forum",
          description: "Share 100-word reflections on what you watched this week.",
          purpose: "Critical thinking and sharing"
        },
        {
          id: "oz-directors-notebook",
          title: "Director's Notebook",
          description: "Open space for ideas, sketches, thoughts, and inspirations.",
          purpose: "Personal creative collection"
        }
      ]
    }
  ]

  // Semester 2 Topics (placeholder for now)
  const semester2Topics = [
    // Will be added later
  ]

  const topics = semester === 1 ? semester1Topics : semester2Topics
  const selectedTopicData = topics.find(t => t.id === selectedTopic)
  const selectedExerciseData = selectedTopicData?.exercises.find((ex: any) => ex.id === selectedExerciseId)

  // Filter history based on selected exercise
  const filteredHistory = selectedExerciseId
    ? historyData.filter(item => item.exerciseId === selectedExerciseId)
    : historyData

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setUploadedFiles([...uploadedFiles, ...Array.from(e.target.files)])
    }
  }

  const handleSave = () => {
    // TODO: Implement save functionality to database
    console.log("Saving:", {
      notes,
      uploadedFiles,
      topic: selectedTopic,
      exerciseId: selectedExerciseId,
      studentId: profile?.id
    })
    alert("Saved successfully!")
  }

  const updateURL = (topic: string | null, exercise: string | null) => {
    const params = new URLSearchParams()
    if (topic) params.set('topic', topic)
    if (exercise) params.set('exercise', exercise)

    const queryString = params.toString()
    navigate(queryString ? `?${queryString}` : '/student/explore-beyond-syllabus', { replace: true })
  }

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId)
    updateURL(topicId, null)
  }

  const handleExerciseClick = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId)
    updateURL(selectedTopic, exerciseId)
  }

  const handleBack = () => {
    if (selectedExerciseId !== null) {
      setSelectedExerciseId(null)
      setNotes("")
      setUploadedFiles([])
      updateURL(selectedTopic, null)
    } else {
      setSelectedTopic(null)
      updateURL(null, null)
    }
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg">
                  <Compass className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Explore Beyond Syllabus
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Discover additional learning resources to enhance your filmmaking journey
                  </p>
                </div>
              </div>
              {selectedTopic && (
                <Button variant="outline" onClick={() => setHistoryOpen(true)}>
                  <History className="h-4 w-4 mr-2" />
                  History
                </Button>
              )}
            </div>
          </div>

          {/* Show topic list or exercises based on selection */}
          {!selectedTopic ? (
            <>
              {/* Introduction Card */}
              <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Choose your path for today:
                  </h2>
                  <p className="text-gray-600">
                    Each path leads to 3-5 interactive exercises: self-paced, creative, and feedback-ready.
                  </p>
                </CardContent>
              </Card>

              {/* Topics Grid */}
              {semester === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topics.map((topic) => {
                const Icon = topic.icon
                return (
                  <Card
                    key={topic.id}
                    className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer border-2 hover:border-purple-300"
                    onClick={() => handleTopicClick(topic.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn(
                          "p-3 rounded-lg bg-gradient-to-br",
                          topic.color
                        )}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <ArrowRight className="h-5 w-5 text-gray-400" />
                      </div>
                      <CardTitle className="text-xl mb-2">{topic.title}</CardTitle>
                      <CardDescription className="text-xs font-semibold text-purple-600 mb-2">
                        {topic.subtitle}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {topic.description}
                      </p>
                      <Button
                        className={cn(
                          "w-full mt-4 bg-gradient-to-r",
                          topic.color,
                          "text-white hover:opacity-90"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTopicClick(topic.id)
                        }}
                      >
                        Explore Exercises
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center py-12">
                    <Compass className="h-16 w-16 mx-auto text-purple-500 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                      Semester 2 Resources
                    </h3>
                    <p className="text-gray-500">
                      Content will be added here soon for second semester students
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            /* Exercises View */
            selectedTopicData && (
              <div>
                {/* Back Button */}
                <Button
                  variant="outline"
                  className="mb-6"
                  onClick={handleBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {selectedExerciseId !== null ? "Back to Exercises" : "Back to Topics"}
                </Button>

                {selectedExerciseId === null ? (
                  <>
                    {/* Topic Header */}
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-800">
                        {selectedTopicData.title}
                      </h2>
                    </div>

                    {/* Exercises List */}
                    <div className="space-y-4">
                      {selectedTopicData.exercises.map((exercise: any, idx: number) => (
                        <Card
                          key={exercise.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleExerciseClick(exercise.id)}
                        >
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className={cn(
                                  "w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold",
                                  selectedTopicData.color
                                )}>
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                  {exercise.title}
                                </h3>
                                <p className="text-gray-600 mb-3">
                                  {exercise.description}
                                </p>
                                <div className="flex items-center gap-2 text-sm">
                                  <Target className="h-4 w-4 text-purple-600" />
                                  <span className="text-purple-600 font-medium">
                                    Purpose: {exercise.purpose}
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  /* Exercise Work Area */
                  selectedExerciseData && (
                    <div className="space-y-6">
                      {/* Exercise Header */}
                      <Card className={cn(
                        "bg-gradient-to-br border-2",
                        selectedTopicData.color.replace('500', '100')
                      )}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg",
                              selectedTopicData.color
                            )}>
                              {selectedTopicData.exercises.findIndex((ex: any) => ex.id === selectedExerciseId) + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {selectedExerciseData.title}
                              </h3>
                              <p className="text-gray-700 mb-2">
                                {selectedExerciseData.description}
                              </p>
                              <div className="flex items-center gap-2 text-sm">
                                <Target className="h-4 w-4 text-purple-600" />
                                <span className="text-purple-600 font-medium">
                                  Purpose: {selectedExerciseData.purpose}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                    {/* Notes Section */}
                    <Card>
                      <CardContent className="pt-6">
                        <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                          Your Notes & Work
                        </Label>
                        <Textarea
                          id="notes"
                          placeholder="Write your thoughts, ideas, observations, or complete the exercise here..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={10}
                          className="mb-4"
                        />

                        {/* Upload Section */}
                        <div className="space-y-4">
                          <Label className="text-base font-semibold">Upload Files</Label>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              type="button"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Files
                            </Button>
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              accept=".png,.svg,.jpeg,.jpg,.mp4,.pdf,.pptx,.ppt,.doc,.docx"
                              onChange={handleFileUpload}
                              className="hidden"
                            />

                            {/* Uploaded Files in Row */}
                            {uploadedFiles.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-full">
                                <span className="text-sm text-gray-700 truncate max-w-[150px]">
                                  {file.name}
                                </span>
                                <button
                                  onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== idx))}
                                  className="text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Supported: Images (PNG, JPG, SVG), Videos (MP4), Documents (PDF, PPT, DOC)
                          </p>
                        </div>

                        {/* Save Button */}
                        <div className="mt-6">
                          <Button
                            onClick={handleSave}
                            className={cn(
                              "w-full bg-gradient-to-r text-white",
                              selectedTopicData.color
                            )}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Save Work
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  )
                )}
              </div>
            )
          )}

          {/* History Sidebar */}
          <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
            <SheetContent side="right" className="w-full sm:w-[50vw] sm:max-w-none overflow-y-auto">
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <SheetTitle className="text-2xl font-bold">Work History</SheetTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setHistoryOpen(false)
                      setSelectedHistoryItem(null)
                    }}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </SheetHeader>

              <div className="mt-6">
                {!selectedHistoryItem ? (
                  /* History List */
                  <div className="space-y-4">
                    {/* Show exercise context if filtered */}
                    {selectedExerciseId && selectedExerciseData && (
                      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200 mb-4">
                        <CardContent className="pt-4 pb-4">
                          <p className="text-sm text-gray-600">
                            Showing history for:
                          </p>
                          <h3 className="font-semibold text-gray-900">
                            {selectedExerciseData.title}
                          </h3>
                        </CardContent>
                      </Card>
                    )}

                    {filteredHistory.map((item) => (
                      <Card
                        key={item.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedHistoryItem(item)}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {item.exerciseTitle}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {item.topicTitle}
                              </p>
                              <p className="text-sm text-gray-700 line-clamp-2">
                                {item.notes}
                              </p>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                          </div>

                          {/* Files Preview */}
                          {item.files.length > 0 && (
                            <div className="flex items-center gap-2 mt-3 flex-wrap">
                              {item.files.map((file, idx) => {
                                const FileIcon = getFileIcon(file.type)
                                return (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                                  >
                                    <FileIcon className="h-3 w-3" />
                                    <span className="truncate max-w-[100px]">{file.name}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}

                          <p className="text-xs text-gray-500 mt-3">
                            {new Date(item.savedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </CardContent>
                      </Card>
                    ))}

                    {filteredHistory.length === 0 && (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500">
                          {selectedExerciseId ? 'No saved work for this exercise yet' : 'No saved work yet'}
                        </p>
                        <p className="text-sm text-gray-400 mt-2">
                          Complete exercises and save your work to see it here
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* History Detail View */
                  <div className="space-y-6">
                    <Button
                      variant="ghost"
                      onClick={() => setSelectedHistoryItem(null)}
                      className="mb-4"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to History
                    </Button>

                    {/* Exercise Info */}
                    <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                      <CardContent className="pt-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {selectedHistoryItem.exerciseTitle}
                        </h3>
                        <p className="text-sm font-semibold text-purple-600 mb-3">
                          {selectedHistoryItem.topicTitle}
                        </p>
                        <p className="text-xs text-gray-500">
                          Saved on {new Date(selectedHistoryItem.savedAt).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Notes */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Your Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedHistoryItem.notes}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Attached Files */}
                    {selectedHistoryItem.files.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Attached Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {selectedHistoryItem.files.map((file: any, idx: number) => {
                              const FileIcon = getFileIcon(file.type)
                              return (
                                <a
                                  key={idx}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <div className="p-2 bg-purple-100 rounded">
                                    <FileIcon className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {file.type}
                                    </p>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </a>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
