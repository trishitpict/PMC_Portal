import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import api from '../services/api';
import { AREAS } from '../data/areas';

export default function CreateAnnouncement() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', content: '', area: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [published, setPublished] = useState([]); // history in this session

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.area) { setError('Please select a target area.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/announcements', form);
      setPublished((prev) => [data, ...prev]); // prepend to local history
      setForm({ title: '', content: '', area: '' });
      setSuccess(`Announcement published to ${data.area}!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish announcement.');
    } finally { setLoading(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Create Announcement</h1>
          <p>Publish official notices to citizens in a specific area.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>

          {/* Form */}
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: '1.5rem', fontSize: '1.05rem' }}>
              📢 New Announcement
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="ann-title">Title</label>
                <input
                  id="ann-title" name="title" type="text"
                  className="form-control"
                  placeholder="e.g. Water supply disruption in Baner"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="ann-area">Target Area</label>
                <select
                  id="ann-area" name="area"
                  className="form-control"
                  value={form.area}
                  onChange={handleChange}
                >
                  <option value="">— Select area —</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <span style={{ fontSize: '0.78rem', color: 'var(--on-surface-var)', marginTop: '0.25rem' }}>
                  Only citizens in this area will see the announcement.
                </span>
              </div>

              <div className="form-group">
                <label htmlFor="ann-content">Content</label>
                <textarea
                  id="ann-content" name="content"
                  className="form-control"
                  rows={5}
                  placeholder="Write the full announcement details here…"
                  value={form.content}
                  onChange={handleChange}
                  required
                />
              </div>

              {error   && <p className="form-error">{error}</p>}
              {success && (
                <p style={{ color: 'var(--success)', fontSize: '0.88rem', marginBottom: '0.75rem' }}>
                  ✅ {success}
                </p>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
                {loading ? <span className="spinner" /> : '📢 Publish Announcement'}
              </button>
            </form>
          </div>

          {/* Published this session */}
          <div>
            <h3 className="section-title">Published This Session</h3>
            {published.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-icon">📭</div>
                <p>No announcements published yet.</p>
              </div>
            ) : (
              <div className="announcement-list">
                {published.map((a) => (
                  <div className="announcement-card" key={a._id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <h4>{a.title}</h4>
                      <span className="badge" style={{ background: 'var(--surface-high)', color: 'var(--on-surface-var)', flexShrink: 0 }}>
                        {a.area}
                      </span>
                    </div>
                    <p>{a.content}</p>
                    <div className="ann-meta">
                      <span>📅 {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Notification />
    </div>
  );
}
