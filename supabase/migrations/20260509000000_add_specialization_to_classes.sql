-- Add a `specialization` column to classes. Sem 1-2 classes don't have a
-- specialisation (foundation), Sem 3+ classes pick one of the five tracks.
-- Direction and Production stay common subjects across all tracks, so they
-- are NOT specialisations here.
--
-- Nullable so existing classes (Sem 1-2 or pre-spec rows) stay valid. The
-- grading UI treats null Sem 3+ classes as "needs admin to set".
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS specialization text
    CHECK (
      specialization IS NULL
      OR specialization IN (
        'screenwriting',
        'cinematography',
        'editing',
        'sound_design',
        'vfx'
      )
    );
