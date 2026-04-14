import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState({ email: '', password: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Real-time validation
    if (name === 'email') {
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      setValidation({ ...validation, email: value && !isValid ? 'Please enter a valid email' : '' });
    } else if (name === 'password') {
      setValidation({ ...validation, password: value && value.length < 1 ? 'Password is required' : '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate(data.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="brand">PMC Portal</p>
        <p className="subtitle">Pune Municipal Corporation · Citizen Services</p>

        <form onSubmit={handleSubmit}>
          <div className={`form-group ${validation.email ? 'has-error' : ''}`}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              placeholder="rahul@gmail.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
            {validation.email && <p className="form-hint error">{validation.email}</p>}
          </div>
          <div className={`form-group ${validation.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
            {validation.password && <p className="form-hint error">{validation.password}</p>}
          </div>

          {error && <div className="info-box" style={{ background: 'rgba(186, 26, 26, 0.05)', borderLeftColor: 'var(--error)' }}>{error}</div>}

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading || validation.email || validation.password}>
            {loading ? <span className="spinner" /> : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', fontSize: '0.88rem', color: 'var(--on-surface-var)', textAlign: 'center' }}>
          New citizen?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
