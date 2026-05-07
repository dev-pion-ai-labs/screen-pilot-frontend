-- Allow a single submission to carry multiple attachments (logline, synopsis,
-- screenplay, floor plan, shot divisions, crew roles, etc.). Each entry is a
-- JSON object: { category, file_name, file_path, script_url, size, content_type }.
-- The existing `file_path` / `file_name` / `script_url` columns continue to point
-- at the primary file so AI evaluation and download links keep working without
-- changes to the agents service.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Mark assignments that are semester-end assessments so faculty can manage them
-- under a dedicated Sem-End tab while still sharing the submissions / grading
-- pipeline with regular assignments.
ALTER TABLE public.assignments
  ADD COLUMN IF NOT EXISTS is_sem_end boolean NOT NULL DEFAULT false;
