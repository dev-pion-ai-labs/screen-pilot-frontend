// Final % and Final Grade helpers — mirror the Excel formulas from
// ACFM_Final_Working_System.xlsx so the in-app report card matches what
// the school's spreadsheet would produce for the same grades.

export type Grade = "A" | "B" | "C" | "D";

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
