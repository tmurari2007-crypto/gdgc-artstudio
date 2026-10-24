import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { LoadingState, EmptyState, ErrorState } from '../components/StateViews';
import {
  Palette,
  ShoppingBag,
  Calendar,
  Coffee,
  PlusCircle,
  Edit,
  CheckCircle,
  XCircle,
  Check,
  X,
  AlertCircle,
  TrendingUp
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'paintings' | 'orders' | 'bookings' | 'pottery'

  const [stats, setStats] = useState(null);
  const [paintings, setPaintings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pottery, setPottery] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bannerSuccess, setBannerSuccess] = useState(null);
  const [bannerError, setBannerError] = useState(null);

  // Add/Edit Painting Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPainting, setEditingPainting] = useState(null);
  const [paintingForm, setPaintingForm] = useState({
    title: '',
    description: '',
    price: '',
    medium: 'Oil on Canvas',
    dimensions: '24" x 36"',
    imageUrl: '',
  });

  const loadAllAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, paintingsRes, ordersRes, bookingsRes, potteryRes] = await Promise.all([
        api.getAdminStats(),
        api.getPaintings(),
        api.getAllOrders(),
        api.getAllBookings(),
        api.getAllPotteryRequests(),
      ]);
      setStats(statsRes.stats);
      setPaintings(paintingsRes.paintings || []);
      setOrders(ordersRes.orders || []);
      setBookings(bookingsRes.bookings || []);
      setPottery(potteryRes.requests || []);
    } catch (err) {
      setError(err.message || 'Failed to load studio administration data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  // Handle Add/Edit Painting Submit
  const handleSavePainting = async (e) => {
    e.preventDefault();
    setBannerSuccess(null);
    setBannerError(null);

    try {
      if (editingPainting) {
        await api.editPainting(editingPainting._id, paintingForm);
        setBannerSuccess(`Painting "${paintingForm.title}" updated successfully.`);
      } else {
        await api.addPainting(paintingForm);
        setBannerSuccess(`New painting "${paintingForm.title}" added to studio gallery.`);
      }
      setShowAddModal(false);
      setEditingPainting(null);
      setPaintingForm({
        title: '',
        description: '',
        price: '',
        medium: 'Oil on Canvas',
        dimensions: '24" x 36"',
        imageUrl: '',
      });
      loadAllAdminData();
    } catch (err) {
      setBannerError(err.message || 'Failed to save painting record.');
    }
  };

  // Booking Decisions
  const handleBookingDecision = async (id, decision) => {
    setBannerSuccess(null);
    setBannerError(null);
    try {
      if (decision === 'confirm') {
        await api.confirmBooking(id);
        setBannerSuccess('Wall painting booking confirmed.');
      } else {
        await api.declineBooking(id);
        setBannerSuccess('Wall painting booking declined. Date released.');
      }
      loadAllAdminData();
    } catch (err) {
      setBannerError(err.message || `Failed to ${decision} booking.`);
    }
  };

  // Pottery Decisions
  const handlePotteryDecision = async (id, decision) => {
    setBannerSuccess(null);
    setBannerError(null);
    try {
      if (decision === 'accept') {
        await api.acceptPotteryRequest(id);
        setBannerSuccess('Custom pottery request accepted.');
      } else {
        await api.declinePotteryRequest(id);
        setBannerSuccess('Custom pottery request declined.');
      }
      loadAllAdminData();
    } catch (err) {
      setBannerError(err.message || `Failed to ${decision} pottery request.`);
    }
  };

  return (
    <div className="container" style={{ padding: '40px var(--space-lg)' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '2.4rem', marginBottom: '6px' }}>Studio Administration</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Oversee artwork inventory, confirm client bookings, and manage custom pottery requests.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingPainting(null);
            setPaintingForm({
              title: '',
              description: '',
              price: '',
              medium: 'Oil on Canvas',
              dimensions: '24" x 36"',
              imageUrl: '',
            });
            setShowAddModal(true);
          }}
          className="btn btn-primary"
        >
          <PlusCircle size={18} />
          <span>Add New Artwork</span>
        </button>
      </div>

      {/* Notifications */}
      {bannerSuccess && (
        <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} />
          <span>{bannerSuccess}</span>
        </div>
      )}
      {bannerError && (
        <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <span>{bannerError}</span>
        </div>
      )}

      {/* Nav Tabs */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '2px solid var(--border-light)',
        marginBottom: '28px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('stats')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'stats' ? 'var(--terracotta)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'stats' ? '3px solid var(--terracotta)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <TrendingUp size={18} />
          <span>Studio Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('paintings')}
          style={{
            padding: '12px 20px',
            fontWeight: 600,
            fontSize: '1rem',
            color: activeTab === 'paintings' ? 'var(--terracotta)' : 'var(--text-secondary)',
            borderBottom: activeTab === 'paintings' ? '3px solid var(--terracotta)' : '3px solid transparent',
            marginBottom: '-2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Palette size={18} />
          <span>Paintings ({paintings.length})</span>
        </button>

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
          <span>Orders ({orders.length})</span>
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

      {/* Main View Area */}
      {loading ? (
        <LoadingState message="Connecting to studio database..." />
      ) : error ? (
        <ErrorState message={error} onRetry={loadAllAdminData} />
      ) : (
        <div>
          {/* STATS OVERVIEW */}
          {activeTab === 'stats' && stats && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '24px',
                marginBottom: '36px'
              }}>
                <div className="card">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Available Artworks
                  </span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--terracotta)', margin: '8px 0' }}>
                    {stats.paintings.available}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {stats.paintings.sold} Sold / Reserved
                  </span>
                </div>

                <div className="card">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Artwork Sales Revenue
                  </span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--text-primary)', margin: '8px 0' }}>
                    ${stats.orders.revenue.toLocaleString()}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    From {stats.orders.active} active orders
                  </span>
                </div>

                <div className="card">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Wall Bookings
                  </span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--sage)', margin: '8px 0' }}>
                    {stats.bookings.total}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {stats.bookings.requested} pending review • ${stats.bookings.revenue} confirmed
                  </span>
                </div>

                <div className="card">
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Pottery Commissions
                  </span>
                  <div style={{ fontSize: '2.2rem', fontWeight: 700, color: '#E65100', margin: '8px 0' }}>
                    {stats.pottery.total}
                  </div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {stats.pottery.requested} pending review
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* PAINTINGS MANAGEMENT */}
          {activeTab === 'paintings' && (
            <div>
              <div style={{ display: 'grid', gap: '16px' }}>
                {paintings.map((p) => (
                  <div key={p._id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=150&q=80'}
                        alt={p.title}
                        style={{ width: '70px', height: '70px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <div>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{p.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {p.medium} • {p.dimensions} • Price: <strong>${p.price}</strong>
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge ${p.isAvailable ? 'badge-placed' : 'badge-declined'}`}>
                        {p.isAvailable ? 'Available' : 'Sold'}
                      </span>
                      {/* Business Rule: Studio/admin can edit a painting ONLY while it is available */}
                      {p.isAvailable ? (
                        <button
                          onClick={() => {
                            setEditingPainting(p);
                            setPaintingForm({
                              title: p.title,
                              description: p.description,
                              price: p.price,
                              medium: p.medium || 'Oil on Canvas',
                              dimensions: p.dimensions || '24" x 36"',
                              imageUrl: p.imageUrl || '',
                            });
                            setShowAddModal(true);
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: '0.85rem' }}
                        >
                          <Edit size={14} />
                          <span>Edit Artwork</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Cannot edit sold piece
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL ORDERS */}
          {activeTab === 'orders' && (
            orders.length === 0 ? (
              <EmptyState title="No orders placed yet" message="When customers purchase original paintings, orders will appear here." />
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {orders.map((o) => (
                  <div key={o._id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.15rem' }}>{o.painting?.title || 'Painting Artwork'}</h3>
                        <span className={`badge badge-${o.status}`}>{o.status}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Client: <strong>{o.customer?.name}</strong> ({o.customer?.email})
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Order #{o._id} • Recorded Purchase Price: <strong>${o.purchasePrice}</strong>
                      </p>
                    </div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(o.placedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ALL WALL BOOKINGS */}
          {activeTab === 'bookings' && (
            bookings.length === 0 ? (
              <EmptyState title="No wall painting bookings" message="No clients have requested wall painting dates yet." />
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {bookings.map((b) => (
                  <div key={b._id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.15rem' }}>Date: {b.bookingDate}</h3>
                        <span className={`badge badge-${b.status}`}>{b.status}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Client: <strong>{b.customer?.name}</strong> ({b.customer?.email}) • Wall Size: <strong>{b.wallSize} sq ft</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Address: {b.address} • Total Quote: <strong>${b.totalPrice}</strong>
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {b.status === 'requested' && (
                        <>
                          <button
                            onClick={() => handleBookingDecision(b._id, 'confirm')}
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          >
                            <Check size={14} />
                            <span>Confirm</span>
                          </button>
                          <button
                            onClick={() => handleBookingDecision(b._id, 'decline')}
                            className="btn btn-outline"
                            style={{ padding: '8px 14px', fontSize: '0.85rem', color: 'var(--danger)' }}
                          >
                            <X size={14} />
                            <span>Decline</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ALL POTTERY REQUESTS */}
          {activeTab === 'pottery' && (
            pottery.length === 0 ? (
              <EmptyState title="No pottery requests" message="No custom ceramic commissions received yet." />
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {pottery.map((pr) => (
                  <div key={pr._id} className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.15rem' }}>{pr.quantity} × {pr.item}</h3>
                        <span className={`badge badge-${pr.status}`}>{pr.status}</span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Client: <strong>{pr.customer?.name}</strong> ({pr.customer?.email}) • Glaze: <strong>{pr.glaze}</strong>
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Needed By: <strong>{pr.neededBy}</strong> {pr.specialNotes ? `• Notes: "${pr.specialNotes}"` : ''}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {pr.status === 'requested' && (
                        <>
                          <button
                            onClick={() => handlePotteryDecision(pr._id, 'accept')}
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                          >
                            <Check size={14} />
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => handlePotteryDecision(pr._id, 'decline')}
                            className="btn btn-outline"
                            style={{ padding: '8px 14px', fontSize: '0.85rem', color: 'var(--danger)' }}
                          >
                            <X size={14} />
                            <span>Decline</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* Add / Edit Painting Modal */}
      {showAddModal && (
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
          <div className="card" style={{ maxWidth: '580px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>
              {editingPainting ? `Edit Painting: ${editingPainting.title}` : 'Add New Original Painting'}
            </h2>

            <form onSubmit={handleSavePainting}>
              <div className="form-group">
                <label className="form-label">Painting Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={paintingForm.title}
                  onChange={(e) => setPaintingForm({ ...paintingForm, title: e.target.value })}
                  placeholder="e.g. Terracotta Coastline at Dawn"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (USD)</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={paintingForm.price}
                  onChange={(e) => setPaintingForm({ ...paintingForm, price: e.target.value })}
                  placeholder="e.g. 750"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Medium</label>
                <input
                  type="text"
                  className="form-input"
                  value={paintingForm.medium}
                  onChange={(e) => setPaintingForm({ ...paintingForm, medium: e.target.value })}
                  placeholder="e.g. Oil on Belgian Linen"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dimensions</label>
                <input
                  type="text"
                  className="form-input"
                  value={paintingForm.dimensions}
                  onChange={(e) => setPaintingForm({ ...paintingForm, dimensions: e.target.value })}
                  placeholder="e.g. 30in x 40in"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Image URL</label>
                <input
                  type="url"
                  className="form-input"
                  value={paintingForm.imageUrl}
                  onChange={(e) => setPaintingForm({ ...paintingForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Artwork Description</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={paintingForm.description}
                  onChange={(e) => setPaintingForm({ ...paintingForm, description: e.target.value })}
                  placeholder="Artistic statement, pigments, and provenance"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPainting ? 'Update Artwork' : 'Publish to Gallery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
