import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from '../components/StateViews';
import { Calendar, Ruler, MapPin, DollarSign, CheckCircle2, AlertCircle } from 'lucide-react';

export const WallPaintingPage = () => {
  const { user, isCustomer, isAuthenticated } = useAuth();

  const [ratePerSqFt, setRatePerSqFt] = useState(25);
  const [bookedDates, setBookedDates] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  // Form Fields
  const [bookingDate, setBookingDate] = useState('');
  const [wallSize, setWallSize] = useState('');
  const [address, setAddress] = useState('');

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [successBooking, setSuccessBooking] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Fetch Studio availability and rate
  const fetchAvailability = async () => {
    try {
      const data = await api.getBookingAvailability();
      if (data.ratePerSqFt) setRatePerSqFt(data.ratePerSqFt);
      if (data.bookedDates) setBookedDates(data.bookedDates);
    } catch (err) {
      console.error('Failed to load wall painting rate/availability:', err);
    } finally {
      setLoadingAvailability(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  // Compute allowed date boundaries (7 to 90 days away)
  const today = new Date();
  const minDateObj = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const maxDateObj = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
  const minDateStr = minDateObj.toISOString().split('T')[0];
  const maxDateStr = maxDateObj.toISOString().split('T')[0];

  // Calculated Price
  const parsedWallSize = Number(wallSize) || 0;
  const calculatedPrice = parsedWallSize >= 10 && parsedWallSize <= 500 ? parsedWallSize * ratePerSqFt : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessBooking(null);

    if (!bookingDate) {
      setErrorMessage('Please select a valid booking date.');
      return;
    }

    if (bookedDates.includes(bookingDate)) {
      setErrorMessage('This date is already booked on our calendar. Please pick another date.');
      return;
    }

    if (parsedWallSize < 10 || parsedWallSize > 500) {
      setErrorMessage('Wall size must be between 10 and 500 square feet.');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please provide a complete installation address.');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.createBooking({
        bookingDate,
        wallSize: parsedWallSize,
        address: address.trim(),
      });
      setSuccessBooking(data.booking);
      setBookingDate('');
      setWallSize('');
      setAddress('');
      fetchAvailability();
    } catch (err) {
      if (err.status === 409) {
        setErrorMessage('This date was just claimed by another client! Please choose another calendar date.');
        fetchAvailability();
      } else {
        setErrorMessage(err.message || 'Failed to submit wall booking request.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px var(--space-lg)' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '12px' }}>Custom Wall Painting & Murals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Transform residential interiors, architectural feature walls, or boutique commercial spaces with hand-painted original murals.
          </p>
        </div>

        {/* Studio Parameters Card */}
        <div className="card" style={{
          backgroundColor: 'var(--sage-subtle)',
          borderColor: '#C8D9CE',
          marginBottom: '32px',
          padding: '24px'
        }}>
          <h3 style={{ color: 'var(--sage-hover)', fontSize: '1.15rem', marginBottom: '12px' }}>
            Studio Booking Guidelines & Terms
          </h3>
          <ul style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.8', paddingLeft: '20px' }}>
            <li><strong>Current Studio Rate:</strong> ${ratePerSqFt} per square foot (calculated on server).</li>
            <li><strong>Wall Size Limits:</strong> Minimum 10 sq ft, maximum 500 sq ft.</li>
            <li><strong>Lead Time:</strong> Pick a date between 7 and 90 days away.</li>
            <li><strong>Cancellation Window:</strong> Free cancellation until 3 days before your reserved date.</li>
            <li><strong>Exclusivity:</strong> Only 1 wall painting booking accepted per calendar date.</li>
          </ul>
        </div>

        {/* Feedback Banners */}
        {successBooking && (
          <div className="alert alert-success" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <CheckCircle2 size={22} />
              <strong style={{ fontSize: '1.05rem' }}>Wall Booking Request Received!</strong>
            </div>
            <p style={{ fontSize: '0.92rem' }}>
              Your booking for <strong>{successBooking.bookingDate}</strong> ({successBooking.wallSize} sq ft) has been submitted. Status: <strong>{successBooking.status}</strong>. Total studio quote: <strong>${successBooking.totalPrice}</strong>.
            </p>
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Booking Form */}
        <div className="card">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Reserve Your Wall Painting Date</h2>

          {!isAuthenticated ? (
            <div style={{ textAlign: 'center', padding: '30px 20px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Please sign in to your customer account to reserve an exclusive wall painting date.
              </p>
              <a href="/login" className="btn btn-primary">
                Log in to Book
              </a>
            </div>
          ) : !isCustomer ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              Logged in as Administrator. Administrators manage bookings from the Admin Dashboard.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Date Input */}
              <div className="form-group">
                <label className="form-label">
                  <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Select Painting Date (Between 7 and 90 days away)
                </label>
                <input
                  type="date"
                  className="form-input"
                  min={minDateStr}
                  max={maxDateStr}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Allowed range: {minDateStr} to {maxDateStr}
                </span>
                {bookingDate && bookedDates.includes(bookingDate) && (
                  <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '4px' }}>
                    ⚠️ This date is already booked. Please choose another date.
                  </p>
                )}
              </div>

              {/* Wall Size Input */}
              <div className="form-group">
                <label className="form-label">
                  <Ruler size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Wall Size (Square Feet)
                </label>
                <input
                  type="number"
                  className="form-input"
                  min="10"
                  max="500"
                  placeholder="e.g. 120"
                  value={wallSize}
                  onChange={(e) => setWallSize(e.target.value)}
                  required
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Must be between 10 sq ft and 500 sq ft.
                </span>
              </div>

              {/* Address Input */}
              <div className="form-group">
                <label className="form-label">
                  <MapPin size={14} style={{ display: 'inline', marginRight: '6px' }} />
                  Installation / On-Site Address
                </label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Full street address, apartment/suite number, and city"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />
              </div>

              {/* Live Price Estimation */}
              <div style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '16px 20px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Calculated Booking Price (${ratePerSqFt}/sq ft)
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--terracotta)' }}>
                    ${calculatedPrice.toLocaleString()}
                  </div>
                </div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {parsedWallSize > 0 ? `${parsedWallSize} sq ft × $${ratePerSqFt}` : 'Enter dimensions above'}
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting || calculatedPrice === 0 || bookedDates.includes(bookingDate)}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
              >
                {submitting ? 'Submitting Reservation...' : 'Submit Wall Painting Request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
