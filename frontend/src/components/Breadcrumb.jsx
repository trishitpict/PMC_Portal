import { useLocation } from 'react-router-dom';

const breadcrumbLabels = {
  '/dashboard': 'Dashboard',
  '/complaints': 'My Complaints',
  '/announcements': 'Announcements',
  '/admin': 'Admin Dashboard',
  '/admin/complaints': 'Manage Complaints',
  '/admin/announcements': 'Create Announcement',
};

export default function Breadcrumb() {
  const location = useLocation();
  const path = location.pathname;
  const parts = path.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  const isAdmin = parts[0] === 'admin';
  const rootLabel = isAdmin ? 'Admin' : 'Dashboard';

  return (
    <div className="breadcrumb">
      <a href={isAdmin ? '/admin' : '/dashboard'}>{rootLabel}</a>
      {parts.slice(isAdmin ? 1 : 0).map((part, idx, arr) => (
        <span key={idx}>
          <span className="breadcrumb-sep"> / </span>
          {idx === arr.length - 1 ? (
            <span className="breadcrumb-current">
              {breadcrumbLabels[path] || part.charAt(0).toUpperCase() + part.slice(1)}
            </span>
          ) : (
            <a href={`/${arr.slice(0, idx + 1).join('/')}`}>
              {part.charAt(0).toUpperCase() + part.slice(1)}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}
