import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState, EmptyState, ErrorState } from '../components/StateViews';
import { ShoppingBag, CheckCircle, AlertCircle, Filter } from 'lucide-react';

export const PaintingsPage = () => {
  const { user, isCustomer, isAuthenticated } = useAuth();
  const [paintings, setPaintings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableOnly, setAvailableOnly] = useState(false);

  // Purchase interaction state
  const [purchasingId, setPurchasingId] = useState(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [purchaseError, setPurchaseError] = useState(null);

  const fetchPaintings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getPaintings(availableOnly);
      setPaintings(data.paintings || []);
    } catch (err) {
      setError(err.message || 'Failed to load paintings from studio catalogue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaintings();
  }, [availableOnly]);

  const handlePurchase = async (painting) => {
    if (!window.confirm(`Confirm acquisition of "${painting.title}" for $${painting.price}?`)) {
      return;
    }

    setPurchasingId(painting._id);
    setPurchaseSuccess(null);
    setPurchaseError(null);

    try {
      const data = await api.purchasePainting(painting._id);
      setPurchaseSuccess(`Success! You have purchased "${painting.title}". Order #${data.order._id} placed.`);
      // Refresh paintings list
      fetchPaintings();
    } catch (err) {
      if (err.status === 409) {
        setPurchaseError('Another collector just acquired this painting! It is no longer available.');
      } else {
        setPurchaseError(err.message || 'Purchase could not be completed.');
      }
      fetchPaintings();
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '40px var(--space-lg)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '8px' }}>Original Painting Collection</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Each painting is unique and can be purchased only once. Authentic one-of-a-kind originals.
          </p>
        </div>

        {/* Filter Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setAvailableOnly(!availableOnly)}
            className={`btn ${availableOnly ? 'btn-secondary' : 'btn-outline'}`}
            style={{ fontSize: '0.9rem' }}
          >
            <Filter size={16} />
            {availableOnly ? 'Showing Available Only' : 'Show Available Only'}
          </button>
        </div>
      </div>

      {/* Purchase Feedback Alerts */}
      {purchaseSuccess && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle size={20} />
          <span>{purchaseSuccess}</span>
        </div>
      )}
      {purchaseError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={20} />
          <span>{purchaseError}</span>
        </div>
      )}

      {/* Screen States */}
      {loading ? (
        <LoadingState message="Fetching original studio paintings..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPaintings} />
      ) : paintings.length === 0 ? (
        <EmptyState
          title="No paintings found"
          message={availableOnly ? "No paintings are currently available. Check back soon for new studio releases!" : "No paintings currently listed in the catalogue."}
          actionText={availableOnly ? "View All Paintings" : null}
          onAction={() => setAvailableOnly(false)}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {paintings.map((painting) => (
            <div
              key={painting._id}
              className="card"
              style={{
                padding: '0',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                opacity: painting.isAvailable ? 1 : 0.85
              }}
            >
              {/* Artwork Image */}
              <div style={{ position: 'relative', height: '260px', backgroundColor: '#EFECE6' }}>
                <img
                  src={painting.imageUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80'}
                  alt={painting.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <span className={`badge ${painting.isAvailable ? 'badge-placed' : 'badge-declined'}`}>
                    {painting.isAvailable ? 'Available' : 'Sold / Reserved'}
                  </span>
                </div>
              </div>

              {/* Painting Info */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '8px' }}>{painting.title}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  <span>{painting.medium || 'Oil on Canvas'}</span> • <span>{painting.dimensions || '24" x 36"'}</span>
                </div>
                <p style={{
                  fontSize: '0.92rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  marginBottom: '20px',
                  flex: 1
                }}>
                  {painting.description}
                </p>

                {/* Pricing & Acquisition Action */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-light)'
                }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Price</span>
                    <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      ${painting.price}
                    </span>
                  </div>

                  <div>
                    {painting.isAvailable ? (
                      isAuthenticated ? (
                        isCustomer ? (
                          <button
                            onClick={() => handlePurchase(painting)}
                            disabled={purchasingId === painting._id}
                            className="btn btn-primary"
                          >
                            <ShoppingBag size={16} />
                            {purchasingId === painting._id ? 'Processing...' : 'Purchase Painting'}
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Admin Mode
                          </span>
                        )
                      ) : (
                        <a href="/login" className="btn btn-outline" style={{ fontSize: '0.88rem' }}>
                          Log in to Purchase
                        </a>
                      )
                    ) : (
                      <button disabled className="btn btn-outline" style={{ opacity: 0.6 }}>
                        Sold Out
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
