'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAdminAuth } from '../../../lib/useAdminAuth';
import { bookingStatusBadgeClass, paymentStatusBadgeClass } from '../../../lib/badges';

const STATUS_OPTIONS = ['confirmed', 'checked_in', 'checked_out', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'paid', 'refunded', 'failed'];

const EMPTY_FORM = {
  room_type_id: '',
  check_in: '',
  check_out: '',
  guests_count: 1,
  full_name: '',
  email: '',
  phone: '',
};

export default function AdminBookingsPage() {
  const { token, ready } = useAdminAuth();
  const [bookings, setBookings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [showForm, setShowForm] = useState(false);

  async function loadBookings() {
    try {
      const rows = await api.getAdminBookings(token, { status, q });
      setBookings(rows);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!ready) return;
    loadBookings();
    api.getAdminRoomTypes(token).then(setRoomTypes).catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!ready) return;
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleSearchSubmit(e) {
    e.preventDefault();
    loadBookings();
  }

  async function handlePatch(id, payload) {
    try {
      await api.patchAdminBooking(token, id, payload);
      loadBookings();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateBooking(e) {
    e.preventDefault();
    setFormError(null);
    try {
      await api.createAdminBooking(token, {
        room_type_id: form.room_type_id,
        check_in: form.check_in,
        check_out: form.check_out,
        guests_count: Number(form.guests_count),
        guest: { full_name: form.full_name, email: form.email, phone: form.phone },
      });
      setForm(EMPTY_FORM);
      setShowForm(false);
      loadBookings();
    } catch (err) {
      setFormError(err.message);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Bookings</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-gold">
          {showForm ? 'Cancel' : '+ Manual booking'}
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className="card mb-6 flex flex-wrap items-end gap-3">
        <label className="field flex-1">
          Search
          <input
            className="input"
            placeholder="Reference / guest name / email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label className="field">
          Status
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-secondary">Search</button>
      </form>

      {error && <p className="alert-error mb-6">{error}</p>}

      {showForm && (
        <form onSubmit={handleCreateBooking} className="card mb-6 grid gap-4 sm:grid-cols-2">
          <h3 className="col-span-full text-base text-slate-700">New manual booking</h3>
          <label className="field">
            Room type
            <select
              className="input"
              value={form.room_type_id}
              onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
              required
            >
              <option value="">Select a room type…</option>
              {roomTypes.map((rt) => (
                <option key={rt.id} value={rt.id}>{rt.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Guests
            <input className="input" type="number" min={1} value={form.guests_count} onChange={(e) => setForm({ ...form, guests_count: e.target.value })} required />
          </label>
          <label className="field">
            Check-in
            <input className="input" type="date" value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} required />
          </label>
          <label className="field">
            Check-out
            <input className="input" type="date" value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} required />
          </label>
          <label className="field">
            Guest name
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
          </label>
          <label className="field">
            Guest email
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </label>
          <label className="field">
            Guest phone
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </label>
          {formError && <p className="alert-error col-span-full">{formError}</p>}
          <button type="submit" className="btn-primary col-span-full sm:col-span-1">Create booking</button>
        </form>
      )}

      <div className="card overflow-x-auto p-0">
        <table className="table-base">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Guest</th>
              <th>Room</th>
              <th>Dates</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="font-medium text-slate-800">{b.reference_code}</td>
                <td>
                  {b.guest_name}
                  <br />
                  <span className="text-xs text-slate-400">{b.guest_email}</span>
                </td>
                <td>{b.room_type_name} ({b.room_label})</td>
                <td className="whitespace-nowrap">{b.check_in} → {b.check_out}</td>
                <td>
                  <select
                    className={`${bookingStatusBadgeClass(b.status)} border-0 bg-transparent pr-1`}
                    value={b.status}
                    onChange={(e) => handlePatch(b.id, { status: e.target.value })}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    className={`${paymentStatusBadgeClass(b.payment_status)} border-0 bg-transparent pr-1`}
                    value={b.payment_status}
                    onChange={(e) => handlePatch(b.id, { payment_status: e.target.value })}
                  >
                    {PAYMENT_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="capitalize text-slate-500">{b.source}</td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={7} className="text-center text-slate-400">No bookings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
