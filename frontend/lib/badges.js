const BOOKING_STATUS_CLASSES = {
  confirmed: 'badge-blue',
  checked_in: 'badge-green',
  checked_out: 'badge-slate',
  cancelled: 'badge-rose',
};

const PAYMENT_STATUS_CLASSES = {
  pending: 'badge-amber',
  paid: 'badge-green',
  refunded: 'badge-slate',
  failed: 'badge-rose',
};

export function bookingStatusBadgeClass(status) {
  return BOOKING_STATUS_CLASSES[status] || 'badge-slate';
}

export function paymentStatusBadgeClass(status) {
  return PAYMENT_STATUS_CLASSES[status] || 'badge-slate';
}
