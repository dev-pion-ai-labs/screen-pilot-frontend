import { useMemo, useState } from "react";
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
import {
  Award,
  Check,
  ClipboardList,
  Download,
  GraduationCap,
  Loader2,
  Pencil,
  Save,
} from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { GradeEditor } from "@/components/grading/GradeEditor";
import {
  computeFinalGrade,
  computeFinalPercent,
  type Grade,
} from "@/lib/grading";
import {
  SPECIALIZATION_LABELS,
  SPECIALIZATION_MIN_SEMESTER,
  type Specialization,
} from "@/data/syllabus";
import { downloadReportCardPdf } from "@/lib/reportCardPdf";

// Codes for foundation columns (Sem I & II). Direction and Production are
// the common subjects and lead the order; Screenwriting and the remaining
// specialisation tracks follow (per Lead's feedback, 01 Jun 2026).
export const FOUNDATION_COLUMNS: { code: string; label: string }[] = [
  { code: "direction", label: "Direction" },
  { code: "production", label: "Production" },
  { code: "screenwriting", label: "Screenwriting" },
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
  // section headers show an "Edit grades" toggle that reveals the inline
  // GradeEditor for this class/student (no navigation away from the page).
  editClassId?: string;
  editStudentId?: string;
  // Semester of the class being edited. The GradeEditor only grades this
  // class's own semester, so the "Edit grades" toggle is shown solely on the
  // matching section: Foundation for Sem 1-2 classes, Specialisation for Sem
  // 3+ classes. This keeps a Sem 4 teacher, say, from launching the Sem 4
  // specialisation editor out of the Foundation header.
  editClassSemester?: number | null;
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
  // Called after grades are edited inline so the parent can re-fetch them and
  // keep the Final % / grade tables in sync.
  onGradesChanged?: () => void;
}

