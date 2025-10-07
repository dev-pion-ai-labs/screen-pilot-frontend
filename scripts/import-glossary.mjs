import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { config as loadEnv } from 'dotenv';

// Usage:
// node scripts/import-glossary.mjs "D:\\ACFM\\SCREEN_SCRIBE_PILOT\\screen-scribe-pilot\\public\\Rohit's data - Sheet1.csv" ADDED_BY_UUID
// Requires env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

// Load env from .env.local if present, else .env
const root = process.cwd();
const envLocalPath = path.join(root, '.env.local');
const envPath = path.join(root, '.env');
if (fs.existsSync(envLocalPath)) {
  loadEnv({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  loadEnv({ path: envPath });
} else {
  loadEnv();
}

function parseCsvWithMultiline(content) {
  const lines = content.split(/\r?\n/);
  const rows = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (inQuotes) {
      current += '\n' + line;
      // toggle quotes count if balanced
      const quoteCount = (line.match(/"/g) || []).length;
      if (quoteCount % 2 === 1) {
        inQuotes = !inQuotes;
      }
      if (!inQuotes) {
        rows.push(current);
        current = '';
      }
      continue;
    }
    const quoteCount = (line.match(/"/g) || []).length;
    if (quoteCount % 2 === 1) {
      inQuotes = true;
      current = line;
    } else {
      rows.push(line);
    }
  }
  if (current) rows.push(current);

  // simple CSV split respecting quotes
  const parsed = rows.map((row) => {
    const result = [];
    let field = '';
    let quoted = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (quoted && row[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = !quoted;
        }
      } else if (ch === ',' && !quoted) {
        result.push(field);
        field = '';
      } else {
        field += ch;
      }
    }
    result.push(field);
    return result;
  });

  return parsed;
}

function normalizeExamplesCell(cell) {
  if (!cell) return [];
  const trimmed = cell.trim();
  // Replace single quotes with double quotes for JSON-like lists
  if (/^\s*\[.*\]\s*$/.test(trimmed)) {
    const jsonish = trimmed.replace(/'([^']*)'/g, (_, s) => JSON.stringify(s));
    try {
      const arr = JSON.parse(jsonish);
      return Array.isArray(arr) ? arr.map(String) : [];
    } catch {
      // fallthrough
    }
  }
  // Split on semicolon or pipe if not JSON
  return trimmed
    .split(/[;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const [, , csvPath, addedBy] = process.argv;
  if (!csvPath) {
    console.error('Path to CSV is required.');
    process.exit(1);
  }
  if (!addedBy) {
    console.error('added_by UUID is required as second argument.');
    process.exit(1);
  }

  // Support multiple common env names
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env.');
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf8');
  const parsed = parseCsvWithMultiline(content);
  if (parsed.length === 0) {
    console.error('Empty CSV.');
    process.exit(1);
  }
  const header = parsed[0].map((h) => h.trim().toLowerCase());
  const colWord = header.indexOf('word');
  const colMeaning = header.indexOf('meaning');
  const colExamples = header.indexOf('examples');
  if (colWord === -1 || colMeaning === -1) {
    console.error('CSV must have headers: word, meaning[, examples]');
    process.exit(1);
  }

  const rows = [];
  for (let i = 1; i < parsed.length; i++) {
    const cols = parsed[i];
    const word = (cols[colWord] || '').trim();
    const meaning = (cols[colMeaning] || '').trim();
    const examplesCell = colExamples !== -1 ? cols[colExamples] : '';
    if (!word || !meaning) continue;
    const examples = normalizeExamplesCell(examplesCell);
    rows.push({ word, meaning, examples, added_by: addedBy });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const CHUNK = 300;
  let success = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error, count } = await supabase
      .from('glossary')
      .upsert(chunk, { onConflict: 'word', ignoreDuplicates: false, count: 'exact' });
    if (error) {
      console.error('Chunk failed:', error.message);
      // try row by row for diagnostics
      for (const r of chunk) {
        const { error: e } = await supabase
          .from('glossary')
          .upsert(r, { onConflict: 'word', ignoreDuplicates: false });
        if (e) console.error(`Failed '${r.word}':`, e.message);
        else success++;
      }
    } else {
      success += chunk.length;
    }
    console.log(`Processed ${Math.min(i + CHUNK, rows.length)} / ${rows.length}`);
  }

  console.log(`Done. Upserted ${success} rows.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


