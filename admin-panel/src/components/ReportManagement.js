import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ADMIN_ENDPOINTS } from '../config/api';
import { analyzeContent } from '../utils/contentAnalyzer';

const styles = `
  .report-management {
    padding: 16px 20px;
    max-width: 860px;
    margin: 0 auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1a1a2e;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 14px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e8eaf0;
  }

  .section-header h2 {
    font-size: 17px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }

  .refresh-btn {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    color: #4f5b93;
    background: #f0f1f8;
    border: 1px solid #dde0f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .refresh-btn:hover { background: #e4e6f5; }

  .filter-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 14px;
    background: #f5f6fb;
    padding: 4px;
    border-radius: 8px;
    width: fit-content;
  }

  .filter-btn {
    padding: 5px 13px;
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .filter-btn:hover { color: #374151; background: #eceef8; }

  .filter-btn.active {
    color: #1a1a2e;
    background: #ffffff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.10);
  }

  .error-message {
    background: #fff0f0;
    color: #b91c1c;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 9px 13px;
    font-size: 13px;
    margin-bottom: 12px;
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: #9ca3af;
    font-size: 13px;
    background: #f9fafb;
    border-radius: 10px;
    border: 1px dashed #e5e7eb;
  }

  .loading-container {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    color: #9ca3af;
    font-size: 13px;
  }

  .reports-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .report-card {
    background: #ffffff;
    border: 1px solid #e8eaf0;
    border-radius: 10px;
    padding: 13px 15px;
    transition: box-shadow 0.15s ease;
  }

  .report-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.06); }

  .report-card.flagged {
    border-left: 3px solid #f87171;
    background: #fffafa;
  }

  .report-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }

  .report-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a2e;
    margin: 0;
  }

  .report-badges {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .badge.spam {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }

  .badge.inappropriate {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .report-image-container {
    margin-bottom: 10px;
    border-radius: 6px;
    overflow: hidden;
    background: #f3f4f6;
    width: 180px;
    height: 130px;
  }

  .report-image {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    border-radius: 6px;
  }

  .report-info {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px 12px;
    margin-bottom: 10px;
    padding: 10px 12px;
    background: #f8f9fc;
    border-radius: 7px;
    border: 1px solid #eef0f8;
  }

  .info-row {
    font-size: 12px;
    color: #374151;
    line-height: 1.4;
  }

  .info-row strong {
    color: #9ca3af;
    font-weight: 500;
    display: block;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-bottom: 1px;
  }

  .card-body {
    display: flex;
    gap: 14px;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .report-actions {
    display: flex;
    justify-content: flex-end;
    padding-top: 10px;
    border-top: 1px solid #f0f1f8;
  }

  .btn-delete {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    font-size: 12px;
    font-weight: 500;
    color: #b91c1c;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-delete:hover { background: #fee2e2; border-color: #f87171; }
  .btn-delete:active { transform: scale(0.98); }

  @media (max-width: 600px) {
    .report-info { grid-template-columns: 1fr 1fr; }
    .filter-tabs { width: 100%; }
    .section-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  }
`;

const ReportManagement = ({ admin }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const endpoint =
        filter === 'flagged'
          ? ADMIN_ENDPOINTS.flaggedReports
          : ADMIN_ENDPOINTS.allReports;

      const response = await axios.get(endpoint);
      let reportsData = response.data.reports || [];

      if (filter === 'spam') {
        reportsData = reportsData.filter((r) => r.isSpam || r.analysis?.spam);
      } else if (filter === 'inappropriate') {
        reportsData = reportsData.filter(
          (r) => r.isInappropriate || r.analysis?.inappropriate
        );
      }

      const analysed = await Promise.all(
        reportsData.map(async (r) => {
          const result = await analyzeContent(r.specieName || '');
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

  const handleDelete = async (reportId) => {
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
      fetchReports();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || 'Unable to remove content at this time.';
      alert(errorMessage);
      console.error('Error deleting report:', err);
    }
  };

  const normalizeImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))
      return imageUrl;
    if (imageUrl.startsWith('data:image')) return imageUrl;
    const API_BASE = ADMIN_ENDPOINTS.allReports.replace(
      '/api/admin/reports/all',
      ''
    );
    return imageUrl.startsWith('/')
      ? `${API_BASE}${imageUrl}`
      : `${API_BASE}/${imageUrl}`;
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="loading-container">
          <p>Loading reports...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="report-management">
        <div className="section-header">
          <h2>Report Management</h2>
          <button onClick={fetchReports} className="refresh-btn">
            ↻ Refresh
          </button>
        </div>

        <div className="filter-tabs">
          {['all', 'flagged', 'spam', 'inappropriate'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all'
                ? `All (${reports.length})`
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
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
                    {report.isSpam && (
                      <span className="badge spam">Spam</span>
                    )}
                    {report.isInappropriate && (
                      <span className="badge inappropriate">
                        Inappropriate
                      </span>
                    )}
                    {report.analysis?.spam && !report.isSpam && (
                      <span className="badge spam" title="Auto-detected spam">
                        Auto-Spam
                      </span>
                    )}
                    {report.analysis?.inappropriate &&
                      !report.isInappropriate && (
                        <span
                          className="badge inappropriate"
                          title="Auto-detected inappropriate"
                        >
                          Auto-Inappropriate
                        </span>
                      )}
                  </div>
                </div>

                <div className="card-body">
                  {report.image && (
                    <div className="report-image-container">
                      <img
                        src={normalizeImageUrl(report.image)}
                        alt={report.specieName}
                        className="report-image"
                        onError={(e) => {
                          e.target.parentElement.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="report-info" style={{ flex: 1, marginBottom: 0 }}>
                    <div className="info-row">
                      <strong>Health Status</strong>
                      {report.healthStatus}
                    </div>
                    <div className="info-row">
                      <strong>Reported By</strong>
                      {report.username}
                    </div>
                    <div className="info-row">
                      <strong>Location</strong>
                      {report.location?.latitude?.toFixed(5)},{' '}
                      {report.location?.longitude?.toFixed(5)}
                    </div>
                    <div className="info-row">
                      <strong>Reported At</strong>
                      {report.timestamp}
                    </div>
                    {report.flaggedBy && (
                      <div className="info-row">
                        <strong>Flagged By</strong>
                        {report.flaggedBy} (
                        {new Date(report.flaggedAt).toLocaleString()})
                      </div>
                    )}
                    <div className="info-row">
                      <strong>Comments</strong>
                      {report.commentsCount || 0}
                    </div>
                    <div className="info-row">
                      <strong>Weather</strong>
                      {report.weatherConditions?.temperature
                        ? report.weatherConditions.temperature
                        : 'N/A'}
                    </div>
                  </div>
                </div>

                <div className="report-actions">
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(report._id)}
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
  );
};

export default ReportManagement;