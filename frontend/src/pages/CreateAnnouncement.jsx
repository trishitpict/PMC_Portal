import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import api from '../services/api';
import { AREAS } from '../data/areas';

export default function CreateAnnouncement() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', content: '', area: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [published, setPublished] = useState([]);
  const [validation, setValidation] = useState({ title: '', content: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'title') {
      setValidation({ ...validation, title: value && value.trim().length < 5 ? 'Title must be at least 5 characters' : '' });
    } else if (name === 'content') {
      setValidation({ ...validation, content: value && value.trim().length < 10 ? 'Content must be at least 10 characters' : '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.area) { setError('Please select a target area.'); return; }
    if (validation.title || validation.content) { setError('Please fix validation errors.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/announcements', form);
      setPublished((prev) => [data, ...prev]);
      setForm({ title: '', content: '', area: '' });
      setValidation({ title: '', content: '' });
      setSuccess(`Announcement published to ${data.area}!`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish announcement.');
    } finally { setLoading(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
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
              <div className={`form-group ${validation.title ? 'has-error' : ''}`}>
                <label htmlFor="ann-title">Title</label>
                <input
                  id="ann-title" name="title" type="text"
                  className="form-control"
                  placeholder="e.g. Water supply disruption in Baner"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
                {validation.title && <p className="form-hint error">{validation.title}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="ann-area">Target Area <span style={{ color: 'var(--error)' }}>*</span></label>
                <select
                  id="ann-area" name="area"
                  className="form-control"
                  value={form.area}
                  onChange={handleChange}
                  aria-label="Select target area"
                >
                  <option value="">— Select area —</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <p className="form-hint">Only citizens in this area will see the announcement.</p>
              </div>

              <div className={`form-group ${validation.content ? 'has-error' : ''}`}>
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
                {validation.content && <p className="form-hint error">{validation.content}</p>}
              </div>

              {error && (
                <div className="info-box" style={{ background: 'rgba(186, 26, 26, 0.05)', borderLeftColor: 'var(--error)' }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="info-box" style={{ background: 'rgba(30, 126, 52, 0.05)', borderLeftColor: 'var(--success)' }}>
                  ✅ {success}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading || validation.title || validation.content}
              >
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <h4>{a.title}</h4>
                      <span className="badge" style={{ background: 'var(--secondary-cont)', color: 'var(--on-secondary-cont)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {a.area}
                      </span>
                    </div>
                    <p>{a.content}</p>
                    <div className="ann-meta">
                      <span>📅 {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      <span>⏰ {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
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