'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { bookingStatusBadgeClass, paymentStatusBadgeClass } from '../../../lib/badges';

// Guest self-service screen: view own booking and cancel it.
export default function MyBookingPage({ params }) {
  const { cancelToken } = params;
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    api.getBooking(cancelToken).then(setBooking).catch((err) => setError(err.message));
  }, [cancelToken]);

  async function handleCancel() {
    setCancelling(true);
    try {
      await api.cancelBooking(cancelToken);
      setBooking((prev) => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-800 text-white">
        <div className="mx-auto max-w-2xl px-6 py-6">
          <span className="font-serif text-2xl text-white">MC Hotel</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {error && <p className="alert-error">{error}</p>}
        {!booking && !error && <p className="text-slate-500">Loading…</p>}

        {booking && (
          <div className="card">
            <div className="flex items-start justify-between">
              <h1 className="text-xl">Booking {booking.reference_code}</h1>
              <span className={bookingStatusBadgeClass(booking.status)}>{booking.status}</span>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Room</dt>
                <dd className="font-medium text-slate-800">{booking.room_type_name} ({booking.room_label})</dd>
              </div>
              <div>
                <dt className="text-slate-500">Dates</dt>
                <dd className="font-medium text-slate-800">{booking.check_in} → {booking.check_out}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Guest</dt>
                <dd className="font-medium text-slate-800">{booking.guest_name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Payment</dt>
                <dd>
                  <span className={paymentStatusBadgeClass(booking.payment_status)}>
                    {booking.payment_status}
                  </span>
                </dd>
              </div>
            </dl>

            {booking.status === 'confirmed' && (
              <button onClick={handleCancel} disabled={cancelling} className="btn-danger mt-6">
                {cancelling ? 'Cancelling…' : 'Cancel booking'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
