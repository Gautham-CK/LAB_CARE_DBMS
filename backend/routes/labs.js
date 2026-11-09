const { makeCrudRouter } = require('../utils/crud');

module.exports = makeCrudRouter({
  table: 'lab',
  pk: 'lab_id',
  label: 'Lab',
  required: ['lab_name', 'capacity'],
});
