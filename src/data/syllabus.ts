// Single source of truth for the program × semester × topic → subtopics taxonomy.
// Topic ids are camelCase keys; topic & subtopic *labels* are what the UI shows
// and what gets persisted to Supabase / sent to the FastAPI generator.
// Keep label strings stable — historical assignments / notes / quizzes already
// reference them by string equality.

export type Program = "BA" | "MA";

export interface Topic {
  topic: string;
  subtopics: string[];
}

export type Syllabus = Record<string, Topic>;

const baSem1: Syllabus = {
  introductionToDirection: {
    topic: "Introduction to Direction",
    subtopics: [
      "Film Analysis",
      "Different approaches to Shoot and types of film",
      "Case studies of Filmmakers and their approach",
      "Case studies of Filmmakers in historical perspective",
      "Writing Actuality Report",
      "Film Diary (Analysis of films, director and scripts, thoughts, ideas/stories,scenes, photographs)",
    ],
  },
  visualStorytellingAndCollaboration: {
    topic: "Visual Storytelling and Collaboration",
    subtopics: [
      "Introduction to visual storytelling (Composition, Cutting, Closeup, Continuity, Camera Angle)",
      "Recreating a Painting",
      "Collaboration with Camera, Edit and Sound",
      "Turning Actualities into stories (Writing on observation)",
      "Trip to closed public space (e.g. Library, Museum)",
      "Trip to an open public space (e.g. Park, Market place, Bus stop)",
    ],
  },
  principlesOfContinuity: {
    topic: "Principles of Continuity",
    subtopics: [
      "Decoupage (cutting scripts and planning visual for cinematic connection) and Continuity",
      "Aspects of continuity",
      "Time and Space in films",
      "Scene analysis of Classical Hollywood films and contemporary films",
    ],
  },
  conceptIdeationAndResearch: {
    topic: "Concept, Ideation & Research",
    subtopics: [
      "Research",
      "Types of stories",
      "Developing a concept",
      "Usage of VFX elements",
      "Oral narrative skills",
      "Creative Writing (Personal Memoir, Descriptive Writing)",
      "Reading and Analysis of short stories",
    ],
  },
  theoriesAndFormatsOfScriptwriting: {
    topic: "Theories and Formats of Scriptwriting",
    subtopics: [
      "History of Storytelling",
      "Screenplay writing - Overview and Process",
      "Elements of a screenplay",
      "Premise, Plot, Treatment, Characters, Conflict",
      "Screenwriting Softwares",
      "Introductions to Story structures  - I (Three-Act Structure, 5 Act Structure)",
      "Creating simple screenplays using 3 act structure",
    ],
  },
};

const baSem2: Syllabus = {
  stagingAndBlocking: {
    topic: "Staging and Blocking",
    subtopics: [
      "Understanding the concept of staging and blocking",
      "Types of staging and blocking",
      "Usage of props and space",
      "I, A, L, C, S patterns",
      "Blocking for VFX",
    ],
  },
  workingWithActors: {
    topic: "Working with Actors",
    subtopics: [
      "Staging a scene with actors",
      "Exercise on Improvisation",
      "Styles of acting",
      "Difference between stage and film acting",
      "Working with Virtual/Digital Actors : Possibilities & Limitations",
    ],
  },
  sceneAnalysis: {
    topic: "Scene Analysis",
    subtopics: [
      "Dialogue – Acting - Composition-Staging and Blocking along with use of Visualization tools like",
      "Traditional/Digital Storyboards & AI tools for mood boards",
    ],
  },
  dialogueWritingAndStoryStructures: {
    topic: "Dialogue Writing & Story Structures",
    subtopics: [
      "Dialogue, monologue and conversation",
      "Types of dialogue",
      "Writing effective dialogue",
      "Dialogue through observation",
      "Dialogue in a situation",
      "Story Structures II (Hero’s Journey, Dan Harmon Story Circle)",
      "Creating effective story conflicts",
    ],
  },
  rhythmAndPace: {
    topic: "Rhythm and Pace",
    subtopics: [
      "Usage of Edit, Sound and BGM from Director’s Point of View",
      "Tonalities of Dialogue",
      "Space and Action Dynamics",
    ],
  },
};

