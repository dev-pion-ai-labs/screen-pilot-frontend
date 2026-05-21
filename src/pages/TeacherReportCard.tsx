import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, School } from "lucide-react";
import {
  ReportCardView,
  type ReportCardData,
  type ReportCardGradeRow,
} from "@/components/grading/ReportCardView";
import { type Grade } from "@/lib/grading";
import { type Specialization } from "@/data/syllabus";

interface TeacherClass {
  id: string;
  name: string;
  semester: number | null;
  program: string | null;
}

interface Student {
  id: string;
  full_name: string;
  email: string;
}

const EMPTY_REPORT: ReportCardData = {
  studentName: "",
  studentEmail: "",
  specialization: null,
  grades: [],
  portfolioUrl: "",
  creativeComment: "",
  technicalComment: "",
  professionalComment: "",
};

export default function TeacherReportCard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const teacherId = profile?.id;

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [report, setReport] = useState<ReportCardData>(EMPTY_REPORT);
  // Snapshot of the report as last loaded/saved — used to compute "dirty"
  // so the Save button stays disabled until the teacher actually edits.
  const [originalReport, setOriginalReport] = useState<ReportCardData>(EMPTY_REPORT);

  // 1. Teacher's classes (for the class picker).
  useEffect(() => {
    if (!teacherId) return;
    let cancelled = false;
    (async () => {
      setLoadingClasses(true);
      const { data, error } = await supabase
        .from("class_teachers")
        .select("class_id, classes:class_id ( id, name, semester, program )")
        .eq("teacher_id", teacherId);
      if (cancelled) return;
      if (error) {
        toast({
          title: "Couldn't load classes",
          description: error.message,
          variant: "destructive",
        });
        setLoadingClasses(false);
        return;
      }
      const list: TeacherClass[] = (data ?? [])
        .map((row: { classes: TeacherClass | null }) => row.classes)
        .filter(Boolean) as TeacherClass[];
      setClasses(list);
      setLoadingClasses(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [teacherId, toast]);

  // 2. Students in the picked class.
  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setSelectedStudentId("");
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingStudents(true);
      const { data, error } = await supabase
        .from("class_students")
        .select("student_id, profiles:student_id ( id, full_name, email )")
        .eq("class_id", selectedClassId);
      if (cancelled) return;
      if (error) {
        toast({
          title: "Couldn't load students",
          description: error.message,
          variant: "destructive",
        });
        setLoadingStudents(false);
        return;
      }
      const list: Student[] = (data ?? [])
        .map((row: { profiles: Student | null }) => row.profiles)
        .filter(Boolean)
        .sort((a, b) => a!.full_name.localeCompare(b!.full_name)) as Student[];
      setStudents(list);
      setSelectedStudentId("");
      setReport(EMPTY_REPORT);
      setLoadingStudents(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedClassId, toast]);

  // 3. Hydrate the report card data when a student is picked.
  useEffect(() => {
    if (!selectedStudentId) {
      setReport(EMPTY_REPORT);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoadingReport(true);
      try {
        const data = await loadReportCard(selectedStudentId);
        if (!cancelled) {
          setReport(data);
          setOriginalReport(data);
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Couldn't load report card",
            description: (err as Error).message,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedStudentId, toast]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  // Any of the 4 editable fields differ from the last loaded/saved version.
  const isDirty = useMemo(
    () =>
      report.portfolioUrl !== originalReport.portfolioUrl ||
      report.creativeComment !== originalReport.creativeComment ||
      report.technicalComment !== originalReport.technicalComment ||
      report.professionalComment !== originalReport.professionalComment,
    [report, originalReport],
  );

  const handleChange: NonNullable<
    React.ComponentProps<typeof ReportCardView>["onChange"]
  > = (field, value) => {
    setReport((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!selectedStudentId || !teacherId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("student_report_card")
        .upsert(
          {
            student_id: selectedStudentId,
            portfolio_url: report.portfolioUrl || null,
            creative_comment: report.creativeComment || null,
            technical_comment: report.technicalComment || null,
            professional_comment: report.professionalComment || null,
            updated_by: teacherId,
          },
          { onConflict: "student_id" },
        );
      if (error) throw error;
      // Mark current state as the new baseline so isDirty goes false.
      setOriginalReport(report);
      toast({ title: "Report card saved" });
    } catch (err) {
      toast({
        title: "Save failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["teacher", "admin"]}>
      <ModernDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 p-2 text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Report Cards
              </h1>
              <p className="text-sm text-slate-500">
                Pick a student to see their full report card with Final % and
                grade, plus the Creative / Technical / Professional summary.
              </p>
            </div>
          </div>

          <Card className="print:hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                <span className="flex items-center gap-2">
                  <School className="h-4 w-4" /> Pick a class and student
                </span>
              </CardTitle>
              <CardDescription>
                Grades shown are pulled from every semester this student has
                been graded on, not just this class.
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
                        {[
                          c.name,
                          c.semester && `Sem ${c.semester}`,
                          c.program,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
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

          {selectedStudent &&
            (loadingReport ? (
              <Card>
                <CardContent className="flex items-center gap-2 py-10 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading report
                  card…
                </CardContent>
              </Card>
            ) : (
              <ReportCardView
                data={report}
                editable
                saving={saving}
                isDirty={isDirty}
                editClassId={selectedClassId}
                editStudentId={selectedStudentId}
                onChange={handleChange}
                onSave={handleSave}
              />
            ))}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}

// Pull together every piece of the report card in a single helper so the
// component file stays focused on rendering. Returns a fully-shaped
// ReportCardData (empty strings instead of nulls so the inputs stay
// controlled).
async function loadReportCard(studentId: string): Promise<ReportCardData> {
  type ProfileRow = { full_name: string; email: string };
  type GradeRow = {
    semester: number;
    grade: string;
    subject: { code: string } | null;
    comment: { body: string } | null;
  };
  type ClassRow = { specialization: string | null };
  type ReportRow = {
    portfolio_url: string | null;
    creative_comment: string | null;
    technical_comment: string | null;
    professional_comment: string | null;
  };

  const [profileRes, gradesRes, specRes, reportRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("student_grades")
      .select(
        "semester, grade, subject:subject_id ( code ), comment:comment_id ( body )",
      )
      .eq("student_id", studentId),
    supabase
      .from("class_students")
      .select("classes:class_id ( specialization )")
      .eq("student_id", studentId),
    supabase
      .from("student_report_card")
      .select(
        "portfolio_url, creative_comment, technical_comment, professional_comment",
      )
      .eq("student_id", studentId)
      .maybeSingle(),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (gradesRes.error) throw gradesRes.error;
  if (specRes.error) throw specRes.error;
  if (reportRes.error) throw reportRes.error;

  const profile = (profileRes.data ?? null) as ProfileRow | null;
  const grades = (gradesRes.data ?? []) as unknown as GradeRow[];
  const report = (reportRes.data ?? null) as ReportRow | null;

  // Derive the student's specialisation from any Sem 3+ class they're
  // enrolled in that has a non-null spec. A student should only ever be
  // in one track, so taking the first match is fine.
  const specRows = (specRes.data ?? []) as unknown as Array<{
    classes: ClassRow | null;
  }>;
  const specialization =
    (specRows
      .map((r) => r.classes?.specialization)
      .find((s) => !!s) as Specialization | undefined) ?? null;

  const mappedGrades: ReportCardGradeRow[] = grades
    .filter((g): g is GradeRow & { subject: { code: string } } => !!g.subject)
    .map((g) => ({
      semester: g.semester,
      subjectCode: g.subject.code,
      grade: g.grade as Grade,
      commentBody: g.comment?.body ?? null,
    }));

  return {
    studentName: profile?.full_name ?? "Unknown student",
    studentEmail: profile?.email ?? "",
    specialization,
    grades: mappedGrades,
    portfolioUrl: report?.portfolio_url ?? "",
    creativeComment: report?.creative_comment ?? "",
    technicalComment: report?.technical_comment ?? "",
    professionalComment: report?.professional_comment ?? "",
  };
}
