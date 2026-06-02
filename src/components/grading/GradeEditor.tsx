import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  SPECIALIZATION_MIN_SEMESTER,
  type Specialization,
} from "@/data/syllabus";

type Grade = "A" | "B" | "C" | "D";
const GRADES: Grade[] = ["A", "B", "C", "D"];

interface Subject {
  id: string;
  code: string;
  name: string;
  display_order: number;
}

interface Comment {
  id: string;
  semester: number;
  subject_id: string;
  grade: string;
  body: string;
}

interface ExistingGrade {
  subject_id: string;
  semester: number;
  grade: string;
  comment_id: string;
}

// Sem I & II foundation subjects, in the order they should appear in the grid.
// Direction and Production (common subjects) lead, then Screenwriting and the
// remaining specialisation tracks (per Lead's feedback, 01 Jun 2026).
const FOUNDATION_SUBJECT_CODES = [
  "direction",
  "production",
  "screenwriting",
  "cinematography",
  "sound_design",
  "editing",
];

// Sem III+ classes grade 3 subjects: Direction and Production (common across
// all tracks) come first, then the class's own specialisation.
const COMMON_SPECIALIZATION_CODES = ["direction", "production"];

// Cell state — what the teacher has selected for one (semester, subject) cell.
// savedGrade / savedCommentId track what's persisted, so the button can show
// "Saved" while the current selection matches and "Save" the moment the user
// picks a different grade or comment.
interface CellState {
  grade: Grade | "";
  commentId: string;
  saving: boolean;
  savedGrade: Grade | "";
  savedCommentId: string;
}

type GridState = Record<string, CellState>; // key = `${semester}:${subjectId}`

const cellKey = (semester: number, subjectId: string) =>
  `${semester}:${subjectId}`;

// Which slice of the report card this editor grades:
//   "foundation"     → Sem I & II, all 6 foundation subjects (class-independent)
//   "specialization" → the class's own Sem 3+ semester: spec + Direction + Production
// Omitted = legacy behaviour: derive the slice from the class's semester.
type GradingScope = "foundation" | "specialization";

interface GradeEditorProps {
  classId: string;
  studentId: string;
  scope?: GradingScope;
  // Called after each successful cell save so the surrounding report card can
  // re-fetch grades and keep the Final % / grade tables in sync.
  onGradesSaved?: () => void;
}

/**
 * Inline grade + comment editor for a single student in a single class.
 *
 * This is the grading grid lifted out of the old standalone /teacher/grading
 * page so it can be embedded directly inside the report card. The class and
 * student are passed in (the report card already owns those pickers), so this
 * component only loads reference data and renders the per-subject cards.
 */
