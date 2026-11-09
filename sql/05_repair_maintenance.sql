-- ============================================================
-- STEP 5: REPAIR + MAINTENANCE_LOG  (run AFTER 01, 02, 03)
-- Written against your real columns:
--   repair(repair_id, complaint_id, technician_id, repair_date, repair_description, repair_cost, repair_status)
--   maintenance_log(log_id, equipment_id, repair_id, action, remarks, log_date)
--
-- Full automatic chain after this file:
--   repair INSERT            -> complaint IN_PROGRESS -> equipment UNDER_REPAIR + maintenance_log 'REPAIR_STARTED'
--   repair -> COMPLETED      -> assignment COMPLETED -> complaint RESOLVED -> equipment WORKING + log 'REPAIR_COMPLETED'
--   repair -> UNSUCCESSFUL   -> log 'REPAIR_UNSUCCESSFUL'
--   equipment status change  -> log 'STATUS_CHANGED'
-- ============================================================

-- ---------- VIEWS ----------
-- Repair history (JOIN of 5 tables)
CREATE OR REPLACE VIEW v_repair_history WITH (security_invoker = true) AS
SELECT r.repair_id,
       r.repair_date,
       r.repair_status,
       r.repair_description,
       r.repair_cost,
       cp.complaint_id,
       cp.issue_type,
       e.equipment_id,
       e.asset_tag,
       e.equipment_name,
       l.lab_name,
       t.user_id AS technician_id,
       t.name    AS technician_name
FROM repair r
JOIN complaint cp    ON cp.complaint_id = r.complaint_id
JOIN equipment e     ON e.equipment_id = cp.equipment_id
JOIN lab l           ON l.lab_id = e.lab_id
JOIN labcare_user t  ON t.user_id = r.technician_id;

-- Maintenance log with equipment name
CREATE OR REPLACE VIEW v_maintenance_history WITH (security_invoker = true) AS
SELECT m.log_id,
       m.log_date,
       m.action,
       m.remarks,
       m.repair_id,
       e.equipment_id,
       e.asset_tag,
       e.equipment_name,
       l.lab_name
FROM maintenance_log m
JOIN equipment e ON e.equipment_id = m.equipment_id
JOIN lab l       ON l.lab_id = e.lab_id;

-- ---------- TRIGGER: validate a new repair (BEFORE INSERT) ----------
CREATE OR REPLACE FUNCTION trg_fn_repair_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_status VARCHAR;
    v_role   VARCHAR;
BEGIN
    SELECT status INTO v_status FROM complaint WHERE complaint_id = NEW.complaint_id;
    IF v_status IS NOT NULL AND v_status NOT IN ('ASSIGNED','IN_PROGRESS') THEN
        RAISE EXCEPTION 'Complaint % is % - a repair needs an ASSIGNED or IN_PROGRESS complaint', NEW.complaint_id, v_status;
    END IF;

    SELECT role INTO v_role FROM labcare_user WHERE user_id = NEW.technician_id;
    IF v_role IS NOT NULL AND v_role <> 'TECHNICIAN' THEN
        RAISE EXCEPTION 'User % is a % - only a TECHNICIAN can do repairs', NEW.technician_id, v_role;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM assignment
                   WHERE complaint_id = NEW.complaint_id
                     AND technician_id = NEW.technician_id
                     AND status = 'ACTIVE') THEN
        RAISE EXCEPTION 'Technician % has no ACTIVE assignment for complaint %', NEW.technician_id, NEW.complaint_id;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_repair_before_insert ON repair;
CREATE TRIGGER trg_repair_before_insert
BEFORE INSERT ON repair
FOR EACH ROW EXECUTE FUNCTION trg_fn_repair_before_insert();

-- ---------- TRIGGER: repair started -> complaint IN_PROGRESS + log (AFTER INSERT) ----------
CREATE OR REPLACE FUNCTION trg_fn_repair_after_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_equipment BIGINT;
BEGIN
    SELECT equipment_id INTO v_equipment FROM complaint WHERE complaint_id = NEW.complaint_id;

    UPDATE complaint SET status = 'IN_PROGRESS'
    WHERE complaint_id = NEW.complaint_id AND status = 'ASSIGNED';

    INSERT INTO maintenance_log (equipment_id, repair_id, action, remarks)
    VALUES (v_equipment, NEW.repair_id, 'REPAIR_STARTED',
            COALESCE(NEW.repair_description, 'Repair started for complaint ' || NEW.complaint_id));
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_repair_after_insert ON repair;
CREATE TRIGGER trg_repair_after_insert
AFTER INSERT ON repair
FOR EACH ROW EXECUTE FUNCTION trg_fn_repair_after_insert();

