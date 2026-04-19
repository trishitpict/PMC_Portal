import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Notification from '../components/Notification.jsx';
import api from '../services/api';

const CATEGORIES = [
  { key: 'fire',        label: 'Fire Brigade' },
  { key: 'ambulance',   label: 'Ambulance' },
  { key: 'emergency',   label: 'Emergency Numbers' },
  { key: 'police',      label: 'Police' },
  { key: 'hospital',    label: 'Hospitals' },
  { key: 'blood_bank',  label: 'Blood Bank' },
];

const isPlaceholderPhone = (value) => String(value || '').trim() === '0000000000';
const displayPhone = (value) => {
  if (isPlaceholderPhone(value)) return 'Not Available';
  return value ? String(value) : '—';
};

const IconRow = ({ icon, children }) => (
  <div className="gov-row">
    <span className="gov-row-ic">{icon}</span>
    <span className="gov-row-txt">{children}</span>
  </div>
);

export default function Services() {
  const [params, setParams] = useSearchParams();

  const category = params.get('category') || '';

  // Listing state
  const [subType, setSubType] = useState('');
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [items, setItems] = useState([]);
  const [subTypes, setSubTypes] = useState([]);

  const requestSeq = useRef(0);

  const isTable = category === 'ambulance';

  useEffect(() => {
    setSubType('');
    setSearch('');
  }, [category]);

  useEffect(() => {
    if (!category) return;

    const controller = new AbortController();
    const seq = ++requestSeq.current;

    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/services', {
          params: {
            category,
            all: true,
            subType: subType || undefined,
            search: search || undefined,
          },
          signal: controller.signal,
        });

        // If a newer request has started, ignore this response.
        if (seq !== requestSeq.current) return;

        setItems(Array.isArray(data.items) ? data.items : []);
        setSubTypes(Array.isArray(data.subTypes) ? data.subTypes : []);
      } catch (e) {
        if (e?.name === 'CanceledError') return;
        setError(e?.response?.data?.message || 'Failed to load services.');
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    };

    fetch();
    return () => controller.abort();
  }, [category, subType, search]);

  const activeCategory = useMemo(
    () => CATEGORIES.find((c) => c.key === category),
    [category]
  );

  const openCategory = (key) => {
    setParams({ category: key });
  };

  const clearCategory = () => {
    setParams({});
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content govtech gov-bg">
        <Breadcrumb />

        {!category ? (
          <>
            <div className="page-header" style={{ marginBottom: '1.75rem' }}>
              <h1>Municipal Services & Contacts</h1>
              <p>Quick access to important civic services in Pune.</p>
            </div>

            <div className="gov-grid-wrap">
              <div className="gov-grid">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    className="gov-action-card"
                    onClick={() => openCategory(c.key)}
                    type="button"
                  >
                    <span className="gov-action-title">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="gov-header">
              <div>
                <h1 style={{ marginBottom: '0.25rem' }}>{activeCategory?.label || 'Services'}</h1>
                <p style={{ margin: 0 }}>
                  Search by name or area. Filter using sub-categories.
                </p>
              </div>
              <button className="btn-secondary" onClick={clearCategory} type="button">
                ← Back
              </button>
            </div>

            {/* Filter bar */}
            <div className="gov-filterbar">
              <div className="gov-subtabs" role="tablist" aria-label="Sub-category filters">
                <button
                  type="button"
                  className={!subType ? 'gov-subtab active' : 'gov-subtab'}
                  onClick={() => { setSubType(''); }}
                >
                  All
                </button>
                {subTypes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={subType === s ? 'gov-subtab active' : 'gov-subtab'}
                    onClick={() => { setSubType(s); }}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="gov-search">
                <input
                  className="form-control"
                  placeholder="Search by name or area…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); }}
                  aria-label="Search services"
                />
              </div>
            </div>

            {error && (
              <div className="info-box" style={{ borderLeftColor: 'var(--error)', background: 'rgba(220, 38, 38, 0.06)' }}>
                {error}
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="loading-center"><span className="spinner" /></div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No results. Try a different search or filter.</p>
              </div>
            ) : isTable ? (
              <div className="gov-table-wrap">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Sr No.</th>
                      <th>Vehicle Reg No.</th>
                      <th>Vehicle Type</th>
                      <th>Driver Name</th>
                      <th>Working Hours</th>
                      <th>Work Location</th>
                      <th className="gov-mob">Mobile No.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((s, idx) => (
                      <tr key={s._id} className={idx % 2 === 0 ? 'even' : 'odd'}>
                        <td style={{ fontWeight: 800, color: 'var(--on-surface)' }}>{s.srNo ?? '—'}</td>
                        <td>{s.vehicleRegNo || '—'}</td>
                        <td>{s.vehicleType || '—'}</td>
                        <td>{s.driverName || '—'}</td>
                        <td>{s.workingHours || '—'}</td>
                        <td>{s.workLocation || '—'}</td>
                        <td className="gov-mob">
                          {displayPhone(s.mobileNo)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <div className="gov-cards">
                  {items.map((s) => (
                    <div key={s._id} className="gov-service-card">
                      <div className="gov-card-body">
                        <div className="gov-card-title">{s.name || '—'}</div>

                        {s.address && <IconRow icon="🏢">{s.address}</IconRow>}

                        {'phone' in s && (
                          <IconRow icon="☎️">
                            {s.phone && !isPlaceholderPhone(s.phone) ? (
                              <a className="gov-phone" href={`tel:${s.phone}`}>{s.phone}</a>
                            ) : (
                              displayPhone(s.phone)
                            )}
                          </IconRow>
                        )}

                        {'contact' in s && (
                          <IconRow icon="☎️">
                            {s.contact && !isPlaceholderPhone(s.contact) ? (
                              <a className="gov-phone" href={`tel:${s.contact}`}>{s.contact}</a>
                            ) : (
                              displayPhone(s.contact)
                            )}
                          </IconRow>
                        )}

                        {'gmapLink' in s && s.gmapLink && (
                          <IconRow icon="🗺️">
                            <a href={s.gmapLink} target="_blank" rel="noreferrer">Open in Maps</a>
                          </IconRow>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
      <Notification />
    </div>
  );
}
