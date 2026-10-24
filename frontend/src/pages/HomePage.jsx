import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowRight, Palette, Brush, Coffee, Sparkles } from 'lucide-react';

export const HomePage = () => {
  const [featuredPaintings, setFeaturedPaintings] = useState([]);

  useEffect(() => {
    api.getPaintings(true)
      .then((data) => {
        setFeaturedPaintings((data.paintings || []).slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section style={{
        padding: '90px 0 80px 0',
        backgroundColor: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-light)'
      }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '820px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--terracotta-subtle)',
            color: 'var(--terracotta)',
            padding: '6px 14px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '24px'
          }}>
            <Sparkles size={14} />
            <span>Original Art & Bespoke Studio Commissions</span>
          </div>

          <h1 style={{
            fontSize: 'clamp(2.4rem, 4vw, 3.4rem)',
            color: 'var(--text-primary)',
            marginBottom: '20px',
            lineHeight: 1.15
          }}>
            Art for Your Space. Crafted Just for You.
          </h1>

          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            marginBottom: '36px',
            lineHeight: 1.6
          }}>
            Discover original one-of-a-kind paintings, transform your architectural walls with bespoke murals, and commission handcrafted pottery made to your personal taste.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <Link to="/paintings" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
              Explore Paintings
              <ArrowRight size={18} />
            </Link>
            <Link to="/wall-painting" className="btn btn-outline" style={{ padding: '12px 26px', fontSize: '1rem' }}>
              Book a Wall Painting
            </Link>
            <Link to="/custom-pottery" className="btn btn-secondary" style={{ padding: '12px 26px', fontSize: '1rem' }}>
              Request Custom Pottery
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 50px auto' }}>
            <h2 style={{ fontSize: '2.1rem', marginBottom: '14px' }}>Our Three Studio Services</h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              From individual gallery canvases to large scale wall installations and customized clay works, our studio provides complete creative craftsmanship.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px'
          }}>
            {/* Service 1 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                backgroundColor: 'var(--terracotta-subtle)',
                color: 'var(--terracotta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Palette size={26} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Original Paintings</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', flex: 1, lineHeight: '1.6' }}>
                Every painting in our catalogue is an authentic, original one-of-a-kind artwork. Once acquired by a collector, it is permanently preserved in our historical register.
              </p>
              <Link to="/paintings" style={{ color: 'var(--terracotta)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Browse Gallery <ArrowRight size={16} />
              </Link>
            </div>

            {/* Service 2 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                backgroundColor: 'var(--sage-subtle)',
                color: 'var(--sage)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Brush size={26} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Custom Wall Painting</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', flex: 1, lineHeight: '1.6' }}>
                Transform your home or creative commercial space. Choose dates between 7 and 90 days out, input your wall dimensions (10 to 500 sq ft), and receive verified studio booking.
              </p>
              <Link to="/wall-painting" style={{ color: 'var(--sage)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Check Dates & Rates <ArrowRight size={16} />
              </Link>
            </div>

            {/* Service 3 */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '8px',
                backgroundColor: '#FFF3E0',
                color: '#E65100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <Coffee size={26} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '12px' }}>Handcrafted Pottery</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', flex: 1, lineHeight: '1.6' }}>
                Select authentic studio wheel-thrown items and artisanal glazes (Matte Terracotta, Earthy Sage, Speckled Sand). Handcrafted with care for batches of 1 to 12 pieces.
              </p>
              <Link to="/custom-pottery" style={{ color: '#E65100', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                Commission Pottery <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artwork Preview */}
      {featuredPaintings.length > 0 && (
        <section style={{ padding: '60px 0 80px 0', backgroundColor: 'var(--bg-subtle)' }}>
          <div className="container">
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginBottom: '36px'
            }}>
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Featured Studio Pieces</h2>
                <p style={{ color: 'var(--text-secondary)' }}>Authentic one-of-a-kind artworks currently available for acquisition.</p>
              </div>
              <Link to="/paintings" className="btn btn-outline">
                View All Paintings
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '28px'
            }}>
              {featuredPaintings.map((painting) => (
                <div key={painting._id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  <img
                    src={painting.imageUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'}
                    alt={painting.title}
                    style={{ width: '100%', height: '240px', objectFit: 'cover' }}
                  />
                  <div style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>{painting.title}</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      {painting.medium} • {painting.dimensions}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--terracotta)' }}>
                        ${painting.price}
                      </span>
                      <Link to="/paintings" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Studio Philosophy */}
      <section style={{ padding: '80px 0' }}>
        <div className="container" style={{ maxWidth: '800px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '20px' }}>Studio Craftsmanship</h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '24px' }}>
            At Atelier Art Studio, we believe physical spaces should inspire calm, contemplation, and individuality. We reject mass duplication in favor of singular canvases, hand-painted murals, and wheel-thrown ceramic vessels cured with studio glazes.
          </p>
          <p style={{ fontStyle: 'italic', color: 'var(--terracotta)', fontSize: '1.05rem' }}>
            "Art that breathes life into living environments."
          </p>
        </div>
      </section>
    </div>
  );
};
