-- Grant DML permissions to authenticated role
-- RLS controls which rows, GRANT controls if the role can operate at all
-- Applied manually via MCP on 2026-07-02, now formalized in migrations
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE assessment_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE skill_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE training_plans TO authenticated;
GRANT SELECT ON TABLE exercises TO authenticated;
GRANT SELECT ON TABLE exercises TO anon;
