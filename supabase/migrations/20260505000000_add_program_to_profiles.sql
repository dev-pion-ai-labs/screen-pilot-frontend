-- Add a `program` column to profiles so admins can record whether a
-- student is enrolled in BA or MA. Nullable because non-student roles
-- (teacher / admin) have no program.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS program text
    CHECK (program IS NULL OR program IN ('BA', 'MA'));
