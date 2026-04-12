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
  const [filter, setFilter] = useState('all');
  const [deletingUser, setDeletingUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // { type: 'user'|'report', id, name }

  useEffect(() => {
    fetchUsers();
  }, [filter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(ADMIN_ENDPOINTS.allUsers);
      let usersData = response.data.users || [];
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
    setConfirmDelete({ type: 'report', id: reportId, name: 'this report' });
  };

  const handleDeleteUser = async (userId, username) => {
    setConfirmDelete({ type: 'user', id: userId, name: username });
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'report') {
      try {
        await axios.delete(ADMIN_ENDPOINTS.deleteReport(confirmDelete.id), {
          data: { adminUsername: admin.username },
        });
        setConfirmDelete(null);
        if (selectedUser) fetchUserDetails(selectedUser);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to remove report.');
        setConfirmDelete(null);
      }
    } else if (confirmDelete.type === 'user') {
      try {
        setDeletingUser(confirmDelete.id);
        await axios.delete(ADMIN_ENDPOINTS.deleteUser(confirmDelete.id), {
          data: { adminUsername: admin.username },
        });
        setConfirmDelete(null);
        setDeletingUser(null);
        if (selectedUser === confirmDelete.id) {
          closeUserDetails();
        }
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to delete user.');
        setConfirmDelete(null);
        setDeletingUser(null);
      }
    }
  };

  const closeUserDetails = () => {
    setSelectedUser(null);
    setUserDetails(null);
  };

  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) return imageUrl;
    if (imageUrl.startsWith('data:image')) return imageUrl;
    const API_BASE = ADMIN_ENDPOINTS.allUsers.replace('/api/admin/users/all', '');
    if (imageUrl.startsWith('/')) return `${API_BASE}${imageUrl}`;
    return `${API_BASE}/${imageUrl}`;
  };

  const communityCount = users.filter((u) => u.userType === 'community').length;
  const researcherCount = users.filter((u) => u.userType === 'researcher').length;

  if (loading) {
    return (
      <div className="um-loading">
        <div className="um-spinner" />
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="um-root">
      {/* Confirm Modal */}
      {confirmDelete && (
        <div className="um-modal-overlay">
          <div className="um-modal">
            <div className="um-modal-icon">
              {confirmDelete.type === 'user' ? '👤' : '📄'}
            </div>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to permanently delete{' '}
              <strong>{confirmDelete.name}</strong>?
              {confirmDelete.type === 'user' && (
                <span className="um-modal-warning">
                  {' '}This will also remove all their reports and data.
                </span>
              )}
            </p>
            <div className="um-modal-actions">
              <button className="um-btn um-btn-ghost" onClick={() => setConfirmDelete(null)}>
                Cancel
              </button>
              <button className="um-btn um-btn-danger" onClick={executeDelete}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="um-page-header">
        <div className="um-page-title">
          <h2>User Management</h2>
          <p className="um-subtitle">Manage community members and researchers</p>
        </div>
        <button onClick={fetchUsers} className="um-btn um-btn-refresh">
          <span className="um-refresh-icon">↻</span> Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="um-stats-bar">
        <div className="um-stat">
          <span className="um-stat-number">{users.length}</span>
          <span className="um-stat-label">Total Users</span>
        </div>
        <div className="um-stat-divider" />
        <div className="um-stat">
          <span className="um-stat-number um-stat-community">{communityCount}</span>
          <span className="um-stat-label">Community</span>
        </div>
        <div className="um-stat-divider" />
        <div className="um-stat">
          <span className="um-stat-number um-stat-researcher">{researcherCount}</span>
          <span className="um-stat-label">Researchers</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="um-filter-tabs">
        {[
          { key: 'all', label: 'All Users', count: users.length },
          { key: 'community', label: 'Community', count: communityCount },
          { key: 'researcher', label: 'Researchers', count: researcherCount },
        ].map((tab) => (
          <button
            key={tab.key}
            className={`um-tab ${filter === tab.key ? 'um-tab-active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="um-tab-badge">{tab.count}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="um-error">
          <span className="um-error-icon">⚠</span>
          {error}
          <button className="um-error-close" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Detail View */}
      {selectedUser && userDetails ? (
        <div className="um-detail-view">
          <div className="um-detail-nav">
            <button onClick={closeUserDetails} className="um-back-btn">
              ← Back to Users
            </button>
            <div className="um-breadcrumb">
              Users / <span>{userDetails.username}</span>
            </div>
          </div>

          {loadingDetails ? (
            <div className="um-loading">
              <div className="um-spinner" />
              <p>Loading profile...</p>
            </div>
          ) : (
            <>
              {/* Profile Card */}
              <div className="um-profile-card">
                <div className="um-profile-avatar">
                  {userDetails.userType === 'researcher' ? '🔬' : '👤'}
                </div>
                <div className="um-profile-body">
                  <div className="um-profile-top">
                    <div>
                      <h3 className="um-profile-name">{userDetails.username}</h3>
                      <p className="um-profile-email">{userDetails.email}</p>
                      <div className="um-badges">
                        <span className={`um-badge um-badge-${userDetails.userType}`}>
                          {userDetails.userType === 'researcher' ? '🔬 Researcher' : '👤 Community'}
                        </span>
                        {userDetails.userType === 'researcher' && (
                          <span className={`um-badge ${userDetails.verified ? 'um-badge-verified' : 'um-badge-pending'}`}>
                            {userDetails.verified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      className="um-btn um-btn-danger-outline"
                      onClick={() => handleDeleteUser(selectedUser, userDetails.username)}
                      disabled={deletingUser === selectedUser}
                    >
                      🗑 Delete User
                    </button>
                  </div>

                  <div className="um-profile-stats">
                    <div className="um-pstat">
                      <span className="um-pstat-val">{userDetails.reportsCount}</span>
                      <span className="um-pstat-key">Reports</span>
                    </div>
                    <div className="um-pstat">
                      <span className="um-pstat-val">
                        {new Date(userDetails.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                      <span className="um-pstat-key">Joined</span>
                    </div>
                    {userDetails.userType === 'researcher' && userDetails.education && (
                      <div className="um-pstat">
                        <span className="um-pstat-val">{userDetails.education.highestDegree}</span>
                        <span className="um-pstat-key">Highest Degree</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Reports Section */}
              <div className="um-reports-section">
                <div className="um-section-header">
                  <h4>Submitted Reports</h4>
                  <span className="um-count-pill">{userDetails.reports?.length || 0}</span>
                </div>

                {!userDetails.reports || userDetails.reports.length === 0 ? (
                  <div className="um-empty">
                    <div className="um-empty-icon">📭</div>
                    <p>No reports submitted yet.</p>
                  </div>
                ) : (
                  <div className="um-reports-grid">
                    {userDetails.reports.map((report) => (
                      <div
                        key={report._id}
                        className={`um-report-card ${report.isSpam || report.isInappropriate ? 'um-report-flagged' : ''}`}
                      >
                        <div className="um-report-top">
                          <h5 className="um-report-title">{report.specieName}</h5>
                          <div className="um-report-badges">
                            {report.isSpam && <span className="um-badge um-badge-spam">Spam</span>}
                            {report.isInappropriate && <span className="um-badge um-badge-inappropriate">Inappropriate</span>}
                            {report.analysis?.spam && !report.isSpam && (
                              <span className="um-badge um-badge-spam" title="Auto-detected">Auto-Spam</span>
                            )}
                            {report.analysis?.inappropriate && !report.isInappropriate && (
                              <span className="um-badge um-badge-inappropriate" title="Auto-detected">Auto-Inapp.</span>
                            )}
                          </div>
                        </div>

                        {report.image && (
                          <div className="um-report-img-wrap">
                            <img
                              src={normalizeImageUrl(report.image)}
                              alt={report.specieName}
                              className="um-report-img"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          </div>
                        )}

                        <div className="um-report-meta">
                          <div className="um-meta-row">
                            <span className="um-meta-key">Health</span>
                            <span className="um-meta-val">{report.healthStatus}</span>
                          </div>
                          <div className="um-meta-row">
                            <span className="um-meta-key">Location</span>
                            <span className="um-meta-val">
                              {report.location?.latitude?.toFixed(4)}, {report.location?.longitude?.toFixed(4)}
                            </span>
                          </div>
                          <div className="um-meta-row">
                            <span className="um-meta-key">Date</span>
                            <span className="um-meta-val">
                              {new Date(report.timestamp || report.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <div className="um-meta-row">
                            <span className="um-meta-key">Comments</span>
                            <span className="um-meta-val">{report.commentsCount || 0}</span>
                          </div>
                          {report.flaggedBy && (
                            <div className="um-meta-row">
                              <span className="um-meta-key">Flagged By</span>
                              <span className="um-meta-val">
                                {report.flaggedBy} · {new Date(report.flaggedAt).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="um-report-footer">
                          <button
                            className="um-btn um-btn-danger-sm"
                            onClick={() => handleDeleteReport(report._id)}
                          >
                            🗑 Delete Report
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
        /* Users List */
        <>
          {users.length === 0 ? (
            <div className="um-empty">
              <div className="um-empty-icon">👥</div>
              <p>No users found for this filter.</p>
            </div>
          ) : (
            <div className="um-users-grid">
              {users.map((user) => (
                <div key={user._id} className="um-user-card">
                  <div className="um-user-card-accent" data-type={user.userType} />
                  <div className="um-user-card-body">
                    <div className="um-user-avatar">
                      {user.userType === 'researcher' ? '🔬' : '👤'}
                    </div>
                    <div className="um-user-info">
                      <h3 className="um-user-name">{user.username}</h3>
                      <p className="um-user-email">{user.email}</p>
                      <div className="um-badges">
                        <span className={`um-badge um-badge-${user.userType}`}>
                          {user.userType === 'researcher' ? 'Researcher' : 'Community'}
                        </span>
                        {user.userType === 'researcher' && (
                          <span className={`um-badge ${user.verified ? 'um-badge-verified' : 'um-badge-pending'}`}>
                            {user.verified ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="um-user-card-footer">
                    <span className="um-joined">
                      Joined {new Date(user.createdAt).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                    <div className="um-user-actions">
                      <button
                        className="um-btn um-btn-danger-outline um-btn-sm"
                        onClick={() => handleDeleteUser(user._id, user.username)}
                        disabled={deletingUser === user._id}
                        title="Delete User"
                      >
                        🗑
                      </button>
                      <button
                        className="um-btn um-btn-primary um-btn-sm"
                        onClick={() => fetchUserDetails(user._id)}
                      >
                        View Profile →
                      </button>
                    </div>
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