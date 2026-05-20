-- Grading & Comments module — Phase 1 (Foundation semesters: BA Sem I & II).
--
-- Three tables:
--   subjects       — reference list of subjects (incl. VFX for Phase 2)
--   comment_bank   — pre-written comments keyed by (semester, subject, grade)
--   student_grades — one row per (student × semester × subject)
--
-- Specialisation-only subject (VFX) is included up front so the schema is
-- ready for Sem III–VI without another migration. Phase 1 only seeds and
-- grades the six foundation subjects.

CREATE TABLE IF NOT EXISTS public.subjects (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  display_order smallint NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.subjects (code, name, display_order) VALUES
  ('screenwriting',  'Screenwriting',  1),
  ('direction',      'Direction',      2),
  ('production',     'Production',     3),
  ('cinematography', 'Cinematography', 4),
  ('sound_design',   'Sound Design',   5),
  ('editing',        'Editing',        6),
  ('vfx',            'VFX',            7)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.comment_bank (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  semester    smallint NOT NULL CHECK (semester BETWEEN 1 AND 6),
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  grade       char(1) NOT NULL CHECK (grade IN ('A','B','C','D')),
  body        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS comment_bank_lookup_idx
  ON public.comment_bank (semester, subject_id, grade);

CREATE TABLE IF NOT EXISTS public.student_grades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  semester    smallint NOT NULL CHECK (semester BETWEEN 1 AND 6),
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  grade       char(1) NOT NULL CHECK (grade IN ('A','B','C','D')),
  comment_id  uuid NOT NULL REFERENCES public.comment_bank(id) ON DELETE RESTRICT,
  teacher_id  uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, semester, subject_id)
);

CREATE INDEX IF NOT EXISTS student_grades_student_idx
  ON public.student_grades (student_id);

CREATE OR REPLACE FUNCTION public.grading_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_grades_touch_updated_at ON public.student_grades;
CREATE TRIGGER student_grades_touch_updated_at
  BEFORE UPDATE ON public.student_grades
  FOR EACH ROW EXECUTE FUNCTION public.grading_touch_updated_at();

-- Row-level security. subjects + comment_bank are reference data, readable
-- by any signed-in user. student_grades: teachers/admins can read+write any
-- row (broad for now — will tighten to "teacher must be assigned to that
-- student's class" once that mapping is needed). Students can read their own.
ALTER TABLE public.subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_bank    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_grades  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subjects_read_authenticated"
  ON public.subjects FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "comment_bank_read_authenticated"
  ON public.comment_bank FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "student_grades_select"
  ON public.student_grades FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "student_grades_insert"
  ON public.student_grades FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "student_grades_update"
  ON public.student_grades FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "student_grades_delete"
  ON public.student_grades FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
