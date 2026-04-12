// Utility functions for ORCID identifier validation

/**
 * Validate an ORCID identifier using the official checksum algorithm.
 *
 * ORCID format is typically 0000-0000-0000-0000 (16 digits with hyphens).
 * The final digit is a checksum which may be X.
 * This function is tolerant of hyphens and spaces.
 *
 * @param {string} value - the ORCID string to validate
 * @returns {boolean} true if valid, false otherwise
 */
function isValidOrcid(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  // remove hyphens and spaces
  const normalized = value.replace(/[-\s]/g, '');
  // must be 16 characters, digits except that last char may be X
  if (!/^\d{15}[\dX]$/.test(normalized)) {
    return false;
  }

  // compute checksum according to ORCID spec
  let total = 0;
  for (let i = 0; i < 15; i++) {
    total = (total + parseInt(normalized.charAt(i), 10)) * 2;
  }
  const remainder = total % 11;
  let result = (12 - remainder) % 11;
  const checkDigit = result === 10 ? 'X' : String(result);
  return checkDigit === normalized.charAt(15);
}

module.exports = {
  isValidOrcid,
};
