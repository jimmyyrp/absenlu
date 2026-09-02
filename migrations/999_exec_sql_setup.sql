-- ============================================================================
-- EXEC_SQL RPC FUNCTION — One-time setup for migration system
-- ============================================================================
-- Jalankan sekali ini di Supabase Dashboard → SQL Editor
-- Setelah itu, npm run db:migrate:api akan bisa menjalankan raw SQL via API
-- ============================================================================

CREATE OR REPLACE FUNCTION exec_sql(query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
  rec RECORD;
  rows_affected INT;
BEGIN
  -- Execute the dynamic SQL
  EXECUTE query;

  -- Try to get rows if it was a SELECT
  BEGIN
    EXECUTE query INTO result;
    RETURN result;
  EXCEPTION WHEN OTHERS THEN
    -- Not a SELECT query, return rows_affected info
    GET DIAGNOSTICS rows_affected = ROW_COUNT;
    RETURN jsonb_build_object('rows_affected', rows_affected, 'success', true);
  END;
END;
$$;

-- Also create a version that returns query results as a table
CREATE OR REPLACE FUNCTION exec_sql_rows(query TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT to_jsonb(t) FROM (' || query || ') t';
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION exec_sql_rows(TEXT) TO anon, authenticated;
