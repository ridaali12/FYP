import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import { analyzeContent } from '../utils/contentAnalyzer';

const ReportManagement = ({ admin }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, flagged, spam, inappropriate
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      let endpoint;
      if (filter === 'flagged') {
        endpoint = ADMIN_ENDPOINTS.flaggedReports;
      } else {
        endpoint = ADMIN_ENDPOINTS.allReports;
      }

      const response = await axios.get(endpoint);
      let reportsData = response.data.reports || [];

      // Filter by type if needed
      if (filter === 'spam') {
        // include reports already marked spam as well as those the analyzer flagged
        reportsData = reportsData.filter((r) => r.isSpam || r.analysis?.spam);
      } else if (filter === 'inappropriate') {
        reportsData = reportsData.filter((r) => r.isInappropriate || r.analysis?.inappropriate);
      }
      // note: auto‑analysis results are only used for display and not stored server‑side

      // run analysis on each report text to offer a hint to admin
      const analysed = await Promise.all(
        reportsData.map(async (r) => {
          const textToCheck = r.specieName || ''; // could extend to comments or other fields
          const result = await analyzeContent(textToCheck);
          return { ...r, analysis: result };
        })
      );

      setReports(analysed);
      setError('');
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFlagSpam = async (reportId) => {
    if (!window.confirm('Mark this report as spam?')) return;

    try {
      await axios.post(ADMIN_ENDPOINTS.flagSpam(reportId), {
        adminUsername: admin.username,
      });
      alert('Report marked as spam');
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to flag report');
    }
  };

  const handleFlagInappropriate = async (reportId) => {
    if (!window.confirm('Mark this report as inappropriate?')) return;

    try {
      await axios.post(ADMIN_ENDPOINTS.flagInappropriate(reportId), {
        adminUsername: admin.username,
      });
      alert('Report marked as inappropriate');
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to flag report');
    }
  };

  const handleDelete = async (reportId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this report? This action cannot be undone.'
      )
    )
      return;

    try {
      const response = await axios.delete(ADMIN_ENDPOINTS.deleteReport(reportId), {
        data: { adminUsername: admin.username },
      });
      
      // Show success message as per UC-17 requirement
      alert('Report removed successfully');
      fetchReports();
    } catch (err) {
      // Show error message as per UC-17 alternative scenario requirement
      const errorMessage = err.response?.data?.message || 'Unable to remove content at this time.';
      alert(errorMessage);
      console.error('Error deleting report:', err);
    }
  };

  const handleUnflag = async (reportId) => {
    if (!window.confirm('Remove flags from this report?')) return;

    try {
      await axios.post(ADMIN_ENDPOINTS.unflagReport(reportId), {
        adminUsername: admin.username,
      });
      alert('Report flags removed');
      fetchReports();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unflag report');
    }
  };

  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }
    const API_BASE = ADMIN_ENDPOINTS.allReports.replace('/api/admin/reports/all', '');
    if (imageUrl.startsWith('/')) {
      return `${API_BASE}${imageUrl}`;
    }
    return `${API_BASE}/${imageUrl}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="report-management">
      <div className="section-header">
        <h2>Report Management</h2>
        <button onClick={fetchReports} className="refresh-btn">
          Refresh
        </button>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('all')}
        >
          All Reports ({reports.length})
        </button>
        <button
          className={filter === 'flagged' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('flagged')}
        >
          Flagged
        </button>
        <button
          className={filter === 'spam' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('spam')}
        >
          Spam
        </button>
        <button
          className={filter === 'inappropriate' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilter('inappropriate')}
        >
          Inappropriate
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {reports.length === 0 ? (
        <div className="empty-state">
          <p>No reports found</p>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => (
            <div
              key={report._id}
              className={`report-card ${
                report.isSpam || report.isInappropriate ? 'flagged' : ''
              }`}
            >
              <div className="report-header">
                <h3>{report.specieName}</h3>
                <div className="report-badges">
                  {report.isSpam && <span className="badge spam">Spam</span>}
                  {report.isInappropriate && (
                    <span className="badge inappropriate">Inappropriate</span>
                  )}
                  {/* hints from external analyzer; do not auto‑flag, just inform */}
                  {report.analysis?.spam && !report.isSpam && (
                    <span className="badge spam" title="Auto‑detected spam">
                      Auto‑Spam
                    </span>
                  )}
                  {report.analysis?.inappropriate && !report.isInappropriate && (
                    <span className="badge inappropriate" title="Auto‑detected inappropriate">
                      Auto‑Inappropriate
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
                  <strong>Reported By:</strong> {report.username}
                </div>
                <div className="info-row">
                  <strong>Location:</strong> {report.location?.latitude?.toFixed(5)},{' '}
                  {report.location?.longitude?.toFixed(5)}
                </div>
                <div className="info-row">
                  <strong>Reported At:</strong> {report.timestamp}
                </div>
                {report.flaggedBy && (
                  <div className="info-row">
                    <strong>Flagged By:</strong> {report.flaggedBy} (
                    {new Date(report.flaggedAt).toLocaleString()})
                  </div>
                )}
                <div className="info-row">
                  <strong>Comments:</strong> {report.commentsCount || 0}
                </div>
              </div>

              <div className="report-actions">
                {report.isSpam || report.isInappropriate ? (
                  <button
                    className="btn-unflag"
                    onClick={() => handleUnflag(report._id)}
                  >
                    ✅ Unflag
                  </button>
                ) : (
                  <>
                    <button
                      className="btn-flag-spam"
                      onClick={() => handleFlagSpam(report._id)}
                    >
                      ⚠️ Mark as Spam
                    </button>
                    <button
                      className="btn-flag-inappropriate"
                      onClick={() => handleFlagInappropriate(report._id)}
                    >
                      🚫 Mark Inappropriate
                    </button>
                  </>
                )}
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(report._id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
