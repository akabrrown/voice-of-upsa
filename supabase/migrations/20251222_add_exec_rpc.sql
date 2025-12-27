-- Create a secure exec function for administrative diagnostics
-- Security: DEFINER (runs with privileges of the creator, which should be an admin)
-- Access: Only executable by service_role (by REVOKE ALL/GRANT)

CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE 'SELECT row_to_json(t) FROM (' || sql || ') t';
END;
$$;

-- Restrict access to service_role only
REVOKE ALL ON FUNCTION exec(text) FROM public;
REVOKE ALL ON FUNCTION exec(text) FROM anon;
REVOKE ALL ON FUNCTION exec(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION exec(text) TO service_role;
