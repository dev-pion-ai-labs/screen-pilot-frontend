-- Transactional cascade delete for a user account.
-- Runs as SECURITY DEFINER so it can wipe rows the caller might not own,
-- but blocks anyone except an admin from invoking it.
-- Each table delete is wrapped in its own BEGIN/EXCEPTION block so the
-- function still works in environments where some optional tables
-- (notes, quizzes, glossary, etc.) have not yet been provisioned.

CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  target_profile profiles%ROWTYPE;
BEGIN
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  SELECT * INTO target_profile FROM profiles WHERE id = target_user_id;
  IF target_profile.id IS NULL THEN
    RETURN;
  END IF;

  BEGIN
    INSERT INTO deleted_users (id, email, full_name, role, created_at, updated_at, deleted_at)
    VALUES (
      target_profile.id,
      target_profile.email,
      target_profile.full_name,
      target_profile.role,
      target_profile.created_at,
      target_profile.updated_at,
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN DELETE FROM submissions WHERE student_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM submissions WHERE assignment_id IN (SELECT id FROM assignments WHERE teacher_id = target_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM assignment_enrollments WHERE student_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM assignment_enrollments WHERE assignment_id IN (SELECT id FROM assignments WHERE teacher_id = target_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM assignments WHERE teacher_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN DELETE FROM class_students WHERE student_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM class_teachers WHERE teacher_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN DELETE FROM chats WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM quiz_chat_messages WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM quiz_chats WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN DELETE FROM quiz_submissions WHERE student_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM quiz_enrollments WHERE student_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM quiz_submissions WHERE quiz_id IN (SELECT id FROM quizzes WHERE teacher_id = target_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM quiz_enrollments WHERE quiz_id IN (SELECT id FROM quizzes WHERE teacher_id = target_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM quiz_questions WHERE quiz_id IN (SELECT id FROM quizzes WHERE teacher_id = target_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM quizzes WHERE teacher_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN DELETE FROM note_enrollments WHERE student_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM note_enrollments WHERE note_id IN (SELECT id FROM notes WHERE teacher_id = target_user_id); EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM notes WHERE teacher_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN DELETE FROM script_reviews WHERE reviewer_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM script_reviews WHERE student_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM script_notifications WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM script_analyses WHERE user_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  BEGIN DELETE FROM glossary_requests WHERE student_id = target_user_id OR teacher_id = target_user_id; EXCEPTION WHEN undefined_table THEN NULL; END;

  DELETE FROM profiles WHERE id = target_user_id;
END;
$$;

REVOKE ALL ON FUNCTION admin_delete_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_delete_user(UUID) TO authenticated;
