// Merge the per-subject refined comment files into a single Excel workbook
// for Lead (Amala) review. Validates integrity against the parsed source first.
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const root = path.resolve(__dirname, "..");
const refinedDir = path.join(root, "scripts", "refined");

const SUBJECTS = [
  { code: "direction", name: "Direction", order: 1, expect: 125 },
  { code: "production", name: "Production", order: 2, expect: 191 },
  { code: "screenwriting", name: "Screenwriting", order: 3, expect: 192 },
  { code: "cinematography", name: "Cinematography", order: 4, expect: 192 },
  { code: "sound_design", name: "Sound Design", order: 5, expect: 192 },
  { code: "editing", name: "Editing", order: 6, expect: 192 },
  { code: "vfx", name: "VFX", order: 7, expect: 135 },
];
const GRADE_ORDER = { A: 0, B: 1, C: 2, D: 3 };
const ROMAN = { 1: "I", 2: "II", 3: "III", 4: "IV", 5: "V", 6: "VI" };

// Source of truth for integrity check.
const source = JSON.parse(
  fs.readFileSync(path.join(root, "scripts", "comment_bank_parsed.json"), "utf8"),
);
const srcCount = {};
for (const r of source) {
  srcCount[r.subject] = (srcCount[r.subject] || 0) + 1;
}

let all = [];
const problems = [];
for (const s of SUBJECTS) {
  const file = path.join(refinedDir, `${s.code}.json`);
  if (!fs.existsSync(file)) {
    problems.push(`MISSING FILE: ${s.code}.json`);
    continue;
  }
  const rows = JSON.parse(fs.readFileSync(file, "utf8"));
  if (rows.length !== s.expect) {
    problems.push(
      `${s.code}: expected ${s.expect} rows, got ${rows.length}`,
    );
  }
  if (srcCount[s.code] !== rows.length) {
    problems.push(
      `${s.code}: source has ${srcCount[s.code]}, refined has ${rows.length}`,
    );
  }
  for (const r of rows) {
    if (!r.refined || !r.refined.trim()) {
      problems.push(`${s.code} sem${r.semester} ${r.grade}: empty refined`);
    }
    if (r.refined && r.refined.trim() === (r.original || "").trim() && r.grade !== "A") {
      // Non-A rows identical to original is suspicious (not a hard fail).
    }
    all.push({ ...r, _subjectName: s.name, _order: s.order });
  }
}

// Stable sort: Semester, then subject display order, then grade A-D.
// (Within a group the file's phrasing order is preserved by stable sort.)
all = all
  .map((r, i) => ({ r, i }))
  .sort((a, b) => {
    const ra = a.r, rb = b.r;
    return (
      ra.semester - rb.semester ||
      ra._order - rb._order ||
      GRADE_ORDER[ra.grade] - GRADE_ORDER[rb.grade] ||
      a.i - b.i
    );
  })
  .map((x) => x.r);

if (problems.length) {
  console.log("INTEGRITY PROBLEMS:");
  for (const p of problems) console.log("  - " + p);
} else {
  console.log("Integrity OK. Total rows:", all.length);
}

// Build worksheet rows (header + data).
const aoa = [
  [
    "Semester",
    "Subject",
    "Grade",
    "Current Comment",
    "Refined Comment (proposed)",
  ],
];
for (const r of all) {
  aoa.push([
    `Sem ${ROMAN[r.semester]}`,
    r._subjectName,
    r.grade,
    r.original,
    r.refined,
  ]);
}

const ws = XLSX.utils.aoa_to_sheet(aoa);
ws["!cols"] = [
  { wch: 10 },
  { wch: 16 },
  { wch: 7 },
  { wch: 70 },
  { wch: 80 },
];
ws["!freeze"] = { xSplit: 0, ySplit: 1 };
ws["!autofilter"] = { ref: `A1:E${aoa.length}` };

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Comment Bank (Refined)");

const outName = "ACFM_Academic_Report_Comment_Bank_Refined.xlsx";
const outPath = path.join(root, outName);
XLSX.writeFile(wb, outPath);
console.log("Wrote", outPath, "with", all.length, "data rows.");

// Also drop a copy on the Desktop for easy sending.
try {
  const desktop = path.join(require("os").homedir(), "Desktop", outName);
  XLSX.writeFile(wb, desktop);
  console.log("Also wrote", desktop);
} catch (e) {
  console.log("Desktop copy skipped:", e.message);
}
