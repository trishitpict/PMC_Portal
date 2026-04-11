import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import api from '../services/api';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/announcements')
      .then(({ data }) => setAnnouncements(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1>Announcements</h1>
          <p>Official notices and updates for <strong>{user.area}</strong>.</p>
        </div>

        {loading ? (
          <div className="loading-center"><span className="spinner" /></div>
        ) : announcements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No announcements for your area yet.</p>
          </div>
        ) : (
          <div className="announcement-list">
            {announcements.map((a) => (
              <div className="announcement-card" key={a._id}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
                  <h4>{a.title}</h4>
                  <span className="badge" style={{ background: 'var(--surface-high)', color: 'var(--on-surface-var)', flexShrink: 0 }}>{a.area}</span>
                </div>
                <p>{a.content}</p>
                <div className="ann-meta">
                  <span>📅 {new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Notification />
    </div>
  );
}
