const crypto = require('crypto');

function generateCancelToken() {
  return crypto.randomBytes(24).toString('hex');
}

module.exports = { generateCancelToken };
