import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Pencil, Save } from "lucide-react";
import {
  computeFinalGrade,
  computeFinalPercent,
  type Grade,
} from "@/lib/grading";
import {
  SPECIALIZATION_LABELS,
  type Specialization,
} from "@/data/syllabus";
import { downloadReportCardPdf } from "@/lib/reportCardPdf";

// Codes for foundation columns (Sem I & II). Order matches Lead's mockup
// (Screenwriting, Direction, Production, Cine, Sound, Edit).
export const FOUNDATION_COLUMNS: { code: string; label: string }[] = [
  { code: "screenwriting", label: "Screenwriting" },
  { code: "direction", label: "Direction" },
  { code: "production", label: "Production" },
  { code: "cinematography", label: "Cine" },
  { code: "sound_design", label: "Sound" },
  { code: "editing", label: "Edit" },
];

export interface ReportCardGradeRow {
  semester: number;
  subjectCode: string; // foundation 6 + 5 specialisations (e.g. "vfx")
  grade: Grade;
  commentBody: string | null;
}

export interface ReportCardData {
  studentName: string;
  studentEmail: string;
  specialization: Specialization | null;
  grades: ReportCardGradeRow[];
  portfolioUrl: string;
  creativeComment: string;
  technicalComment: string;
  professionalComment: string;
}

interface ReportCardViewProps {
  data: ReportCardData;
  editable?: boolean;
  saving?: boolean;
  // True when any editable summary field differs from the saved baseline.
  // Drives the Save button's disabled state so it only lights up after
  // a real edit.
  isDirty?: boolean;
  // When provided in editable mode, the Foundation and Specialisation
  // section headers show "Edit grades" links pointing at /teacher/grading
  // with these IDs pre-selected.
  editClassId?: string;
  editStudentId?: string;
  // Editable-mode change handlers; only required when editable=true.
  onChange?: (
    field:
      | "portfolioUrl"
      | "creativeComment"
      | "technicalComment"
      | "professionalComment",
    value: string,
  ) => void;
  onSave?: () => void;
}

