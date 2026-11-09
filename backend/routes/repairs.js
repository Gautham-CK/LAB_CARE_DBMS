const express = require('express');
const supabase = require('../supabaseClient');
const { makeCrudRouter, sendError } = require('../utils/crud');

const router = express.Router();

// GET /api/repairs/history -> repairs with complaint, equipment, lab and technician (JOIN view)
// Optional filters: ?repair_status=COMPLETED&equipment_id=1
router.get('/history', async (req, res) => {
  try {
    let q = supabase.from('v_repair_history').select('*');
    for (const [k, v] of Object.entries(req.query)) q = q.eq(k, v);
    const { data, error } = await q.order('repair_date', { ascending: false });
    if (error) return sendError(res, error);
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repairs/:id/complete  { repair_description?, repair_cost? }
// Calls fn_complete_repair -> triggers resolve the complaint and set equipment WORKING
router.post('/:id/complete', async (req, res) => {
  try {
    const { repair_description, repair_cost } = req.body || {};
    const { data, error } = await supabase.rpc('fn_complete_repair', {
      p_repair_id: Number(req.params.id),
      p_description: repair_description ?? null,
      p_cost: repair_cost ?? null,
    });
    if (error) return sendError(res, error);
    res.json({ message: 'Repair completed!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Standard CRUD. POST body: { complaint_id, technician_id, repair_description }
// A trigger checks: complaint ASSIGNED/IN_PROGRESS, user is a TECHNICIAN, technician has an ACTIVE assignment.
router.use('/', makeCrudRouter({
  table: 'repair',
  pk: 'repair_id',
  label: 'Repair',
  required: ['complaint_id', 'technician_id'],
}));

module.exports = router;
