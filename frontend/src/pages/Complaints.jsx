import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Sidebar from '../components/Sidebar.jsx';
import Notification from '../components/Notification.jsx';
import Breadcrumb from '../components/Breadcrumb.jsx';
import { SkeletonCard } from '../components/SkeletonLoader.jsx';
import LocationPicker from '../components/LocationPicker.jsx';
import api from '../services/api';
import { SERVER_BASE_URL } from '../services/runtimeConfig';

const CATEGORIES = ['Roads', 'Water Supply', 'Electricity', 'Garbage', 'Drainage', 'Street Lights', 'Other'];

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: '', location: { coordinates: { latitude: null, longitude: null }, address: '', area: '' } });
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [formValidation, setFormValidation] = useState({ title: '', description: '' });

  const fetchComplaints = async () => {
    try {
      const { data } = await api.get('/complaints/user');
      setComplaints(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const maxAllowed = 3;
    const combined = [...selectedImages, ...files].slice(0, maxAllowed);

    if (combined.length > maxAllowed) {
      alert(`You can upload a maximum of ${maxAllowed} images.`);
    }

    setSelectedImages(combined);
    const previews = combined.map(file => URL.createObjectURL(file));
    setImagePreviews(previews);

    // Reset the input so the same file can be selected again if needed.
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  useEffect(() => { fetchComplaints(); }, []);

  const filteredComplaints = useMemo(() => {
    let filtered = complaints;
    
    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    
    // Filter by search query (title, description, or category)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [complaints, searchQuery, filterStatus]);

  const validateForm = () => {
    const errors = { title: '', description: '' };
    if (form.title.trim().length < 5) errors.title = 'Title must be at least 5 characters';
    if (form.description.trim().length < 10) errors.description = 'Description must be at least 10 characters';
    setFormValidation(errors);
    return !errors.title && !errors.description;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!validateForm()) return;
    if (!form.category) { setFormError('Please select a category.'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('location', JSON.stringify(form.location));
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      await api.post('/complaints', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setForm({ title: '', description: '', category: '', location: { coordinates: { latitude: null, longitude: null }, address: '', area: '' } });
      setFormValidation({ title: '', description: '' });
      setSelectedImages([]);
      setImagePreviews([]);
      setShowForm(false);
      fetchComplaints();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Submission failed.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Breadcrumb />
        <div className="section-header">
          <div className="page-header" style={{ margin: 0 }}>
            <h1>My Complaints</h1>
            <p>Track the status of your submitted grievances.</p>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            + New Complaint
          </button>
        </div>

        {/* Create Modal */}
        {showForm && (
          <div className="modal-backdrop">
            <div className="modal">
              <h3>File a New Complaint</h3>
              <form onSubmit={handleSubmit}>
                <div className={`form-group ${formValidation.title ? 'has-error' : ''}`}>
                  <label htmlFor="c-title">Title</label>
                  <input
                    id="c-title" className="form-control"
                    placeholder="e.g. Pothole near Katraj chowk"
                    value={form.title}
                    onChange={(e) => {
                      setForm({ ...form, title: e.target.value });
                      if (e.target.value.trim().length < 5) {
                        setFormValidation({ ...formValidation, title: 'Title must be at least 5 characters' });
                      } else {
                        setFormValidation({ ...formValidation, title: '' });
                      }
                    }}
                    required
                  />
                  {formValidation.title && <p className="form-hint error">{formValidation.title}</p>}
                </div>
                <div className="form-group">
                  <label htmlFor="c-category">Category <span style={{ color: 'var(--error)' }}>*</span></label>
                  <select
                    id="c-category" className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    aria-label="Complaint category"
                  >
                    <option value="">— Select category —</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className={`form-group ${formValidation.description ? 'has-error' : ''}`}>
                  <label htmlFor="c-desc">Description</label>
                  <textarea
                    id="c-desc" className="form-control"
                    rows={3}
                    placeholder="Describe the issue in detail…"
                    value={form.description}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      if (e.target.value.trim().length < 10) {
                        setFormValidation({ ...formValidation, description: 'Description must be at least 10 characters' });
                      } else {
                        setFormValidation({ ...formValidation, description: '' });
                      }
                    }}
                    required
                  />
                  {formValidation.description && <p className="form-hint error">{formValidation.description}</p>}
                </div>

                <LocationPicker
                  location={form.location}
                  onChange={(location) => setForm({ ...form, location })}
                />

                <div className="form-group">
                  <label htmlFor="c-images">Attach Images (optional, max 3)</label>
                  <input
                    id="c-images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="form-control"
                  />
                  <p className="form-hint">Upload up to 3 images to help illustrate the issue.</p>
                </div>

                {imagePreviews.length > 0 && (
                  <div className="image-previews" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    {imagePreviews.map((preview, index) => (
                      <div key={index} style={{ position: 'relative' }}>
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--outline)' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            background: 'var(--error)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {formError && <p className="form-error">{formError}</p>}
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting || !!formValidation.title || !!formValidation.description}>
                    {submitting ? <span className="spinner" /> : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        {complaints.length > 0 && (
          <div className="filter-bar">
            <div className="search-box" style={{ flex: 1, maxWidth: '300px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search complaints"
              />
            </div>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            {(searchQuery || filterStatus) && (
              <button
                className="btn-secondary btn-sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filteredComplaints.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>
              {searchQuery || filterStatus
                ? 'No complaints match your search or filters.'
                : "You haven't filed any complaints yet."}
            </p>
            {!(searchQuery || filterStatus) && (
              <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowForm(true)}>
                + File Your First Complaint
              </button>
            )}
          </div>
        ) : (
          <>
            <p style={{ fontSize: '0.85rem', color: 'var(--on-surface-var)', marginBottom: '1rem' }}>
              Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> complaints
            </p>
            <div className="complaint-list">
              {filteredComplaints.map((c) => (
                <div className="complaint-card" key={c._id}>
                  <div className="meta">
                    <span className={`badge badge-${c.status}`}>
                      <span className={`status-dot ${c.status}`}></span>
                      {c.status.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-var)', background: 'var(--surface-low)', padding: '0.15rem 0.5rem', borderRadius: 999 }}>{c.category}</span>
                  </div>
                  <h4>{c.title}</h4>
                  <p>{c.description}</p>

                  {c.images && c.images.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {c.images.map((image, index) => (
                          <img
                            key={index}
                            src={`${SERVER_BASE_URL}${image}`}
                            alt={`Complaint image ${index + 1}`}
                            style={{
                              width: '80px',
                              height: '80px',
                              objectFit: 'cover',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--outline)',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(`${SERVER_BASE_URL}${image}`, '_blank')}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {c.location?.coordinates?.latitude && (
                    <div className="location-info" style={{ background: 'var(--primary-container)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.75rem', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                      <strong>📍 Location:</strong>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.8rem' }}>
                        {c.location.address || `${c.location.coordinates.latitude.toFixed(4)}, ${c.location.coordinates.longitude.toFixed(4)}`}
                      </p>
                    </div>
                  )}

                  {c.remarks && (
                    <div style={{ background: 'var(--surface-low)', borderRadius: 'var(--radius-md)', padding: '0.6rem 0.75rem', fontSize: '0.82rem' }}>
                      <strong>Admin Remarks:</strong> {c.remarks}
                    </div>
                  )}
                  <span style={{ fontSize: '0.72rem', color: 'var(--on-surface-var)' }}>
                    Filed on {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Notification />
    </div>
  );
}
