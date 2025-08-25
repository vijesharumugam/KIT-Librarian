const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getAccessSecrets, config } = require('../config/env');

function kidFromSecret(secret) {
  return crypto.createHash('sha256').update(String(secret)).digest('hex').slice(0, 12);
}

function signAccess(payload, options = {}) {
  const { current } = getAccessSecrets();
  const kid = kidFromSecret(current);
  return jwt.sign(payload, current, {
    expiresIn: config.TOKEN_ACCESS_TTL,
    header: { kid },
    ...options,
  });
}

function verifyAccess(token) {
  const { current, prev } = getAccessSecrets();
  // Try with header kid hint first
  try {
    return jwt.verify(token, current);
  } catch (e1) {
    if (prev) {
      try {
        return jwt.verify(token, prev);
      } catch (e2) {
        throw e2;
      }
    }
    throw e1;
  }
}

module.exports = { signAccess, verifyAccess };
