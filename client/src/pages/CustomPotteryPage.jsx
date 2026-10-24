import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/StateViews';
import { Coffee, Sparkles, Calendar, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

export const CustomPotteryPage = () => {
  const { user, isCustomer, isAuthenticated } = useAuth();

  const [items, setItems] = useState([]);
  const [glazes, setGlazes] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  // Form State
  const [selectedItem, setSelectedItem] = useState('');
  const [selectedGlaze, setSelectedGlaze] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [neededBy, setNeededBy] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [successRequest, setSuccessRequest] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    api.getPotteryCatalog()
      .then((data) => {
        setItems(data.items || []);
        setGlazes(data.glazes || []);
        if (data.items?.length > 0) setSelectedItem(data.items[0]);
        if (data.glazes?.length > 0) setSelectedGlaze(data.glazes[0]);
      })
      .catch((err) => {
        console.error('Failed to load pottery catalog:', err);
      })
      .finally(() => {
        setLoadingCatalog(false);
      });
  }, []);

  // Compute allowed needed-by date boundary (at least 14 days away)
  const today = new Date();
  const minDateObj = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const minDateStr = minDateObj.toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessRequest(null);

    const numQty = Number(quantity);
    if (!Number.isInteger(numQty) || numQty < 1 || numQty > 12) {
      setErrorMessage('Quantity must be between 1 and 12 pieces.');
      return;
    }

    if (!neededBy || neededBy < minDateStr) {
      setErrorMessage(`Needed-by date must be at least 14 days in the future (minimum: ${minDateStr}).`);
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.createPotteryRequest({
        item: selectedItem,
        glaze: selectedGlaze,
        quantity: numQty,
        neededBy,
        specialNotes,
      });

      setSuccessRequest(data.request);
      setSpecialNotes('');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit pottery commission request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px var(--space-lg)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '12px' }}>Custom Handcrafted Pottery</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Commission bespoke wheel-thrown ceramics and stoneware. Choose from our catalog items and mineral-based studio glazes.
          </p>
        </div>

        {/* Guidelines Card */}
        <div className="card" style={{
          backgroundColor: 'var(--terracotta-subtle)',
          borderColor: '#E8D4CC',
          marginBottom: '32px',
          padding: '24px'
        }}>
          <h3 style={{ color: 'var(--terracotta-hover)', fontSize: '1.15rem', marginBottom: '12px' }}>
            Pottery Commission Terms & Crafting Schedule
          </h3>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Batch Quantity:</strong> 1 to 12 pieces per custom request.</li>
            <li><strong>Studio Curing & Kiln Firing:</strong> Minimum 14 days lead time required for throwing, drying, bisque firing, and glaze curing.</li>
            <li><strong>Status Workflow:</strong> New requests begin as <em>requested</em>. The studio team reviews and accepts or declines each commission.</li>
            <li><strong>Client Modifications:</strong> You may edit or cancel your request anytime while it remains in <em>requested</em> status.</li>
          </ul>
        </div>

        {/* Feedback Banners */}
        {successRequest && (
          <div className="alert alert-success" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CheckCircle2 size={22} />
              <strong style={{ fontSize: '1.05rem' }}>Custom Pottery Request Submitted!</strong>
            </div>
            <p style={{ fontSize: '0.92rem' }}>
              We received your request for <strong>{successRequest.quantity} × {successRequest.item}</strong> in <strong>{successRequest.glaze}</strong> glaze (Needed by {successRequest.neededBy}). Status: <strong>{successRequest.status}</strong>. View details in your Customer Dashboard.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Request Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Submit Pottery Commission</h2>

          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Please sign in to your customer account to commission custom studio pottery.
              </p>
              <a href="/login" className="btn btn-primary">
                Log in to Commission
              </a>
            </div>
          ) : !isCustomer ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              Logged in as Administrator. Administrators review pottery requests in the Admin Dashboard.
            </div>
          ) : loadingCatalog ? (
            <LoadingState message="Loading studio pottery options..." />
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Item selection */}
              <div className="form-group">
                <label className="form-label">
                  <Coffee size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Select Pottery Item
                </label>
                <select
                  className="form-select"
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  required
                >
                  {items.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>

              {/* Glaze selection */}
              <div className="form-group">
                <label className="form-label">
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Select Studio Glaze
                </label>
                <select
                  className="form-select"
                  value={selectedGlaze}
                  onChange={(e) => setSelectedGlaze(e.target.value)}
                  required
                >
                  {glazes.map((glaze) => (
                    <option key={glaze} value={glaze}>{glaze}</option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div className="form-group">
                <label className="form-label">
                  <Layers size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Quantity (1 to 12 pieces)
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="12"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              {/* Needed-by date */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Needed-By Date (At least 14 days in future)
                </label>
                <input
                  type="date"
                  className="form-input"
                  min={minDateStr}
                  value={neededBy}
                  onChange={(e) => setNeededBy(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Earliest completion date: {minDateStr}
                </span>
              </div>

              {/* Special notes */}
              <div className="form-group">
                <label className="form-label">Special Crafting Notes / Dimensions (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Specific handle design, textural preference, or gift packaging notes"
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                  maxLength={1000}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                {submitting ? 'Submitting Commission...' : 'Send Commission Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
