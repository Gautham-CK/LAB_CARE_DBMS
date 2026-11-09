-- ============================================================
-- STEP 0: INSPECT YOUR REAL DATABASE (run each query separately)
-- Supabase Dashboard -> SQL Editor -> paste -> Run
-- ============================================================

-- 1) Exact columns of ALL 8 tables  (look at repair and maintenance_log!)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('labcare_user','lab','category','equipment','complaint',
                     'assignment','repair','maintenance_log')
ORDER BY table_name, ordinal_position;

-- 2) All CHECK constraints (shows allowed roles, priorities, statuses)
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'c' AND connamespace = 'public'::regnamespace
ORDER BY 1;

-- 3) All FOREIGN KEYS (shows how repair / maintenance_log connect to other tables)
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'public'::regnamespace
ORDER BY 1;

-- 4) Which users already exist? (avoid creating duplicates)
SELECT user_id, name, email, role FROM labcare_user ORDER BY user_id;

-- 5) Current complaints and assignments
SELECT complaint_id, equipment_id, user_id, priority, status FROM complaint ORDER BY complaint_id;
SELECT * FROM assignment ORDER BY assignment_id;

-- 6) Is Row Level Security (RLS) on? (rowsecurity = true means the backend may be blocked)
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
