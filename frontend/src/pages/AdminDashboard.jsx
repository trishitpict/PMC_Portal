import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SkeletonStatCard, SkeletonRow } from '../components/SkeletonLoader.jsx';
import api from '../services/api';
import { connectSocket } from '../socket/socket';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connectSocket(user._id, user.area);
    api.get('/complaints/all')
      .then(({ data }) => setComplaints(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const total      = complaints.length;
  const pending    = complaints.filter((c) => c.status === 'pending').length;
  const inProgress = complaints.filter((c) => c.status === 'in_progress').length;
  const resolved   = complaints.filter((c) => c.status === 'resolved').length;

  // Last 5 complaints for the overview table
  const recent = complaints.slice(0, 5);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, <strong>{user.name}</strong>. Here's today's overview.</p>
        </div>

        {/* Stat cards */}
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
                <span className="stat-value">{total}</span>
                <span className="stat-sub">All time</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Pending</span>
                <span className="stat-value" style={{ color: '#783100' }}>{pending}</span>
                <span className="stat-sub">Needs attention</span>
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

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => navigate('/admin/complaints')}>
            📋 Manage Complaints
          </button>
          <button className="btn-secondary" onClick={() => navigate('/admin/announcements')}>
            📢 Create Announcement
          </button>
        </div>

        {/* Recent complaints overview */}
        <div className="section-header">
          <h3 className="section-title" style={{ margin: 0 }}>Recent Complaints</h3>
          <button className="btn-secondary btn-sm" onClick={() => navigate('/admin/complaints')}>
            View all
          </button>
        </div>

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
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonRow key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : recent.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No complaints submitted yet.</p>
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
                </tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c._id} style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/complaints')}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{c.userId?.name ?? '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)' }}>{c.userId?.email ?? ''}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--on-surface-var)' }}>{c.userId?.area ?? '—'}</td>
                    <td style={{ maxWidth: 180 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>{c.title}</div>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Notification />
    </div>
  );
}
