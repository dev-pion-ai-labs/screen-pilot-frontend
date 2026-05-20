import { useEffect, useMemo, useState } from "react";
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
import {
  GraduationCap,
  School,
  Users,
  Loader2,
  Save,
  CheckCircle2,
} from "lucide-react";

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

// Cell state — what the teacher has selected for one (semester, subject) cell.
interface CellState {
  grade: Grade | "";
  commentId: string;
  saving: boolean;
  savedAt: number | null; // timestamp of last successful save, used for the brief checkmark
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

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [grid, setGrid] = useState<GridState>({});

  // 1. Load reference data (subjects + the entire Sem I/II comment bank).
  // The comment bank is small (384 rows), so we fetch it once and filter
  // client-side rather than re-querying each time the grade changes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRefData(true);
      try {
        const [subjRes, commentsRes] = await Promise.all([
          supabase.from("subjects").select("*").order("display_order"),
          supabase
            .from("comment_bank")
            .select("id, semester, subject_id, grade, body")
            .in("semester", [1, 2]),
        ]);
        if (cancelled) return;
        if (subjRes.error) throw subjRes.error;
        if (commentsRes.error) throw commentsRes.error;
        setSubjects(subjRes.data ?? []);
        setCommentBank((commentsRes.data ?? []) as Comment[]);
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
          .select("class_id, classes:class_id ( id, name, semester, program )")
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
    if (!selectedStudentId) {
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
          .in("semester", [1, 2]);
        if (error) throw error;
        if (cancelled) return;
        const next: GridState = {};
        (data as ExistingGrade[] | null)?.forEach((row) => {
          next[cellKey(row.semester, row.subject_id)] = {
            grade: row.grade as Grade,
            commentId: row.comment_id,
            saving: false,
            savedAt: null,
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
  }, [selectedStudentId, toast]);

  const foundationSubjects = useMemo(() => {
    const bycode = new Map(subjects.map((s) => [s.code, s]));
    return FOUNDATION_SUBJECT_CODES.map((code) => bycode.get(code)).filter(
      Boolean,
    ) as Subject[];
  }, [subjects]);

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
      savedAt: null,
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
    updateCell(semester, subjectId, { grade, commentId: "", savedAt: null });
  };

  const onCommentChange = (
    semester: number,
    subjectId: string,
    commentId: string,
  ) => {
    updateCell(semester, subjectId, { commentId, savedAt: null });
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
        savedAt: Date.now(),
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

  const renderSemesterPanel = (semester: 1 | 2) => (
    <div className="space-y-3">
      {foundationSubjects.map((subject) => {
        const cell = getCell(semester, subject.id);
        const commentChoices = cell.grade
          ? commentsByCell.get(`${semester}:${subject.id}:${cell.grade}`) ?? []
          : [];
        const recentlySaved =
          cell.savedAt && Date.now() - cell.savedAt < 4000;
        return (
          <Card key={subject.id} className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h4 className="font-medium text-slate-900">{subject.name}</h4>
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
                      cell.saving || !cell.grade || !cell.commentId
                    }
                  >
                    {cell.saving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : recentlySaved ? (
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
                <SelectContent className="max-w-[640px]">
                  {commentChoices.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="whitespace-normal py-2"
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
                Foundation semesters (Sem I &amp; II). Pick a student, set a
                grade per subject, then choose a comment.
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
                <Select
                  value={selectedClassId || undefined}
                  onValueChange={setSelectedClassId}
                  disabled={loadingClasses}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingClasses
                          ? "Loading classes…"
                          : classes.length === 0
                            ? "No classes assigned"
                            : "Select a class"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                        {c.semester ? ` · Sem ${c.semester}` : ""}
                        {c.program ? ` · ${c.program}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Student
                </label>
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
              </div>
            </CardContent>
          </Card>

          {selectedStudent && (
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