-- ---------- TRIGGER: a finished repair cannot be changed back (BEFORE UPDATE) ----------
CREATE OR REPLACE FUNCTION trg_fn_repair_before_update() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF OLD.repair_status = 'COMPLETED' AND NEW.repair_status <> 'COMPLETED' THEN
        RAISE EXCEPTION 'Repair % is already COMPLETED and cannot be reopened', OLD.repair_id;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_repair_before_update ON repair;
CREATE TRIGGER trg_repair_before_update
BEFORE UPDATE OF repair_status ON repair
FOR EACH ROW EXECUTE FUNCTION trg_fn_repair_before_update();

-- ---------- TRIGGER: repair status change -> assignment + log (AFTER UPDATE) ----------
CREATE OR REPLACE FUNCTION trg_fn_repair_status_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_equipment BIGINT;
BEGIN
    IF NEW.repair_status IS NOT DISTINCT FROM OLD.repair_status THEN
        RETURN NEW;
    END IF;

    SELECT equipment_id INTO v_equipment FROM complaint WHERE complaint_id = NEW.complaint_id;

    IF NEW.repair_status = 'COMPLETED' THEN
        -- completing the assignment fires the existing chain: complaint RESOLVED -> equipment WORKING
        UPDATE assignment SET status = 'COMPLETED'
        WHERE complaint_id = NEW.complaint_id
          AND technician_id = NEW.technician_id
          AND status = 'ACTIVE';

        INSERT INTO maintenance_log (equipment_id, repair_id, action, remarks)
        VALUES (v_equipment, NEW.repair_id, 'REPAIR_COMPLETED',
                COALESCE(NEW.repair_description, 'Repair completed') || ' (cost: ' || COALESCE(NEW.repair_cost, 0) || ')');

    ELSIF NEW.repair_status = 'UNSUCCESSFUL' THEN
        INSERT INTO maintenance_log (equipment_id, repair_id, action, remarks)
        VALUES (v_equipment, NEW.repair_id, 'REPAIR_UNSUCCESSFUL',
                COALESCE(NEW.repair_description, 'Repair was unsuccessful'));
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_repair_status_change ON repair;
CREATE TRIGGER trg_repair_status_change
AFTER UPDATE OF repair_status ON repair
FOR EACH ROW EXECUTE FUNCTION trg_fn_repair_status_change();

-- ---------- TRIGGER: every equipment status change is logged ----------
CREATE OR REPLACE FUNCTION trg_fn_equipment_log_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO maintenance_log (equipment_id, action, remarks)
    VALUES (NEW.equipment_id, 'STATUS_CHANGED', OLD.status || ' -> ' || NEW.status);
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_equipment_log_status ON equipment;
CREATE TRIGGER trg_equipment_log_status
AFTER UPDATE OF status ON equipment
FOR EACH ROW WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION trg_fn_equipment_log_status();

-- ---------- FUNCTION: complete a repair ----------
CREATE OR REPLACE FUNCTION fn_complete_repair(
    p_repair_id   BIGINT,
    p_description TEXT    DEFAULT NULL,
    p_cost        NUMERIC DEFAULT NULL
) RETURNS repair
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_status VARCHAR;
    v_row    repair;
BEGIN
    SELECT repair_status INTO v_status FROM repair WHERE repair_id = p_repair_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Repair % does not exist', p_repair_id;
    END IF;
    IF v_status <> 'IN_PROGRESS' THEN
        RAISE EXCEPTION 'Repair % is % - only IN_PROGRESS repairs can be completed', p_repair_id, v_status;
    END IF;

    UPDATE repair
    SET repair_status      = 'COMPLETED',
        repair_description = COALESCE(p_description, repair_description),
        repair_cost        = COALESCE(p_cost, repair_cost)
    WHERE repair_id = p_repair_id
    RETURNING * INTO v_row;

    RETURN v_row;
END $$;

-- ---------- REPORT: repair cost per lab ----------
CREATE OR REPLACE FUNCTION fn_repair_cost_report()
RETURNS TABLE (lab_name VARCHAR, total_repairs BIGINT, total_cost NUMERIC)
LANGUAGE sql STABLE SET search_path = public AS $$
    SELECT l.lab_name::varchar, COUNT(r.repair_id), COALESCE(SUM(r.repair_cost), 0)
    FROM lab l
    LEFT JOIN equipment e  ON e.lab_id = l.lab_id
    LEFT JOIN complaint cp ON cp.equipment_id = e.equipment_id
    LEFT JOIN repair r     ON r.complaint_id = cp.complaint_id
    GROUP BY l.lab_name
    ORDER BY 3 DESC;
$$;

NOTIFY pgrst, 'reload schema';
