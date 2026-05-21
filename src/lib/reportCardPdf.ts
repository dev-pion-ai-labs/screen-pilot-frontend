import jsPDF from "jspdf";
import autoTable, { type CellHookData } from "jspdf-autotable";
import {
  computeFinalGrade,
  computeFinalPercent,
} from "./grading";
import { SPECIALIZATION_LABELS } from "@/data/syllabus";
import type {
  ReportCardData,
  ReportCardGradeRow,
} from "@/components/grading/ReportCardView";

const COLLEGE_NAME = "ANNAPURNA COLLEGE OF FILM AND MEDIA";

// Foundation column order matches the on-screen view + Lead's spreadsheet.
const FOUNDATION_CODES = [
  "screenwriting",
  "direction",
  "production",
  "cinematography",
  "sound_design",
  "editing",
] as const;
const FOUNDATION_LABELS = [
  "Screenwriting",
  "Direction",
  "Production",
  "Cine",
  "Sound",
  "Edit",
];

// Brand colours.
const INDIGO: RGB = [79, 70, 229];
const SLATE_900: RGB = [15, 23, 42];
const SLATE_700: RGB = [51, 65, 85];
const SLATE_500: RGB = [100, 116, 139];
const SLATE_300: RGB = [203, 213, 225];
const SLATE_100: RGB = [241, 245, 249];

// Grade pill colours (background + text) — match the on-screen view.
const GRADE_FILL: Record<string, RGB> = {
  A: [209, 250, 229],
  B: [219, 234, 254],
  C: [254, 243, 199],
  D: [255, 228, 230],
};
const GRADE_TEXT: Record<string, RGB> = {
  A: [6, 95, 70],
  B: [30, 64, 175],
  C: [146, 64, 14],
  D: [159, 18, 57],
};

type RGB = [number, number, number];

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/logo.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onloadend = () => resolve((r.result as string) ?? null);
      r.onerror = () => resolve(null);
      r.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

const findRow = (
  grades: ReportCardGradeRow[],
  semester: number,
  code: string,
) => grades.find((g) => g.semester === semester && g.subjectCode === code);

const getGrade = (
  grades: ReportCardGradeRow[],
  semester: number,
  code: string,
) => findRow(grades, semester, code)?.grade ?? "—";

const getComment = (
  grades: ReportCardGradeRow[],
  semester: number,
  code: string,
) => findRow(grades, semester, code)?.commentBody ?? "";

/**
 * Build a polished PDF mirroring Lead's spreadsheet layout.
 * Landscape A4 so the 7-column Specialisation table breathes.
 */
export async function downloadReportCardPdf(data: ReportCardData) {
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const headerBottom = drawBrandedHeader(
    doc,
    margin,
    pageWidth,
    await loadLogoDataUrl(),
  );
  let y = headerBottom + 18;

  drawStudentInfo(doc, data, margin, contentWidth, y);
  y = getLastY(doc) + 18;

  drawFoundationTable(doc, data.grades, margin, y);
  y = getLastY(doc) + 18;

  drawSpecializationTable(doc, data, margin, y, contentWidth);
  y = getLastY(doc) + 18;

  // Final Summary may push past the page — addPage if so. We need a healthy
  // chunk for 3 paragraphs + a title (rough 130pt) before the footer.
  if (y > pageHeight - 150) {
    drawFooter(doc);
    doc.addPage();
    y = margin;
  }
  drawFinalSummary(doc, data, margin, y);

  drawFooter(doc);

  const safeName = (data.studentName || "Student").replace(/[\\/:*?"<>|]/g, "");
  doc.save(`Report Card - ${safeName}.pdf`);
}

// ---------- sections ----------

function drawBrandedHeader(
  doc: jsPDF,
  margin: number,
  pageWidth: number,
  logoDataUrl: string | null,
): number {
  // Thin top accent bar in indigo.
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, pageWidth, 6, "F");

  // Stack: logo centered, college name below, subtitle below that.
  const logoSize = 80;
  const topPad = 16;
  let cursorY = topPad;

  if (logoDataUrl) {
    try {
      doc.addImage(
        logoDataUrl,
        "PNG",
        (pageWidth - logoSize) / 2,
        cursorY,
        logoSize,
        logoSize,
      );
      cursorY += logoSize + 8;
    } catch {
      /* ignore — fall through to text-only header */
    }
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...SLATE_900);
  doc.text(COLLEGE_NAME, pageWidth / 2, cursorY + 14, { align: "center" });
  cursorY += 22;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...SLATE_500);
  doc.text("Student Report Card", pageWidth / 2, cursorY + 6, {
    align: "center",
  });
  cursorY += 16;

  // Issued-on label on the right, vertically aligned with college name area.
  const today = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_500);
  doc.text(`Issued: ${today}`, pageWidth - margin, cursorY + 4, {
    align: "right",
  });

  // Bottom divider line for the header.
  cursorY += 10;
  doc.setDrawColor(...SLATE_300);
  doc.setLineWidth(0.5);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);

  return cursorY;
}

