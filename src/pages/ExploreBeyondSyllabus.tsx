"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Compass, Eye, Frame, Scissors, Lightbulb, PenTool, ArrowRight, ArrowLeft, Target } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ExploreBeyondSyllabus() {
  const { profile } = useAuth()
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  // Get student's semester from profile
  const semester = profile?.semester || 1

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
          title: "Frame the Ordinary",
          description: "Take a photo of a mundane moment and describe it as if it were a film scene.",
          purpose: "Deepens observation and cinematic language"
        },
        {
          title: "Director's Logbook",
          description: "Write one paragraph daily describing something real you saw as if directing it.",
          purpose: "Builds daily observation habits"
        },
        {
          title: "Mini Film Analysis Prompts",
          description: "Choose any film scene you love. Break down shot types, rhythm, and emotion.",
          purpose: "Develops analytical skills"
        },
        {
          title: "Sound-to-Image Challenge",
          description: "Record any 30-second sound. Imagine the visuals that fit it.",
          purpose: "Strengthens audio-visual thinking"
        },
        {
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
          title: "Moodboard Generator",
          description: "Create a digital collage expressing a tone — \"loneliness,\" \"chaos,\" \"hope.\"",
          purpose: "Visual literacy through creative exploration"
        },
        {
          title: "Lighting Mood Test",
          description: "Capture the same face/object under three different lighting setups.",
          purpose: "Understanding lighting's emotional impact"
        },
        {
          title: "Silent Sequence Challenge",
          description: "Make a 3-shot silent story expressing a feeling (e.g., jealousy, loss, excitement).",
          purpose: "Visual storytelling without dialogue"
        },
        {
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
          title: "Edit in Your Mind",
          description: "Watch a 1-minute clip. Mentally note where you'd cut and why.",
          purpose: "Teaches pacing and rhythm"
        },
        {
          title: "Time Jump Experiment",
          description: "Write or storyboard a scene that skips time creatively (match cut, flash cut).",
          purpose: "Understanding creative transitions"
        },
        {
          title: "Continuity Detective",
          description: "Pick a famous film scene, freeze it, and spot 3 continuity cues.",
          purpose: "Develops attention to detail"
        },
        {
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
          title: "Observation to Idea",
          description: "Turn a real-life event you witnessed this week into a story seed.",
          purpose: "Encourages creative independence"
        },
        {
          title: "Story Type Quiz",
          description: "Identify whether your idea fits mythic, realistic, or surreal structure.",
          purpose: "Understanding story archetypes"
        },
        {
          title: "Concept Sprint",
          description: "In 10 minutes, write 3 story concepts that start from a single word (\"door,\" \"mirror,\" \"noise\").",
          purpose: "Quick ideation practice"
        },
        {
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
          title: "Story Skeleton",
          description: "Write the 3-act breakdown of any short film you like.",
          purpose: "Understanding structure intuitively"
        },
        {
          title: "Plot Flip",
          description: "Take a well-known story (e.g., \"Cinderella\") and reimagine it with a different ending or POV.",
          purpose: "Creative reinterpretation skills"
        },
        {
          title: "Conflict Builder",
          description: "Write 2 characters, 1 setting, 1 object — design a conflict in 5 lines.",
          purpose: "Building dramatic tension"
        },
        {
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
          title: "Sound Journal",
          description: "Upload 10-second ambient clips; write what stories they inspire.",
          purpose: "Audio-visual imagination"
        },
        {
          title: "Visual Haiku",
          description: "Capture 3 frames expressing a mood.",
          purpose: "Minimalist visual storytelling"
        },
        {
          title: "Mini-Script Generator",
          description: "Screenpilot gives a random prompt (e.g., \"a locked door at dawn\") and student writes 5 lines.",
          purpose: "Quick creative response"
        },
        {
          title: "Film Reaction Forum",
          description: "Share 100-word reflections on what you watched this week.",
          purpose: "Critical thinking and sharing"
        },
        {
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

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
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
                    onClick={() => setSelectedTopic(topic.id)}
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
                          setSelectedTopic(topic.id)
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
                  onClick={() => setSelectedTopic(null)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Topics
                </Button>

                {/* Topic Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {selectedTopicData.title}
                  </h2>
                </div>

                {/* Exercises List */}
                <div className="space-y-4">
                  {selectedTopicData.exercises.map((exercise, idx) => (
                    <Card key={idx} className="hover:shadow-md transition-shadow">
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  )
}
