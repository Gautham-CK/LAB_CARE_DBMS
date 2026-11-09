const express = require('express');
const supabase = require('../supabaseClient');
const { makeCrudRouter, sendError } = require('../utils/crud');

const router = express.Router();

// GET /api/assignments/details -> assignments with technician, admin, equipment (JOIN view)
router.get('/details', async (req, res) => {
  try {
    let q = supabase.from('v_technician_assignments').select('*');
    for (const [k, v] of Object.entries(req.query)) q = q.eq(k, v);
    const { data, error } = await q.order('assignment_id');
    if (error) return sendError(res, error);
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments  { complaint_id, technician_id, assigned_by }
// Uses the PostgreSQL function fn_assign_complaint (all checks + insert happen in ONE transaction)
router.post('/', async (req, res) => {
  try {
    const { complaint_id, technician_id, assigned_by } = req.body;
    if (!complaint_id || !technician_id || !assigned_by) {
      return res.status(400).json({ error: 'complaint_id, technician_id and assigned_by are required' });
    }
    const { data, error } = await supabase.rpc('fn_assign_complaint', {
      p_complaint_id: Number(complaint_id),
      p_technician_id: Number(technician_id),
      p_assigned_by: Number(assigned_by),
    });
    if (error) return sendError(res, error);
    res.status(201).json({ message: 'Complaint assigned successfully!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments/:id/complete -> finish the work (assignment COMPLETED, complaint RESOLVED, equipment WORKING)
router.post('/:id/complete', async (req, res) => {
  try {
    const { data, error } = await supabase.rpc('fn_complete_assignment', {
      p_assignment_id: Number(req.params.id),
    });
    if (error) return sendError(res, error);
    res.json({ message: 'Assignment completed!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / (list), GET /:id, PUT /:id, DELETE /:id (POST / is handled above)
router.use('/', makeCrudRouter({
  table: 'assignment',
  pk: 'assignment_id',
  label: 'Assignment',
}));

module.exports = router;
