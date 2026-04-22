import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import api from '../services/api';
import { connectSocket } from '../socket/socket';
import { AREAS } from '../data/areas';

const CATEGORIES = ['Roads', 'Water Supply', 'Electricity', 'Garbage', 'Drainage', 'Street Lights', 'Other'];

export default function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState('complaints');  // 'complaints' | 'announcements'
  const [complaints, setComplaints] = useState([]);
  const [loadingC, setLoadingC] = useState(true);

  // Update complaint modal
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', remarks: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Announcement form
  const [annForm, setAnnForm] = useState({ title: '', content: '', area: '' });
  const [annLoading, setAnnLoading] = useState(false);
  const [annError, setAnnError] = useState('');
  const [annSuccess, setAnnSuccess] = useState('');

  useEffect(() => {
    connectSocket(user._id, user.area);
    fetchComplaints();
  }, [user]);

  const fetchComplaints = async () => {
    setLoadingC(true);
    try {
      const { data } = await api.get('/complaints/all');
      setComplaints(data);
    } catch (e) { console.error(e); }
    finally { setLoadingC(false); }
  };

  // ── Stats ──────────────────────────────────────────
  const total      = complaints.length;
  const pending    = complaints.filter((c) => c.status === 'pending').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const resolved   = complaints.filter((c) => c.status === 'resolved').length;

  // ── Edit complaint ─────────────────────────────────
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

  // ── Create announcement ────────────────────────────
  const handleAnnSubmit = async (e) => {
    e.preventDefault();
    setAnnError(''); setAnnSuccess('');
    if (!annForm.area) { setAnnError('Please select an area.'); return; }
    setAnnLoading(true);
    try {
      await api.post('/announcements', annForm);
      setAnnForm({ title: '', content: '', area: '' });
      setAnnSuccess('Announcement published successfully!');
    } catch (err) {
      setAnnError(err.response?.data?.message || 'Failed to create announcement.');
    } finally { setAnnLoading(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Manage citizen grievances and publish area announcements.</p>
        </div>

        {/* Stats */}
        <div className="card-grid">
          <div className="stat-card"><span className="stat-label">Total Complaints</span><span className="stat-value">{total}</span></div>
          <div className="stat-card"><span className="stat-label">Pending</span><span className="stat-value" style={{ color: '#783100' }}>{pending}</span></div>
          <div className="stat-card"><span className="stat-label">In Progress</span><span className="stat-value" style={{ color: 'var(--on-secondary-cont)' }}>{inProgress}</span></div>
          <div className="stat-card"><span className="stat-label">Resolved</span><span className="stat-value" style={{ color: 'var(--success)' }}>{resolved}</span></div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button
            className={tab === 'complaints' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setTab('complaints')}
          >📋 Manage Complaints</button>
          <button
            className={tab === 'announcements' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
            onClick={() => setTab('announcements')}
          >📢 Create Announcement</button>
        </div>

        {/* ── Complaints Tab ── */}
        {tab === 'complaints' && (
          <>
            {loadingC ? (
              <div className="loading-center"><span className="spinner" /></div>
            ) : complaints.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📭</div><p>No complaints submitted yet.</p></div>
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
                    {complaints.map((c) => (
                      <tr key={c._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.userId?.name ?? '—'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)' }}>{c.userId?.email ?? ''}</div>
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--on-surface-var)' }}>{c.userId?.area ?? '—'}</td>
                        <td style={{ maxWidth: 200 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{c.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)' }}>{c.description.substring(0, 60)}…</div>
                        </td>
                        <td><span style={{ fontSize: '0.78rem', background: 'var(--surface-low)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>{c.category}</span></td>
                        <td><span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--on-surface-var)', whiteSpace: 'nowrap' }}>
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </td>
                        <td>
                          <button className="btn-secondary btn-sm" onClick={() => openEdit(c)}>Update</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Announcements Tab ── */}
        {tab === 'announcements' && (
          <div className="card" style={{ maxWidth: 600 }}>
            <h3 style={{ fontWeight: 600, marginBottom: '1.25rem' }}>Publish Announcement</h3>
            <form onSubmit={handleAnnSubmit}>
              <div className="form-group">
                <label htmlFor="ann-title">Title</label>
                <input
                  id="ann-title" className="form-control"
                  placeholder="e.g. Water supply disruption in Baner"
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="ann-area">Target Area</label>
                <select
                  id="ann-area" className="form-control"
                  value={annForm.area}
                  onChange={(e) => setAnnForm({ ...annForm, area: e.target.value })}
                >
                  <option value="">— Select area —</option>
                  {AREAS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="ann-content">Content</label>
                <textarea
                  id="ann-content" className="form-control" rows={4}
                  placeholder="Write the announcement details here…"
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  required
                />
              </div>
              {annError && <p className="form-error">{annError}</p>}
              {annSuccess && <p style={{ color: 'var(--success)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>✅ {annSuccess}</p>}
              <button type="submit" className="btn-primary" disabled={annLoading}>
                {annLoading ? <span className="spinner" /> : '📢 Publish Announcement'}
              </button>
            </form>
          </div>
        )}

        {/* Edit Complaint Modal */}
        {editing && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>Update Complaint Status</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--on-surface-var)', marginBottom: '1rem' }}>
                <strong>{editing.title}</strong> — {editing.userId?.name}
              </p>
              <form onSubmit={handleEditSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-status">Status</label>
                  <select
                    id="edit-status" className="form-control"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-remarks">Remarks (optional)</label>
                  <textarea
                    id="edit-remarks" className="form-control" rows={3}
                    placeholder="Add notes for the citizen…"
                    value={editForm.remarks}
                    onChange={(e) => setEditForm({ ...editForm, remarks: e.target.value })}
                  />
                </div>
                {editError && <p className="form-error">{editError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
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
