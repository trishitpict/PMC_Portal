import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';
import { AREAS } from '../data/areas';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', area: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState({ name: '', email: '', password: '', area: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Real-time validation
    if (name === 'name') {
      setValidation({ ...validation, name: value && value.trim().length < 3 ? 'Name must be at least 3 characters' : '' });
    } else if (name === 'email') {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setValidation({ ...validation, email: value && !isValid ? 'Please enter a valid email' : '' });
    } else if (name === 'password') {
      setValidation({ ...validation, password: value && value.length < 6 ? 'Password must be at least 6 characters' : '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.area) { setError('Please select your area.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 500 }}>
        <p className="brand">PMC Portal</p>
        <p className="subtitle">Create your citizen account</p>

        <form onSubmit={handleSubmit}>
          <div className={`form-group ${validation.name ? 'has-error' : ''}`}>
            <label htmlFor="name">Full Name</label>
            <input
              id="name" name="name" type="text"
              className="form-control"
              placeholder="Rahul Sharma"
              value={form.name}
              onChange={handleChange}
              required
            />
            {validation.name && <p className="form-hint error">{validation.name}</p>}
          </div>

          <div className={`form-group ${validation.email ? 'has-error' : ''}`}>
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email" name="email" type="email"
              className="form-control"
              placeholder="rahul@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
            />
            {validation.email && <p className="form-hint error">{validation.email}</p>}
          </div>

          <div className={`form-group ${validation.password ? 'has-error' : ''}`}>
            <label htmlFor="reg-pass">Password</label>
            <input
              id="reg-pass" name="password" type="password"
              className="form-control"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
            {validation.password && <p className="form-hint error">{validation.password}</p>}
          </div>

          <div className={`form-group ${validation.area ? 'has-error' : ''}`}>
            <label htmlFor="area">Your Area (Pune) <span style={{ color: 'var(--error)' }}>*</span></label>
            <select
              id="area" name="area"
              className="form-control"
              value={form.area}
              onChange={handleChange}
              required
              aria-label="Select your area"
            >
              <option value="">— Select your area —</option>
              {AREAS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            {validation.area && <p className="form-hint error">{validation.area}</p>}
          </div>

          {error && <div className="info-box" style={{ background: 'rgba(186, 26, 26, 0.05)', borderLeftColor: 'var(--error)' }}>{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading || validation.name || validation.email || validation.password}
          >
            {loading ? <span className="spinner" /> : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', fontSize: '0.88rem', color: 'var(--on-surface-var)', textAlign: 'center' }}>
          Already registered?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
