'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAdminAuth } from '../../../lib/useAdminAuth';

function ArrivalsList({ title, rows }) {
  return (
    <div className="card">
      <h2 className="mb-4 text-base text-slate-700">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-slate-400">None</p>}
      <ul className="divide-y divide-slate-100">
        {rows.map((b) => (
          <li key={b.id} className="flex items-center justify-between py-2 text-sm">
            <span className="font-medium text-slate-800">{b.guest_name}</span>
            <span className="text-slate-500">{b.room_type_name} ({b.room_label})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Admin dashboard: today's arrivals/departures/occupancy.
export default function AdminDashboardPage() {
  const { token, ready } = useAdminAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ready) return;
    api.getAdminDashboard(token).then(setData).catch((err) => setError(err.message));
  }, [ready, token]);

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="mb-6 text-2xl">Dashboard</h1>

      {error && <p className="alert-error mb-6">{error}</p>}
      {!data && !error && <p className="text-slate-500">Loading…</p>}

      {data && (
        <div className="grid gap-6">
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Occupancy</p>
              <p className="mt-1 text-3xl font-semibold text-brand-700">
                {data.occupancy.occupied_units}
                <span className="text-lg text-slate-400"> / {data.occupancy.total_active_units}</span>
              </p>
            </div>
            <div className="text-4xl">🏨</div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <ArrivalsList title="Arrivals today" rows={data.arrivals} />
            <ArrivalsList title="Departures today" rows={data.departures} />
          </div>
        </div>
      )}
    </main>
  );
}
