import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SkeletonCard } from '../components/SkeletonLoader.jsx';
import api from '../services/api';
import { AREAS } from '../data/areas';

export default function CreateAnnouncement() {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: '', content: '', areas: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [validation, setValidation] = useState({ title: '', content: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState('');

  const fetchAnnouncements = async () => {
    setAnnouncementsLoading(true);
    try {
      const { data } = await api.get('/announcements/admin/all');
      setAnnouncements(data);
    } catch (e) {
      console.error(e);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (name === 'title') {
      setValidation({ ...validation, title: value && value.trim().length < 5 ? 'Title must be at least 5 characters' : '' });
    } else if (name === 'content') {
      setValidation({ ...validation, content: value && value.trim().length < 10 ? 'Content must be at least 10 characters' : '' });
    }
  };

  const handleAreaChange = (area) => {
    setForm((prev) => {
      if (prev.areas.includes(area)) {
        return { ...prev, areas: prev.areas.filter((a) => a !== area) };
      } else {
        return { ...prev, areas: [...prev.areas, area] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.areas.length === 0) {
      setError('Please select at least one target area.');
      return;
    }
    if (validation.title || validation.content) {
      setError('Please fix validation errors.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/announcements', form);
      setAnnouncements((prev) => [data, ...prev]);
      setForm({ title: '', content: '', areas: [] });
      setValidation({ title: '', content: '' });
      setSuccess(`Announcement published to ${data.areas.length} area(s)!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish announcement.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete announcement.');
    }
  };

  const filteredAnnouncements = useMemo(() => {
    let filtered = announcements;

    if (filterArea) {
      filtered = filtered.filter((a) => a.areas.includes(filterArea));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((a) =>
        a.title.toLowerCase().includes(query) ||
        a.content.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [announcements, filterArea, searchQuery]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
        <div className="page-header">
          <h1>Create Announcement</h1>
          <p>Publish official notices to citizens in specific areas.</p>
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
                  id="ann-title"
                  name="title"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Water supply disruption in Baner"
                  value={form.title}
                  onChange={handleChange}
                  required
                />
                {validation.title && <p className="form-hint error">{validation.title}</p>}
              </div>

              <div className="form-group">
                <label><span style={{ color: 'var(--error)' }}>*</span> Target Areas (select multiple)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', maxHeight: '200px', overflowY: 'auto', padding: '0.5rem', border: '1px solid var(--outline)', borderRadius: 'var(--radius-sm)' }}>
                  {AREAS.map((area) => (
                    <label key={area} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={form.areas.includes(area)}
                        onChange={() => handleAreaChange(area)}
                        style={{ cursor: 'pointer' }}
                      />
                      {area}
                    </label>
                  ))}
                </div>
                {form.areas.length > 0 && (
                  <p className="form-hint">Selected: <strong>{form.areas.join(', ')}</strong></p>
                )}
                <p className="form-hint">Citizens in these areas will see the announcement.</p>
              </div>

              <div className={`form-group ${validation.content ? 'has-error' : ''}`}>
                <label htmlFor="ann-content">Content</label>
                <textarea
                  id="ann-content"
                  name="content"
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

          {/* All Announcements */}
          <div>
            <h3 className="section-title">All Announcements</h3>

            {announcements.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div className="search-box" style={{ flex: 1, minWidth: '150px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search announcements…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search announcements"
                  />
                </div>
                <select
                  className="form-control"
                  value={filterArea}
                  onChange={(e) => setFilterArea(e.target.value)}
                  style={{ maxWidth: '150px' }}
                  aria-label="Filter by area"
                >
                  <option value="">All Areas</option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
                {(searchQuery || filterArea) && (
                  <button
                    className="btn-secondary btn-sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterArea('');
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            {announcementsLoading ? (
              <div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-icon">📭</div>
                <p>
                  {searchQuery || filterArea
                    ? 'No announcements match your filters.'
                    : 'No announcements published yet.'}
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-var)', marginBottom: '1rem' }}>
                  Showing <strong>{filteredAnnouncements.length}</strong> of <strong>{announcements.length}</strong> announcements
                </p>
                <div className="announcement-list">
                  {filteredAnnouncements.map((a) => (
                    <div className="announcement-card" key={a._id} style={{ position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h4>{a.title}</h4>
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                      <p>{a.content}</p>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        {a.areas.map((area) => (
                          <span key={area} className="badge" style={{ background: 'var(--secondary-cont)', color: 'var(--on-secondary-cont)', fontSize: '0.75rem' }}>
                            {area}
                          </span>
                        ))}
                      </div>
                      <div className="ann-meta">
                        <span>📅 {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span>⏰ {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        {a.createdBy && <span>👤 {a.createdBy.name}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Notification />
    </div>
  );
}