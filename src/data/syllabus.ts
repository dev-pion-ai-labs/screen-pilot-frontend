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

export const SYLLABUS: Record<Program, Record<number, Syllabus>> = {
  BA: { 1: baSem1, 2: baSem2 },
  MA: {},
};

// What the UI offers in Program dropdowns. MA exists in the schema but has no
// syllabus yet — surface only BA until that content lands.
export const PROGRAM_OPTIONS: Program[] = ["BA"];

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
