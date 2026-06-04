// Final % and Final Grade helpers — mirror the Excel formulas from
// ACFM_Final_Working_System.xlsx so the in-app report card matches what
// the school's spreadsheet would produce for the same grades.

import {
  SPECIALIZATION_MIN_SEMESTER,
  type Specialization,
} from "@/data/syllabus";

export type Grade = "A" | "B" | "C" | "D";

// Sem I & II foundation subjects, in display order. Direction and Production
// (common subjects) lead, then Screenwriting and the remaining specialisation
// tracks (per Lead's feedback, 01 Jun 2026).
export const FOUNDATION_SUBJECT_CODES = [
  "direction",
  "production",
  "screenwriting",
  "cinematography",
  "sound_design",
  "editing",
] as const;

// Sem III+ classes grade Direction + Production (common across all tracks)
// followed by the class's own specialisation.
export const COMMON_SPECIALIZATION_CODES = ["direction", "production"] as const;

// Display labels for subject codes — used by pickers that only know the code.
export const SUBJECT_LABELS: Record<string, string> = {
  direction: "Direction",
  production: "Production",
  screenwriting: "Screenwriting",
  cinematography: "Cinematography",
  sound_design: "Sound Design",
  editing: "Editing",
  vfx: "VFX",
};

/**
 * Subject codes graded for a class, in display order. Single source of truth
 * shared by the grading grid and the admin subject-assignment picker so they
 * never disagree on which subjects a class has.
 *   Sem 1-2  → the six foundation subjects
 *   Sem 3+   → Direction + Production + the class's specialisation
 *             (just the two common subjects until a specialisation is set)
 */
export function gradableSubjectCodes(
  semester: number | null,
  specialization: Specialization | string | null,
): string[] {
  if (semester == null) return [];
  if (semester < SPECIALIZATION_MIN_SEMESTER) {
    return [...FOUNDATION_SUBJECT_CODES];
  }
  if (!specialization) return [...COMMON_SPECIALIZATION_CODES];
  return [...COMMON_SPECIALIZATION_CODES, specialization];
}

// Per-cell weights used in the Excel formula:
//   pct = (A*4 + B*3 + C*2 + D*1) / cell_count * 25
// which is equivalent to averaging cell scores where A=100, B=75, C=50, D=25.
export const GRADE_WEIGHTS: Record<Grade, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
};

// Final-grade thresholds copied verbatim from the Evaluation Sheet:
//   =IF(pct>=85,"A",IF(pct>=70,"B",IF(pct>=50,"C","D")))
export const FINAL_GRADE_THRESHOLDS: Array<{ min: number; grade: Grade }> = [
  { min: 85, grade: "A" },
  { min: 70, grade: "B" },
  { min: 50, grade: "C" },
  { min: 0, grade: "D" },
];

/**
 * Computes the Final % from a list of per-cell grades.
 * Returns null when there are no graded cells (avoids divide-by-zero;
 * the report card UI treats null as "incomplete").
 */
export function computeFinalPercent(grades: Grade[]): number | null {
  if (grades.length === 0) return null;
  const weighted = grades.reduce((sum, g) => sum + GRADE_WEIGHTS[g], 0);
  return (weighted / grades.length) * 25;
}

/**
 * Maps a Final % to a letter grade using the Excel thresholds.
 * Returns null when percent is null (no grades yet).
 */
export function computeFinalGrade(percent: number | null): Grade | null {
  if (percent == null) return null;
  for (const { min, grade } of FINAL_GRADE_THRESHOLDS) {
    if (percent >= min) return grade;
  }
  return "D";
}

/**
 * Total cells a student should be graded against for a complete report card.
 * Sem 1 & 2 contribute 6 subjects each (foundation), Sem 3-6 contribute 3
 * each (specialisation + Direction + Production). 6+6+3+3+3+3 = 24.
 */
export const EXPECTED_TOTAL_CELLS = 24;
