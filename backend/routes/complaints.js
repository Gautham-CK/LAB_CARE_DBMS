const express = require('express');
const supabase = require('../supabaseClient');
const { makeCrudRouter, sendError } = require('../utils/crud');

const router = express.Router();

// GET /api/complaints/pending -> pending complaints with equipment + user names (JOIN view)
router.get('/pending', async (req, res) => {
  try {
    const { data, error } = await supabase.from('v_pending_complaints').select('*').order('complaint_date');
    if (error) return sendError(res, error);
    res.json({ count: data.length, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Standard CRUD. Triggers in the database automatically update the equipment status.
// Update status example: PATCH /api/complaints/1  { "status": "IN_PROGRESS" }
router.use('/', makeCrudRouter({
  table: 'complaint',
  pk: 'complaint_id',
  label: 'Complaint',
  required: ['equipment_id', 'user_id', 'issue_type', 'priority'],
}));

module.exports = router;
