-- ============================================================
-- STEP 3: TRIGGERS (code that runs AUTOMATICALLY on INSERT/UPDATE/DELETE)
--
-- The automatic chain you get after this file:
--   complaint INSERT        -> equipment becomes FAULTY
--   assignment INSERT       -> complaint becomes ASSIGNED
--   complaint IN_PROGRESS   -> equipment becomes UNDER_REPAIR
--   assignment COMPLETED    -> complaint becomes RESOLVED
--   complaint RESOLVED/CLOSED/REJECTED -> equipment becomes WORKING (if no other open complaints)
--
-- Rules that BLOCK invalid operations:
--   * no complaint on RETIRED equipment
--   * RETIRED equipment can never be un-retired
--   * only a PENDING complaint can get an assignment
--   * a complaint cannot have two ACTIVE assignments
-- ============================================================

-- ---------- EQUIPMENT: RETIRED is final ----------
CREATE OR REPLACE FUNCTION trg_fn_equipment_protect_retired() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF OLD.status = 'RETIRED' AND NEW.status <> 'RETIRED' THEN
        RAISE EXCEPTION 'Equipment % is RETIRED and cannot be changed back to %', OLD.equipment_id, NEW.status;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_equipment_protect_retired ON equipment;
CREATE TRIGGER trg_equipment_protect_retired
BEFORE UPDATE OF status ON equipment
FOR EACH ROW EXECUTE FUNCTION trg_fn_equipment_protect_retired();

-- ---------- COMPLAINT: block on retired equipment (BEFORE INSERT) ----------
CREATE OR REPLACE FUNCTION trg_fn_complaint_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status VARCHAR;
BEGIN
    SELECT status INTO v_status FROM equipment WHERE equipment_id = NEW.equipment_id;
    IF v_status = 'RETIRED' THEN
        RAISE EXCEPTION 'Cannot register a complaint: equipment % is RETIRED', NEW.equipment_id;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_complaint_before_insert ON complaint;
CREATE TRIGGER trg_complaint_before_insert
BEFORE INSERT ON complaint
FOR EACH ROW EXECUTE FUNCTION trg_fn_complaint_before_insert();

-- ---------- COMPLAINT: new complaint -> equipment FAULTY (AFTER INSERT) ----------
CREATE OR REPLACE FUNCTION trg_fn_complaint_after_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE equipment SET status = 'FAULTY'
    WHERE equipment_id = NEW.equipment_id AND status = 'WORKING';
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_complaint_after_insert ON complaint;
CREATE TRIGGER trg_complaint_after_insert
AFTER INSERT ON complaint
FOR EACH ROW EXECUTE FUNCTION trg_fn_complaint_after_insert();

-- ---------- COMPLAINT: status change -> equipment status (AFTER UPDATE) ----------
CREATE OR REPLACE FUNCTION trg_fn_complaint_status_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'IN_PROGRESS' THEN
        UPDATE equipment SET status = 'UNDER_REPAIR'
        WHERE equipment_id = NEW.equipment_id AND status IN ('WORKING','FAULTY');

    ELSIF NEW.status IN ('RESOLVED','CLOSED','REJECTED') THEN
        -- only mark WORKING if no OTHER complaint on this equipment is still open
        IF NOT EXISTS (
            SELECT 1 FROM complaint
            WHERE equipment_id = NEW.equipment_id
              AND complaint_id <> NEW.complaint_id
              AND status IN ('PENDING','ASSIGNED','IN_PROGRESS')
        ) THEN
            UPDATE equipment SET status = 'WORKING'
            WHERE equipment_id = NEW.equipment_id AND status IN ('FAULTY','UNDER_REPAIR');
        END IF;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_complaint_status_change ON complaint;
CREATE TRIGGER trg_complaint_status_change
AFTER UPDATE OF status ON complaint
FOR EACH ROW EXECUTE FUNCTION trg_fn_complaint_status_change();

-- ---------- ASSIGNMENT: validation (BEFORE INSERT) ----------
CREATE OR REPLACE FUNCTION trg_fn_assignment_before_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_status VARCHAR;
BEGIN
    SELECT status INTO v_status FROM complaint WHERE complaint_id = NEW.complaint_id;
    IF v_status IS NOT NULL AND v_status <> 'PENDING' THEN
        RAISE EXCEPTION 'Complaint % is % - only PENDING complaints can be assigned', NEW.complaint_id, v_status;
    END IF;

    IF EXISTS (SELECT 1 FROM assignment WHERE complaint_id = NEW.complaint_id AND status = 'ACTIVE') THEN
        RAISE EXCEPTION 'Complaint % already has an ACTIVE assignment', NEW.complaint_id;
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assignment_before_insert ON assignment;
CREATE TRIGGER trg_assignment_before_insert
BEFORE INSERT ON assignment
FOR EACH ROW EXECUTE FUNCTION trg_fn_assignment_before_insert();

-- ---------- ASSIGNMENT: new assignment -> complaint ASSIGNED (AFTER INSERT) ----------
CREATE OR REPLACE FUNCTION trg_fn_assignment_after_insert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.status = 'ACTIVE' THEN
        UPDATE complaint SET status = 'ASSIGNED'
        WHERE complaint_id = NEW.complaint_id AND status = 'PENDING';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assignment_after_insert ON assignment;
CREATE TRIGGER trg_assignment_after_insert
AFTER INSERT ON assignment
FOR EACH ROW EXECUTE FUNCTION trg_fn_assignment_after_insert();

-- ---------- ASSIGNMENT: status change -> complaint status (AFTER UPDATE) ----------
CREATE OR REPLACE FUNCTION trg_fn_assignment_status_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN
        RETURN NEW;
    END IF;

    IF NEW.status = 'COMPLETED' THEN
        UPDATE complaint SET status = 'RESOLVED'
        WHERE complaint_id = NEW.complaint_id AND status IN ('ASSIGNED','IN_PROGRESS');
    ELSIF NEW.status = 'CANCELLED' THEN
        UPDATE complaint SET status = 'PENDING'
        WHERE complaint_id = NEW.complaint_id AND status = 'ASSIGNED';
    END IF;
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_assignment_status_change ON assignment;
CREATE TRIGGER trg_assignment_status_change
AFTER UPDATE OF status ON assignment
FOR EACH ROW EXECUTE FUNCTION trg_fn_assignment_status_change();

-- NOTE: the "auto maintenance_log entry" trigger is added in the next step,
-- after we know the real columns of maintenance_log.
