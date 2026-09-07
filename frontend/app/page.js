'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { toAmenityList } from '../lib/amenities';
import RoomCardImage from '../components/RoomCardImage';
import AmenityList from '../components/AmenityList';
import { ShieldCheckIcon, CalendarCheckIcon, ClockIcon, UsersIcon } from '../lib/icons';

const TRUST_BADGES = [
  { icon: CalendarCheckIcon, title: 'Instant confirmation', text: 'Your booking is confirmed the moment you check out.' },
  { icon: ShieldCheckIcon, title: 'Secure booking', text: 'Your details are only used to manage your stay.' },
  { icon: ClockIcon, title: 'Free cancellation', text: 'Manage or cancel your booking anytime before check-in.' },
];

const TODAY = new Date().toISOString().slice(0, 10);

export default function HomePage() {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const roomTypes = await api.getAvailability(checkIn, checkOut, guests);
      setResults(roomTypes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="bg-brand-800 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
          <span className="font-serif text-2xl tracking-wide text-white">MC Hotel</span>
          <Link href="/admin/login" className="text-xs text-brand-200 hover:text-white">
            Staff login
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-700 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/rooms/hero.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25"
        />
        <div className="relative mx-auto max-w-5xl px-6 py-16 text-center sm:py-20">
          <p className="text-xs uppercase tracking-[0.2em] text-gold-300">Welcome</p>
          <h1 className="mt-3 font-serif text-3xl text-white sm:text-4xl">Find your stay</h1>
          <p className="mt-2 text-brand-100">Comfortable rooms, simple booking, no surprises.</p>
        </div>
      </section>

      <main className="mx-auto max-w-5xl px-6">
        <form
          onSubmit={handleSearch}
          className="card -mt-10 grid gap-4 sm:grid-cols-4 sm:items-end"
        >
          <label className="field">
            Check-in
            <input
              className="input"
              type="date"
              min={TODAY}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Check-out
            <input
              className="input"
              type="date"
              min={checkIn || TODAY}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </label>
          <label className="field">
            Guests
            <input
              className="input"
              type="number"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              required
            />
          </label>
          <button type="submit" className="btn-gold h-10" disabled={loading}>
            {loading ? 'Searching…' : 'Check availability'}
          </button>
        </form>

        {/* Trust badges */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {TRUST_BADGES.map(({ icon: IconComp, title, text }) => (
            <div key={title} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <IconComp className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
              <div>
                <p className="text-sm font-semibold text-brand-800">{title}</p>
                <p className="text-xs text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="alert-error mt-6">{error}</p>}

        {results && (
          <div className="mt-8 grid gap-6 pb-16 sm:grid-cols-2">
            {results.length === 0 && (
              <p className="col-span-full text-slate-500">No rooms available for those dates.</p>
            )}
            {results.map((room) => {
              const amenities = toAmenityList(room.amenities);
              return (
                <div key={room.id} className="card flex flex-col gap-3 overflow-hidden !p-0">
                  <RoomCardImage photos={room.photos} alt={room.name} />
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div>
                      <h3 className="text-lg">{room.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{room.description}</p>
                    </div>
                    {amenities.length > 0 && <AmenityList amenities={amenities} />}
                    <div className="mt-auto flex items-center justify-between text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <UsersIcon className="h-4 w-4 text-slate-400" />
                        Sleeps up to {room.max_guests}
                      </span>
                      <span className="text-base font-semibold text-brand-700">
                        {room.base_price} XAF<span className="text-xs text-slate-400">/night</span>
                      </span>
                    </div>
                    <Link
                      href={`/booking/${room.id}?check_in=${checkIn}&check_out=${checkOut}&guests=${guests}&name=${encodeURIComponent(room.name)}&price=${room.base_price}&max_guests=${room.max_guests}&photos=${encodeURIComponent(JSON.stringify(room.photos || []))}&amenities=${encodeURIComponent(JSON.stringify(room.amenities || []))}`}
                      className="btn-primary mt-1"
                    >
                      Select this room
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
