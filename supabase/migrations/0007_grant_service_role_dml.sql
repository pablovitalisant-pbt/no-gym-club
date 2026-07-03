-- Grant DML permissions to service_role
-- Required for admin scripts that use the service_role key
-- The service_role bypasses RLS but still needs table-level permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE assessment_results TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workout_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE skill_progress TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE training_plans TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE exercises TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE sport_science_corpus TO service_role;
