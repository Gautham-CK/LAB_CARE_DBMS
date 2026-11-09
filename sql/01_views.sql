-- ============================================================
-- STEP 1: VIEWS (a view = a saved SELECT query that acts like a table)
-- These use JOINs so you can demonstrate relationships.
-- ============================================================

-- 1) Equipment with lab name and category name (INNER JOIN x2)
CREATE OR REPLACE VIEW v_equipment_details WITH (security_invoker = true) AS
SELECT e.equipment_id,
       e.asset_tag,
       e.equipment_name,
       e.brand,
       e.status,
       e.purchase_date,
       l.lab_id,
       l.lab_name,
       l.building,
       c.category_id,
       c.category_name
FROM equipment e
JOIN lab l      ON l.lab_id = e.lab_id
JOIN category c ON c.category_id = e.category_id;

-- 2) Pending complaints with equipment + reporter details
CREATE OR REPLACE VIEW v_pending_complaints WITH (security_invoker = true) AS
SELECT cp.complaint_id,
       cp.issue_type,
       cp.description,
       cp.priority,
       cp.status,
       cp.complaint_date,
       e.equipment_id,
       e.asset_tag,
       e.equipment_name,
       l.lab_name,
       u.user_id   AS reported_by_id,
       u.name      AS reported_by
FROM complaint cp
JOIN equipment e     ON e.equipment_id = cp.equipment_id
JOIN lab l           ON l.lab_id = e.lab_id
JOIN labcare_user u  ON u.user_id = cp.user_id
WHERE cp.status = 'PENDING';

-- 3) Technician assignments (labcare_user is joined TWICE: technician and admin)
CREATE OR REPLACE VIEW v_technician_assignments WITH (security_invoker = true) AS
SELECT a.assignment_id,
       a.status          AS assignment_status,
       a.assigned_date,
       cp.complaint_id,
       cp.issue_type,
       cp.priority,
       cp.status         AS complaint_status,
       e.equipment_id,
       e.asset_tag,
       e.equipment_name,
       t.user_id         AS technician_id,
       t.name            AS technician_name,
       ad.user_id        AS assigned_by_id,
       ad.name           AS assigned_by_name
FROM assignment a
JOIN complaint cp     ON cp.complaint_id = a.complaint_id
JOIN equipment e      ON e.equipment_id = cp.equipment_id
JOIN labcare_user t   ON t.user_id = a.technician_id
JOIN labcare_user ad  ON ad.user_id = a.assigned_by;

-- 4) Repair history view is created in the NEXT step once repair columns are known.

NOTIFY pgrst, 'reload schema';  -- tells Supabase API to notice the new views
