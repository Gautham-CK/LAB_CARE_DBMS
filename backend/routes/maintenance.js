const express = require('express');
const supabase = require('../supabaseClient');
const { makeCrudRouter, sendError } = require('../utils/crud');

const router = express.Router();

// GET /api/maintenance/details -> log entries with equipment name, tag and lab (JOIN view)
// Equipment history: /api/maintenance/details?equipment_id=1
router.get('/details', async (req, res) => {
  try {
    let q = supabase.from('v_maintenance_history').select('*');
    for (const [k, v] of Object.entries(req.query)) q = q.eq(k, v);
    const { data, error } = await q.order('log_date', { ascending: false });
    if (error) return sendError(res, error);
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Standard CRUD. POST body: { equipment_id, action, remarks?, repair_id? }
// (Most entries are created automatically by database triggers.)
router.use('/', makeCrudRouter({
  table: 'maintenance_log',
  pk: 'log_id',
  label: 'Maintenance log',
  required: ['equipment_id', 'action'],
}));

module.exports = router;
