import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Lock, Mail, User } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginRole, setLoginRole] = useState('admin'); // 'admin' | 'customer'
  const [email, setEmail] = useState('admin@artstudio.com');
  const [password, setPassword] = useState('AdminPass123!');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const selectRole = (role) => {
    setLoginRole(role);
    setError(null);
    if (role === 'admin') {
      setEmail('admin@artstudio.com');
      setPassword('AdminPass123!');
    } else {
      setEmail('collector@example.com');
      setPassword('password123');
    }
  };

  const handleLoginWithRole = async (targetRole) => {
    setError(null);
    setLoading(true);

    const targetEmail = targetRole === 'admin' ? (loginRole === 'admin' ? email : 'admin@artstudio.com') : (loginRole === 'customer' ? email : 'collector@example.com');
    const targetPassword = targetRole === 'admin' ? (loginRole === 'admin' ? password : 'AdminPass123!') : (loginRole === 'customer' ? password : 'password123');

    try {
      const user = await login(targetEmail, targetPassword);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px var(--space-lg)', maxWidth: '520px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Studio Sign In</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Choose your role to automatically load credentials or type your own.
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          backgroundColor: 'var(--bg-subtle)',
          padding: '6px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: '24px'
        }}>
          <button
            type="button"
            onClick={() => selectRole('customer')}
            className={`btn ${loginRole === 'customer' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '8px 12px', fontSize: '0.9rem' }}
          >
            Customer Account
          </button>
          <button
            type="button"
            onClick={() => selectRole('admin')}
            className={`btn ${loginRole === 'admin' ? 'btn-secondary' : 'btn-outline'}`}
            style={{ padding: '8px 12px', fontSize: '0.9rem' }}
          >
            Studio Admin
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. yourname@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Password
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className={`btn ${loginRole === 'admin' ? 'btn-secondary' : 'btn-primary'}`}
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '8px' }}
          >
            {loading ? 'Signing in...' : `Sign In as ${loginRole === 'admin' ? 'Studio Admin' : 'Customer'}`}
          </button>
        </form>

        {/* Quick Direct 1-Click Buttons */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-light)',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
            ⚡ 1-Click Quick Demo Access
          </span>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleLoginWithRole('customer')}
              className="btn btn-outline"
              style={{ flex: 1, fontSize: '0.85rem' }}
            >
              Sign In as Customer
            </button>
            <button
              type="button"
              onClick={() => handleLoginWithRole('admin')}
              className="btn btn-outline"
              style={{ flex: 1, fontSize: '0.85rem' }}
            >
              Sign In as Admin
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Don't have an account yet?{' '}
          <Link to="/register" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>
            Register as Customer
          </Link>
        </div>
      </div>
    </div>
  );
};

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '60px var(--space-lg)', maxWidth: '500px' }}>
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create Account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Register to purchase original paintings and book studio commissions.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <User size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Full Name
            </label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Eleanor Vance"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Mail size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Email Address
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. eleanor@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} style={{ display: 'inline', marginRight: '6px' }} />
              Password (Min. 6 characters)
            </label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '1rem', marginTop: '8px' }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--terracotta)', fontWeight: 600 }}>
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
