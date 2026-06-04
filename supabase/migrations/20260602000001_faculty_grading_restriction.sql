-- Faculty grading restriction + mark locking (ACFM meeting, 01 Jun 2026).
--
-- Two coupled client requirements:
--   1. Per-subject faculty restriction — each teacher grades only the subject(s)
--      they are assigned to in a class ("Reema is faculty of Editing only").
--   2. Mark locking — a grade auto-locks when saved; only an admin can unlock or
--      edit it afterward ("once they lock it, no one can edit unless admin").
--
-- This tightens the deliberately-broad RLS shipped with the grading module
-- (20260508000000), which let any teacher write any grade.

-- 1. Which subjects a teacher may grade in a given class.
CREATE TABLE IF NOT EXISTS public.class_teacher_subjects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id    uuid NOT NULL REFERENCES public.classes(id)  ON DELETE CASCADE,
  teacher_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id  uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_id, teacher_id, subject_id)
);

CREATE INDEX IF NOT EXISTS class_teacher_subjects_lookup_idx
  ON public.class_teacher_subjects (teacher_id, class_id, subject_id);

-- 2. Lock state on each grade. Teacher writes auto-lock (see trigger below);
--    admins control the flag explicitly to unlock for re-grading.
ALTER TABLE public.student_grades
  ADD COLUMN IF NOT EXISTS locked    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Helpers (SECURITY DEFINER so policies can read profiles regardless of the
--    caller's own row visibility).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'
  );
$$;

-- True when the current user is assigned to grade p_subject for a class that
-- p_student belongs to.
CREATE OR REPLACE FUNCTION public.teacher_can_grade(p_student uuid, p_subject uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.class_teacher_subjects cts
    JOIN public.class_students cs ON cs.class_id = cts.class_id
    WHERE cts.teacher_id = auth.uid()
      AND cts.subject_id = p_subject
      AND cs.student_id  = p_student
  );
$$;

-- 4. Auto-lock trigger. The server, not the client, decides the lock state:
--    teacher writes are always locked; admins keep whatever they set.
CREATE OR REPLACE FUNCTION public.enforce_grade_lock()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;  -- admin controls locked/locked_by/locked_at explicitly
  END IF;
  NEW.locked    := true;
  NEW.locked_by := auth.uid();
  NEW.locked_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS student_grades_enforce_lock ON public.student_grades;
CREATE TRIGGER student_grades_enforce_lock
  BEFORE INSERT OR UPDATE ON public.student_grades
  FOR EACH ROW EXECUTE FUNCTION public.enforce_grade_lock();

-- 5. RLS for the new mapping table. Admins manage it; teachers read their own.
ALTER TABLE public.class_teacher_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cts_select" ON public.class_teacher_subjects;
CREATE POLICY "cts_select"
  ON public.class_teacher_subjects FOR SELECT
  TO authenticated
  USING (teacher_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "cts_insert" ON public.class_teacher_subjects;
CREATE POLICY "cts_insert"
  ON public.class_teacher_subjects FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "cts_update" ON public.class_teacher_subjects;
CREATE POLICY "cts_update"
  ON public.class_teacher_subjects FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "cts_delete" ON public.class_teacher_subjects;
CREATE POLICY "cts_delete"
  ON public.class_teacher_subjects FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 6. Tighten student_grades write policies. SELECT and DELETE keep their prior
--    behaviour (read: student-own or teacher/admin; delete: admin only). INSERT
--    and UPDATE now require the teacher to be assigned to that subject, and
--    UPDATE additionally blocks locked rows for non-admins.
DROP POLICY IF EXISTS "student_grades_insert" ON public.student_grades;
CREATE POLICY "student_grades_insert"
  ON public.student_grades FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin()
    OR public.teacher_can_grade(student_id, subject_id)
  );

DROP POLICY IF EXISTS "student_grades_update" ON public.student_grades;
CREATE POLICY "student_grades_update"
  ON public.student_grades FOR UPDATE
  TO authenticated
  USING (
    -- existing row: admins always; teachers only their subject AND while unlocked
    public.is_admin()
    OR (public.teacher_can_grade(student_id, subject_id) AND locked = false)
  )
  WITH CHECK (
    -- new row: admins always; teachers must still own the subject
    public.is_admin()
    OR public.teacher_can_grade(student_id, subject_id)
  );
