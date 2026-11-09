-- ============================================================
-- STEP 2: FUNCTIONS (PostgreSQL's version of stored procedures)
-- A function runs INSIDE one transaction: if anything fails,
-- EVERYTHING it did is rolled back automatically (Atomicity!).
-- ============================================================

-- ---------- 1) ASSIGN A COMPLAINT TO A TECHNICIAN ----------
CREATE OR REPLACE FUNCTION fn_assign_complaint(
    p_complaint_id  BIGINT,
    p_technician_id BIGINT,
    p_assigned_by   BIGINT
) RETURNS assignment
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status VARCHAR;
    v_row    assignment;
BEGIN
    -- lock the complaint row so two admins can't assign it at the same time
    SELECT status INTO v_status FROM complaint WHERE complaint_id = p_complaint_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Complaint % does not exist', p_complaint_id;
    END IF;
    IF v_status <> 'PENDING' THEN
        RAISE EXCEPTION 'Complaint % is % - only PENDING complaints can be assigned', p_complaint_id, v_status;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM labcare_user WHERE user_id = p_technician_id) THEN
        RAISE EXCEPTION 'Technician (user) % does not exist', p_technician_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM labcare_user WHERE user_id = p_assigned_by) THEN
        RAISE EXCEPTION 'Admin (user) % does not exist', p_assigned_by;
    END IF;

    INSERT INTO assignment (complaint_id, technician_id, assigned_by, assigned_date, status)
    VALUES (p_complaint_id, p_technician_id, p_assigned_by, now(), 'ACTIVE')
    RETURNING * INTO v_row;
    -- (a trigger then sets the complaint status to ASSIGNED - see 03_triggers.sql)

    RETURN v_row;
END;
$$;

-- ---------- 2) UPDATE EQUIPMENT STATUS ----------
CREATE OR REPLACE FUNCTION fn_update_equipment_status(
    p_equipment_id BIGINT,
    p_status       VARCHAR
) RETURNS equipment
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_row equipment;
BEGIN
    IF p_status NOT IN ('WORKING','FAULTY','UNDER_REPAIR','RETIRED') THEN
        RAISE EXCEPTION 'Invalid status %. Allowed: WORKING, FAULTY, UNDER_REPAIR, RETIRED', p_status;
    END IF;

    UPDATE equipment SET status = p_status
    WHERE equipment_id = p_equipment_id
    RETURNING * INTO v_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipment % does not exist', p_equipment_id;
    END IF;

    RETURN v_row;
END;
$$;

-- ---------- 3) COMPLETE AN ASSIGNMENT (finish the repair work) ----------
-- Assignment -> COMPLETED. Triggers then set complaint -> RESOLVED and equipment -> WORKING.
CREATE OR REPLACE FUNCTION fn_complete_assignment(p_assignment_id BIGINT)
RETURNS assignment
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_status VARCHAR;
    v_row    assignment;
BEGIN
    SELECT status INTO v_status FROM assignment WHERE assignment_id = p_assignment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment % does not exist', p_assignment_id;
    END IF;
    IF v_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'Assignment % is % - only ACTIVE assignments can be completed', p_assignment_id, v_status;
    END IF;

    UPDATE assignment SET status = 'COMPLETED'
    WHERE assignment_id = p_assignment_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$;

-- ---------- 4) REPORT FUNCTIONS ----------
-- complaints per status
CREATE OR REPLACE FUNCTION fn_complaint_summary()
RETURNS TABLE (status_name VARCHAR, total BIGINT)
LANGUAGE sql STABLE SET search_path = public
AS $$
    SELECT cp.status::varchar, COUNT(*)
    FROM complaint cp
    GROUP BY cp.status
    ORDER BY COUNT(*) DESC;
$$;

-- equipment per status
CREATE OR REPLACE FUNCTION fn_equipment_status_report()
RETURNS TABLE (status_name VARCHAR, total BIGINT)
LANGUAGE sql STABLE SET search_path = public
AS $$
    SELECT e.status::varchar, COUNT(*)
    FROM equipment e
    GROUP BY e.status
    ORDER BY COUNT(*) DESC;
$$;

-- per-lab report (LEFT JOIN so labs with no equipment still appear)
CREATE OR REPLACE FUNCTION fn_lab_report()
RETURNS TABLE (lab_id BIGINT, lab_name VARCHAR, total_equipment BIGINT, working BIGINT, faulty BIGINT, under_repair BIGINT)
LANGUAGE sql STABLE SET search_path = public
AS $$
    SELECT l.lab_id,
           l.lab_name::varchar,
           COUNT(e.equipment_id),
           COUNT(*) FILTER (WHERE e.status = 'WORKING'),
           COUNT(*) FILTER (WHERE e.status = 'FAULTY'),
           COUNT(*) FILTER (WHERE e.status = 'UNDER_REPAIR')
    FROM lab l
    LEFT JOIN equipment e ON e.lab_id = l.lab_id
    GROUP BY l.lab_id, l.lab_name
    ORDER BY l.lab_id;
$$;

NOTIFY pgrst, 'reload schema';
