import { useLocation, useNavigate } from 'react-router-dom';

export default function MobileCapsuleNav({ links }) {
  const location = useLocation();
  const navigate = useNavigate();

  if (!Array.isArray(links) || links.length === 0) return null;

  return (
    <nav className="mobile-capsule-nav" aria-label="Mobile navigation">
      {links.map((l) => (
        <button
          key={l.path}
          type="button"
          className={location.pathname === l.path ? 'mc-item active' : 'mc-item'}
          onClick={() => navigate(l.path)}
          aria-label={l.label}
          title={l.label}
        >
          <span className="mc-icon" aria-hidden="true">{l.icon}</span>
          <span className="mc-label">{l.label}</span>
        </button>
      ))}
    </nav>
  );
}
