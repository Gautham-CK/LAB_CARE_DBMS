-- ============================================================
-- ACID DEMO  (run each numbered block separately in Supabase SQL Editor)
-- Uses your sample router: asset_tag = 'LAB-TEST-002'
-- ============================================================

-- ---------------- A = ATOMICITY: "all or nothing" ----------------
-- Block A1: changes inside a transaction can be undone with ROLLBACK
BEGIN;
  UPDATE equipment SET status = 'FAULTY' WHERE asset_tag = 'LAB-TEST-002';
  SELECT asset_tag, status AS status_inside_transaction FROM equipment WHERE asset_tag = 'LAB-TEST-002';
ROLLBACK;   -- undo everything
SELECT asset_tag, status AS status_after_rollback FROM equipment WHERE asset_tag = 'LAB-TEST-002';
-- Expected: status returns to what it was before. Nothing was saved.

-- Block A2: a function is atomic by itself.
-- Use a real PENDING complaint id and a technician id that does NOT exist (999999):
--   SELECT * FROM fn_assign_complaint(<pending_complaint_id>, 999999, 1);
-- Expected: ERROR, and the complaint is STILL 'PENDING' - no half-finished assignment.

-- ---------------- C = CONSISTENCY: database never breaks its own rules ----------------
-- Run these ONE AT A TIME. Every one must give an ERROR - that is the proof.

-- C1: CHECK constraint (capacity must be > 0)
INSERT INTO lab (lab_name, building, floor, capacity) VALUES ('Bad Lab', 'A', 1, -5);

-- C2: CHECK constraint (invalid equipment status)
UPDATE equipment SET status = 'BROKEN' WHERE asset_tag = 'LAB-TEST-002';

-- C3: FOREIGN KEY (equipment in a lab that does not exist)
INSERT INTO equipment (lab_id, category_id, asset_tag, equipment_name)
VALUES (99999, 1, 'BAD-FK-001', 'Ghost Device');

-- C4: UNIQUE constraint (same asset_tag twice)
INSERT INTO equipment (lab_id, category_id, asset_tag, equipment_name)
SELECT lab_id, category_id, asset_tag, 'Duplicate' FROM equipment WHERE asset_tag = 'LAB-TEST-002';

-- C5: NOT NULL (user without name)
INSERT INTO labcare_user (name, email, role) VALUES (NULL, 'nobody@x.com', 'STUDENT');

-- C6: TRIGGER rule (RETIRED equipment cannot be revived)
BEGIN;
  UPDATE equipment SET status = 'RETIRED' WHERE asset_tag = 'LAB-TEST-002';
  UPDATE equipment SET status = 'WORKING' WHERE asset_tag = 'LAB-TEST-002';  -- ERROR here
ROLLBACK;

-- ---------------- I = ISOLATION: transactions don't disturb each other ----------------
-- Open TWO SQL Editor tabs (Session A and Session B). Default level in PostgreSQL = READ COMMITTED.
--
-- Session A:
--   BEGIN;
--   UPDATE equipment SET brand = 'ISOLATION-TEST' WHERE asset_tag = 'LAB-TEST-002';
--   -- (do NOT commit yet)
--
-- Session B:
--   SELECT brand FROM equipment WHERE asset_tag = 'LAB-TEST-002';
--   -- Still shows the OLD brand: B cannot see A's uncommitted change (no "dirty read").
--   UPDATE equipment SET brand = 'B-WANTS-IT' WHERE asset_tag = 'LAB-TEST-002';
--   -- This WAITS (blocked by A's row lock).
--
-- Session A:
--   COMMIT;      -- now B's update continues
-- Session B:
--   COMMIT;
--
-- Reset your data afterwards:  UPDATE equipment SET brand = 'TP-Link' WHERE asset_tag = 'LAB-TEST-002';
-- Check the level:             SHOW transaction_isolation;
-- Stricter level example:      BEGIN ISOLATION LEVEL REPEATABLE READ; ... COMMIT;
-- (Note: if the editor tabs share one connection you may not see blocking; explain it in your report
--  using the steps above, or run the same two sessions in psql.)

-- ---------------- D = DURABILITY: committed data survives crashes ----------------
-- D1: commit a change
BEGIN;
  UPDATE equipment SET brand = 'TP-Link' WHERE asset_tag = 'LAB-TEST-002';
COMMIT;   -- from now on it is written to the Write-Ahead Log (WAL) on disk

-- D2: show the settings that guarantee durability
SHOW synchronous_commit;            -- 'on' = COMMIT returns only after WAL is safely flushed
SELECT pg_current_wal_lsn() AS wal_position_now;   -- WAL position moves forward with every commit

-- D3: proof from the backend: POST a new lab with the API, STOP the server (Ctrl+C),
--     START it again, then GET /api/labs -> the lab is still there.
