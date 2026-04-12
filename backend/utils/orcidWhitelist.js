// ============================================================
// ORCID Whitelist Verification Utility
// ============================================================
// This module checks whether an ORCID + email combination
// belongs to a pre-approved wildlife conservation researcher.
// This is the core security layer for the Researcher Portal.
// ============================================================

const { approvedResearchers } = require('../data/approvedResearchers');

/**
 * Normalize an ORCID string by removing hyphens and spaces,
 * then re-format as XXXX-XXXX-XXXX-XXXX
 * @param {string} orcid
 * @returns {string}
 */
function normalizeOrcid(orcid) {
  if (!orcid || typeof orcid !== 'string') return '';
  const stripped = orcid.replace(/[-\s]/g, '').toUpperCase();
  // Re-insert hyphens at positions 4, 8, 12
  if (stripped.length !== 16) return stripped;
  return `${stripped.slice(0, 4)}-${stripped.slice(4, 8)}-${stripped.slice(8, 12)}-${stripped.slice(12, 16)}`;
}

/**
 * Check if a given ORCID exists in the whitelist.
 * @param {string} orcid
 * @returns {{ found: boolean, researcher?: object }}
 */
function isOrcidWhitelisted(orcid) {
  const normalized = normalizeOrcid(orcid);
  const researcher = approvedResearchers.find(
    (r) => normalizeOrcid(r.orcid) === normalized
  );
  if (researcher) {
    return { found: true, researcher };
  }
  return { found: false };
}

/**
 * Full three-layer verification:
 *  1. Is ORCID in the whitelist?
 *  2. Does the provided email match the whitelisted email?
 *
 * @param {string} orcid   - ORCID entered by the user
 * @param {string} email   - Email entered by the user
 * @returns {{
 *   verified: boolean,
 *   reason: string,
 *   researcher?: { name, orcid, email, institution, specialization }
 * }}
 */
function verifyResearcherByOrcidAndEmail(orcid, email) {
  if (!orcid || !email) {
    return { verified: false, reason: 'ORCID and email are both required.' };
  }

  // Step 1: Check ORCID whitelist
  const { found, researcher } = isOrcidWhitelisted(orcid);
  if (!found) {
    return {
      verified: false,
      reason: 'This ORCID is not in our approved researcher list. Only verified wildlife conservation researchers may register.',
    };
  }

  // Step 2: Check email match
  const providedEmail = email.trim().toLowerCase();
  const whitelistedEmail = researcher.email.trim().toLowerCase();
  if (providedEmail !== whitelistedEmail) {
    return {
      verified: false,
      reason: 'The email address does not match our records for this ORCID. Please use the email associated with your research profile.',
    };
  }

  // All checks passed
  return {
    verified: true,
    reason: 'Researcher identity verified successfully.',
    researcher: {
      name: researcher.name,
      orcid: normalizeOrcid(researcher.orcid),
      email: researcher.email,
      institution: researcher.institution,
      specialization: researcher.specialization,
    },
  };
}

module.exports = {
  normalizeOrcid,
  isOrcidWhitelisted,
  verifyResearcherByOrcidAndEmail,
};
