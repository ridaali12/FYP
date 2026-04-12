// utils/emailVerification.js
// Email verification service using Mailboxlayer API

const MAILBOXLAYER_API_KEY = 'bb2fed36a59f8f6d4946b1bffacc5f4c'; // ← PASTE YOUR API KEY HERE
const MAILBOXLAYER_BASE_URL = 'http://apilayer.net/api/check';

/**
 * Verify if an email address exists and is valid using Mailboxlayer API
 * @param {string} email - Email address to verify
 * @returns {Promise<Object>} Verification result
 */
export const verifyEmail = async (email) => {
  try {
    const url = `${MAILBOXLAYER_BASE_URL}?access_key=${MAILBOXLAYER_API_KEY}&email=${encodeURIComponent(email)}&smtp=1&format=1`;
    
    console.log('Verifying email:', email);
    
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Mailboxlayer response:', data);
    
    if (!response.ok) {
      throw new Error(data.error?.info || 'Failed to verify email');
    }
    
    // Check if API returned an error
    if (data.error) {
      throw new Error(data.error.info || 'API error occurred');
    }
    
    // Parse the response
    return {
      success: true,
      email: data.email,
      isValid: data.format_valid && data.mx_found && data.smtp_check,
      details: {
        formatValid: data.format_valid,        // Email format is correct
        mxFound: data.mx_found,                // MX records exist for domain
        smtpCheck: data.smtp_check,            // SMTP server accepts emails
        disposable: data.disposable,           // Is disposable email (temp email)
        free: data.free,                       // Is free email provider (gmail, yahoo, etc)
        role: data.role,                       // Is role-based email (info@, admin@)
        score: data.score,                     // Quality score (0-1)
        didYouMean: data.did_you_mean || null, // Suggested correction if typo detected
      },
      message: getVerificationMessage(data)
    };
  } catch (error) {
    console.error('Email verification error:', error);
    return {
      success: false,
      isValid: false,
      error: error.message,
      message: 'Unable to verify email. Please check your connection.'
    };
  }
};

/**
 * Generate user-friendly message based on verification result
 */
const getVerificationMessage = (data) => {
  if (!data.format_valid) {
    return 'Invalid email format';
  }
  
  if (!data.mx_found) {
    return 'Email domain does not exist';
  }
  
  if (!data.smtp_check) {
    return 'Email address does not exist or cannot receive emails';
  }
  
  if (data.disposable) {
    return 'Disposable/temporary email addresses are not allowed';
  }
  
  if (data.did_you_mean) {
    return `Did you mean: ${data.did_you_mean}?`;
  }
  
  return 'Email verified successfully';
};

/**
 * Quick validation - checks format and basic validity
 * Use this for instant feedback before API call
 */
export const quickEmailValidation = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, message: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email format' };
  }
  
  // Check for common typos in domains
  const commonTypos = {
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'yahooo.com': 'yahoo.com',
    'yaho.com': 'yahoo.com',
    'hotmial.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
  };
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (commonTypos[domain]) {
    return { 
      isValid: false, 
      message: `Did you mean @${commonTypos[domain]}?`,
      suggestion: email.replace(domain, commonTypos[domain])
    };
  }
  
  return { isValid: true, message: '' };
};

export default verifyEmail;