// MA syllabus has multiple subjects per semester (Direction, Screenwriting,
// Cinematography, etc.) — flattened here with a "Subject: Topic" label so the
// existing flat-dropdown UI continues to work without a hierarchical rewrite.
const maSem1: Syllabus = {
  d1VisualStorytelling: {
    topic: "Direction I: Visual Storytelling",
    subtopics: [
      "Analysis and Study of Paintings",
      "Blocking and Staging",
      "Lensing and Camera Angle",
      "Continuity Actuality Trip",
    ],
  },
  d1DialogueNarrativeAndDramaticTension: {
    topic: "Direction I: Dialogue, Narrative and Dramatic Tension",
    subtopics: [
      "Analysis and Study of film – Introduction to Western and Indian Narratology",
      "Creating and maintaining dramatic tension",
      "Creating scenes with dialogue",
      "Shooting a dramatic scene with dialogue",
    ],
  },
  d1SpatioTemporalRelationships: {
    topic: "Direction I: Spatio-Temporal Relationships",
    subtopics: [
      "Real time",
      "Compression and Expansion of Time",
      "Shooting a scene exploring spatio-temporal relationships – Shooting a short fiction",
    ],
  },
  d1IntroductionToDocumentary: {
    topic: "Direction I: Introduction to Documentary",
    subtopics: [
      "History of documentary",
      "Modes of Documentary",
      "Types of Documentary",
      "Sequencing for Documentary",
      "Research and Preparing Documentary Proposal",
    ],
  },
  d1DocumentaryShoot: {
    topic: "Direction I: Documentary Shoot",
    subtopics: [
      "Documentary – Pre-production",
      "Documentary – Production",
      "Documentary – Post-production",
    ],
  },
  ebmMediaAndEntertainmentIndustry: {
    topic: "Entertainment Business Management: Media and Entertainment Industry",
    subtopics: [
      "Introduction to Media & Entertainment as a business",
      "Evaluating success parameters of films and projects",
    ],
  },
  ebmRoleOfAProducer: {
    topic: "Entertainment Business Management: The Role of a Producer",
    subtopics: [
      "Scope and role of the producer",
      "Film finance, development and packaging",
      "Content curation and creation",
      "Achieving project greenlight",
      "Scope and purpose of pitch decks",
    ],
  },
  ebmProductionAndDistributionStage: {
    topic: "Entertainment Business Management: The Production and Distribution Stage",
    subtopics: [
      "Role of the producer in the production stage",
      "On-set project management",
      "Distribution and exhibition models",
      "Evaluating current trends",
    ],
  },
  ebmProducingForNonFiction: {
    topic: "Entertainment Business Management: Producing for Non-fiction",
    subtopics: [
      "Producing for documentaries and the role of the Documentary Producer",
      "Budgeting and funding strategies for documentaries",
      "Exploring the episodic documentary medium",
      "Practical exposure and live documentary project",
    ],
  },
  s1IdeatingAStory: {
    topic: "Screenwriting I: Ideating a Story",
    subtopics: [
      "Using observation of our environment to create stories",
      "Types of stories (Reading and Analysis of short stories / scripts)",
      "Screenwriting Overview (Industrial practices and explanations, software)",
    ],
  },
  s1FoundationOfNarrative: {
    topic: "Screenwriting I: Foundation of Narrative",
    subtopics: [
      "Aristotle's Poetics",
      "Indian Narratology",
      "Story and Discourse",
    ],
  },
  s1ElementsOfAScreenplayI: {
    topic: "Screenwriting I: Elements of a Screenplay - I",
    subtopics: [
      "Elements of screenplay (Premise, Characters, Setting, Plot, Conflict, Dialogue)",
      "Developing a screenplay concept",
      "Premise",
      "Characters (Create compelling characters)",
      "Setting",
      "Relationship between Character and Setting",
    ],
  },
  s1ElementsOfAScreenplayII: {
    topic: "Screenwriting I: Elements of a Screenplay - II",
    subtopics: [
      "Elements of Plot",
      "Creating Conflict in a plot",
      "Character and Narrative Arcs",
      "Creating and breaking Screenplay beats",
      "Introductions to Narrative structures (Hero's Journey, Dan Harmon Story Structure, 3 Act and 5 Act Structures)",
    ],
  },
  s1DialogueInCinema: {
    topic: "Screenwriting I: Dialogue in Cinema",
    subtopics: [
      "Understanding Role of Dialogue in Cinema",
      "Dialogue, monologue and conversation in cinema",
      "Types of cinema dialogue",
      "Writing effective cinema dialogue",
      "Cinema dialogue through observation",
      "Cinema dialogue in a situation",
    ],
  },
  c1VisualStorytellingBasics: {
    topic: "Cinematography I: Visual Storytelling Basics",
    subtopics: [
      "Camera Angles and Visual Storytelling",
      "Continuity Basics",
      "Cutting and Narrative Flow",
      "Close-Ups and Emphasis",
      "Composition and Framing Aesthetics",
      "Cheating Techniques",
      "Scene Exercise (Visual Storytelling)",
    ],
  },
  c1BasicCameraOperations: {
    topic: "Cinematography I: Basic Camera Operations",
    subtopics: [
      "Introduction to Basic Motion Picture Cameras and Lenses",
      "Panning and Tilting",
      "Functions of Camera Movement",
      "Motivated vs. Unmotivated Movement",
      "Purpose & Emotion",
      "Understanding Momentum, Rhythm, Pace and Tempo",
      "Focus Pulling Methods",
      "Scene Exercise (Camera Operations)",
    ],
  },
  c1FilmLightingBasics: {
    topic: "Cinematography I: Film Lighting Basics",
    subtopics: [
      "History of Lighting",
      "Introduction to Luminaires",
      "Understanding Electricity and Safety",
      "Photometrics",
      "Lighting Principles",
      "Understanding and Adapting to Available Light",
      "Three Point Lighting",
      "Lighting Recreation",
      "Scene Exercise (Lighting)",
    ],
  },
  c1ColorCorrection: {
    topic: "Cinematography I: Color Correction",
    subtopics: [
      "Color Correcting a DaVinci Resolve Timeline",
      "Balancing Footage",
      "Creating Color Continuity",
      "Correcting and Enhancing Isolated Areas",
      "Managing Nodes and Grades",
      "Adjusting Image Properties",
      "Setting up RAW Projects",
      "Delivering Projects",
      "Scene Exercise (Color Correction)",
    ],
  },
  c1WorkshopFieldTripProject: {
    topic: "Cinematography I: Workshop / Field Trip / Project",
    subtopics: [
      "Comprehensive workshop or field visit – shooting a scene adhering to basic principles of cinematography",
    ],
  },
  e1NarrativeStructuringAndTimeInEditing: {
    topic: "Editing I: Narrative Structuring and Time in Editing",
    subtopics: [
      "Principles of editing applied for linearity, coherence and lucidity",
      "Approach to Narrative Construction (Fiction and Non-Fiction)",
      "Examining Time in real life vis-a-vis Time in Cinema",
      "Identifying different types of Time in Cinema",
      "Understanding Duration vs Timing",
      "Tools used for time manipulation on the edit table",
      "Dramatic Emphasis & Time-Space Relational Treatment",
      "Pace – Purpose, Elements of Pace, Rhythm",
    ],
  },
  e1ProfessionalWorkflowAndDigitalVideoTheory: {
    topic: "Editing I: Professional Workflow & Fundamentals of Digital Video Theory",
    subtopics: [
      "Setting up Projects",
      "Input methods",
      "Basic Editing Workflow & Application Interface",
      "Essential Tools & Commands",
      "Timeline – Tracks & clips",
      "Audio Track Laying – Exporting",
      "Broadcast & Color Encoding Systems (PAL/NTSC/SECAM)",
      "Structure of a Video File (Containers & Codecs, Bit Rate & Bit Depth)",
    ],
  },
  e1DialogEditing: {
    topic: "Editing I: Dialog Editing",
    subtopics: [
      "Identifying Different Ways of Communication (Physical Action, Gestures, Camera/Space Interaction, Non-Verbal Expressions, Audio)",
      "Reading Shot Compositions and camera movements – Static & Movement in dialogue sequences",
      "Impact of Shot Placements, Juxtapositions, Order and Duration",
      "Use of Reactions and pauses – Dramatic Emphasis in Dialog Editing",
      "Staging & Blocking of Shot Compositions in Editing",
      "Designing Pace of the edit (genre, characterization, narrative intent)",
      "Dialog Editing Practical Exercise – syncing & editing a dialog sequence",
      "Observation Log Report and Folder Structure",
    ],
  },
  sd1AdvancedDialogRecordingAndEditing: {
    topic: "Sound Design I: Advanced Dialog Recording and Editing",
    subtopics: [
      "Sync Sound Recording with Advanced Field Recorders",
      "Working with Advanced Wireless Microphones",
      "Noise Elimination",
      "Dialogue Loudness Levels",
    ],
  },
  sd1SoundEditing: {
    topic: "Sound Design I: Sound Editing",
    subtopics: [
      "Sound Effects Track Laying",
      "Ambience Designing (recording and layering)",
      "Simulating a realistic environment in a film",
    ],
  },
  sd1IntroductionToSoundDesign: {
    topic: "Sound Design I: Introduction to Sound Design",
    subtopics: [
      "Identifying Sound Elements in a soundtrack",
      "Functions and roles of Sound Elements",
      "Decoding signs and syntaxes in Sound",
      "Sound Design in building time and space in Cinema",
    ],
  },
  sd1SoundForDocumentary: {
    topic: "Sound Design I: Sound Recording, Structuring and Editing a Documentary",
    subtopics: [
      "Thematic structure of various forms of documentaries",
      "Working with Interviews and Voiceover recording",
      "Track laying – Editing ambiences & sound effects for Documentary",
      "Introduction to Stereo Mixing",
      "Outputting for different formats",
    ],
  },
  p1WorkingWithTheCreatives: {
    topic: "Production I: Working with the Creatives",
    subtopics: [
      "Analysis of the Creative Process",
      "Budgetary constraints and production challenges",
      "Working with Creative and technical HODs",
      "Business scope and exploitation potential of a film project",
    ],
  },
  p1ScriptReadingAndVisualization: {
    topic: "Production I: Reading a Script and Visualization",
    subtopics: [
      "Script reading and visualization process",
      "Evaluating requirements according to the screenplay",
      "Manual script breakdown process and categories",
    ],
  },
  p1ProductionDocumentation: {
    topic: "Production I: Production Documentation",
    subtopics: [
      "Formats, Budgeting and Breakdown Process",
      "Production Software",
      "International Standard Production Formats",
      "Script breakdown using production software",
      "Shoot schedules and budgets",
      "Call sheets and daily production reports",
    ],
  },
  p1TechnologyAndAIInProduction: {
    topic: "Production I: Technology and AI in Production",
    subtopics: [
      "Use of Technology and AI in film production",
      "AI tools in pre-visualization and visualization",
      "Film production software in planning",
      "Case studies of technology disruption in film and media",
    ],
  },
};

