// ================================================================
// FILE: frontend/utils/orcid.js  (UPDATED)
// ================================================================
// This file handles:
//   1. Client-side ORCID format validation (checksum)
//   2. Whitelist pre-check against the backend API
//   3. A user-friendly format helper
// ================================================================

import { API_BASE_URL } from '../constants/api';

/**
 * Validate ORCID identifier using the official checksum algorithm.
 * Accepts formats with or without hyphens.
 *
 * @param {string} value
 * @returns {{ isValid: boolean, normalized?: string }}
 */
export function validateOrcid(value) {
  if (!value || typeof value !== 'string') {
    return { isValid: false };
  }
  const normalized = value.replace(/[-\s]/g, '');
  if (!/^\d{15}[\dX]$/.test(normalized)) {
    return { isValid: false };
  }

  // Checksum algorithm (official ORCID spec)
  let total = 0;
  for (let i = 0; i < 15; i++) {
    total = (total + parseInt(normalized.charAt(i), 10)) * 2;
  }
  const remainder = total % 11;
  const result = (12 - remainder) % 11;
  const checkDigit = result === 10 ? 'X' : String(result);

  if (checkDigit !== normalized.charAt(15).toUpperCase()) {
    return { isValid: false };
  }

  // Format as XXXX-XXXX-XXXX-XXXX
  const formatted = `${normalized.slice(0,4)}-${normalized.slice(4,8)}-${normalized.slice(8,12)}-${normalized.slice(12,16)}`;
  return { isValid: true, normalized: formatted };
}

/**
 * Format an ORCID string for display (adds hyphens if missing).
 * Does NOT validate — use validateOrcid() for that.
 *
 * @param {string} value
 * @returns {string}
 */
export function formatOrcidDisplay(value) {
  if (!value) return '';
  const stripped = value.replace(/[-\s]/g, '');
  if (stripped.length !== 16) return value;
  return `${stripped.slice(0,4)}-${stripped.slice(4,8)}-${stripped.slice(8,12)}-${stripped.slice(12,16)}`;
}

/**
 * Verify researcher identity with the backend whitelist.
 * This calls the /api/auth/researcher/verify-whitelist endpoint.
 *
 * Use this BEFORE the full signup form is submitted —
 * e.g., on the ORCID + Email entry screen — to give the user
 * early feedback.
 *
 * @param {string} orcid   - ORCID entered by the user
 * @param {string} email   - Email entered by the user
 * @returns {Promise<{
 *   verified: boolean,
 *   message: string,
 *   researcher?: { name, institution, specialization }
 * }>}
 */
export async function verifyOrcidWithWhitelist(orcid, email) {
  try {
    // Step 1: validate format locally first (no network call wasted)
    const formatCheck = validateOrcid(orcid);
    if (!formatCheck.isValid) {
      return {
        verified: false,
        message: 'Invalid ORCID format. It must be 16 digits in XXXX-XXXX-XXXX-XXXX format.',
      };
    }

    // Step 2: Call backend whitelist check
    const response = await fetch(`${API_BASE_URL}/api/auth/researcher/verify-whitelist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orcid: formatCheck.normalized, email }),
    });

    const data = await response.json();

    if (response.ok && data.verified) {
      return {
        verified: true,
        message: `Welcome, ${data.researcher.name}! Identity verified.`,
        researcher: data.researcher,
      };
    } else {
      return {
        verified: false,
        message: data.message || 'Verification failed. Please check your ORCID and email.',
      };
    }
  } catch (error) {
    console.error('Whitelist verification error:', error);
    return {
      verified: false,
      message: 'Unable to connect to verification service. Please check your internet connection.',
    };
  }
}
