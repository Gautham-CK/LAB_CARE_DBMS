const express = require('express');
const supabase = require('../supabaseClient');
const { makeCrudRouter, sendError } = require('../utils/crud');

const router = express.Router();

// GET /api/equipment/details -> equipment WITH lab name and category name (uses the JOIN view)
// Optional filters: ?status=WORKING&lab_name=Computer%20Lab%201
router.get('/details', async (req, res) => {
  try {
    let q = supabase.from('v_equipment_details').select('*');
    for (const [k, v] of Object.entries(req.query)) q = q.eq(k, v);
    const { data, error } = await q.order('equipment_id');
    if (error) return sendError(res, error);
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/equipment/:id/status  { "status": "RETIRED" } -> calls the PostgreSQL function
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'status is required' });

    const { data, error } = await supabase.rpc('fn_update_equipment_status', {
      p_equipment_id: Number(req.params.id),
      p_status: status,
    });
    if (error) return sendError(res, error);
    res.json({ message: 'Equipment status updated!', data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use('/', makeCrudRouter({
  table: 'equipment',
  pk: 'equipment_id',
  label: 'Equipment',
  required: ['lab_id', 'category_id', 'asset_tag', 'equipment_name'],
}));

module.exports = router;
