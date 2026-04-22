import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SkeletonRow } from '../components/SkeletonLoader.jsx';
import api from '../services/api';
import { SERVER_BASE_URL } from '../services/runtimeConfig';

const COMPLAINT_CATEGORIES = [
  'Roads',
  'Water Supply',
  'Electricity',
  'Garbage',
  'Drainage',
  'Street Lights',
  'Other',
];

export default function ManageComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | in_progress | resolved
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit modal state
  const [editing, setEditing]       = useState(null);
  const [editForm, setEditForm]     = useState({ status: '', remarks: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]   = useState('');

  // Report modal state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportRange, setReportRange] = useState('last30');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportAllCategories, setReportAllCategories] = useState(true);
  const [reportCategories, setReportCategories] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [reportMessage, setReportMessage] = useState('');

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/complaints/all');
      setComplaints(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const openEdit = (c) => {
    setEditing(c);
    setEditForm({ status: c.status, remarks: c.remarks || '' });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditLoading(true);
    try {
      await api.put(`/complaints/${editing._id}`, editForm);
      setEditing(null);
      fetchComplaints();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Update failed.');
    } finally { setEditLoading(false); }
  };

  const openReportModal = () => {
    setReportError('');
    setReportMessage('');
    setReportOpen(true);
  };

  const toggleReportCategory = (category) => {
    setReportCategories((prev) => (
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
    ));
  };

  const extractReportErrorMessage = async (error) => {
    const fallback = 'Failed to generate report';

    if (error?.response?.data && typeof error.response.data === 'object' && !('text' in error.response.data)) {
      return error.response.data.message || fallback;
    }

    if (error?.response?.data && typeof error.response.data.text === 'function') {
      try {
        const text = await error.response.data.text();
        if (!text) return fallback;
        try {
          const parsed = JSON.parse(text);
          return parsed.message || fallback;
        } catch {
          return text;
        }
      } catch {
        return fallback;
      }
    }

    return error?.message || fallback;
  };

  const handleReportDownload = async (e) => {
    e.preventDefault();
    setReportError('');
    setReportMessage('');

    if (reportRange === 'custom') {
      if (!reportFrom || !reportTo) {
        setReportError('Select both start and end time for custom range.');
        return;
      }
      if (new Date(reportFrom) > new Date(reportTo)) {
        setReportError('Start time cannot be after end time.');
        return;
      }
    }

    if (!reportAllCategories && reportCategories.length === 0) {
      setReportError('Select at least one category or choose All categories.');
      return;
    }

    setReportLoading(true);
    try {
      const params = { range: reportRange };
      if (reportRange === 'custom') {
        params.from = new Date(reportFrom).toISOString();
        params.to = new Date(reportTo).toISOString();
      }

      if (reportAllCategories) {
        params.categories = 'all';
      } else {
        params.categories = reportCategories.join(',');
      }

      const response = await api.get('/complaints/report', {
        params,
        responseType: 'blob',
      });

      const disposition = response.headers?.['content-disposition'] || '';
      const fileNameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const fileName = fileNameMatch
        ? fileNameMatch[1]
        : `complaints-report-${new Date().toISOString().slice(0, 10)}.csv`;

      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setReportMessage(`Report downloaded: ${fileName}`);
      setReportOpen(false);
    } catch (error) {
      const message = await extractReportErrorMessage(error);
      setReportError(message);
    } finally {
      setReportLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let result = filter === 'all'
      ? complaints
      : complaints.filter((c) => c.status === filter);

    if (categoryFilter !== 'all') {
      result = result.filter((c) => c.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.userId?.name?.toLowerCase().includes(query) ||
        c.userId?.email?.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [complaints, filter, categoryFilter, searchQuery]);

  useEffect(() => {
    if (reportAllCategories) {
      setReportCategories([]);
    }
  }, [reportAllCategories]);

  const counts = {
    all:         complaints.length,
    pending:     complaints.filter((c) => c.status === 'pending').length,
    in_progress: complaints.filter((c) => c.status === 'in_progress').length,
    resolved:    complaints.filter((c) => c.status === 'resolved').length,
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
        <div className="page-header">
          <h1>Manage Complaints</h1>
          <p>Review and update the status of citizen grievances.</p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'all',         label: `All (${counts.all})` },
              { key: 'pending',     label: `Pending (${counts.pending})` },
              { key: 'in_progress', label: `In Progress (${counts.in_progress})` },
              { key: 'resolved',    label: `Resolved (${counts.resolved})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={filter === key ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="btn-primary" onClick={openReportModal}>
            Download Complaints Report
          </button>
        </div>

        {/* Category + Search */}
        {complaints.length > 0 && (
          <div className="filter-bar" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'grid', gap: '0.35rem' }}>
              <label htmlFor="manage-category-filter" style={{ fontSize: '0.8rem', color: 'var(--on-surface-var)' }}>
                Category
              </label>
              <select
                id="manage-category-filter"
                className="form-control"
                style={{ minWidth: '190px' }}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter by complaint category"
              >
                <option value="all">All categories</option>
                {COMPLAINT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gap: '0.35rem', flex: 1, minWidth: '240px', maxWidth: '420px' }}>
              <label htmlFor="manage-search-filter" style={{ fontSize: '0.8rem', color: 'var(--on-surface-var)' }}>
                Search
              </label>
              <div className="search-box" style={{ width: '100%' }}>
                <input
                  id="manage-search-filter"
                  type="text"
                  className="form-control"
                  placeholder="Search by name, email, title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search complaints"
                />
              </div>
            </div>
            {searchQuery && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            )}
            {categoryFilter !== 'all' && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => setCategoryFilter('all')}
              >
                Clear Category
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Citizen</th>
                  <th>Area</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Filed</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>
              {searchQuery || filter !== 'all' || categoryFilter !== 'all'
                ? 'No complaints match your filters.'
                : 'No complaints submitted yet.'}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-var)', marginBottom: '1rem' }}>
              Showing <strong>{filtered.length}</strong> of <strong>{complaints.length}</strong> complaints
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Citizen</th>
                    <th>Area</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Filed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c._id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.userId?.name ?? '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)' }}>{c.userId?.email ?? ''}</div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--on-surface-var)' }}>{c.userId?.area ?? '—'}</td>
                      <td style={{ maxWidth: 200 }}>
                        <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{c.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)' }}>
                          {c.description.substring(0, 55)}{c.description.length > 55 ? '…' : ''}
                        </div>
                        {c.images && c.images.length > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                            📷 {c.images.length} image{c.images.length > 1 ? 's' : ''}
                          </div>
                        )}
                        {c.location?.coordinates?.latitude && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 500 }}>
                            📍 {c.location.address || `${c.location.coordinates.latitude.toFixed(4)}, ${c.location.coordinates.longitude.toFixed(4)}`}
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.78rem', background: 'var(--surface-low)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                          {c.category}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${c.status}`}>
                          <span className={`status-dot ${c.status}`}></span>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--on-surface-var)', whiteSpace: 'nowrap' }}>
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td>
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}>
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Update Status Modal */}
        {editing && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>Update Complaint Status</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-var)', marginBottom: '1rem' }}>
                <strong>{editing.title}</strong>
                <br />
                <span style={{ fontSize: '0.8rem' }}>by {editing.userId?.name} · {editing.userId?.area}</span>
              </p>

              <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {editing.description}
              </div>

              {editing.images && editing.images.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Attached Images</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {editing.images.map((image, index) => (
                      <img
                        key={index}
                        src={`${SERVER_BASE_URL}${image}`}
                        alt={`Complaint image ${index + 1}`}
                        style={{
                          width: '100px',
                          height: '100px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--outline)',
                          cursor: 'pointer'
                        }}
                        onClick={() => window.open(`${SERVER_BASE_URL}${image}`, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-status">New Status <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select
                    id="edit-status"
                    className="form-control"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    aria-label="Update complaint status"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-remarks">Remarks for Citizen (optional)</label>
                  <p className="form-hint">Citizens will be notified of status changes and read these remarks.</p>
                  <textarea
                    id="edit-remarks"
                    className="form-control"
                    rows={3}
                    placeholder="Add a note for the citizen about this update…"
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  />
                </div>
                {editError && <div className="info-box" style={{ background: 'rgba(186, 26, 26, 0.05)', borderLeftColor: 'var(--error)' }}>{editError}</div>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={editLoading}>
                    {editLoading ? <span className="spinner" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Report Modal */}
        {reportOpen && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>Generate Complaints CSV Report</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-var)', marginBottom: '1rem' }}>
                Choose time range and category selection for export.
              </p>

              <form onSubmit={handleReportDownload}>
                <div className="form-group">
                  <label htmlFor="report-range">Time Range</label>
                  <select
                    id="report-range"
                    className="form-control"
                    value={reportRange}
                    onChange={(e) => setReportRange(e.target.value)}
                    aria-label="Select report time range"
                  >
                    <option value="all">All time</option>
                    <option value="today">Today</option>
                    <option value="last7">Last 7 days</option>
                    <option value="last30">Last 30 days</option>
                    <option value="custom">Custom time range</option>
                  </select>
                </div>

                {reportRange === 'custom' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="report-from">Start time</label>
                      <input
                        id="report-from"
                        type="datetime-local"
                        className="form-control"
                        value={reportFrom}
                        onChange={(e) => setReportFrom(e.target.value)}
                        max={reportTo || undefined}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label htmlFor="report-to">End time</label>
                      <input
                        id="report-to"
                        type="datetime-local"
                        className="form-control"
                        value={reportTo}
                        onChange={(e) => setReportTo(e.target.value)}
                        min={reportFrom || undefined}
                      />
                    </div>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={reportAllCategories}
                      onChange={(e) => setReportAllCategories(e.target.checked)}
                    />
                    All categories
                  </label>
                  <p className="form-hint">Turn off to select one or multiple categories.</p>
                </div>

                {!reportAllCategories && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setReportCategories([])}
                      >
                        Clear all
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {COMPLAINT_CATEGORIES.map((category) => (
                        <label
                          key={category}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            border: '1px solid var(--outline)',
                            borderRadius: 999,
                            padding: '0.35rem 0.7rem',
                            fontSize: '0.8rem',
                            background: 'var(--surface)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={reportCategories.includes(category)}
                            onChange={() => toggleReportCategory(category)}
                          />
                          {category}
                        </label>
                      ))}
                    </div>

                    <p className="form-hint" style={{ marginTop: '0.6rem' }}>
                      {reportCategories.length} categories selected.
                    </p>
                  </div>
                )}

                {reportError && <div className="info-box" style={{ background: 'rgba(186, 26, 26, 0.05)', borderLeftColor: 'var(--error)' }}>{reportError}</div>}
                {!reportError && reportMessage && <div className="info-box" style={{ borderLeftColor: 'var(--success)' }}>{reportMessage}</div>}

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" disabled={reportLoading} onClick={() => setReportOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={reportLoading}>
                    {reportLoading ? 'Generating CSV...' : 'Download CSV'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Notification />
    </div>
  );
}
