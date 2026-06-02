import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthGuard } from "@/components/AuthGuard";
import { ModernDashboardLayout } from "@/components/ModernDashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import {
  ReportCardView,
  type ReportCardData,
  type ReportCardGradeRow,
} from "@/components/grading/ReportCardView";
import { type Grade } from "@/lib/grading";
import { type Specialization } from "@/data/syllabus";

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

export default function StudentReportCard() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const studentId = profile?.id;

  const [report, setReport] = useState<ReportCardData>(EMPTY_REPORT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await loadOwnReportCard(studentId);
        if (!cancelled) {
          setReport({
            ...data,
            studentName: profile?.full_name ?? data.studentName,
            studentEmail: profile?.email ?? data.studentEmail,
          });
        }
      } catch (err) {
        if (!cancelled) {
          toast({
            title: "Couldn't load your academic report",
            description: (err as Error).message,
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [studentId, profile?.full_name, profile?.email, toast]);

  return (
    <AuthGuard allowedRoles={["student"]}>
      <ModernDashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 p-2 text-white">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                My Academic Report
              </h1>
              <p className="text-sm text-slate-500">
                Your grades and Final % from every semester, plus the
                summary written by your faculty.
              </p>
            </div>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center gap-2 py-10 text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </CardContent>
            </Card>
          ) : (
            <ReportCardView data={report} />
          )}
        </div>
      </ModernDashboardLayout>
    </AuthGuard>
  );
}

async function loadOwnReportCard(studentId: string): Promise<ReportCardData> {
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

  const [gradesRes, specRes, reportRes] = await Promise.all([
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

  if (gradesRes.error) throw gradesRes.error;
  if (specRes.error) throw specRes.error;
  if (reportRes.error) throw reportRes.error;

  const grades = (gradesRes.data ?? []) as unknown as GradeRow[];
  const report = (reportRes.data ?? null) as ReportRow | null;

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
    studentName: "",
    studentEmail: "",
    specialization,
    grades: mappedGrades,
    portfolioUrl: report?.portfolio_url ?? "",
    creativeComment: report?.creative_comment ?? "",
    technicalComment: report?.technical_comment ?? "",
    professionalComment: report?.professional_comment ?? "",
  };
}