function drawStudentInfo(
  doc: jsPDF,
  data: ReportCardData,
  margin: number,
  contentWidth: number,
  y: number,
) {
  const finalPercent = computeFinalPercent(data.grades.map((g) => g.grade));
  const finalGrade = computeFinalGrade(finalPercent);
  const specLabel = data.specialization
    ? SPECIALIZATION_LABELS[data.specialization]
    : "—";
  const finalPctStr =
    finalPercent == null ? "—" : `${finalPercent.toFixed(2)}%`;

  // 4 columns: Label | Value | Label | Value. Wider value columns.
  const labelW = 120;
  const valueW = (contentWidth - labelW * 2) / 2;

  autoTable(doc, {
    startY: y,
    theme: "grid",
    body: [
      [
        "Student Name",
        data.studentName || "—",
        "Department / Specialisation",
        specLabel,
      ],
      ["Email", data.studentEmail || "—", "Final %", finalPctStr],
      [
        "Portfolio URL",
        data.portfolioUrl || "—",
        "Final Grade",
        finalGrade ?? "—",
      ],
    ],
    styles: {
      fontSize: 10,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      lineColor: SLATE_300 as [number, number, number],
      lineWidth: 0.4,
      valign: "middle",
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: labelW,
        fillColor: SLATE_100 as [number, number, number],
        textColor: SLATE_700 as [number, number, number],
      },
      1: { cellWidth: valueW, textColor: SLATE_900 as [number, number, number] },
      2: {
        fontStyle: "bold",
        cellWidth: labelW,
        fillColor: SLATE_100 as [number, number, number],
        textColor: SLATE_700 as [number, number, number],
      },
      3: { cellWidth: valueW, textColor: SLATE_900 as [number, number, number] },
    },
    margin: { left: margin, right: margin },
    // Make the Final Grade cell pop with a coloured pill.
    didParseCell: (hook) => {
      if (hook.column.index === 3 && hook.row.index === 2 && finalGrade) {
        const fill = GRADE_FILL[finalGrade];
        const text = GRADE_TEXT[finalGrade];
        if (fill && text) {
          hook.cell.styles.fillColor = fill as [number, number, number];
          hook.cell.styles.textColor = text as [number, number, number];
          hook.cell.styles.fontStyle = "bold";
        }
      }
    },
  });
}

function drawFoundationTable(
  doc: jsPDF,
  grades: ReportCardGradeRow[],
  margin: number,
  y: number,
) {
  sectionTitle(doc, "Foundation", margin, y);
  autoTable(doc, {
    startY: y + 6,
    theme: "grid",
    head: [["Semester", ...FOUNDATION_LABELS]],
    body: [
      ["Sem I", ...FOUNDATION_CODES.map((c) => getGrade(grades, 1, c))],
      ["Sem II", ...FOUNDATION_CODES.map((c) => getGrade(grades, 2, c))],
    ],
    styles: {
      fontSize: 10,
      halign: "center",
      cellPadding: 8,
      lineColor: SLATE_300 as [number, number, number],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: INDIGO as [number, number, number],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: {
        halign: "left",
        fontStyle: "bold",
        cellWidth: 80,
        textColor: SLATE_700 as [number, number, number],
      },
    },
    alternateRowStyles: { fillColor: SLATE_100 as [number, number, number] },
    margin: { left: margin, right: margin },
    didParseCell: (hook) => paintGradeCell(hook, 1),
  });
}

