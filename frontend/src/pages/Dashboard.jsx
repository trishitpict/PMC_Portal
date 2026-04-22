import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SkeletonStatCard, SkeletonCard } from '../components/SkeletonLoader.jsx';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../socket/socket';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleMobileLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  useEffect(() => {
    connectSocket(user._id, user.area);

    const fetchData = async () => {
      try {
        const [cRes, aRes] = await Promise.all([
          api.get('/complaints/user'),
          api.get('/announcements'),
        ]);
        setComplaints(cRes.data);
        setAnnouncements(aRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const pending     = complaints.filter((c) => c.status === 'pending').length;
  const inProgress  = complaints.filter((c) => c.status === 'in_progress').length;
  const resolved    = complaints.filter((c) => c.status === 'resolved').length;

  const recent = complaints.slice(0, 3);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
        <div className="page-header dashboard-mobile-header">
          <button
            type="button"
            className="btn-secondary btn-sm dashboard-mobile-logout"
            onClick={handleMobileLogout}
            aria-label="Logout"
          >
            Logout
          </button>
          <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p>Here's an overview of your complaints and local announcements in <strong>{user.area}</strong>.</p>
        </div>

        {/* Stats */}
        <div className="card-grid">
          {loading ? (
            <>
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
              <SkeletonStatCard />
            </>
          ) : (
            <>
              <div className="stat-card">
                <span className="stat-label">Total Complaints</span>
                <span className="stat-value">{complaints.length}</span>
                <span className="stat-sub">Submitted by you</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pending</span>
                <span className="stat-value" style={{ color: '#783100' }}>{pending}</span>
                <span className="stat-sub">Awaiting action</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">In Progress</span>
                <span className="stat-value" style={{ color: 'var(--on-secondary-cont)' }}>{inProgress}</span>
                <span className="stat-sub">Being addressed</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Resolved</span>
                <span className="stat-value" style={{ color: 'var(--success)' }}>{resolved}</span>
                <span className="stat-sub">Completed</span>
              </div>
            </>
          )}
        </div>

        <div className="split-grid-2">
          {/* Recent complaints */}
          <div>
            <div className="section-header">
              <h3 className="section-title" style={{ margin: 0 }}>Recent Complaints</h3>
              <button className="btn-secondary btn-sm" onClick={() => navigate('/complaints')}>View all</button>
            </div>
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : recent.length === 0 ? (
              <div className="empty-state">
                <p>No complaints yet.</p>
                <button className="btn-primary btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => navigate('/complaints')}>File one</button>
              </div>
            ) : (
              <div className="complaint-list">
                {recent.map((c) => (
                  <div className="complaint-card" key={c._id}>
                    <div className="meta">
                      <span className={`badge badge-${c.status}`}>
                        <span className={`status-dot ${c.status}`}></span>
                        {c.status.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)' }}>{c.category}</span>
                    </div>
                    <h4>{c.title}</h4>
                    <p>{c.description.substring(0, 80)}{c.description.length > 80 ? '…' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Latest announcements */}
          <div>
            <div className="section-header">
              <h3 className="section-title" style={{ margin: 0 }}>Latest Announcements</h3>
              <button className="btn-secondary btn-sm" onClick={() => navigate('/announcements')}>View all</button>
            </div>
            {loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : announcements.slice(0, 3).length === 0 ? (
              <div className="empty-state"><p>No announcements for {user.area} yet.</p></div>
            ) : (
              <div className="announcement-list">
                {announcements.slice(0, 3).map((a) => (
                  <div className="announcement-card" key={a._id}>
                    <h4>{a.title}</h4>
                    <p>{a.content.substring(0, 100)}{a.content.length > 100 ? '…' : ''}</p>
                    <div className="ann-meta">
                      <span>{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
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
