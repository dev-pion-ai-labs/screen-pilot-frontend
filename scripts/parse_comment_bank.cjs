// One-off helper: parse the comment_bank seed SQL files into structured JSON
// so the comments can be refined and exported to Excel for Lead approval.
const fs = require("fs");
const path = require("path");

const files = [
  "supabase/migrations/20260508000001_seed_comment_bank_sem1_sem2.sql",
  "supabase/migrations/20260509000001_seed_comment_bank_sem3_sem6.sql",
];

const rowRe = /^\s*\((\d+),\s*'([^']+)',\s*'([A-D])',\s*'(.*)'\),?\s*$/;

const rows = [];
for (const f of files) {
  const text = fs.readFileSync(path.resolve(f), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(rowRe);
    if (!m) continue;
    rows.push({
      semester: Number(m[1]),
      subject: m[2],
      grade: m[3],
      body: m[4].replace(/''/g, "'"),
    });
  }
}

fs.writeFileSync(
  path.resolve("scripts/comment_bank_parsed.json"),
  JSON.stringify(rows, null, 2),
);

// Quick distribution report.
const dist = {};
for (const r of rows) {
  const k = `${r.subject}`;
  dist[k] = dist[k] || { total: 0, sems: new Set(), grades: {} };
  dist[k].total++;
  dist[k].sems.add(r.semester);
  dist[k].grades[r.grade] = (dist[k].grades[r.grade] || 0) + 1;
}
console.log("Total rows:", rows.length);
for (const [k, v] of Object.entries(dist)) {
  console.log(
    `${k.padEnd(16)} total=${v.total}  sems=[${[...v.sems].sort().join(",")}]  grades=${JSON.stringify(v.grades)}`,
  );
}