function drawSpecializationTable(
  doc: jsPDF,
  data: ReportCardData,
  margin: number,
  y: number,
  contentWidth: number,
) {
  sectionTitle(doc, "Specialisation Semesters", margin, y);

  // Width budget for the 7 columns. Grade letters compact; comments share rest.
  const semW = 60;
  const gradeW = 60;
  const totalFixed = semW + gradeW * 3;
  const commentW = (contentWidth - totalFixed) / 3;

  const specCode = data.specialization ?? "";
  const semRoman = ["III", "IV", "V", "VI"];

  autoTable(doc, {
    startY: y + 6,
    theme: "grid",
    head: [
      [
        "Semester",
        "Specialisation",
        "Direction",
        "Production",
        "Specialisation Comment",
        "Direction Comment",
        "Production Comment",
      ],
    ],
    body: [3, 4, 5, 6].map((sem, i) => [
      `Sem ${semRoman[i]}`,
      getGrade(data.grades, sem, specCode),
      getGrade(data.grades, sem, "direction"),
      getGrade(data.grades, sem, "production"),
      getComment(data.grades, sem, specCode),
      getComment(data.grades, sem, "direction"),
      getComment(data.grades, sem, "production"),
    ]),
    styles: {
      fontSize: 8.5,
      cellPadding: 6,
      valign: "top",
      lineColor: SLATE_300 as [number, number, number],
      lineWidth: 0.4,
    },
    headStyles: {
      fillColor: INDIGO as [number, number, number],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: semW,
        halign: "left",
        valign: "middle",
        textColor: SLATE_700 as [number, number, number],
      },
      1: {
        halign: "center",
        valign: "middle",
        cellWidth: gradeW,
      },
      2: { halign: "center", valign: "middle", cellWidth: gradeW },
      3: { halign: "center", valign: "middle", cellWidth: gradeW },
      4: {
        cellWidth: commentW,
        textColor: SLATE_700 as [number, number, number],
      },
      5: {
        cellWidth: commentW,
        textColor: SLATE_700 as [number, number, number],
      },
      6: {
        cellWidth: commentW,
        textColor: SLATE_700 as [number, number, number],
      },
    },
    alternateRowStyles: { fillColor: SLATE_100 as [number, number, number] },
    margin: { left: margin, right: margin },
    // Paint the 3 grade columns (1,2,3) as coloured pills.
    didParseCell: (hook) => paintGradeCell(hook, 1, 3),
  });
}

function drawFinalSummary(
  doc: jsPDF,
  data: ReportCardData,
  margin: number,
  y: number,
) {
  sectionTitle(doc, "Final Summary", margin, y);
  autoTable(doc, {
    startY: y + 6,
    theme: "grid",
    body: [
      ["Creative Comment", data.creativeComment || "—"],
      ["Technical Comment", data.technicalComment || "—"],
      ["Professional Comment", data.professionalComment || "—"],
    ],
    styles: {
      fontSize: 10,
      cellPadding: { top: 8, bottom: 8, left: 10, right: 10 },
      valign: "top",
      lineColor: SLATE_300 as [number, number, number],
      lineWidth: 0.4,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 180,
        fillColor: SLATE_100 as [number, number, number],
        textColor: SLATE_700 as [number, number, number],
        valign: "middle",
      },
      1: {
        cellWidth: "auto",
        textColor: SLATE_900 as [number, number, number],
      },
    },
    margin: { left: margin, right: margin },
  });
}

function drawFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const y = pageHeight - 24;

  doc.setDrawColor(...SLATE_300);
  doc.setLineWidth(0.4);
  doc.line(margin, y - 10, pageWidth - margin, y - 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...SLATE_500);
  doc.text(COLLEGE_NAME, margin, y);

  const pageInfo = doc.getNumberOfPages();
  const currentPage = doc.getCurrentPageInfo().pageNumber;
  doc.text(
    `Page ${currentPage} of ${pageInfo}`,
    pageWidth - margin,
    y,
    { align: "right" },
  );
}

// ---------- helpers ----------

function sectionTitle(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_900);
  doc.text(text, x, y);
}

// Colour-paint cells that hold a single grade letter (A/B/C/D) in body rows.
// `firstCol` / `lastCol` define the inclusive column range to paint (defaults
// to a single column at `firstCol`).
function paintGradeCell(
  hook: CellHookData,
  firstCol: number,
  lastCol: number = firstCol,
) {
  if (hook.section !== "body") return;
  if (hook.column.index < firstCol || hook.column.index > lastCol) return;
  const value = String(hook.cell.raw ?? "");
  if (!(value in GRADE_FILL)) return;
  hook.cell.styles.fillColor = GRADE_FILL[value] as [number, number, number];
  hook.cell.styles.textColor = GRADE_TEXT[value] as [number, number, number];
  hook.cell.styles.fontStyle = "bold";
  hook.cell.styles.halign = "center";
  hook.cell.styles.valign = "middle";
}

function getLastY(doc: jsPDF): number {
  const lastTable = (doc as unknown as { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  return lastTable?.finalY ?? 0;
}
