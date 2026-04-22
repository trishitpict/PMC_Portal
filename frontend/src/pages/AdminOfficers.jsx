import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Notification from '../components/Notification.jsx';
import OfficerCard from '../components/OfficerCard.jsx';
import api from '../services/api';

const PAGE_SIZE = 30;

const isTenDigit = (value) => /^\d{10}$/.test(String(value || '').trim());
const isValidEmail = (value) => /^\S+@\S+\.\S+$/.test(String(value || '').trim());

export default function AdminOfficers() {
  const [reloadToken, setReloadToken] = useState(0);

  const [officers, setOfficers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    designation: '',
    email: '',
    mobile: '',
  });

  const [validation, setValidation] = useState({
    name: '',
    designation: '',
    email: '',
    mobile: '',
  });

  const [success, setSuccess] = useState('');

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
  }, [currentPage, reloadToken]);

  const pages = useMemo(
    () => Array.from({ length: totalPages }, (_, idx) => idx + 1),
    [totalPages]
  );

  const validate = () => {
    const next = { name: '', designation: '', email: '', mobile: '' };

    if (String(form.name).trim().length < 3) next.name = 'Name must be at least 3 characters.';
    if (!String(form.designation).trim()) next.designation = 'Designation is required.';

    if (!String(form.email).trim()) next.email = 'Email is required.';
    else if (!isValidEmail(form.email)) next.email = 'Invalid email format.';

    if (!String(form.mobile).trim()) next.mobile = 'Mobile is required.';
    else if (!isTenDigit(form.mobile)) next.mobile = 'Mobile must be 10 digits.';

    setValidation(next);
    return Object.values(next).every((v) => !v);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    try {
      await api.post('/officers', {
        name: form.name,
        designation: form.designation,
        email: form.email,
        mobile: form.mobile,
      });

      setSuccess('Saved.');
      setForm({ name: '', designation: '', email: '', mobile: '' });
      setCurrentPage(1);
      setReloadToken((t) => t + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content govtech gov-bg admin-gov-main-content">
        <Breadcrumb />

        <div className="admin-gov-page-wrap">

        <div className="gov-header">
          <div>
            <h1 style={{ marginBottom: '0.25rem', color: 'var(--primary)' }}>Officer Contacts (Admin)</h1>
            <p style={{ margin: 0 }}>Add and review municipal officer contact records.</p>
          </div>
        </div>

        <div className="gov-admin-grid">
          {/* Form */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Add Officer</h3>

            <form onSubmit={submit}>
              <div className={`form-group ${validation.name ? 'has-error' : ''}`}>
                <label>Name</label>
                <input
                  className="form-control"
                  placeholder="e.g. Rahul Patil"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
                {validation.name && <p className="form-hint error">{validation.name}</p>}
              </div>

              <div className={`form-group ${validation.designation ? 'has-error' : ''}`}>
                <label>Designation</label>
                <input
                  className="form-control"
                  placeholder="e.g. Ward Officer"
                  value={form.designation}
                  onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
                  required
                />
                {validation.designation && <p className="form-hint error">{validation.designation}</p>}
              </div>

              <div className={`form-group ${validation.email ? 'has-error' : ''}`}>
                <label>Email</label>
                <input
                  className="form-control"
                  placeholder="e.g. officer@pmc.gov.in"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                {validation.email && <p className="form-hint error">{validation.email}</p>}
              </div>

              <div className={`form-group ${validation.mobile ? 'has-error' : ''}`}>
                <label>Mobile (10 digits)</label>
                <input
                  className="form-control"
                  placeholder="e.g. 9876543210"
                  value={form.mobile}
                  onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
                  required
                />
                {validation.mobile && <p className="form-hint error">{validation.mobile}</p>}
              </div>

              {error && (
                <div className="info-box" style={{ borderLeftColor: 'var(--error)', background: 'rgba(220, 38, 38, 0.06)' }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="info-box" style={{ borderLeftColor: 'var(--success)', background: 'rgba(5, 150, 105, 0.06)' }}>
                  {success}
                </div>
              )}

              <button className="btn-primary" type="submit" style={{ width: '100%', justifyContent: 'center' }}>
                Save
              </button>
            </form>
          </div>

          {/* Listing */}
          <div>
            <div className="gov-filterbar" style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>Existing Officers</div>
            </div>

            {loading ? (
              <div className="loading-center"><span className="spinner" /></div>
            ) : officers.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-icon">📭</div>
                <p>No officers found.</p>
              </div>
            ) : (
              <div className="gov-cards">
                {officers.map((o) => (
                  <OfficerCard key={o._id} officer={o} />
                ))}
              </div>
            )}

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
        </div>
        </div>
      </main>
      <Notification />
    </div>
  );
}
