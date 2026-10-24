const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // Always include credentials (HTTP-only cookies)
    credentials: 'include',
  };

  if (options.body && typeof options.body !== 'string') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (userData) => request('/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => request('/auth/login', { method: 'POST', body: credentials }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request('/auth/me'),

  // Paintings
  getPaintings: (availableOnly = false) => request(`/paintings${availableOnly ? '?availableOnly=true' : ''}`),
  getPainting: (id) => request(`/paintings/${id}`),
  addPainting: (paintingData) => request('/paintings', { method: 'POST', body: paintingData }),
  editPainting: (id, paintingData) => request(`/paintings/${id}`, { method: 'PUT', body: paintingData }),

  // Orders
  purchasePainting: (paintingId) => request('/orders/purchase', { method: 'POST', body: { paintingId } }),
  getMyOrders: () => request('/orders/my'),
  getAllOrders: () => request('/orders/all'),
  cancelOrder: (id) => request(`/orders/${id}/cancel`, { method: 'PUT' }),

  // Wall Bookings
  getBookingAvailability: () => request('/bookings/availability'),
  createBooking: (bookingData) => request('/bookings', { method: 'POST', body: bookingData }),
  getMyBookings: () => request('/bookings/my'),
  getAllBookings: () => request('/bookings/all'),
  confirmBooking: (id) => request(`/bookings/${id}/confirm`, { method: 'PUT' }),
  declineBooking: (id) => request(`/bookings/${id}/decline`, { method: 'PUT' }),
  cancelBooking: (id) => request(`/bookings/${id}/cancel`, { method: 'PUT' }),

  // Pottery Requests
  getPotteryCatalog: () => request('/pottery/catalog'),
  createPotteryRequest: (data) => request('/pottery', { method: 'POST', body: data }),
  getMyPotteryRequests: () => request('/pottery/my'),
  getAllPotteryRequests: () => request('/pottery/all'),
  editPotteryRequest: (id, data) => request(`/pottery/${id}`, { method: 'PUT', body: data }),
  cancelPotteryRequest: (id) => request(`/pottery/${id}/cancel`, { method: 'PUT' }),
  acceptPotteryRequest: (id) => request(`/pottery/${id}/accept`, { method: 'PUT' }),
  declinePotteryRequest: (id) => request(`/pottery/${id}/decline`, { method: 'PUT' }),

  // Admin stats
  getAdminStats: () => request('/admin/stats'),
};
