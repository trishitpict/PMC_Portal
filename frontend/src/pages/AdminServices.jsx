import { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Notification from '../components/Notification.jsx';
import api from '../services/api';

const CARD_TYPES = [
  { key: 'fire',       label: 'Fire Brigade' },
  { key: 'emergency',  label: 'Emergency Numbers' },
  { key: 'police',     label: 'Police' },
  { key: 'hospital',   label: 'Hospitals' },
  { key: 'blood_bank', label: 'Blood Bank' },
];

const isPlaceholderPhone = (value) => String(value || '').trim() === '0000000000';
const displayPhone = (value) => {
  if (isPlaceholderPhone(value)) return 'Not Available';
  return value ? String(value) : '—';
};

const isTenDigit = (value) => /^\d{10}$/.test(String(value));

const toCategoryEnum = (key) => {
  const map = {
    fire: 'Fire',
    hospital: 'Hospital',
    police: 'Police',
    emergency: 'Emergency',
    blood_bank: 'BloodBank',
    ambulance: 'Ambulance',
  };
  return map[key] || '';
};

export default function AdminServices() {
  const [mode, setMode] = useState('card'); // card | table
  const [cardType, setCardType] = useState('hospital');
  const [reloadToken, setReloadToken] = useState(0);

  const activeType = mode === 'table' ? 'ambulance' : cardType;
  const activeCategory = toCategoryEnum(activeType);

  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const requestSeq = useRef(0);

  const [form, setForm] = useState({
    name: '',
    address: '',
    phone: '',
    contact: '',
    gmapLink: '',
    imageURL: '',
    subType: '',

    // Ambulance
    srNo: '',
    vehicleRegNo: '',
    vehicleType: '',
    driverName: '',
    mobileNo: '',
    workingHours: '',
    workLocation: '',
  });

  const [validation, setValidation] = useState({
    name: '',
    address: '',
    phone: '',
    contact: '',

    // Ambulance
    srNo: '',
    vehicleRegNo: '',
    vehicleType: '',
    driverName: '',
    mobileNo: '',
    workingHours: '',
    workLocation: '',
  });
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setSearch('');
    setError('');
    setSuccess('');

    setForm((prev) => ({
      ...prev,
      // Keep ambulance fields only for ambulance mode
      srNo: activeType === 'ambulance' ? prev.srNo : '',
      vehicleRegNo: activeType === 'ambulance' ? prev.vehicleRegNo : '',
      vehicleType: activeType === 'ambulance' ? prev.vehicleType : '',
      driverName: activeType === 'ambulance' ? prev.driverName : '',
      mobileNo: activeType === 'ambulance' ? prev.mobileNo : '',
      workingHours: activeType === 'ambulance' ? prev.workingHours : '',
      workLocation: activeType === 'ambulance' ? prev.workLocation : '',
    }));
  }, [activeType]);

  useEffect(() => {
    const controller = new AbortController();
    const seq = ++requestSeq.current;

    const fetch = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get('/services', {
          params: {
            category: activeType,
            all: true,
            search: search || undefined,
          },
          signal: controller.signal,
        });

        if (seq !== requestSeq.current) return;

        setItems(Array.isArray(data.items) ? data.items : []);
      } catch (e) {
        if (e?.name === 'CanceledError') return;
        setError(e?.response?.data?.message || 'Failed to load services.');
      } finally {
        if (seq === requestSeq.current) setLoading(false);
      }
    };

    fetch();
    return () => controller.abort();
  }, [activeType, mode, search, reloadToken]);

  const validate = () => {
    const next = {
      name: '',
      address: '',
      phone: '',
      contact: '',
      srNo: '',
      vehicleRegNo: '',
      vehicleType: '',
      driverName: '',
      mobileNo: '',
      workingHours: '',
      workLocation: '',
    };

    if (activeType !== 'ambulance') {
      if (form.name.trim().length < 3) next.name = 'Name must be at least 3 characters.';

      if (activeType === 'blood_bank') {
        if (!form.address.trim()) next.address = 'Address is required.';
        if (!form.contact.trim()) next.contact = 'Contact is required.';
        else if (!isTenDigit(form.contact)) next.contact = 'Contact must be 10 digits.';
      } else {
        // fire / hospital / police / emergency
        if (!form.phone.trim()) next.phone = 'Phone is required.';
        else if (!isTenDigit(form.phone)) next.phone = 'Phone must be 10 digits.';

        if (activeType !== 'emergency' && !form.address.trim()) {
          next.address = 'Address is required.';
        }
      }
    } else {
      if (String(form.srNo).trim() === '') next.srNo = 'Sr No. is required.';
      else if (!Number.isFinite(Number(form.srNo)) || Number(form.srNo) <= 0) next.srNo = 'Sr No. must be a positive number.';

      if (!form.vehicleRegNo.trim()) next.vehicleRegNo = 'Vehicle Reg No. is required.';
      if (!form.vehicleType.trim()) next.vehicleType = 'Vehicle Type is required.';
      if (!form.driverName.trim()) next.driverName = 'Driver Name is required.';
      if (!form.mobileNo.trim()) next.mobileNo = 'Mobile No. is required.';
      else if (!isTenDigit(form.mobileNo)) next.mobileNo = 'Mobile No. must be 10 digits.';
      if (!form.workingHours.trim()) next.workingHours = 'Working Hours is required.';
      if (!form.workLocation.trim()) next.workLocation = 'Work Location is required.';
    }

    setValidation(next);
    return Object.values(next).every((v) => !v);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    try {
      await api.post('/services', {
        category: activeCategory,
        imageURL: form.imageURL,
        ...(activeType === 'fire' || activeType === 'hospital' || activeType === 'police'
          ? {
              name: form.name,
              address: form.address,
              phone: form.phone,
              subType: form.subType,
            }
          : {}),
        ...(activeType === 'emergency'
          ? {
              name: form.name,
              phone: form.phone,
            }
          : {}),
        ...(activeType === 'blood_bank'
          ? {
              name: form.name,
              address: form.address,
              contact: form.contact,
              gmapLink: form.gmapLink,
            }
          : {}),
        ...(activeType === 'ambulance'
          ? {
              srNo: Number(form.srNo),
              vehicleRegNo: form.vehicleRegNo,
              vehicleType: form.vehicleType,
              driverName: form.driverName,
              mobileNo: form.mobileNo,
              workingHours: form.workingHours,
              workLocation: form.workLocation,
            }
          : {}),
      });

      setSuccess('Saved.');
      setForm((prev) => ({
        ...prev,
        name: '',
        address: '',
        phone: '',
        contact: '',
        gmapLink: '',
        imageURL: '',
        subType: '',
        srNo: '',
        vehicleRegNo: '',
        vehicleType: '',
        driverName: '',
        mobileNo: '',
        workingHours: '',
        workLocation: '',
      }));
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
            <h1 style={{ marginBottom: '0.25rem' }}>Services & Contacts (Admin)</h1>
            <p style={{ margin: 0 }}>Add and review municipal service records.</p>
          </div>
        </div>

        <div className="gov-admin-top">
          <div className="gov-toggle">
            <button
              type="button"
              className={mode === 'card' ? 'gov-toggle-btn active' : 'gov-toggle-btn'}
              onClick={() => setMode('card')}
            >
              Card View
            </button>
            <button
              type="button"
              className={mode === 'table' ? 'gov-toggle-btn active' : 'gov-toggle-btn'}
              onClick={() => setMode('table')}
            >
              Table View
            </button>
          </div>

          {mode === 'card' && (
            <select
              className="form-control"
              value={cardType}
              onChange={(e) => setCardType(e.target.value)}
              style={{ maxWidth: 260 }}
              aria-label="Select card category"
            >
              {CARD_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          )}

          {mode === 'table' && (
            <div className="gov-pill">Ambulances</div>
          )}
        </div>

        <div className="gov-admin-grid">
          {/* Form */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Add Service</h3>

            <form onSubmit={submit}>
              <div className="form-group">
                <label>Category</label>
                <input className="form-control" value={activeCategory} readOnly />
              </div>

              {activeType !== 'ambulance' ? (
                <>
                  <div className={`form-group ${validation.name ? 'has-error' : ''}`}>
                    <label>Name</label>
                    <input
                      className="form-control"
                      placeholder="e.g. Hadapsar Fire Station"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                    {validation.name && <p className="form-hint error">{validation.name}</p>}
                  </div>

                  {activeType !== 'emergency' && (
                    <div className={`form-group ${validation.address ? 'has-error' : ''}`}>
                      <label>Address</label>
                      <input
                        className="form-control"
                        placeholder="Full address"
                        value={form.address}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                        required
                      />
                      {validation.address && <p className="form-hint error">{validation.address}</p>}
                    </div>
                  )}

                  {(activeType === 'fire' || activeType === 'hospital' || activeType === 'police') && (
                    <div className="form-group">
                      <label>Sub-Type (optional)</label>
                      <input
                        className="form-control"
                        placeholder="e.g. General, Maternity"
                        value={form.subType}
                        onChange={(e) => setForm((p) => ({ ...p, subType: e.target.value }))}
                      />
                    </div>
                  )}

                  {(activeType === 'blood_bank') ? (
                    <>
                      <div className={`form-group ${validation.contact ? 'has-error' : ''}`}>
                        <label>Contact (10 digits)</label>
                        <input
                          className="form-control"
                          placeholder="e.g. 9876543210"
                          value={form.contact}
                          onChange={(e) => setForm((p) => ({ ...p, contact: e.target.value }))}
                          required
                        />
                        {validation.contact && <p className="form-hint error">{validation.contact}</p>}
                      </div>
                      <div className="form-group">
                        <label>Google Maps Link (optional)</label>
                        <input
                          className="form-control"
                          placeholder="https://maps.google.com/..."
                          value={form.gmapLink}
                          onChange={(e) => setForm((p) => ({ ...p, gmapLink: e.target.value }))}
                        />
                      </div>
                    </>
                  ) : (
                    <div className={`form-group ${validation.phone ? 'has-error' : ''}`}>
                      <label>Phone (10 digits)</label>
                      <input
                        className="form-control"
                        placeholder="e.g. 9876543210"
                        value={form.phone}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                        required
                      />
                      {validation.phone && <p className="form-hint error">{validation.phone}</p>}
                    </div>
                  )}

                  <div className="form-group">
                    <label>Image URL (optional)</label>
                    <input
                      className="form-control"
                      placeholder="Landscape image URL"
                      value={form.imageURL}
                      onChange={(e) => setForm((p) => ({ ...p, imageURL: e.target.value }))}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className={`form-group ${validation.srNo ? 'has-error' : ''}`}>
                    <label>Sr No.</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 1"
                      value={form.srNo}
                      onChange={(e) => setForm((p) => ({ ...p, srNo: e.target.value }))}
                      required
                    />
                    {validation.srNo && <p className="form-hint error">{validation.srNo}</p>}
                  </div>
                  <div className={`form-group ${validation.vehicleRegNo ? 'has-error' : ''}`}>
                    <label>Vehicle Reg No.</label>
                    <input
                      className="form-control"
                      value={form.vehicleRegNo}
                      onChange={(e) => setForm((p) => ({ ...p, vehicleRegNo: e.target.value }))}
                      required
                    />
                    {validation.vehicleRegNo && <p className="form-hint error">{validation.vehicleRegNo}</p>}
                  </div>
                  <div className={`form-group ${validation.vehicleType ? 'has-error' : ''}`}>
                    <label>Vehicle Type</label>
                    <input
                      className="form-control"
                      value={form.vehicleType}
                      onChange={(e) => setForm((p) => ({ ...p, vehicleType: e.target.value }))}
                      required
                    />
                    {validation.vehicleType && <p className="form-hint error">{validation.vehicleType}</p>}
                  </div>
                  <div className={`form-group ${validation.driverName ? 'has-error' : ''}`}>
                    <label>Driver Name</label>
                    <input
                      className="form-control"
                      value={form.driverName}
                      onChange={(e) => setForm((p) => ({ ...p, driverName: e.target.value }))}
                      required
                    />
                    {validation.driverName && <p className="form-hint error">{validation.driverName}</p>}
                  </div>
                  <div className={`form-group ${validation.mobileNo ? 'has-error' : ''}`}>
                    <label>Mobile No. (10 digits)</label>
                    <input
                      className="form-control"
                      value={form.mobileNo}
                      onChange={(e) => setForm((p) => ({ ...p, mobileNo: e.target.value }))}
                      required
                    />
                    {validation.mobileNo && <p className="form-hint error">{validation.mobileNo}</p>}
                  </div>
                  <div className={`form-group ${validation.workingHours ? 'has-error' : ''}`}>
                    <label>Working Hours</label>
                    <input
                      className="form-control"
                      placeholder="e.g. 24x7"
                      value={form.workingHours}
                      onChange={(e) => setForm((p) => ({ ...p, workingHours: e.target.value }))}
                      required
                    />
                    {validation.workingHours && <p className="form-hint error">{validation.workingHours}</p>}
                  </div>
                  <div className={`form-group ${validation.workLocation ? 'has-error' : ''}`}>
                    <label>Work Location (Hospital name)</label>
                    <input
                      className="form-control"
                      value={form.workLocation}
                      onChange={(e) => setForm((p) => ({ ...p, workLocation: e.target.value }))}
                      required
                    />
                    {validation.workLocation && <p className="form-hint error">{validation.workLocation}</p>}
                  </div>
                </>
              )}

              {/* Emergency toggle removed — emergency is a category */}

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
              <div style={{ fontWeight: 700, color: 'var(--on-surface)' }}>
                Existing Records
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

            {loading ? (
              <div className="loading-center"><span className="spinner" /></div>
            ) : items.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <div className="empty-icon">📭</div>
                <p>No records found.</p>
              </div>
            ) : mode === 'table' ? (
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
              <div className="gov-cards">
                {items.map((s) => (
                  <div key={s._id} className="gov-service-card">
                    <div className="gov-card-body">
                      <div className="gov-card-title">{s.name || '—'}</div>
                      {s.address && (
                        <div className="gov-row">
                          <span className="gov-row-ic">🏢</span>
                          <span className="gov-row-txt">{s.address}</span>
                        </div>
                      )}
                      <div className="gov-row">
                        <span className="gov-row-ic">☎️</span>
                        <span className="gov-row-txt">
                          {('phone' in s && s.phone)
                            ? displayPhone(s.phone)
                            : ('contact' in s && s.contact)
                              ? displayPhone(s.contact)
                              : '—'}
                        </span>
                      </div>
                      {s.gmapLink && (
                        <div className="gov-row">
                          <span className="gov-row-ic">🗺️</span>
                          <span className="gov-row-txt">
                            <a href={s.gmapLink} target="_blank" rel="noreferrer">Open in Maps</a>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
      <Notification />
    </div>
  );
}