const maSem2: Syllabus = {
  d2MiseEnScene: {
    topic: "Direction II: Mise en Scène",
    subtopics: [
      "Colour",
      "Properties (on Location and sourced)",
      "Actors",
      "Introduction, History and Origin",
      "Roles and Responsibilities",
      "Budgeting",
      "Architectural elements of set design",
      "Set Decoration with Props",
      "Marking Active Props from the Script",
      "The Colour Wheel",
      "Introduction to Color Palette",
      "Balanced Colour Harmonies",
      "Creating a Mood Board",
      "Costumes and Story",
      "Creating and Defining Characters",
      "Costume Design",
      "Research on Period, Fantasy and Future Garments",
      "Skin Tone and Pancake Number",
      "Make up and story",
    ],
  },
  d2LongTake: {
    topic: "Direction II: Long Take",
    subtopics: [
      "History of Long Take",
      "Analysis of Long Takes",
      "Different functions of long take",
      "Shooting and Choreographing a long take",
    ],
  },
  d2LongTakeAndMontage: {
    topic: "Direction II: Long Take and Montage",
    subtopics: [
      "Difference between Long Take and Montage Techniques",
      "Shooting same scene using long take and cuts",
      "Analysis of Long takes and Montage Sequences",
      "Storytelling through Songs",
      "History of Song sequence",
      "Music Video",
      "Function of song sequence",
      "Analysis of song Sequence",
      "Shooting song sequence",
    ],
  },
  d2IntroductionToDifferentFormats: {
    topic: "Direction II: Introduction to Different Formats",
    subtopics: [
      "Television (directing format)",
      "Web series (directing format)",
      "New Media and Interactive Cinema",
      "Working on a show bible",
    ],
  },
  s2UnderstandingArchetypes: {
    topic: "Screenwriting II: Understanding Archetypes",
    subtopics: [
      "Understanding Character Archetypes",
      "Understanding Story Archetypes",
    ],
  },
  s2AdvancedScreenwritingConcepts: {
    topic: "Screenwriting II: Advanced Screenwriting Concepts",
    subtopics: [
      "Text and subtext in screenplay writing",
      "Elements of writing style (tone, rhythm, voice, allegory, ellipsis, metaphor, dramatic irony, figurative language)",
      "Using Structure to reflect theme",
    ],
  },
  s2UnderstandingStoryStructuresII: {
    topic: "Screenwriting II: Understanding Story Structures II",
    subtopics: [
      "Fichtean Curve",
      "Real-Time Structure",
      "Multiple Timeline Structure",
      "Hyperlink Structure",
      "Oneiric Structure",
      "Viewpoint Narratives",
    ],
  },
  s2WritingForDifferentFormats: {
    topic: "Screenwriting II: Writing for Different Formats",
    subtopics: [
      "Film",
      "Television",
      "Web Series",
      "Advertising",
    ],
  },
  s2WritingAWebSeries: {
    topic: "Screenwriting II: Writing a Web Series",
    subtopics: [
      "Web series – an introduction",
      "Developing concepts for web series",
      "Structuring a web series",
      "Writer's Room (Collaborative work)",
      "Writing a Pitch bible for a web series",
    ],
  },
  c2DigitalCinematography: {
    topic: "Cinematography II: Digital Cinematography",
    subtopics: [
      "Motion Picture Film Camera vs Digital Motion Picture Camera",
      "Image formation in a Camera",
      "In-Camera Exposure Tools",
      "Scanning",
      "Sensors",
      "Types",
      "Differences & Artifacts",
      "Color Sampling",
      "Color Space & Gamma",
      "Linear, LOG and RAW",
      "Formats & Compression",
    ],
  },
  c2AdvancedCameraOperations1: {
    topic: "Cinematography II: Advanced Camera Operations 1",
    subtopics: [
      "Camera Movements on Track & Trolley and Basic Gimbal",
      "Advanced Focus Pulling with Wireless Focus Puller",
      "Scene Exercise (Advanced Camera)",
    ],
  },
  c2LightingTechniques1: {
    topic: "Cinematography II: Lighting Techniques 1",
    subtopics: [
      "Scene Lighting Principles and Techniques",
      "Interiors and Exteriors",
      "Variations and Adaptations for different Scene Requirements",
      "Scene Exercise (Advanced Lighting)",
    ],
  },
  c2ColourGrading: {
    topic: "Cinematography II: Colour Grading",
    subtopics: [
      "Conforming",
      "Reading Footage from Various Cameras",
      "Color Correction",
      "Color Grading",
      "Shoot Matching",
      "Case Studies",
      "Scene Exercise (Colour Grading)",
    ],
  },
  c2WorkshopFieldTripProject: {
    topic: "Cinematography II: Workshop / Field Trip / Project",
    subtopics: [
      "Comprehensive workshop or field visit – advanced cinematography",
    ],
  },
  sd2VisualDesignForMusic: {
    topic: "Sound Design II: Visual Design for Music",
    subtopics: [
      "Classification and Application of Musical Instruments",
      "Introduction to Music Structures",
      "Music Editing",
    ],
  },
  sd2EditingGenresI: {
    topic: "Sound Design II: Editing Genres I",
    subtopics: [
      "Relationship of Visual structure and Sound Design",
      "Pace and Rhythm in Cinema through Edit and Sound Design",
      "Track Laying for Editing Genres (dialogues, music, SFX)",
      "Sound Effects Designing for Action Scenes and Trailers",
      "Layering and Processing of Sound Effects",
    ],
  },
  sd2SoundForMiseEnScene: {
    topic: "Sound Design II: Sound Recording & Designing for Mise-en-scène",
    subtopics: [
      "Sound Recording for Mise-en-scène – placement and choreography with multiple microphones",
      "Understanding Signal Flow",
      "Recording and balancing live with Audio Mixers",
      "Noise Reduction Techniques for Location Sound",
      "Track Laying for Mise-en-scène (dialogues, music, SFX)",
      "Sound Effects Editing for Mise-en-scène",
    ],
  },
  e2VisualDesignForMusic: {
    topic: "Editing II: Visual Design for Music",
    subtopics: [
      "Decoding Musical Structures for Editing",
      "Constructing Visual Edit for Music and Songs",
    ],
  },
  e2DesigningMontage: {
    topic: "Editing II: Designing Montage",
    subtopics: [
      "Experiments of Griffith",
      "Soviet Experiments",
      "Identifying and understanding properties of a Shot",
      "Associating and contrasting properties of individual shots",
      "Meanings and Impact through juxtaposing properties through a cut",
    ],
  },
  e2EditingGenresI: {
    topic: "Editing II: Editing Genres I",
    subtopics: [
      "Genre Conventions & Editing Techniques",
      "Action & Altercation",
      "Construction of Visual Syntax",
      "Patterns and connections – Matrix of narrative impact",
      "Use of pauses, silences, duration of shots, inserts, shot compositions",
      "Juxtapositions and timing (point of attack and release, attachment and detachment)",
      "Dramatic Time & Tension",
      "Film Marketing Models and Mediums",
      "Audience Traits and Responses",
      "Constructing Trailers & Promotionals",
    ],
  },
  e2NarrativeStructuringFormAndTimeI: {
    topic: "Editing II: Narrative Structuring – Form and Time I",
    subtopics: [
      "Story Structuring & Narrative Development",
      "Time as a Controlling Factor – Flow and Temporal Stillness of plot",
      "Using time with sound and silence",
      "Punctuations in a narrative",
      "Connotations of a Cut",
      "Rhythm and internal moments",
      "Creating Character Motivation & Empathy",
      "Physical and Psychological Transitions in a Film",
      "Narrative Forms (Mise-en-scène & Montage)",
      "Temporal fragmentation in mise-en-scène",
      "Temporal construction in montage",
      "Techniques at different periods and movements in World Cinema",
      "Editing & Mise-en-scène – practical exercise",
    ],
  },
  hocEarlyCinema: {
    topic: "History of Cinema: Early Cinema",
    subtopics: [
      "Birth of Cinema – Early Innovations and Pioneers (Lumière Brothers)",
      "Thomas Edison and Early Film Experiments",
      "The Silent Film Era – Key Characteristics and Filmmakers",
      "D.W. Griffith and Early Narrative Structures",
      "Charlie Chaplin",
      "Buster Keaton and the Art of Silent Comedy",
      "Georges Méliès – Magician of the Cinema",
    ],
  },
  hocGoldenAgeOfHollywood: {
    topic: "History of Cinema: The Golden Age of Hollywood",
    subtopics: [
      "The Studio System and Hollywood's Dominance",
      "The Rise of Major Studios (MGM, Paramount, Warner Bros.)",
      "Iconic Films and Filmmakers of the 1930s and 1940s",
    ],
  },
  hocWorldCinema: {
    topic: "History of Cinema: World Cinema",
    subtopics: [
      "German Expressionism – Visual Style and Themes",
      "Soviet Montage Theory – Eisenstein and Revolutionary Cinema",
      "Italian Neorealism – Post-War Realism and Humanism",
      "French New Wave – Breaking Conventions and Auteur Theory",
      "Japanese Cinema – Akira Kurosawa, Yasujirō Ozu",
      "Indian Cinema – Satyajit Ray and Parallel Cinema",
    ],
  },
  hocNewHollywood: {
    topic: "History of Cinema: The New Hollywood",
    subtopics: [
      "Decline of the Studio System and Birth of New Hollywood",
      "Influential Directors – Scorsese, Spielberg, Coppola",
      "Rise of Independent Film and the Sundance Phenomenon",
      "Cinema of the 1970s and 1980s – Blockbusters and Commercialization",
      "Emergence of the Science Fiction Genre",
      "Global Cinema – Bollywood and Asian Cinema",
    ],
  },
  hocGenresAndDigitalRevolution: {
    topic: "History of Cinema: Genres & Digital Revolution",
    subtopics: [
      "Development of Key Genres (Horror, Science Fiction, Romance)",
      "Genre Hybrids and Blurring of Boundaries",
      "Influence of Television and New Media on Genre Films",
      "Digital Revolution and Contemporary Cinema",
      "CGI and Special Effects",
      "Rise of Streaming Services and Changing Distribution",
    ],
  },
};

export const SYLLABUS: Record<Program, Record<number, Syllabus>> = {
  BA: { 1: baSem1, 2: baSem2 },
  MA: { 1: maSem1, 2: maSem2 },
};

// What the UI offers in Program dropdowns. BA has a populated syllabus; MA can
// be assigned to classes/users now, and topics will populate as MA Sem 1+2
// content lands in this file.
export const PROGRAM_OPTIONS: Program[] = ["BA", "MA"];

// All programs the schema accepts — used for badges / read-only display when a
// legacy MA row is in the DB.
export const ALL_PROGRAMS: Program[] = ["BA", "MA"];

export const getSyllabus = (
  program?: Program | string | null,
  semester?: number | null,
): Syllabus | null => {
  if (!program || !semester) return null;
  const programSyllabus = SYLLABUS[program as Program];
  if (!programSyllabus) return null;
  return programSyllabus[semester] ?? null;
};
