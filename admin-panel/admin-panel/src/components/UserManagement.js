import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import { analyzeContent } from '../utils/contentAnalyzer';
import './UserManagement.css';

const UserManagement = ({ admin }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [filter, setFilter] = useState('all'); // all, community, researcher

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(ADMIN_ENDPOINTS.allUsers);
      let usersData = response.data.users || [];

      // Filter by type if needed
      if (filter === 'community') {
        usersData = usersData.filter((u) => u.userType === 'community');
      } else if (filter === 'researcher') {
        usersData = usersData.filter((u) => u.userType === 'researcher');
      }

      setUsers(usersData);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoadingDetails(true);
      setError('');

      const response = await axios.get(ADMIN_ENDPOINTS.getUserDetails(userId));
      // run text analysis on reports included in details
      const details = response.data;
      if (details.reports && details.reports.length) {
        const analysedReports = await Promise.all(
          details.reports.map(async (r) => {
            const result = await analyzeContent(r.specieName || '');
            return { ...r, analysis: result };
          })
        );
        details.reports = analysedReports;
      }
      setUserDetails(details);
      setSelectedUser(userId);
    } catch (err) {
      setError('Failed to load user details');
      console.error('Error fetching user details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this report? This action cannot be undone.'
      )
    )
      return;

    try {
      await axios.delete(ADMIN_ENDPOINTS.deleteReport(reportId), {
        data: { adminUsername: admin.username },
      });
      alert('Report removed successfully');
      
      // Refresh user details to update reports list
      if (selectedUser) {
        fetchUserDetails(selectedUser);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to remove content at this time.');
      console.error('Error deleting report:', err);
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    const API_BASE = ADMIN_ENDPOINTS.allUsers.replace('/api/admin/users/all', '');
    if (imageUrl.startsWith('/')) {
      return `${API_BASE}${imageUrl}`;
    }
    return `${API_BASE}/${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="section-header">
        <h2>User Management</h2>
        <button onClick={fetchUsers} className="refresh-btn">
          Refresh
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All Users ({users.length})
        </button>
        <button
          className={filter === 'community' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('community')}
        >
          Community Users ({users.filter((u) => u.userType === 'community').length})
        </button>
        <button
          className={filter === 'researcher' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('researcher')}
        >
          Researchers ({users.filter((u) => u.userType === 'researcher').length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {selectedUser && userDetails ? (
        <div className="user-details-view">
          <div className="details-header">
            <button onClick={closeUserDetails} className="back-btn">
              ← Back to Users List
            </button>
            <h3>User Profile & Activity</h3>
          </div>

          {loadingDetails ? (
            <div className="loading-container">
              <p>Loading user details...</p>
            </div>
          ) : (
            <>
              <div className="user-profile-card">
                <div className="profile-header">
                  <div className="profile-icon">
                    {userDetails.userType === 'researcher' ? '🔬' : '👤'}
                  </div>
                  <div className="profile-info">
                    <h3>{userDetails.username}</h3>
                    <p className="user-email">{userDetails.email}</p>
                    <div className="user-badges">
                      <span className={`badge ${userDetails.userType}`}>
                        {userDetails.userType === 'researcher' ? 'Researcher' : 'Community User'}
                      </span>
                      {userDetails.userType === 'researcher' && (
                        <span
                          className={`badge ${userDetails.verified ? 'verified' : 'pending'}`}
                        >
                          {userDetails.verified ? '✓ Verified' : '⏳ Pending'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="profile-stats">
                  <div className="stat-item">
                    <strong>Reports Submitted:</strong> {userDetails.reportsCount}
                  </div>
                  <div className="stat-item">
                    <strong>Account Created:</strong>{' '}
                    {new Date(userDetails.createdAt).toLocaleDateString()}
                  </div>
                  {userDetails.userType === 'researcher' && userDetails.education && (
                    <div className="stat-item">
                      <strong>Highest Degree:</strong> {userDetails.education.highestDegree}
                    </div>
                  )}
                </div>
              </div>

              <div className="user-reports-section">
                <h4>Reports Submitted by {userDetails.username}</h4>
                {userDetails.reports && userDetails.reports.length === 0 ? (
                  <div className="empty-state">
                    <p>No reports submitted by this user.</p>
                  </div>
                ) : (
                  <div className="reports-list">
                    {userDetails.reports.map((report) => (
                      <div
                        key={report._id}
                        className={`report-card ${
                          report.isSpam || report.isInappropriate ? 'flagged' : ''
                        }`}
                      >
                        <div className="report-header">
                          <h4>{report.specieName}</h4>
                          <div className="report-badges">
                            {report.isSpam && <span className="badge spam">Spam</span>}
                            {report.isInappropriate && (
                              <span className="badge inappropriate">Inappropriate</span>
                            )}
                            {report.analysis?.spam && !report.isSpam && (
                              <span className="badge spam" title="Auto-detected spam">
                                Auto-Spam
                              </span>
                            )}
                            {report.analysis?.inappropriate && !report.isInappropriate && (
                              <span className="badge inappropriate" title="Auto-detected inappropriate">
                                Auto-Inappropriate
                              </span>
                            )}
                          </div>
                        </div>

                        {report.image && (
                          <div className="report-image-container">
                            <img
                              src={normalizeImageUrl(report.image)}
                              alt={report.specieName}
                              className="report-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        <div className="report-info">
                          <div className="info-row">
                            <strong>Health Status:</strong> {report.healthStatus}
                          </div>
                          <div className="info-row">
                            <strong>Location:</strong> {report.location?.latitude?.toFixed(5)},{' '}
                            {report.location?.longitude?.toFixed(5)}
                          </div>
                          <div className="info-row">
                            <strong>Reported At:</strong>{' '}
                            {new Date(report.timestamp || report.createdAt).toLocaleString()}
                          </div>
                          <div className="info-row">
                            <strong>Comments:</strong> {report.commentsCount || 0}
                          </div>
                          {report.flaggedBy && (
                            <div className="info-row">
                              <strong>Flagged By:</strong> {report.flaggedBy} (
                              {new Date(report.flaggedAt).toLocaleString()})
                            </div>
                          )}
                        </div>

                        <div className="report-actions">
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteReport(report._id)}
                          >
                            🗑️ Delete Report
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {users.length === 0 ? (
            <div className="empty-state">
              <p>No users found</p>
            </div>
          ) : (
            <div className="users-list">
              {users.map((user) => (
                <div key={user._id} className="user-card">
                  <div className="user-card-header">
                    <div className="user-icon">
                      {user.userType === 'researcher' ? '🔬' : '👤'}
                    </div>
                    <div className="user-info">
                      <h3>{user.username}</h3>
                      <p className="user-email">{user.email}</p>
                    </div>
                  </div>

                  <div className="user-card-badges">
                    <span className={`badge ${user.userType}`}>
                      {user.userType === 'researcher' ? 'Researcher' : 'Community User'}
                    </span>
                    {user.userType === 'researcher' && (
                      <span className={`badge ${user.verified ? 'verified' : 'pending'}`}>
                        {user.verified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                    )}
                  </div>

                  <div className="user-card-footer">
                    <div className="user-meta">
                      <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                    </div>
                    <button
                      className="btn-view-details"
                      onClick={() => fetchUserDetails(user._id)}
                    >
                      View Profile & Reports →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UserManagement;
