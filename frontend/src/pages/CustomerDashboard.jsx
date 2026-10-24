import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingState, EmptyState, ErrorState } from '../components/StateViews';
import { ShoppingBag, Calendar, Coffee, XCircle, Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'bookings' | 'pottery'

  // Data states
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pottery, setPottery] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  // Edit Pottery Modal / Inline State
  const [editingPottery, setEditingPottery] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [editNotes, setEditNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, bookingRes, potteryRes] = await Promise.all([
        api.getMyOrders(),
        api.getMyBookings(),
        api.getMyPotteryRequests(),
      ]);
      setOrders(orderRes.orders || []);
      setBookings(bookingRes.bookings || []);
      setPottery(potteryRes.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load customer records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cancel Painting Order
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you wish to cancel this artwork purchase? The painting will be released back to the studio gallery.')) {
      return;
    }

    setActionSuccess(null);
    setActionError(null);
    try {
      await api.cancelOrder(orderId);
      setActionSuccess('Order cancelled successfully. The artwork is now available in the studio gallery.');
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel order.');
    }
  };

  // Cancel Wall Booking
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you wish to cancel this wall painting reservation?')) {
      return;
    }

    setActionSuccess(null);
    setActionError(null);
    try {
      await api.cancelBooking(bookingId);
      setActionSuccess('Wall painting booking cancelled. The reserved calendar date is now released.');
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel booking.');
    }
  };

  // Cancel Pottery Request
  const handleCancelPottery = async (potteryId) => {
    if (!window.confirm('Are you sure you wish to cancel this custom pottery commission?')) {
      return;
    }

    setActionSuccess(null);
    setActionError(null);
    try {
      await api.cancelPotteryRequest(potteryId);
      setActionSuccess('Custom pottery request cancelled.');
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel pottery request.');
    }
  };

  // Submit Pottery Edit
  const handleSavePotteryEdit = async (e) => {
    e.preventDefault();
    if (!editingPottery) return;

    setActionSuccess(null);
    setActionError(null);
    try {
      await api.editPotteryRequest(editingPottery._id, {
        quantity: Number(editQty),
        specialNotes: editNotes,
      });
      setActionSuccess('Pottery request details updated successfully.');
      setEditingPottery(null);
      loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to update pottery request.');
    }
  };

  return (
    <div className="container" style={{ padding: '40px var(--space-lg)' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '8px' }}>Customer Dashboard</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Welcome back, <strong>{user?.name}</strong> ({user?.email}). Manage your art orders and commission requests.
        </p>
      </div>

      {/* Action Banners */}
      {actionSuccess && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Service Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '2px solid var(--border-light)',
        marginBottom: '28px'
      }}>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'orders' ? 'var(--terracotta)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'orders' ? '3px solid var(--terracotta)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShoppingBag size={18} />
          <span>Painting Orders ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'bookings' ? 'var(--terracotta)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'bookings' ? '3px solid var(--terracotta)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Calendar size={18} />
          <span>Wall Bookings ({bookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pottery')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'pottery' ? 'var(--terracotta)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'pottery' ? '3px solid var(--terracotta)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Coffee size={18} />
          <span>Pottery Requests ({pottery.length})</span>
        </button>
      </div>

      {/* Content Rendering */}
      {loading ? (
        <LoadingState message="Loading your collection records..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadData} />
      ) : (
        <div>
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            orders.length === 0 ? (
              <EmptyState
                title="No painting purchases yet"
                message="You haven't acquired any original studio paintings yet."
                actionText="Browse Gallery"
                onAction={() => window.location.href = '/paintings'}
              />
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {orders.map((order) => (
                  <div key={order._id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <img
                        src={order.painting?.imageUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=150&q=80'}
                        alt={order.painting?.title || 'Painting'}
                        style={{ width: '80px', height: '80px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                          {order.painting?.title || 'Studio Original Artwork'}
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Order ID: {order._id} • Placed on {new Date(order.placedAt).toLocaleDateString()}
                        </p>
                        <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                          Acquisition Price: <strong>${order.purchasePrice}</strong>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span className={`badge badge-${order.status}`}>{order.status}</span>
                      {order.status === 'placed' && (
                        <button
                          onClick={() => handleCancelOrder(order._id)}
                          className="btn btn-outline"
                          style={{ color: 'var(--danger)', borderColor: '#FFCDD2', fontSize: '0.85rem' }}
                        >
                          <XCircle size={15} />
                          <span>Cancel Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* WALL BOOKINGS TAB */}
          {activeTab === 'bookings' && (
            bookings.length === 0 ? (
              <EmptyState
                title="No wall painting reservations"
                message="You have not requested any architectural wall murals or installations."
                actionText="Book Wall Painting"
                onAction={() => window.location.href = '/wall-painting'}
              />
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {bookings.map((booking) => (
                  <div key={booking._id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>Reserved Date: {booking.bookingDate}</h3>
                        <span className={`badge badge-${booking.status}`}>{booking.status}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Wall Size: <strong>{booking.wallSize} sq ft</strong> (at ${booking.ratePerSqFt}/sq ft) • Total: <strong>${booking.totalPrice}</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Installation Address: {booking.address}
                      </p>
                    </div>

                    <div>
                      {booking.status === 'requested' && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="btn btn-outline"
                          style={{ color: 'var(--danger)', borderColor: '#FFCDD2', fontSize: '0.85rem' }}
                        >
                          <XCircle size={15} />
                          <span>Cancel Booking</span>
                        </button>
                      )}
                      {booking.status === 'confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="btn btn-outline"
                          style={{ color: 'var(--danger)', borderColor: '#FFCDD2', fontSize: '0.85rem' }}
                        >
                          <XCircle size={15} />
                          <span>Cancel Booking</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* POTTERY TAB */}
          {activeTab === 'pottery' && (
            pottery.length === 0 ? (
              <EmptyState
                title="No custom pottery requests"
                message="You have not submitted any ceramic or pottery commission requests."
                actionText="Request Custom Pottery"
                onAction={() => window.location.href = '/custom-pottery'}
              />
            ) : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {pottery.map((req) => (
                  <div key={req._id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '20px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                        <h3 style={{ fontSize: '1.2rem' }}>{req.quantity} × {req.item}</h3>
                        <span className={`badge badge-${req.status}`}>{req.status}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Glaze: <strong>{req.glaze}</strong> • Needed By: <strong>{req.neededBy}</strong>
                      </p>
                      {req.specialNotes && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          "{req.specialNotes}"
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* Customer can edit or cancel ONLY while status is 'requested' */}
                      {req.status === 'requested' ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingPottery(req);
                              setEditQty(req.quantity);
                              setEditNotes(req.specialNotes || '');
                            }}
                            className="btn btn-outline"
                            style={{ fontSize: '0.85rem' }}
                          >
                            <Edit2 size={15} />
                            <span>Edit Request</span>
                          </button>
                          <button
                            onClick={() => handleCancelPottery(req._id)}
                            className="btn btn-outline"
                            style={{ color: 'var(--danger)', borderColor: '#FFCDD2', fontSize: '0.85rem' }}
                          >
                            <XCircle size={15} />
                            <span>Cancel</span>
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          Status locked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Edit Pottery Modal */}
      {editingPottery && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '16px' }}>
              Edit Commission: {editingPottery.item}
            </h2>
            <form onSubmit={handleSavePotteryEdit}>
              <div className="form-group">
                <label className="form-label">Quantity (1 to 12 pieces)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="12"
                  value={editQty}
                  onChange={(e) => setEditQty(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Crafting Notes</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  maxLength={1000}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setEditingPottery(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
