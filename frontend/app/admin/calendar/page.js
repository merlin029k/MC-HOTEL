'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../lib/api';
import { useAdminAuth } from '../../../lib/useAdminAuth';

const DAYS_SHOWN = 14;

function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

function buildDateRange(fromISO, count) {
  const dates = [];
  const start = new Date(`${fromISO}T00:00:00Z`);
  for (let i = 0; i < count; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    dates.push(toISODate(d));
  }
  return dates;
}

// Room x date availability grid.
export default function AdminCalendarPage() {
  const { token, ready } = useAdminAuth();
  const [from, setFrom] = useState(() => toISODate(new Date()));
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const dates = useMemo(() => buildDateRange(from, DAYS_SHOWN), [from]);
  const to = dates[dates.length - 1];

  useEffect(() => {
    if (!ready) return;
    api.getAdminCalendar(token, from, to).then(setData).catch((err) => setError(err.message));
  }, [ready, token, from, to]);

  // For a given room unit + date, find the booking (if any) covering that night.
  function bookingFor(roomUnitId, date) {
    if (!data) return null;
    return data.bookings.find(
      (b) => b.room_unit_id === roomUnitId && date >= b.check_in && date < b.check_out
    );
  }

  function isOutOfService(room, date) {
    return room.status === 'out_of_service' && (!room.out_of_service_until || date <= room.out_of_service_until);
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Calendar</h1>
        <label className="field flex-row items-center gap-2">
          From
          <input className="input" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
      </div>

      <div className="mb-4 flex gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-blue-200" /> Confirmed</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-emerald-200" /> Checked in</span>
        <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-slate-200" /> Out of service</span>
      </div>

      {error && <p className="alert-error">{error}</p>}
      {!data && !error && <p className="text-slate-500">Loading…</p>}

      {data && (
        <div className="card overflow-x-auto p-0">
          <table className="table-base text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-50">Room</th>
                {dates.map((d) => (
                  <th key={d} className="min-w-[64px] text-center">{d.slice(5)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rooms.map((room) => (
                <tr key={room.id}>
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-white font-medium text-slate-700">
                    {room.room_type_name} — {room.label}
                  </td>
                  {dates.map((d) => {
                    const booking = bookingFor(room.id, d);
                    const oos = isOutOfService(room, d);
                    let label = '';
                    let cellClass = '';
                    if (oos) {
                      label = 'OOS';
                      cellClass = 'bg-slate-100 text-slate-400';
                    } else if (booking) {
                      label = booking.guest_name.split(' ')[0];
                      cellClass = booking.status === 'checked_in' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700';
                    }
                    return (
                      <td
                        key={d}
                        className={`text-center ${cellClass}`}
                        title={booking ? `${booking.reference_code} — ${booking.guest_name}` : room.out_of_service_reason || ''}
                      >
                        {label}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
