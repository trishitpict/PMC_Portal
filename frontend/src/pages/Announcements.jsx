import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SkeletonCard } from '../components/SkeletonLoader.jsx';
import api from '../services/api';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/announcements')
      .then(({ data }) => setAnnouncements(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery) return announcements;
    const query = searchQuery.toLowerCase();
    return announcements.filter(a =>
      a.title.toLowerCase().includes(query) ||
      a.content.toLowerCase().includes(query)
    );
  }, [announcements, searchQuery]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
        <div className="page-header">
          <h1>Announcements</h1>
          <p>Official notices and updates for <strong>{user.area}</strong>.</p>
        </div>

        {/* Search */}
        {announcements.length > 0 && (
          <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
            <div className="search-box" style={{ flex: 1, maxWidth: '350px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search announcements"
              />
            </div>
            {searchQuery && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div>
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>
              {searchQuery
                ? 'No announcements match your search.'
                : `No announcements for ${user.area} yet.`}
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-var)', marginBottom: '1rem' }}>
              Showing <strong>{filteredAnnouncements.length}</strong> of <strong>{announcements.length}</strong> announcements
            </p>
            <div className="announcement-list">
              {filteredAnnouncements.map((a) => (
                <div className="announcement-card" key={a._id}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <h4>{a.title}</h4>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {a.areas && a.areas.map((area) => (
                        <span key={area} className="badge" style={{ background: 'var(--secondary-cont)', color: 'var(--on-secondary-cont)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p>{a.content}</p>
                  <div className="ann-meta">
                    <span>📅 {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    <span>⏰ {new Date(a.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Notification />
    </div>
  );
}
