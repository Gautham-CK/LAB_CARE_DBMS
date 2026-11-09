const { makeCrudRouter } = require('../utils/crud');

// alias 'user' keeps the old response shape { message, user } that your friend's frontend already uses
module.exports = makeCrudRouter({
  table: 'labcare_user',
  pk: 'user_id',
  label: 'User',
  alias: 'user',
  required: ['name', 'email', 'role'],
});
