import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { disconnectSocket } from '../socket/socket';
import MobileCapsuleNav from './MobileCapsuleNav.jsx';

const CitizenLinks = [
  { path: '/dashboard',     label: 'Dashboard',         icon: '🏠' },
  { path: '/complaints',    label: 'My Complaints',      icon: '📋' },
  { path: '/announcements', label: 'Announcements',      icon: '📢' },
  { path: '/services',      label: 'Services & Contacts', icon: '🏛️' },
  { path: '/officers',      label: 'Officer Contacts',   icon: '👮' },
  { path: '/about-pune',    label: 'About Pune',         icon: 'ℹ️' },
];
const AdminLinks = [
  { path: '/admin',               label: 'Dashboard',          icon: '🏠' },
  { path: '/admin/complaints',    label: 'Manage Complaints',   icon: '📋' },
  { path: '/admin/announcements', label: 'Create Announcement', icon: '📢' },
  { path: '/admin/services',      label: 'Services & Contacts', icon: '🏛️' },
  { path: '/admin/officers',      label: 'Officer Contacts',    icon: '👮' },
  { path: '/about-pune',          label: 'About Pune',          icon: 'ℹ️' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const links = user?.role === 'admin' ? AdminLinks : CitizenLinks;

  const handleLogout = () => {
    disconnectSocket();
    logout();
    navigate('/login');
  };

  const NavItems = () => (
    <>
      <div className="sidebar-logo">
        <h2>PMC Portal</h2>
        <span>{user?.role === 'admin' ? 'Admin Console' : 'Citizen Portal'}</span>
      </div>
      <nav className="sidebar-nav">
        {links.map((l) => (
          <button
            key={l.path}
            className={`nav-btn ${location.pathname === l.path ? 'active' : ''}`}
            onClick={() => { navigate(l.path); setOpen(false); }}
          >
            <span>{l.icon}</span> {l.label}
          </button>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ padding: '0.5rem 1rem', marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--on-surface)' }}>{user?.name}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)' }}>{user?.area}</p>
        </div>
        <button className="nav-btn" onClick={handleLogout}>
          <span>🚪</span> Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="top-navbar">
        <h2>PMC Portal</h2>
        <button className="hamburger" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          <span /><span /><span />
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <NavItems />
      </aside>

      {/* Overlay */}
      <div
        className={`sidebar-overlay ${open ? 'visible' : ''}`}
        onClick={() => setOpen(false)}
      />

      <MobileCapsuleNav links={links} />
    </>
  );
}
