import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  GraduationCap,
  School,
  Users,
  Loader2,
  Save,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  SPECIALIZATION_LABELS,
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

interface TeacherClass {
  id: string;
  name: string;
  semester: number | null;
  program: string | null;
  specialization: Specialization | null;
  student_count: number;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
  semester: number | null;
}

interface ExistingGrade {
  subject_id: string;
  semester: number;
  grade: string;
  comment_id: string;
}

// Sem I & II foundation subjects, in the order they should appear in the grid.
const FOUNDATION_SUBJECT_CODES = [
  "screenwriting",
  "direction",
  "production",
  "cinematography",
  "sound_design",
  "editing",
];

// Sem III+ classes grade 3 subjects: the class's specialisation, plus Direction
// and Production which stay common across all tracks.
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

const cellKey = (semester: number, subjectId: string) => `${semester}:${subjectId}`;

export default function TeacherGrading() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const teacherId = profile?.id;

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [commentBank, setCommentBank] = useState<Comment[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingRefData, setLoadingRefData] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(false);

  // Initial selections can be passed via URL search params from the report
  // card page (?class=…&student=…) so "Edit grades" lands the teacher on
  // exactly the right student/class without an extra click.
  const [searchParams] = useSearchParams();
  const initialClassId = searchParams.get("class") ?? "";
  const initialStudentId = searchParams.get("student") ?? "";

  const [selectedClassId, setSelectedClassId] = useState<string>(initialClassId);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [grid, setGrid] = useState<GridState>({});

  // 1. Load the subjects reference list once. Comments are loaded lazily per
  // class (see below) so a Sem 3 VFX class doesn't pay for Sem I-II data.
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

  // 2. Load the teacher's classes.
  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;
    (async () => {
      setLoadingClasses(true);
      try {
        const { data, error } = await supabase
          .from("class_teachers")
          .select(
            "class_id, classes:class_id ( id, name, semester, program, specialization )",
          )
          .eq("teacher_id", teacherId);
        if (error) throw error;
        if (cancelled) return;

        const withCounts = await Promise.all(
          (data ?? []).map(async (row: any) => {
            const cls = row.classes;
            if (!cls) return null;
            const { count } = await supabase
              .from("class_students")
              .select("*", { count: "exact", head: true })
              .eq("class_id", cls.id);
            return {
              id: cls.id,
              name: cls.name,
              semester: cls.semester,
              program: cls.program,
              specialization: (cls.specialization ?? null) as Specialization | null,
              student_count: count ?? 0,
            } as TeacherClass;
          }),
        );
        if (!cancelled) setClasses(withCounts.filter(Boolean) as TeacherClass[]);
      } catch (err) {
        toast({
          title: "Couldn't load your classes",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingClasses(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teacherId, toast]);

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) ?? null,
    [classes, selectedClassId],
  );

  // Which semesters this class is graded against. Sem 1-2 classes always
  // grade against the full Sem I/II foundation; Sem 3+ classes grade only
  // their own semester.
  const gradingSemesters = useMemo<number[]>(() => {
    if (!selectedClass?.semester) return [];
    if (selectedClass.semester < SPECIALIZATION_MIN_SEMESTER) return [1, 2];
    return [selectedClass.semester];
  }, [selectedClass]);

  // Which subject codes are graded for this class. Foundation = the six
  // common subjects; specialisation = the class's spec + Direction + Production.
  // For a Sem 3+ class with no specialisation set yet, returns [] so the UI
  // can show the "ask admin to set specialisation" guard instead of the grid.
  const gradingSubjectCodes = useMemo<string[]>(() => {
    if (!selectedClass?.semester) return [];
    if (selectedClass.semester < SPECIALIZATION_MIN_SEMESTER) {
      return FOUNDATION_SUBJECT_CODES;
    }
    if (!selectedClass.specialization) return [];
    return [selectedClass.specialization, ...COMMON_SPECIALIZATION_CODES];
  }, [selectedClass]);

  // Hydrate comment bank for the class's semesters whenever the class changes.
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
    // gradingSemesters is derived from selectedClass; comparing by JSON to
    // avoid refetching when the array reference changes but contents don't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(gradingSemesters), toast]);

  // On first mount, after students for the URL-provided class have loaded,
  // pick the URL-provided student. After this initial hydration we let the
  // student dropdown behave normally (each new class picks resets it).
  const [hasAppliedUrlStudent, setHasAppliedUrlStudent] = useState(false);
  useEffect(() => {
    if (hasAppliedUrlStudent) return;
    if (!initialStudentId) {
      setHasAppliedUrlStudent(true);
      return;
    }
    if (students.some((s) => s.id === initialStudentId)) {
      setSelectedStudentId(initialStudentId);
      setHasAppliedUrlStudent(true);
    }
  }, [students, initialStudentId, hasAppliedUrlStudent]);

  // 3. When a class is picked, load its students.
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setSelectedStudentId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingStudents(true);
      try {
        const { data, error } = await supabase
          .from("class_students")
          .select(
            "student_id, profiles:student_id ( id, full_name, email, semester )",
          )
          .eq("class_id", selectedClassId);
        if (error) throw error;
        if (cancelled) return;
        const list: Student[] = (data ?? [])
          .map((row: any) => row.profiles)
          .filter(Boolean)
          .map((p: any) => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            semester: p.semester ?? null,
          }))
          .sort((a: Student, b: Student) =>
            a.full_name.localeCompare(b.full_name),
          );
        setStudents(list);
        // Reset student selection when class changes.
        setSelectedStudentId("");
        setGrid({});
      } catch (err) {
        toast({
          title: "Couldn't load students",
          description: (err as Error).message,
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoadingStudents(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, toast]);

  // 4. When a student is picked, load any existing grades they already have
  // so the dropdowns show what was previously saved (and updates overwrite
  // instead of creating duplicate rows).
  useEffect(() => {
    if (!selectedStudentId || gradingSemesters.length === 0) {
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
          .eq("student_id", selectedStudentId)
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
  }, [selectedStudentId, JSON.stringify(gradingSemesters), toast]);

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

  const onGradeChange = (
    semester: number,
    subjectId: string,
    grade: Grade,
  ) => {
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
    if (!selectedStudentId || !teacherId) return;
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
          student_id: selectedStudentId,
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
    } catch (err) {
      updateCell(semester, subjectId, { saving: false });
      toast({
        title: "Save failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

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
          !!selectedClass?.specialization &&
          subject.code === selectedClass.specialization;
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
                <SelectContent
                  className="w-[var(--radix-select-trigger-width)] max-h-[60vh]"
                >
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

  return (
    <AuthGuard allowedRoles={["teacher", "admin"]}>
      <ModernDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 p-2 text-white">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Grading &amp; Comments
              </h1>
              <p className="text-sm text-slate-500">
                Pick a class and student, set a grade per subject, then choose
                a comment.
              </p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <School className="h-4 w-4" /> Pick a class and student
                </span>
              </CardTitle>
              <CardDescription>
                You can grade any student in any class you are assigned to.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Class
                </label>
                {loadingClasses ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedClassId || undefined}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          classes.length === 0
                            ? "No classes assigned"
                            : "Select a class"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {[
                            c.name,
                            c.semester && `Sem ${c.semester}`,
                            c.program,
                          ]
                            .filter(Boolean)
                            .join(" | ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Student
                </label>
                {selectedClassId && loadingStudents ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                <Select
                  value={selectedStudentId || undefined}
                  onValueChange={setSelectedStudentId}
                  disabled={!selectedClassId || loadingStudents}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedClassId
                          ? "Pick a class first"
                          : loadingStudents
                            ? "Loading students…"
                            : students.length === 0
                              ? "No students enrolled"
                              : "Select a student"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {selectedClass &&
            selectedClass.semester != null &&
            selectedClass.semester >= SPECIALIZATION_MIN_SEMESTER &&
            !selectedClass.specialization && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="flex items-start gap-3 py-4">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-900">
                    <div className="font-medium">
                      Specialisation not set for this class
                    </div>
                    <div className="text-amber-800 mt-1">
                      This is a Sem {selectedClass.semester} class but no
                      specialisation has been assigned. Ask an admin to set one
                      on{" "}
                      <span className="font-mono">/admin/assign-class</span>{" "}
                      (Screenwriting, Cinematography, Editing, Sound Design, or
                      VFX) before grading can begin.
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

          {selectedStudent && gradingSubjectCodes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-slate-500" />
                    <div>
                      <CardTitle className="text-base">
                        {selectedStudent.full_name}
                      </CardTitle>
                      <CardDescription>
                        {selectedStudent.email}
                      </CardDescription>
                    </div>
                  </div>
                  {selectedStudent.semester != null && (
                    <Badge variant="secondary">
                      Sem {selectedStudent.semester}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loadingRefData || loadingGrades ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading
                    grades…
                  </div>
                ) : gradingSemesters.length === 1 ? (
                  // Sem 3+ specialisation class — just one semester to grade.
                  <div className="mt-2">
                    {renderSemesterPanel(gradingSemesters[0])}
                  </div>
                ) : (
                  <Tabs defaultValue="1" className="w-full">
                    <TabsList>
                      <TabsTrigger value="1">Sem I</TabsTrigger>
                      <TabsTrigger value="2">Sem II</TabsTrigger>
                    </TabsList>
                    <TabsContent value="1" className="mt-4">
                      {renderSemesterPanel(1)}
                    </TabsContent>
                    <TabsContent value="2" className="mt-4">
                      {renderSemesterPanel(2)}
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}
