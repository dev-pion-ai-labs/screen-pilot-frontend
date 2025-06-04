
-- Create function to get user script analyses
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
AS $$
BEGIN
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
