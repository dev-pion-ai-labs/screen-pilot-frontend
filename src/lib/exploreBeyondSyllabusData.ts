// src/lib/exploreBeyondSyllabusData.ts

import { BookMarked, Clock, Compass, Eye, Film, Frame, Globe, Layers, Lightbulb, PenTool, Scissors, Users } from "lucide-react";

export const semester1Topics = [
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
  ];

export const semester2Topics = [
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
  ];

export function getTopicTitle(topicId: string, semester: number): string {
  const topics = semester === 1 ? semester1Topics : semester2Topics;
  return topics.find(t => t.id === topicId)?.title || topicId;
}

export function getExerciseTitle(topicId: string, exerciseId: string, semester: number): string {
  const topics = semester === 1 ? semester1Topics : semester2Topics;
  const topic = topics.find(t => t.id === topicId);
  return topic?.exercises.find(ex => ex.id === exerciseId)?.title || exerciseId;
}