export function GradeEditor({
  classId,
  studentId,
  scope,
  onGradesSaved,
}: GradeEditorProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const teacherId = profile?.id;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [commentBank, setCommentBank] = useState<Comment[]>([]);
  const [classSemester, setClassSemester] = useState<number | null>(null);
  const [classSpecialization, setClassSpecialization] =
    useState<Specialization | null>(null);
  const [loadingRefData, setLoadingRefData] = useState(true);
  const [loadingClass, setLoadingClass] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [grid, setGrid] = useState<GridState>({});

  // 1. Load the subjects reference list once.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRefData(true);
      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .order("display_order");
        if (cancelled) return;
        if (error) throw error;
        setSubjects(data ?? []);
      } catch (err) {
        toast({
          title: "Couldn't load grading data",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingRefData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  // 2. Load the class's semester + specialisation (drives which subjects and
  // semesters this student is graded against).
  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    (async () => {
      setLoadingClass(true);
      try {
        const { data, error } = await supabase
          .from("classes")
          .select("semester, specialization")
          .eq("id", classId)
          .maybeSingle();
        if (cancelled) return;
        if (error) throw error;
        setClassSemester(data?.semester ?? null);
        setClassSpecialization(
          (data?.specialization ?? null) as Specialization | null,
        );
      } catch (err) {
        toast({
          title: "Couldn't load class",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingClass(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, toast]);

  // Resolve the effective scope: explicit prop wins; otherwise fall back to the
  // class's semester (legacy callers that don't pass a scope).
  const effectiveScope = useMemo<GradingScope | null>(() => {
    if (scope) return scope;
    if (classSemester == null) return null;
    return classSemester < SPECIALIZATION_MIN_SEMESTER
      ? "foundation"
      : "specialization";
  }, [scope, classSemester]);

  // Which semesters this editor grades against. Foundation always covers the
  // full Sem I/II foundation regardless of the class. Specialisation covers
  // every Sem 3+ semester up to and including the class's own semester — so a
  // Sem 4 class can grade Sem III and Sem IV, but never semesters the class
  // hasn't reached yet (Sem V/VI).
  const gradingSemesters = useMemo<number[]>(() => {
    if (effectiveScope === "foundation") return [1, 2];
    if (effectiveScope === "specialization") {
      if (!classSemester) return [];
      const sems: number[] = [];
      for (let s = SPECIALIZATION_MIN_SEMESTER; s <= classSemester; s++) {
        sems.push(s);
      }
      return sems;
    }
    return [];
  }, [effectiveScope, classSemester]);

  // Which subject codes are graded. Foundation = the six common subjects;
  // specialisation = Direction + Production + the class's spec. For a
  // specialisation scope with no spec set yet, returns [] so the UI can show
  // the "ask admin to set specialisation" guard instead of the grid.
  const gradingSubjectCodes = useMemo<string[]>(() => {
    if (effectiveScope === "foundation") return FOUNDATION_SUBJECT_CODES;
    if (effectiveScope === "specialization") {
      if (!classSpecialization) return [];
      return [...COMMON_SPECIALIZATION_CODES, classSpecialization];
    }
    return [];
  }, [effectiveScope, classSpecialization]);

  // Hydrate comment bank for the class's semesters whenever they change.
  useEffect(() => {
    if (gradingSemesters.length === 0) {
      setCommentBank([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("comment_bank")
          .select("id, semester, subject_id, grade, body")
          .in("semester", gradingSemesters);
        if (cancelled) return;
        if (error) throw error;
        setCommentBank((data ?? []) as Comment[]);
      } catch (err) {
        toast({
          title: "Couldn't load comments",
          description: (err as Error).message,
          variant: "destructive",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
    // gradingSemesters is derived from classSemester; comparing by JSON to
    // avoid refetching when the array reference changes but contents don't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(gradingSemesters), toast]);

  // Load any existing grades the student already has so the dropdowns show what
  // was previously saved (and updates overwrite instead of duplicating rows).
  useEffect(() => {
    if (!studentId || gradingSemesters.length === 0) {
      setGrid({});
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingGrades(true);
      try {
        const { data, error } = await supabase
          .from("student_grades")
          .select("subject_id, semester, grade, comment_id")
          .eq("student_id", studentId)
          .in("semester", gradingSemesters);
        if (error) throw error;
        if (cancelled) return;
        const next: GridState = {};
        (data as ExistingGrade[] | null)?.forEach((row) => {
          next[cellKey(row.semester, row.subject_id)] = {
            grade: row.grade as Grade,
            commentId: row.comment_id,
            saving: false,
            savedGrade: row.grade as Grade,
            savedCommentId: row.comment_id,
          };
        });
        setGrid(next);
      } catch (err) {
        toast({
          title: "Couldn't load existing grades",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingGrades(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, JSON.stringify(gradingSemesters), toast]);

  // Resolve the class's subject codes (foundation 6 or spec 3) into actual
  // Subject rows, preserving the configured display order.
  const gradingSubjects = useMemo(() => {
    const byCode = new Map(subjects.map((s) => [s.code, s]));
    return gradingSubjectCodes
      .map((code) => byCode.get(code))
      .filter(Boolean) as Subject[];
  }, [subjects, gradingSubjectCodes]);

  // Comments grouped by (semester, subject_id, grade) for fast dropdown lookups.
  const commentsByCell = useMemo(() => {
    const map = new Map<string, Comment[]>();
    for (const c of commentBank) {
      const k = `${c.semester}:${c.subject_id}:${c.grade}`;
      const arr = map.get(k);
      if (arr) arr.push(c);
      else map.set(k, [c]);
    }
    return map;
  }, [commentBank]);

  const getCell = (semester: number, subjectId: string): CellState =>
    grid[cellKey(semester, subjectId)] ?? {
      grade: "",
      commentId: "",
      saving: false,
      savedGrade: "",
      savedCommentId: "",
    };

  const updateCell = (
    semester: number,
    subjectId: string,
    patch: Partial<CellState>,
  ) => {
    setGrid((prev) => {
      const k = cellKey(semester, subjectId);
      return {
        ...prev,
        [k]: { ...getCell(semester, subjectId), ...patch },
      };
    });
  };

  const onGradeChange = (semester: number, subjectId: string, grade: Grade) => {
    // Changing the grade clears the previously selected comment, since the
    // comment list is grade-filtered.
    updateCell(semester, subjectId, { grade, commentId: "" });
  };

  const onCommentChange = (
    semester: number,
    subjectId: string,
    commentId: string,
  ) => {
    updateCell(semester, subjectId, { commentId });
  };

  const saveCell = async (semester: number, subjectId: string) => {
    if (!studentId || !teacherId) return;
    const cell = getCell(semester, subjectId);
    if (!cell.grade || !cell.commentId) {
      toast({
        title: "Pick both a grade and a comment",
        variant: "destructive",
      });
      return;
    }
    updateCell(semester, subjectId, { saving: true });
    try {
      const { error } = await supabase.from("student_grades").upsert(
        {
          student_id: studentId,
          semester,
          subject_id: subjectId,
          grade: cell.grade,
          comment_id: cell.commentId,
          teacher_id: teacherId,
        },
        { onConflict: "student_id,semester,subject_id" },
      );
      if (error) throw error;
      updateCell(semester, subjectId, {
        saving: false,
        savedGrade: cell.grade,
        savedCommentId: cell.commentId,
      });
      onGradesSaved?.();
    } catch (err) {
      updateCell(semester, subjectId, { saving: false });
      toast({
        title: "Save failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const renderSemesterPanel = (semester: number) => (
    <div className="space-y-3">
      {gradingSubjects.map((subject) => {
        const cell = getCell(semester, subject.id);
        const commentChoices = cell.grade
          ? commentsByCell.get(`${semester}:${subject.id}:${cell.grade}`) ?? []
          : [];
        const isSaved =
          cell.savedGrade !== "" &&
          cell.savedCommentId !== "" &&
          cell.grade === cell.savedGrade &&
          cell.commentId === cell.savedCommentId;
        const isSpecializationSubject =
          effectiveScope === "specialization" &&
          !!classSpecialization &&
          subject.code === classSpecialization;
        return (
          <Card key={subject.id} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-slate-900">
                      {subject.name}
                    </h4>
                    {isSpecializationSubject && (
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200">
                        Specialisation
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Pick a grade, then choose the matching comment.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={cell.grade || undefined}
                    onValueChange={(v) =>
                      onGradeChange(semester, subject.id, v as Grade)
                    }
                  >
                    <SelectTrigger className="w-24">
                      <SelectValue placeholder="Grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => saveCell(semester, subject.id)}
                    disabled={
                      cell.saving || !cell.grade || !cell.commentId || isSaved
                    }
                    className={
                      isSaved
                        ? "bg-emerald-600 hover:bg-emerald-600 text-white disabled:opacity-100"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }
                  >
                    {cell.saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isSaved ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </div>
              <Select
                value={cell.commentId || undefined}
                onValueChange={(v) => onCommentChange(semester, subject.id, v)}
                disabled={!cell.grade}
              >
                <SelectTrigger className="w-full text-left h-auto py-2 whitespace-normal">
                  <SelectValue
                    placeholder={
                      cell.grade
                        ? "Choose a comment"
                        : "Pick a grade to see comments"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[60vh]">
                  {commentChoices.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="whitespace-normal py-2 pr-8"
                    >
                      <span className="text-sm leading-snug">{c.body}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  // Specialisation scope without a specialisation set — can't grade until an
  // admin assigns one. Mirror the guard the standalone grading page used to
  // show. (Foundation scope never needs a specialisation.)
  if (
    !loadingClass &&
    effectiveScope === "specialization" &&
    classSemester != null &&
    !classSpecialization
  ) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="flex items-start gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm text-amber-900">
            <div className="font-medium">
              Specialisation not set for this class
            </div>
            <div className="text-amber-800 mt-1">
              This is a Sem {classSemester} class but no specialisation has been
              assigned. Ask an admin to set one on{" "}
              <span className="font-mono">/admin/assign-class</span>{" "}
              (Screenwriting, Cinematography, Editing, Sound Design, or VFX)
              before grading can begin.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loadingRefData || loadingClass || loadingGrades) {
    // Mirror the real layout (3 cards for spec / 6 for foundation) so the grid
    // doesn't flash empty-state placeholders before the real data hydrates.
    return (
      <GradingSkeleton
        count={gradingSubjectCodes.length || 3}
        showTabs={gradingSemesters.length > 1}
      />
    );
  }

  if (gradingSemesters.length === 1) {
    // A single semester to grade (e.g. a Sem 3 specialisation class).
    return <div className="mt-2">{renderSemesterPanel(gradingSemesters[0])}</div>;
  }

  // Multiple semesters — one tab each (Sem I/II for foundation, Sem III..N for
  // a Sem N specialisation class).
  return (
    <Tabs defaultValue={String(gradingSemesters[0])} className="w-full">
      <TabsList>
        {gradingSemesters.map((s) => (
          <TabsTrigger key={s} value={String(s)}>
            Sem {ROMAN[s] ?? s}
          </TabsTrigger>
        ))}
      </TabsList>
      {gradingSemesters.map((s) => (
        <TabsContent key={s} value={String(s)} className="mt-4">
          {renderSemesterPanel(s)}
        </TabsContent>
      ))}
    </Tabs>
  );
}

const ROMAN: Record<number, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
  5: "V",
  6: "VI",
};

function GradingSkeleton({
  count,
  showTabs,
}: {
  count: number;
  showTabs: boolean;
}) {
  return (
    <div className="space-y-3">
      {showTabs && (
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-56" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
