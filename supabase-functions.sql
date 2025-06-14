-- Create the match_memories function for semantic search
CREATE OR REPLACE FUNCTION match_memories(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id text
)
RETURNS TABLE (
  id uuid,
  user_id text,
  category text,
  key text,
  value text,
  display_text text,
  importance int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    long_term_memory.id,
    long_term_memory.user_id,
    long_term_memory.category,
    long_term_memory.key,
    long_term_memory.value,
    long_term_memory.display_text,
    long_term_memory.importance,
    1 - (long_term_memory.embedding <=> query_embedding) AS similarity
  FROM long_term_memory
  WHERE long_term_memory.user_id = match_memories.user_id
    AND 1 - (long_term_memory.embedding <=> query_embedding) > match_threshold
  ORDER BY long_term_memory.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;