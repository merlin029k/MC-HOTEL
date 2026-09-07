const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  getAvailability: (checkIn, checkOut, guests) =>
    request(`/availability?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}`),
  createBooking: (payload) => request('/bookings', { method: 'POST', body: payload }),
  getBooking: (cancelToken) => request(`/bookings/${cancelToken}`),
  cancelBooking: (cancelToken) => request(`/bookings/${cancelToken}/cancel`, { method: 'POST' }),

  adminLogin: (email, password) =>
    request('/admin/login', { method: 'POST', body: { email, password } }),
  getAdminDashboard: (token) => request('/admin/dashboard', { token }),

  getAdminBookings: (token, params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null))
    ).toString();
    return request(`/admin/bookings${qs ? `?${qs}` : ''}`, { token });
  },
  createAdminBooking: (token, payload) =>
    request('/admin/bookings', { method: 'POST', body: payload, token }),
  patchAdminBooking: (token, id, payload) =>
    request(`/admin/bookings/${id}`, { method: 'PATCH', body: payload, token }),

  getAdminRoomTypes: (token) => request('/admin/room-types', { token }),
  createAdminRoomType: (token, payload) =>
    request('/admin/room-types', { method: 'POST', body: payload, token }),
  patchAdminRoomType: (token, id, payload) =>
    request(`/admin/room-types/${id}`, { method: 'PATCH', body: payload, token }),

  createAdminRoomUnit: (token, payload) =>
    request('/admin/room-units', { method: 'POST', body: payload, token }),
  patchAdminRoomUnit: (token, id, payload) =>
    request(`/admin/room-units/${id}`, { method: 'PATCH', body: payload, token }),

  getAdminCalendar: (token, from, to) =>
    request(`/admin/calendar?from=${from}&to=${to}`, { token }),
};
