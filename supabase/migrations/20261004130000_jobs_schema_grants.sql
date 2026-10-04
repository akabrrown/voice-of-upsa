-- Expose the jobs schema to PostgREST roles; RLS policies still gate row access.
GRANT USAGE ON SCHEMA jobs TO anon, authenticated;
GRANT SELECT ON jobs.job_categories TO anon, authenticated;
GRANT SELECT ON jobs.postings TO anon, authenticated;
GRANT INSERT, UPDATE ON jobs.postings TO authenticated;
GRANT SELECT, INSERT ON jobs.job_reports TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA jobs TO service_role;

ALTER ROLE authenticator SET pgrst.db_schemas = 'public, storage, graphql_public, jobs';
NOTIFY pgrst, 'reload config';
