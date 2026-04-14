export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton-card-content">
        <div className="skeleton skeleton-text" style={{ width: '100%' }} />
        <div className="skeleton skeleton-text" style={{ width: '90%' }} />
        <div className="skeleton skeleton-text" style={{ width: '80%' }} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      <td><div className="skeleton skeleton-text" style={{ width: '80%' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '70%' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '85%' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '60%' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '50%' }} /></td>
      <td><div className="skeleton skeleton-text" style={{ width: '65%' }} /></td>
    </tr>
  );
}

export function SkeletonStatCard() {
  return (
    <div className="stat-card">
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      <div className="skeleton skeleton-text" style={{ width: '80%', height: '2rem', marginTop: '0.5rem' }} />
      <div className="skeleton skeleton-text" style={{ width: '50%' }} />
    </div>
  );
}

export function SkeletonContent({ count = 3 }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
