-- Add a `program` column to classes so a class explicitly belongs to a
-- program (BA or MA). Nullable to keep existing rows valid; admin can
-- backfill via the class edit dialog.
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS program text
    CHECK (program IS NULL OR program IN ('BA', 'MA'));
