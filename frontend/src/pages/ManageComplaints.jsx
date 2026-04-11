import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import api from '../services/api';

export default function ManageComplaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | pending | in_progress | resolved

  // Edit modal state
  const [editing, setEditing]       = useState(null);
  const [editForm, setEditForm]     = useState({ status: '', remarks: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]   = useState('');

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

  const filtered = filter === 'all'
    ? complaints
    : complaints.filter((c) => c.status === filter);

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
        <div className="page-header">
          <h1>Manage Complaints</h1>
          <p>Review and update the status of citizen grievances.</p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
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

        {loading ? (
          <div className="loading-center"><span className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No complaints found for this filter.</p>
          </div>
        ) : (
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
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', background: 'var(--surface-low)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>
                        {c.category}
                      </span>
                    </td>
                    <td><span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span></td>
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

              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-status">New Status</label>
                  <select
                    id="edit-status"
                    className="form-control"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-remarks">Remarks for Citizen (optional)</label>
                  <textarea
                    id="edit-remarks"
                    className="form-control"
                    rows={3}
                    placeholder="Add a note for the citizen about this update…"
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  />
                </div>
                {editError && <p className="form-error">{editError}</p>}
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
      </main>
      <Notification />
    </div>
  );
}
