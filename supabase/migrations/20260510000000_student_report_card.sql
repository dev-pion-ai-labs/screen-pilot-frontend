-- Phase 3 — Final report card.
--
-- The per-cell grades + comments are already in student_grades (built in
-- Phases 1 & 2). This table stores only the *report card extras* that aren't
-- derivable from those rows: the optional portfolio URL and the three
-- narrative summary comments (Creative / Technical / Professional) that
-- teachers write per student.
--
-- Final % and Final Grade are NOT stored — they're computed on read from
-- student_grades using the Excel formula:
--   pct  = (A*4 + B*3 + C*2 + D*1) / cell_count * 25
--   grade = pct >= 85 ? A : pct >= 70 ? B : pct >= 50 ? C : D

CREATE TABLE IF NOT EXISTS public.student_report_card (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  portfolio_url         text,
  creative_comment      text,
  technical_comment     text,
  professional_comment  text,
  updated_by            uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS student_report_card_student_idx
  ON public.student_report_card (student_id);

DROP TRIGGER IF EXISTS student_report_card_touch_updated_at ON public.student_report_card;
CREATE TRIGGER student_report_card_touch_updated_at
  BEFORE UPDATE ON public.student_report_card
  FOR EACH ROW EXECUTE FUNCTION public.grading_touch_updated_at();

ALTER TABLE public.student_report_card ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_card_select" ON public.student_report_card;
CREATE POLICY "report_card_select"
  ON public.student_report_card FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS "report_card_insert" ON public.student_report_card;
CREATE POLICY "report_card_insert"
  ON public.student_report_card FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS "report_card_update" ON public.student_report_card;
CREATE POLICY "report_card_update"
  ON public.student_report_card FOR UPDATE
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

DROP POLICY IF EXISTS "report_card_delete" ON public.student_report_card;
CREATE POLICY "report_card_delete"
  ON public.student_report_card FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
