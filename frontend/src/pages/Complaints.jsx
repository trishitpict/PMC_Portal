import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import api from '../services/api';

const CATEGORIES = ['Roads', 'Water Supply', 'Electricity', 'Garbage', 'Drainage', 'Street Lights', 'Other'];

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints/user');
      setComplaints(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchComplaints(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.category) { setFormError('Please select a category.'); return; }
    setSubmitting(true);
    try {
      await api.post('/complaints', form);
      setForm({ title: '', description: '', category: '' });
      setShowForm(false);
      fetchComplaints();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="section-header">
          <div className="page-header" style={{ margin: 0 }}>
            <h1>My Complaints</h1>
            <p>Track the status of your submitted grievances.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Complaint
          </button>
        </div>

        {/* Create Modal */}
        {showForm && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>File a New Complaint</h3>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="c-title">Title</label>
                  <input
                    id="c-title" className="form-control"
                    placeholder="e.g. Pothole near Katraj chowk"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="c-category">Category</label>
                  <select
                    id="c-category" className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option value="">— Select category —</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="c-desc">Description</label>
                  <textarea
                    id="c-desc" className="form-control"
                    rows={3}
                    placeholder="Describe the issue in detail…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                  />
                </div>
                {formError && <p className="form-error">{formError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? <span className="spinner" /> : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="loading-center"><span className="spinner" /></div>
        ) : complaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>You haven't filed any complaints yet.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
              + File Your First Complaint
            </button>
          </div>
        ) : (
          <div className="complaint-list">
            {complaints.map((c) => (
              <div className="complaint-card" key={c._id}>
                <div className="meta">
                  <span className={`badge badge-${c.status}`}>{c.status.replace('_', ' ')}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)', background: 'var(--surface-low)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>{c.category}</span>
                </div>
                <h4>{c.title}</h4>
                <p>{c.description}</p>
                {c.remarks && (
                  <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}>
                    <strong>Remarks:</strong> {c.remarks}
                  </div>
                )}
                <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-var)' }}>
                  Filed on {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
      <Notification />
    </div>
  );
}