export function ReportCardView({
  data,
  editable = false,
  saving = false,
  isDirty = false,
  editClassId,
  editStudentId,
  editClassSemester,
  onChange,
  onSave,
  onGradesChanged,
}: ReportCardViewProps) {
  const [downloading, setDownloading] = useState(false);
  // Which section is being edited inline. Set by the "Edit grades" button in
  // the Foundation / Specialisation header; replaces the read-only grade tables
  // with the scoped GradeEditor until the teacher clicks "Done". null = not
  // editing.
  const [editingScope, setEditingScope] = useState<
    "foundation" | "specialization" | null
  >(null);
  const canEditGrades = editable && !!editClassId && !!editStudentId;
  // Foundation (Sem I & II) can be edited from any class context. The
  // specialisation editor needs the class's own Sem 3+ semester, so it only
  // appears when the selected class is a specialisation class.
  const canEditFoundation = canEditGrades;
  const canEditSpecialization =
    canEditGrades &&
    editClassSemester != null &&
    editClassSemester >= SPECIALIZATION_MIN_SEMESTER;

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

  // Whether any Sem I/II cell carries a comment — drives the "click to read"
  // hint so we don't promise comments that aren't there.
  const hasFoundationComments = useMemo(
    () =>
      data.grades.some(
        (g) => (g.semester === 1 || g.semester === 2) && !!g.commentBody,
      ),
    [data.grades],
  );

  const specializationCode = data.specialization;
  const specializationLabel = specializationCode
    ? SPECIALIZATION_LABELS[specializationCode]
    : "—";

  const studentInitials =
    (data.studentName || "")
      .split(" ")
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "—";

  return (
    <div className="space-y-6 print:space-y-3">
      {/* Header card */}
      <Card className="overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-base font-semibold text-white">
                {studentInitials}
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {data.studentName || "—"}
                </h2>
                <p className="text-sm text-slate-500">{data.studentEmail}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <StatChip
                label="Specialisation"
                value={specializationLabel}
                tone="amber"
              />
              <StatChip
                label="Final %"
                value={finalPercent == null ? "—" : finalPercent.toFixed(2)}
                tone="indigo"
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  Final Grade
                </div>
                <div className="mt-0.5">
                  <GradeCell value={finalGrade ?? "—"} />
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

      {/* Inline grade + comment editor — replaces the read-only grade tables
          while the teacher is editing, then folds back when they click Done. */}
      {canEditGrades && editingScope && (
        <Card className="overflow-hidden border-indigo-200">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-indigo-100 bg-indigo-50/50 py-3">
            <CardTitle className="text-base flex items-center gap-2 text-slate-900">
              <Pencil className="h-4 w-4 text-indigo-600" />
              {editingScope === "foundation"
                ? "Edit Foundation grades (Sem I & II)"
                : "Edit Specialisation grades"}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingScope(null);
                onGradesChanged?.();
              }}
              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 print:hidden -my-1"
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Done
            </Button>
          </CardHeader>
          <CardContent className="pt-6">
            <GradeEditor
              classId={editClassId!}
              studentId={editStudentId!}
              scope={editingScope}
              onGradesSaved={onGradesChanged}
            />
          </CardContent>
        </Card>
      )}

      {/* Foundation table — Sem I & II × 6 subjects, grade letter only. */}
      {!editingScope && (
        <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-indigo-100 bg-indigo-50/50 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base text-slate-900">
                Foundation
              </CardTitle>
              <p className="text-xs font-normal text-slate-500">
                Sem I &amp; II — all 6 subjects
                {hasFoundationComments && (
                  <span className="print:hidden">
                    {" "}
                    · hover a dotted grade to read its comment
                  </span>
                )}
              </p>
            </div>
          </div>
          {canEditFoundation && (
            <EditGradesToggle onClick={() => setEditingScope("foundation")} />
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="bg-indigo-50/60 text-left text-indigo-700">
                <th className="w-28 py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">
                  Semester
                </th>
                {FOUNDATION_COLUMNS.map((c) => (
                  <th
                    key={c.code}
                    className="py-2.5 px-3 text-center text-xs font-semibold uppercase tracking-wide"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[1, 2].map((sem, i) => (
                <tr
                  key={sem}
                  className={i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}
                >
                  <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                    Sem {sem === 1 ? "I" : "II"}
                  </td>
                  {FOUNDATION_COLUMNS.map((c) => (
                    <td key={c.code} className="py-3 px-3 text-center">
                      <FoundationGradeCell
                        value={cellGrade(sem, c.code)}
                        comment={cellComment(sem, c.code)}
                        subjectLabel={c.label}
                        semesterLabel={`Sem ${sem === 1 ? "I" : "II"}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Specialisation table — Sem III-VI × 3 columns + comments. */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-amber-100 bg-amber-50/50 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <Award className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base text-slate-900">
                Specialisation Semesters
              </CardTitle>
              <p className="text-xs font-normal text-slate-500">
                Sem III–VI — Direction &amp; Production + track
              </p>
            </div>
          </div>
          {canEditSpecialization && (
            <EditGradesToggle
              onClick={() => setEditingScope("specialization")}
            />
          )}
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-amber-50/60 text-left text-amber-800">
                <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wide">
                  Semester
                </th>
                <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide">
                  Direction
                </th>
                <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide">
                  Production
                </th>
                <th className="py-2.5 px-3 text-xs font-semibold uppercase tracking-wide">
                  Specialisation
                  {specializationCode && (
                    <span className="ml-1 normal-case text-amber-600/80">
                      ({specializationLabel})
                    </span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[3, 4, 5, 6].map((sem, i) => {
                const specCode = specializationCode ?? "";
                return (
                  <tr
                    key={sem}
                    className={`align-top ${i % 2 === 1 ? "bg-slate-50/50" : "bg-white"}`}
                  >
                    <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      Sem {romanize(sem)}
                    </td>
                    <td className="py-3 px-3">
                      <GradeCell value={cellGrade(sem, "direction")} />
                      <CommentBody body={cellComment(sem, "direction")} />
                    </td>
                    <td className="py-3 px-3">
                      <GradeCell value={cellGrade(sem, "production")} />
                      <CommentBody body={cellComment(sem, "production")} />
                    </td>
                    <td className="py-3 px-3">
                      <GradeCell value={cellGrade(sem, specCode)} />
                      <CommentBody body={cellComment(sem, specCode)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
        </>
      )}

      {/* Final Summary — 3 narrative paragraphs. */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-purple-100 bg-purple-50/50 py-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
              <ClipboardList className="h-4 w-4" />
            </span>
            <div>
              <CardTitle className="text-base text-slate-900">
                Final Summary
              </CardTitle>
              <p className="text-xs font-normal text-slate-500">
                Faculty's overall remarks
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
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
                    : "Save the academic report"
                }
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1" /> Save academic report
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

// Small labelled stat pill used in the student header. Tone tints the border
// and background to match the rest of the app (amber = specialisation, indigo
// = primary metric).
function StatChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "indigo";
}) {
  const tones = {
    amber: { box: "border-amber-200 bg-amber-50", label: "text-amber-700" },
    indigo: { box: "border-indigo-200 bg-indigo-50", label: "text-indigo-700" },
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 ${tones.box}`}>
      <div
        className={`text-[11px] font-medium uppercase tracking-wide ${tones.label}`}
      >
        {label}
      </div>
      <div className="font-semibold text-slate-900">{value}</div>
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

// Foundation cell: a grade badge that, when it has a comment, reveals it in a
// hover card with a small dot affordance. Keeps the compact 6-column grid while
// making Sem I/II comments reachable on hover (and on keyboard focus).
function FoundationGradeCell({
  value,
  comment,
  subjectLabel,
  semesterLabel,
}: {
  value: string;
  comment: string | null;
  subjectLabel: string;
  semesterLabel: string;
}) {
  // No grade, or graded with no comment — render the plain badge/dash.
  if (value === "—" || !comment) return <GradeCell value={value} />;

  return (
    <HoverCard openDelay={120} closeDelay={80}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          aria-label={`${subjectLabel} ${semesterLabel} comment`}
          className="relative inline-flex items-center rounded-md outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        >
          <GradeCell value={value} />
          <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-indigo-500 ring-2 ring-white" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-80">
        <div className="text-xs font-medium uppercase text-slate-500">
          {subjectLabel} · {semesterLabel} · Grade {value}
        </div>
        <p className="mt-1.5 text-sm text-slate-700 leading-snug">{comment}</p>
      </HoverCardContent>
    </HoverCard>
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

function EditGradesToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 print:hidden -my-1"
    >
      <Pencil className="h-3.5 w-3.5 mr-1" />
      Edit grades
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