export function ReportCardView({
  data,
  editable = false,
  saving = false,
  isDirty = false,
  editClassId,
  editStudentId,
  onChange,
  onSave,
}: ReportCardViewProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadReportCardPdf(data);
    } finally {
      setDownloading(false);
    }
  };

  // Look up grades for fast O(1) cell access.
  const gradeByKey = useMemo(() => {
    const m = new Map<string, ReportCardGradeRow>();
    for (const g of data.grades) {
      m.set(`${g.semester}:${g.subjectCode}`, g);
    }
    return m;
  }, [data.grades]);

  const finalPercent = useMemo(
    () => computeFinalPercent(data.grades.map((g) => g.grade)),
    [data.grades],
  );
  const finalGrade = computeFinalGrade(finalPercent);

  const cellGrade = (semester: number, subjectCode: string) =>
    gradeByKey.get(`${semester}:${subjectCode}`)?.grade ?? "—";

  const cellComment = (semester: number, subjectCode: string) =>
    gradeByKey.get(`${semester}:${subjectCode}`)?.commentBody ?? null;

  const specializationCode = data.specialization;
  const specializationLabel = specializationCode
    ? SPECIALIZATION_LABELS[specializationCode]
    : "—";

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {data.studentName}
              </h2>
              <p className="text-sm text-slate-500">{data.studentEmail}</p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <div className="rounded-md border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase text-slate-500">
                  Specialisation
                </div>
                <div className="font-medium text-slate-900">
                  {specializationLabel}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase text-slate-500">Final %</div>
                <div className="font-medium text-slate-900">
                  {finalPercent == null ? "—" : finalPercent.toFixed(2)}
                </div>
              </div>
              <div className="rounded-md border border-slate-200 px-3 py-2">
                <div className="text-xs uppercase text-slate-500">
                  Final Grade
                </div>
                <div className="font-medium text-slate-900">
                  {finalGrade ?? "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Label className="text-xs uppercase text-slate-500">
              Portfolio URL
            </Label>
            {editable ? (
              <Input
                value={data.portfolioUrl}
                placeholder="https://…"
                onChange={(e) => onChange?.("portfolioUrl", e.target.value)}
                className="mt-1"
              />
            ) : data.portfolioUrl ? (
              <a
                href={data.portfolioUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 underline break-all text-sm"
              >
                {data.portfolioUrl}
              </a>
            ) : (
              <p className="text-sm text-slate-400">No portfolio URL added.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Foundation table — Sem I & II × 6 subjects, grade letter only. */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Foundation</CardTitle>
          {editable && editClassId && editStudentId && (
            <EditGradesLink classId={editClassId} studentId={editStudentId} />
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3 font-medium">Semester</th>
                {FOUNDATION_COLUMNS.map((c) => (
                  <th key={c.code} className="py-2 pr-3 font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2].map((sem) => (
                <tr key={sem} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-medium text-slate-700">
                    Sem {sem === 1 ? "I" : "II"}
                  </td>
                  {FOUNDATION_COLUMNS.map((c) => (
                    <td key={c.code} className="py-2 pr-3">
                      <GradeCell value={cellGrade(sem, c.code)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Specialisation table — Sem III-VI × 3 columns + comments. */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Specialisation Semesters</CardTitle>
          {editable && editClassId && editStudentId && (
            <EditGradesLink classId={editClassId} studentId={editStudentId} />
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-2 pr-3 font-medium">Semester</th>
                <th className="py-2 pr-3 font-medium">
                  Specialisation
                  {specializationCode && (
                    <span className="text-xs text-slate-400 ml-1">
                      ({specializationLabel})
                    </span>
                  )}
                </th>
                <th className="py-2 pr-3 font-medium">Direction</th>
                <th className="py-2 pr-3 font-medium">Production</th>
              </tr>
            </thead>
            <tbody>
              {[3, 4, 5, 6].map((sem) => {
                const specCode = specializationCode ?? "";
                return (
                  <tr
                    key={sem}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="py-3 pr-3 font-medium text-slate-700">
                      Sem {romanize(sem)}
                    </td>
                    <td className="py-3 pr-3">
                      <GradeCell value={cellGrade(sem, specCode)} />
                      <CommentBody body={cellComment(sem, specCode)} />
                    </td>
                    <td className="py-3 pr-3">
                      <GradeCell value={cellGrade(sem, "direction")} />
                      <CommentBody body={cellComment(sem, "direction")} />
                    </td>
                    <td className="py-3 pr-3">
                      <GradeCell value={cellGrade(sem, "production")} />
                      <CommentBody body={cellComment(sem, "production")} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Final Summary — 3 narrative paragraphs. */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Final Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SummaryField
            label="Creative Comment"
            value={data.creativeComment}
            editable={editable}
            onChange={(v) => onChange?.("creativeComment", v)}
          />
          <SummaryField
            label="Technical Comment"
            value={data.technicalComment}
            editable={editable}
            onChange={(v) => onChange?.("technicalComment", v)}
          />
          <SummaryField
            label="Professional Comment"
            value={data.professionalComment}
            editable={editable}
            onChange={(v) => onChange?.("professionalComment", v)}
          />

          {editable && (
            <div className="flex justify-end gap-2 pt-2 print:hidden">
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={downloading}
                className="text-slate-700"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-1" /> Download PDF
                  </>
                )}
              </Button>
              <Button
                onClick={onSave}
                disabled={saving || !isDirty}
                className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300 disabled:text-slate-500"
                title={
                  !isDirty
                    ? "No changes to save yet"
                    : "Save the report card"
                }
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" /> Save report card
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!editable && (
        <div className="flex justify-end print:hidden">
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Download className="h-4 w-4 mr-1" /> Download PDF
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function GradeCell({ value }: { value: string }) {
  if (value === "—")
    return <span className="text-slate-300 font-mono text-sm">—</span>;
  const colors: Record<string, string> = {
    A: "bg-emerald-100 text-emerald-800",
    B: "bg-sky-100 text-sky-800",
    C: "bg-amber-100 text-amber-800",
    D: "bg-rose-100 text-rose-800",
  };
  return (
    <Badge
      className={`${colors[value] ?? "bg-slate-100 text-slate-800"} border-0 font-semibold`}
    >
      {value}
    </Badge>
  );
}

function CommentBody({ body }: { body: string | null }) {
  if (!body) return null;
  return (
    <p className="mt-1 text-xs text-slate-600 leading-snug max-w-xl">{body}</p>
  );
}

function SummaryField({
  label,
  value,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs uppercase text-slate-500">{label}</Label>
      {editable ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Write the ${label.toLowerCase()}…`}
          rows={3}
          className="mt-1"
        />
      ) : (
        <p className="mt-1 text-sm text-slate-800 whitespace-pre-line">
          {value || (
            <span className="text-slate-400">Not yet written.</span>
          )}
        </p>
      )}
    </div>
  );
}

function EditGradesLink({
  classId,
  studentId,
}: {
  classId: string;
  studentId: string;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 print:hidden -my-1"
    >
      <Link to={`/teacher/grading?class=${classId}&student=${studentId}`}>
        <Pencil className="h-3.5 w-3.5 mr-1" />
        Edit grades
      </Link>
    </Button>
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
const romanize = (n: number) => ROMAN[n] ?? String(n);
