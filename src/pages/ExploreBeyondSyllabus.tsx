"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/useAuth"
import { AuthGuard } from "@/components/AuthGuard"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout"
import { Compass, Eye, Frame, Scissors, Lightbulb, PenTool, ArrowRight, ArrowLeft, Target, Upload, History, Save, X, FileText, Image, Video, File, Users, Clock, Globe, Film, Layers, BookMarked, Music, Loader2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { supabase } from "@/integrations/supabase/client"
import { toast } from "@/hooks/use-toast"

// File type configuration
const FILE_TYPE_CONFIG: Record<string, { type: string; icon: any; accept: boolean }> = {
  'image/jpeg': { type: 'image', icon: Image, accept: true },
  'image/png': { type: 'image', icon: Image, accept: true },
  'image/svg+xml': { type: 'image', icon: Image, accept: true },
  'video/mp4': { type: 'video', icon: Video, accept: true },
  'video/webm': { type: 'video', icon: Video, accept: true },
  'audio/mpeg': { type: 'audio', icon: Music, accept: true },
  'audio/wav': { type: 'audio', icon: Music, accept: true },
  'audio/mp3': { type: 'audio', icon: Music, accept: true },
  'application/pdf': { type: 'document', icon: FileText, accept: true },
  'application/vnd.ms-powerpoint': { type: 'document', icon: File, accept: true },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { type: 'document', icon: File, accept: true },
  'application/msword': { type: 'document', icon: File, accept: true },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { type: 'document', icon: File, accept: true },
};

const ACCEPTED_FILE_TYPES = '.jpg,.jpeg,.png,.svg,.mp4,.webm,.mp3,.wav,.pdf,.ppt,.pptx,.doc,.docx';

// Helper function to get file type from mime type
function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// Helper function to get file icon
function getFileIcon(type: string) {
  switch(type) {
    case 'image': return Image;
    case 'video': return Video;
    case 'audio': return Music;
    case 'document': return FileText;
    default: return File;
  }
}

export default function ExploreBeyondSyllabus() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null)
  const [notes, setNotes] = useState("")
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [historyData, setHistoryData] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Get student's semester from profile
  const semester = profile?.semester || 1

  // Wait for profile to load
  useEffect(() => {
    if (profile) {
      setIsLoading(false)
    }
  }, [profile])

  // Load history when history sidebar opens
  useEffect(() => {
    if (historyOpen && user) {
      loadHistory()
    }
  }, [historyOpen, user, semester])

  // Sync state with URL params
  useEffect(() => {
    const topicParam = searchParams.get('topic')
    const exerciseParam = searchParams.get('exercise')

    if (topicParam) setSelectedTopic(topicParam)
    if (exerciseParam) setSelectedExerciseId(exerciseParam)
  }, [searchParams])

  // Function to load history from Supabase
  const loadHistory = async () => {
    if (!user) return

    setIsLoadingHistory(true)
    try {
      let query = supabase
        .from('student_notes')
        .select(`
          *,
          attachments:student_note_attachments(*)
        `)
        .eq('student_id', user.id)
        .eq('semester', semester)
        .order('created_at', { ascending: false })

      // Filter by exercise if selected
      if (selectedExerciseId) {
        query = query.eq('exercise_id', selectedExerciseId)
      }

      const { data, error } = await query

      if (error) throw error

      // Transform data to match the display format
      const transformedData = data.map((note: any) => ({
        id: note.id,
        semester: note.semester,
        topicId: note.topic_id,
        topicTitle: getTopicTitle(note.topic_id, semester),
        exerciseId: note.exercise_id,
        exerciseTitle: getExerciseTitle(note.topic_id, note.exercise_id, semester),
        notes: note.content,
        files: note.attachments.map((att: any) => ({
          id: att.id,
          name: att.file_name,
          type: att.file_type,
          path: att.file_path,
          size: att.file_size,
          mimeType: att.mime_type
        })),
        savedAt: note.created_at
      }))

      setHistoryData(transformedData)
    } catch (error) {
      console.error('Error loading history:', error)
      toast({
        title: "Error loading history",
        description: "Failed to load your saved notes. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Function to get topic title from topic ID
  const getTopicTitle = (topicId: string, sem: number) => {
    const topics = sem === 1 ? semester1Topics : semester2Topics
    return topics.find(t => t.id === topicId)?.title || topicId
  }

  // Function to get exercise title from exercise ID
  const getExerciseTitle = (topicId: string, exerciseId: string, sem: number) => {
    const topics = sem === 1 ? semester1Topics : semester2Topics
    const topic = topics.find(t => t.id === topicId)
    return topic?.exercises.find((ex: any) => ex.id === exerciseId)?.title || exerciseId
  }

  // Function to validate note before saving
  const validateNote = (content: string, files: File[]): { valid: boolean; error?: string } => {
    // Must have either content or files
    if (!content.trim() && files.length === 0) {
      return { valid: false, error: "Please add notes or upload at least one file" }
    }

    // Validate each file
    for (const file of files) {
      // Check file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        return { valid: false, error: `File ${file.name} exceeds 50MB limit` }
      }

      // Check file type
      if (!FILE_TYPE_CONFIG[file.type]?.accept) {
        return { valid: false, error: `File type ${file.type} is not supported` }
      }
    }

    return { valid: true }
  }

  // Function to save note with files to Supabase
  const handleSave = async () => {
    if (!user || !selectedTopic || !selectedExerciseId) {
      toast({
        title: "Error",
        description: "Missing required information",
        variant: "destructive"
      })
      return
    }

    // Validate
    const validation = validateNote(notes, uploadedFiles)
    if (!validation.valid) {
      toast({
        title: "Validation Error",
        description: validation.error,
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)
    try {
      // Step 1: Create note record
      const { data: note, error: noteError } = await supabase
        .from('student_notes')
        .insert({
          student_id: user.id,
          topic_id: selectedTopic,
          exercise_id: selectedExerciseId,
          semester: semester,
          content: notes
        })
        .select()
        .single()

      if (noteError) throw noteError

      // Step 2: Upload files and create attachment records
      for (const file of uploadedFiles) {
        // Upload to storage
        const fileName = `${user.id}/${note.id}/${Date.now()}_${file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-notes')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Determine file type
        const fileType = getFileType(file.type)

        // Create attachment record
        const { error: attachmentError } = await supabase
          .from('student_note_attachments')
          .insert({
            note_id: note.id,
            file_name: file.name,
            file_path: uploadData.path,
            file_type: fileType,
            file_size: file.size,
            mime_type: file.type
          })

        if (attachmentError) throw attachmentError
      }

      // Success!
      toast({
        title: "Success!",
        description: "Your work has been saved successfully.",
      })

      // Clear form
      setNotes("")
      setUploadedFiles([])

      // Reload history if open
      if (historyOpen) {
        await loadHistory()
      }

    } catch (error) {
      console.error('Error saving note:', error)
      toast({
        title: "Error saving work",
        description: "Failed to save your work. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Function to download/view file
  const handleFileClick = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-notes')
        .createSignedUrl(filePath, 3600) // 1 hour expiry

      if (error) throw error

      // Open in new tab
      window.open(data.signedUrl, '_blank')
    } catch (error) {
      console.error('Error getting file URL:', error)
      toast({
        title: "Error",
        description: "Failed to open file. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Validate file types
      const invalidFiles = newFiles.filter(file => !FILE_TYPE_CONFIG[file.type]?.accept)
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: `Some files are not supported: ${invalidFiles.map(f => f.name).join(', ')}`,
          variant: "destructive"
        })
        return
      }

      setUploadedFiles([...uploadedFiles, ...newFiles])
    }
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

  // Filter history based on selected exercise
  const filteredHistory = selectedExerciseId
    ? historyData.filter(item => item.exerciseId === selectedExerciseId)
    : historyData

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

  // Semester 2 Topics
  const semester2Topics = [
    {
      id: "directors-visual-mind",
      title: "Director's Visual Mind",
      subtitle: "Unit II Extension: Visual Storytelling",
      description: "How directors use visual language to express emotion and meaning",
      icon: Eye,
      color: "from-purple-500 to-indigo-500",
      exercises: [
        {
          id: "dvm-visual-metaphors",
          title: "Visual Metaphors in Cinema",
          description: "Explore how directors use recurring images or colors to express emotion (e.g., mirrors in Black Swan, doors in Parasite).",
          purpose: "Understanding symbolic visual language"
        },
        {
          id: "dvm-geometry-blocking",
          title: "The Geometry of Blocking",
          description: "Analyze triangle vs line vs circle formation in emotional dynamics.",
          purpose: "Spatial composition mastery"
        },
        {
          id: "dvm-eye-trace",
          title: "Eye Trace & Visual Flow",
          description: "Study how composition guides audience attention across cuts.",
          purpose: "Directing viewer attention"
        },
        {
          id: "dvm-silhouette",
          title: "Silhouette Storytelling",
          description: "Tell emotion through shape and contrast (Pixar shorts, Shadow Play).",
          purpose: "Visual reduction and clarity"
        },
        {
          id: "dvm-frame-within-frame",
          title: "Frame-within-Frame as Meaning",
          description: "Use windows, mirrors, and screens as narrative layers.",
          purpose: "Layered visual storytelling"
        }
      ]
    },
    {
      id: "emotion-through-space",
      title: "Emotion Through Space",
      subtitle: "Unit I Extension: Staging & Blocking",
      description: "Understanding how spatial relationships create emotional dynamics",
      icon: Layers,
      color: "from-blue-500 to-cyan-500",
      exercises: [
        {
          id: "ets-spatial-power",
          title: "Spatial Power Shifts",
          description: "Explore how moving closer/farther changes character dominance.",
          purpose: "Power dynamics through space"
        },
        {
          id: "ets-third-space",
          title: "The Unspoken Third Space",
          description: "Create tension using distance, empty space, or barriers.",
          purpose: "Using negative space dramatically"
        },
        {
          id: "ets-stillness-movement",
          title: "Stillness vs Movement",
          description: "Decide when to 'freeze' space or let it flow.",
          purpose: "Dynamic vs static composition"
        },
        {
          id: "ets-blocking-reveal",
          title: "Blocking as Emotional Reveal",
          description: "Show how a character's path mirrors inner change.",
          purpose: "Movement as character arc"
        },
        {
          id: "ets-spatial-irony",
          title: "Spatial Irony",
          description: "Create contrast: cheerful space hosting tragic events.",
          purpose: "Tonal juxtaposition"
        }
      ]
    },
    {
      id: "director-psychologist",
      title: "The Director as Psychologist",
      subtitle: "Unit II Extension: Working with Actors",
      description: "Understanding and directing human emotion authentically",
      icon: Users,
      color: "from-pink-500 to-rose-500",
      exercises: [
        {
          id: "dp-emotional-beats",
          title: "Understanding Emotional Beats",
          description: "Identify the invisible rhythm under each dialogue.",
          purpose: "Timing and pacing emotion"
        },
        {
          id: "dp-non-verbal",
          title: "Non-Verbal Direction",
          description: "Direct using silence, posture, breathing.",
          purpose: "Beyond dialogue performance"
        },
        {
          id: "dp-actor-triggers",
          title: "Actor Triggers",
          description: "Guide performance through sensory cues (sound, object, environment).",
          purpose: "Environmental performance triggers"
        },
        {
          id: "dp-micro-expressions",
          title: "Micro-Expressions and Reaction Shots",
          description: "Direct the 'afterthought' - subtle emotional responses.",
          purpose: "Capturing authentic reactions"
        },
        {
          id: "dp-empathy",
          title: "Empathy in Directing",
          description: "Learn to listen rather than command on set.",
          purpose: "Collaborative direction"
        }
      ]
    },
    {
      id: "cinematic-rhythm",
      title: "Cinematic Rhythm & Time",
      subtitle: "Unit V Extension: Rhythm & Pace",
      description: "Manipulating time and tempo to create emotional impact",
      icon: Clock,
      color: "from-amber-500 to-orange-500",
      exercises: [
        {
          id: "cr-tempo-emotion",
          title: "Tempo as Emotion",
          description: "Compare fast cutting vs long take; analyze what emotion each creates.",
          purpose: "Editorial rhythm understanding"
        },
        {
          id: "cr-breathing-space",
          title: "Breathing Space",
          description: "Identify where to pause in story flow to let emotion sink.",
          purpose: "Pacing for emotional impact"
        },
        {
          id: "cr-subjective-time",
          title: "Subjective Time",
          description: "Show memory, flashback, or dream without linear logic.",
          purpose: "Non-linear storytelling"
        },
        {
          id: "cr-time-manipulation",
          title: "Time Compression / Expansion",
          description: "Experiment with montage, jump cuts, and ellipses.",
          purpose: "Temporal storytelling techniques"
        },
        {
          id: "cr-dialogue-rhythm",
          title: "Rhythm in Dialogue",
          description: "Pace speech vs silence vs interruption.",
          purpose: "Conversational dynamics"
        }
      ]
    },
    {
      id: "world-building",
      title: "World-Building for Directors",
      subtitle: "Units IV & V Extension",
      description: "Creating cohesive and believable story universes",
      icon: Globe,
      color: "from-green-500 to-emerald-500",
      exercises: [
        {
          id: "wb-tone-consistency",
          title: "Tone Consistency",
          description: "Maintain mood across scenes through design and sound.",
          purpose: "Unified aesthetic vision"
        },
        {
          id: "wb-cultural-texture",
          title: "Cultural Texture",
          description: "Use local detail to shape universal stories.",
          purpose: "Authentic world-building"
        },
        {
          id: "wb-story-universe",
          title: "Designing a Story Universe",
          description: "Create visual logic of genre worlds (sci-fi, realism, surreal).",
          purpose: "Genre world construction"
        },
        {
          id: "wb-sound-world",
          title: "Sound as World-Building",
          description: "Design ambient tone before narrative.",
          purpose: "Sonic atmosphere creation"
        },
        {
          id: "wb-symbolic-props",
          title: "Symbolic Props & Motifs",
          description: "Use recurring objects as emotional spine (like the feather in Forrest Gump).",
          purpose: "Visual storytelling through objects"
        }
      ]
    },
    {
      id: "cinematic-experiments",
      title: "Cinematic Experiments",
      subtitle: "Beyond Syllabus Exploration",
      description: "Play and curiosity-driven creative challenges",
      icon: Film,
      color: "from-violet-500 to-purple-500",
      exercises: [
        {
          id: "ce-one-minute",
          title: "The One-Minute Film",
          description: "Tell a full story in 60 seconds.",
          purpose: "Extreme narrative economy"
        },
        {
          id: "ce-single-shot",
          title: "The Single-Shot Story",
          description: "No cuts; choreograph continuous flow.",
          purpose: "Long-take mastery"
        },
        {
          id: "ce-no-dialogue",
          title: "Story Without Dialogue",
          description: "Narrative through only sound or gesture.",
          purpose: "Pure visual storytelling"
        },
        {
          id: "ce-reverse-story",
          title: "Reverse Storytelling",
          description: "Begin at the end and build backwards.",
          purpose: "Non-linear structure"
        },
        {
          id: "ce-unseen-character",
          title: "The Unseen Character",
          description: "Film where one character is never shown, only felt.",
          purpose: "Suggestive storytelling"
        },
        {
          id: "ce-sensory",
          title: "Sensory Filmmaking",
          description: "Tell a story focused only on one sense (sight/sound/touch).",
          purpose: "Sensory exploration"
        }
      ]
    },
    {
      id: "directors-notebook",
      title: "The Director's Notebook",
      subtitle: "Meta Learning & Personal Growth",
      description: "Developing your unique directorial voice and vision",
      icon: BookMarked,
      color: "from-teal-500 to-cyan-500",
      exercises: [
        {
          id: "dn-watch-director",
          title: "How to Watch Like a Director",
          description: "Spot staging, rhythm, and intention in any film.",
          purpose: "Analytical viewing skills"
        },
        {
          id: "dn-reference-mapping",
          title: "Reference Mapping",
          description: "Connect your favorite scene to other directors' works.",
          purpose: "Building visual vocabulary"
        },
        {
          id: "dn-visual-identity",
          title: "Personal Visual Identity",
          description: "Discover your recurring colors, frames, moods.",
          purpose: "Finding your style"
        },
        {
          id: "dn-observation-log",
          title: "Daily Observation Log",
          description: "Convert 5-minute real-life moment to cinematic moment.",
          purpose: "Daily creative practice"
        },
        {
          id: "dn-emotion-image",
          title: "Emotion → Image Mapping",
          description: "Define what shot or rhythm expresses which feeling for you.",
          purpose: "Personal visual language"
        }
      ]
    },
    {
      id: "experimental-forms",
      title: "Experimental Story Forms",
      subtitle: "Advanced Curiosity Zone",
      description: "Exploring avant-garde and unconventional narrative structures",
      icon: Compass,
      color: "from-rose-500 to-pink-500",
      exercises: [
        {
          id: "ef-poetic-cinema",
          title: "Poetic Cinema",
          description: "Study Tarkovsky, Malick, Wong Kar-Wai — when rhythm becomes feeling.",
          purpose: "Lyrical storytelling"
        },
        {
          id: "ef-abstract-narrative",
          title: "Abstract Narrative",
          description: "Use form, color, repetition as structure.",
          purpose: "Non-literal storytelling"
        },
        {
          id: "ef-microfiction",
          title: "Microfiction to Microfilm",
          description: "Adapt 100-word stories visually.",
          purpose: "Extreme compression"
        },
        {
          id: "ef-looped",
          title: "Looped Storytelling",
          description: "Explore circular time, déjà vu structures.",
          purpose: "Cyclical narratives"
        },
        {
          id: "ef-silence",
          title: "Silence & Negative Space",
          description: "Discover the power of withholding.",
          purpose: "Minimalist storytelling"
        }
      ]
    }
  ]

  const topics = semester === 1 ? semester1Topics : semester2Topics
  const selectedTopicData = topics.find(t => t.id === selectedTopic)
  const selectedExerciseData = selectedTopicData?.exercises.find((ex: any) => ex.id === selectedExerciseId)

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
              {isLoading ? (
                /* Skeleton Loader */
                <>
                  <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                    <CardContent className="pt-6">
                      <div className="h-7 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
                      <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="border-2">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                          </div>
                          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6 mb-4 animate-pulse"></div>
                          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
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
                </>
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
                          disabled={isSaving}
                        />

                        {/* Upload Section */}
                        <div className="space-y-4">
                          <Label className="text-base font-semibold">Upload Files</Label>
                          <div className="flex items-center gap-3 flex-wrap">
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById('file-upload')?.click()}
                              type="button"
                              disabled={isSaving}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Files
                            </Button>
                            <input
                              id="file-upload"
                              type="file"
                              multiple
                              accept={ACCEPTED_FILE_TYPES}
                              onChange={handleFileUpload}
                              className="hidden"
                              disabled={isSaving}
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
                                  disabled={isSaving}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500">
                            Supported: Images (PNG, JPG, SVG), Videos (MP4, WEBM), Audio (MP3, WAV), Documents (PDF, PPT, DOC)
                          </p>
                        </div>

                        {/* Save Button */}
                        <div className="mt-6">
                          <Button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={cn(
                              "w-full bg-gradient-to-r text-white",
                              selectedTopicData.color
                            )}
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Work
                              </>
                            )}
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
                {isLoadingHistory ? (
                  /* Loading State */
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                ) : !selectedHistoryItem ? (
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
                              {item.files.map((file: any, idx: number) => {
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
                                <button
                                  key={idx}
                                  onClick={() => handleFileClick(file.path)}
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors w-full text-left"
                                >
                                  <div className="p-2 bg-purple-100 rounded">
                                    <FileIcon className="h-5 w-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500 capitalize">
                                      {file.type} • {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                    </p>
                                  </div>
                                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                </button>
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