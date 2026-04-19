import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Notification from '../components/Notification.jsx';
import OfficerCard from '../components/OfficerCard.jsx';
import api from '../services/api';

const PAGE_SIZE = 30;

export default function OfficerPage() {
  const [officers, setOfficers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestSeq = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    const seq = ++requestSeq.current;

    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/officers', {
          params: { page: currentPage, limit: PAGE_SIZE },
          signal: controller.signal,
        });

        if (seq !== requestSeq.current) return;

        setOfficers(Array.isArray(data.officers) ? data.officers : []);
        setTotalPages(Number.isFinite(data.totalPages) ? data.totalPages : 1);
      } catch (e) {
        if (e?.name === 'CanceledError') return;
        setError(e?.response?.data?.message || 'Failed to load officer contacts.');
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    };

    fetch();
    return () => controller.abort();
  }, [currentPage]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, idx) => idx + 1),
    [totalPages]
  );

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content govtech gov-bg">
        <Breadcrumb />

        <div className="max-w-7xl mx-auto px-4">
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ color: 'var(--primary)' }}>Officer Contacts</h1>
            <p>Directory of key municipal officers (email and mobile).</p>
          </div>

          {error && (
            <div
              className="info-box"
              style={{ borderLeftColor: 'var(--error)', background: 'rgba(220, 38, 38, 0.06)' }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="loading-center"><span className="spinner" /></div>
          ) : officers.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No officer contacts available.</p>
            </div>
          ) : (
            <div className="gov-cards">
              {officers.map((o) => (
                <OfficerCard key={o._id} officer={o} />
              ))}
            </div>
          )}

          {/* Pagination */}
          <nav className="gov-pagination" aria-label="Officer contacts pagination" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {pages.map((p) => (
              <button
                key={p}
                type="button"
                className={p === currentPage ? 'gov-page-btn active-primary' : 'gov-page-btn'}
                onClick={() => setCurrentPage(p)}
                aria-current={p === currentPage ? 'page' : undefined}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </nav>
        </div>
      </main>
      <Notification />
    </div>
  );
}
