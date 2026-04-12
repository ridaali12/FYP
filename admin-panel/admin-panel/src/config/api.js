// API Configuration for Admin Panel
// Update this URL to match your backend server
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.100.2:5000';

export const API_URL = API_BASE_URL;

export const ADMIN_ENDPOINTS = {
  login: `${API_BASE_URL}/api/admin/login`,
  dashboardStats: `${API_BASE_URL}/api/admin/dashboard/stats`,
  pendingResearchers: `${API_BASE_URL}/api/admin/researchers/pending`,
  allResearchers: `${API_BASE_URL}/api/admin/researchers/all`,
  verifyResearcher: (id) => `${API_BASE_URL}/api/admin/researchers/${id}/verify`,
  rejectResearcher: (id) => `${API_BASE_URL}/api/admin/researchers/${id}/reject`,
  allReports: `${API_BASE_URL}/api/admin/reports/all`,
  flaggedReports: `${API_BASE_URL}/api/admin/reports/flagged`,
  flagSpam: (id) => `${API_BASE_URL}/api/admin/reports/${id}/flag-spam`,
  flagInappropriate: (id) => `${API_BASE_URL}/api/admin/reports/${id}/flag-inappropriate`,
  deleteReport: (id) => `${API_BASE_URL}/api/admin/reports/${id}`,
  unflagReport: (id) => `${API_BASE_URL}/api/admin/reports/${id}/unflag`,
  allUsers: `${API_BASE_URL}/api/admin/users/all`,
  getUserDetails: (id) => `${API_BASE_URL}/api/admin/users/${id}`,
};
