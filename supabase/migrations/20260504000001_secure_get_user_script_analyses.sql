-- Tighten get_user_script_analyses so it can't be called for arbitrary
-- user IDs (IDOR). The function is SECURITY DEFINER, so RLS does not
-- protect it; we now enforce auth.uid() = user_uuid inside the function
-- and revoke EXECUTE from anonymous callers.

CREATE OR REPLACE FUNCTION get_user_script_analyses(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  script_content TEXT,
  script_url TEXT,
  analysis_result JSONB,
  chat_messages JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() <> user_uuid THEN
    RAISE EXCEPTION 'Forbidden: cannot read another user''s script analyses';
  END IF;

  RETURN QUERY
  SELECT
    sa.id,
    sa.user_id,
    sa.title,
    sa.script_content,
    sa.script_url,
    sa.analysis_result,
    sa.chat_messages,
    sa.created_at,
    sa.updated_at
  FROM script_analyses sa
  WHERE sa.user_id = user_uuid
  ORDER BY sa.updated_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION get_user_script_analyses(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION get_user_script_analyses(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION get_user_script_analyses(UUID) TO authenticated;
