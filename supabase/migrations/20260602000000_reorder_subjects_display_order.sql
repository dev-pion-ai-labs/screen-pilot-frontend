-- Reorder subject display_order so the common subjects (Direction, Production)
-- lead, followed by Screenwriting and the remaining specialisation tracks.
-- Per Lead's feedback in the Academic Report review (01 Jun 2026): Direction is
-- always the first subject, Production second, then Screenwriting, because
-- Screenwriting is a specialisation while Direction and Production are common to
-- all tracks. Keeps the DB list consistent with the on-screen / PDF column order.

UPDATE public.subjects SET display_order = 1 WHERE code = 'direction';
UPDATE public.subjects SET display_order = 2 WHERE code = 'production';
UPDATE public.subjects SET display_order = 3 WHERE code = 'screenwriting';
UPDATE public.subjects SET display_order = 4 WHERE code = 'cinematography';
UPDATE public.subjects SET display_order = 5 WHERE code = 'sound_design';
UPDATE public.subjects SET display_order = 6 WHERE code = 'editing';
UPDATE public.subjects SET display_order = 7 WHERE code = 'vfx';
