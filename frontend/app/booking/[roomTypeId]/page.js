'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '../../../lib/api';
import { toAmenityList } from '../../../lib/amenities';
import RoomGallery from '../../../components/RoomGallery';
import AmenityList from '../../../components/AmenityList';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Step 2 of the booking flow: room summary + guest details, then create the booking.
function BookingDetailContent() {
  const { roomTypeId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const guestsParam = Number(searchParams.get('guests') || 1);
  const roomName = searchParams.get('name') || 'Selected room';
  const price = Number(searchParams.get('price') || 0);
  const maxGuests = Number(searchParams.get('max_guests') || guestsParam);
  const photos = (() => {
    try {
      return JSON.parse(searchParams.get('photos') || '[]');
    } catch {
      return [];
    }
  })();
  const amenities = toAmenityList((() => {
    try {
      return JSON.parse(searchParams.get('amenities') || '[]');
    } catch {
      return [];
    }
  })());

  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / MS_PER_DAY));
  const total = price * nights;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState(guestsParam);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const booking = await api.createBooking({
        room_type_id: roomTypeId,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: Number(guestsCount),
        guest: { full_name: fullName, email, phone },
      });
      router.push(`/booking/confirmation?ref=${booking.reference_code}&token=${booking.cancel_token}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-brand-800 text-white">
        <div className="mx-auto max-w-3xl px-6 py-6">
          <span className="font-serif text-2xl text-white">MC Hotel</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="card mb-6">
          <RoomGallery photos={photos} alt={roomName} />
          <h1 className="mt-4 text-xl">{roomName}</h1>
          {amenities.length > 0 && <AmenityList amenities={amenities} className="mt-2 gap-4" />}
          <p className="mt-3 text-sm text-slate-500">
            {checkIn} → {checkOut} · {nights} night{nights > 1 ? 's' : ''}
          </p>
          <p className="mt-3 text-lg font-semibold text-brand-700">Total: {total} XAF</p>
        </div>

        <form onSubmit={handleConfirm} className="card grid gap-4">
          <h2 className="text-base text-slate-700">Your details</h2>
          <label className="field">
            Full name
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="field">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Phone
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </label>
          <label className="field">
            Guests
            <input
              className="input"
              type="number"
              min={1}
              max={maxGuests}
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
              required
            />
          </label>

          {error && <p className="alert-error">{error}</p>}

          <button type="submit" className="btn-gold mt-2" disabled={submitting}>
            {submitting ? 'Booking…' : 'Confirm booking'}
          </button>
        </form>
      </main>
    </div>
  );
}

// Wrapped in Suspense because useSearchParams() requires it to avoid a full
// client-side-render bailout for this route.
export default function BookingDetailPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <BookingDetailContent />
    </Suspense>
  );
}
