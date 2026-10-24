import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Palette, LogOut, User as UserIcon, Shield, Layers, Brush, Coffee } from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isCustomer, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header style={{
      backgroundColor: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-light)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '74px'
      }}>
        {/* Studio Brand */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Palette size={26} color="var(--terracotta)" />
          <span className="serif-font" style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.3px' }}>
            Atelier Art Studio
          </span>
        </Link>

        {/* Primary Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              fontWeight: 500,
              color: isActive ? 'var(--terracotta)' : 'var(--text-secondary)'
            })}
          >
            Home
          </NavLink>
          <NavLink
            to="/paintings"
            style={({ isActive }) => ({
              fontWeight: 500,
              color: isActive ? 'var(--terracotta)' : 'var(--text-secondary)'
            })}
          >
            Paintings
          </NavLink>
          <NavLink
            to="/wall-painting"
            style={({ isActive }) => ({
              fontWeight: 500,
              color: isActive ? 'var(--terracotta)' : 'var(--text-secondary)'
            })}
          >
            Wall Painting
          </NavLink>
          <NavLink
            to="/custom-pottery"
            style={({ isActive }) => ({
              fontWeight: 500,
              color: isActive ? 'var(--terracotta)' : 'var(--text-secondary)'
            })}
          >
            Custom Pottery
          </NavLink>
        </nav>

        {/* Auth / Account Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {isAuthenticated ? (
            <>
              {isCustomer && (
                <Link to="/dashboard" className="btn btn-outline" style={{ padding: '8px 14px', fontSize: '0.9rem' }}>
                  <UserIcon size={16} />
                  <span>My Orders & Bookings</span>
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" className="btn btn-secondary" style={{ padding: '8px 14px', fontSize: '0.9rem' }}>
                  <Shield size={16} />
                  <span>Studio Admin</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                style={{ padding: '8px 12px' }}
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ padding: '8px 18px' }}>
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ padding: '8px 18px' }}>
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export const Footer = () => (
  <footer style={{
    backgroundColor: '#1E1E22',
    color: '#D6D3D1',
    padding: '48px 0 32px 0',
    marginTop: '80px',
    borderTop: '1px solid #333'
  }}>
    <div className="container" style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '36px',
      marginBottom: '40px'
    }}>
      <div>
        <h4 className="serif-font" style={{ color: '#FAF8F5', fontSize: '1.2rem', marginBottom: '12px' }}>
          Atelier Art Studio
        </h4>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.7', color: '#A8A29E' }}>
          A dedicated creative sanctuary offering original one-of-a-kind fine art paintings, bespoke wall mural commissions, and handcrafted pottery works.
        </p>
      </div>
      <div>
        <h4 style={{ color: '#FAF8F5', fontSize: '0.95rem', marginBottom: '14px', letterSpacing: '0.5px' }}>
          STUDIO SERVICES
        </h4>
        <ul style={{ listStyle: 'none', fontSize: '0.9rem', lineHeight: '2' }}>
          <li><Link to="/paintings" style={{ color: '#A8A29E' }}>Original Paintings Gallery</Link></li>
          <li><Link to="/wall-painting" style={{ color: '#A8A29E' }}>Custom Wall Painting & Murals</Link></li>
          <li><Link to="/custom-pottery" style={{ color: '#A8A29E' }}>Handcrafted Studio Pottery</Link></li>
        </ul>
      </div>
      <div>
        <h4 style={{ color: '#FAF8F5', fontSize: '0.95rem', marginBottom: '14px', letterSpacing: '0.5px' }}>
          CONTACT & HOURS
        </h4>
        <p style={{ fontSize: '0.9rem', lineHeight: '1.8', color: '#A8A29E' }}>
          Tuesday – Sunday: 10:00 AM – 7:00 PM<br />
          Studio Walk-ins & Consultations Welcome<br />
          Email: inquiries@atelierartstudio.com
        </p>
      </div>
    </div>
    <div className="container" style={{
      borderTop: '1px solid #2C2C30',
      paddingTop: '20px',
      textAlign: 'center',
      fontSize: '0.85rem',
      color: '#78716C'
    }}>
      © {new Date().getFullYear()} Atelier Art Studio. All rights reserved. Built for GDGC Web Development Assessment.
    </div>
  </footer>
);
