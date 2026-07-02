-- Otorgar permisos DML al rol authenticated en todas las tablas de la app
-- RLS controla qué filas, GRANT controla si el rol puede operar
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE assessment_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE workout_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE skill_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE training_plans TO authenticated;
GRANT SELECT ON TABLE exercises TO authenticated;
GRANT SELECT ON TABLE exercises TO anon;
