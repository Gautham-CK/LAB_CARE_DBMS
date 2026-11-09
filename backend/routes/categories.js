const { makeCrudRouter } = require('../utils/crud');

module.exports = makeCrudRouter({
  table: 'category',
  pk: 'category_id',
  label: 'Category',
  required: ['category_name'],
});
