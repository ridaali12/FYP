// ORCID validation for admin panel

export function validateOrcid(orcid) {
  if (!orcid || typeof orcid !== 'string') {
    return { isValid: false };
  }
  const normalized = orcid.replace(/[-\s]/g, '');
  if (!/^\d{15}[\dX]$/.test(normalized)) {
    return { isValid: false };
  }
  let total = 0;
  for (let i = 0; i < 15; i++) {
    total = (total + parseInt(normalized.charAt(i), 10)) * 2;
  }
  const remainder = total % 11;
  let result = (12 - remainder) % 11;
  const checkDigit = result === 10 ? 'X' : String(result);
  if (checkDigit !== normalized.charAt(15)) {
    return { isValid: false };
  }
  return { isValid: true, formatted: normalized.replace(/(\d{4})(?=\d)/g, '$1-') };
}
