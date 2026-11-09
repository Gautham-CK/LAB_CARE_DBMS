const express = require('express');
const supabase = require('../supabaseClient');
const { sendError } = require('../utils/crud');

const router = express.Router();

// GET /api/reports/dashboard -> totals for the dashboard cards
router.get('/dashboard', async (req, res) => {
  try {
    const count = async (table, filter) => {
      let q = supabase.from(table).select('*', { count: 'exact', head: true });
      if (filter) q = q.eq(filter.col, filter.val);
      const { count: c, error } = await q;
      if (error) throw new Error(`${table}: ${error.message}`);
      return c;
    };

    const [users, labs, categories, equipment, complaints, pendingComplaints, assignments, repairs, maintenance] =
      await Promise.all([
        count('labcare_user'),
        count('lab'),
        count('category'),
        count('equipment'),
        count('complaint'),
        count('complaint', { col: 'status', val: 'PENDING' }),
        count('assignment'),
        count('repair'),
        count('maintenance_log'),
      ]);

    res.json({ data: { users, labs, categories, equipment, complaints, pendingComplaints, assignments, repairs, maintenance } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to expose a PostgreSQL function as a GET report
const rpcReport = (path, fn) =>
  router.get(path, async (req, res) => {
    try {
      const { data, error } = await supabase.rpc(fn);
      if (error) return sendError(res, error);
      res.json({ count: data.length, data });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

rpcReport('/complaint-summary', 'fn_complaint_summary');      // complaints per status
rpcReport('/equipment-status', 'fn_equipment_status_report'); // equipment per status
rpcReport('/lab-report', 'fn_lab_report');                    // per-lab equipment + faulty counts
rpcReport('/repair-cost', 'fn_repair_cost_report');           // repairs + total cost per lab (needs 05_repair_maintenance.sql)

module.exports = router;
