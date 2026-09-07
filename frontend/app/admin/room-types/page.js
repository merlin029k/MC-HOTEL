'use client';

import { useEffect, useState } from 'react';
import { api } from '../../../lib/api';
import { useAdminAuth } from '../../../lib/useAdminAuth';

const EMPTY_TYPE_FORM = { name: '', description: '', base_price: '', max_guests: 1, photos: '', amenities: '' };

function linesToList(text) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

// Room type + room unit management.
// There's no dedicated "list room units" endpoint in the spec, so unit data
// is pulled from GET /api/admin/calendar (which already returns every unit,
// with its current status) over a 1-day window just to get the room list.
export default function AdminRoomTypesPage() {
  const { token, ready } = useAdminAuth();
  const [roomTypes, setRoomTypes] = useState([]);
  const [units, setUnits] = useState([]);
  const [error, setError] = useState(null);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [unitForms, setUnitForms] = useState({}); // room_type_id -> label being typed
  const [mediaForms, setMediaForms] = useState({}); // room_type_id -> { photos, amenities } text being edited
  const [mediaOpenFor, setMediaOpenFor] = useState(null); // room_type_id currently expanded

  async function loadAll() {
    try {
      const [types, calendar] = await Promise.all([
        api.getAdminRoomTypes(token),
        api.getAdminCalendar(token, todayISO(), tomorrowISO()),
      ]);
      setRoomTypes(types);
      setUnits(calendar.rooms);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    if (!ready) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  async function handleCreateType(e) {
    e.preventDefault();
    try {
      await api.createAdminRoomType(token, {
        name: typeForm.name,
        description: typeForm.description,
        base_price: Number(typeForm.base_price),
        max_guests: Number(typeForm.max_guests),
        photos: linesToList(typeForm.photos),
        amenities: linesToList(typeForm.amenities),
      });
      setTypeForm(EMPTY_TYPE_FORM);
      setShowTypeForm(false);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  function openMediaEditor(roomType) {
    setMediaOpenFor(roomType.id);
    setMediaForms((prev) => ({
      ...prev,
      [roomType.id]: {
        photos: (roomType.photos || []).join('\n'),
        amenities: (roomType.amenities || []).join('\n'),
      },
    }));
  }

  async function handleSaveMedia(roomTypeId) {
    const form = mediaForms[roomTypeId] || { photos: '', amenities: '' };
    try {
      await api.patchAdminRoomType(token, roomTypeId, {
        photos: linesToList(form.photos),
        amenities: linesToList(form.amenities),
      });
      setMediaOpenFor(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive(roomType) {
    try {
      await api.patchAdminRoomType(token, roomType.id, { active: !roomType.active });
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddUnit(roomTypeId) {
    const label = unitForms[roomTypeId];
    if (!label) return;
    try {
      await api.createAdminRoomUnit(token, { room_type_id: roomTypeId, label });
      setUnitForms((prev) => ({ ...prev, [roomTypeId]: '' }));
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleUnitService(unit) {
    try {
      if (unit.status === 'active') {
        const reason = window.prompt('Reason for taking this room out of service?') || 'Maintenance';
        await api.patchAdminRoomUnit(token, unit.id, { status: 'out_of_service', out_of_service_reason: reason });
      } else {
        await api.patchAdminRoomUnit(token, unit.id, { status: 'active', out_of_service_reason: null, out_of_service_until: null });
      }
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!ready) return null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl">Room types</h1>
        <button onClick={() => setShowTypeForm((v) => !v)} className="btn-gold">
          {showTypeForm ? 'Cancel' : '+ New room type'}
        </button>
      </div>

      {error && <p className="alert-error mb-6">{error}</p>}

      {showTypeForm && (
        <form onSubmit={handleCreateType} className="card mb-8 grid gap-4 sm:grid-cols-2">
          <h3 className="col-span-full text-base text-slate-700">New room type</h3>
          <label className="field col-span-full">
            Name
            <input className="input" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required />
          </label>
          <label className="field col-span-full">
            Description
            <textarea className="input" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
          </label>
          <label className="field">
            Base price (XAF/night)
            <input className="input" type="number" value={typeForm.base_price} onChange={(e) => setTypeForm({ ...typeForm, base_price: e.target.value })} required />
          </label>
          <label className="field">
            Max guests
            <input className="input" type="number" min={1} value={typeForm.max_guests} onChange={(e) => setTypeForm({ ...typeForm, max_guests: e.target.value })} required />
          </label>
          <label className="field col-span-full">
            Photo URLs (one per line)
            <textarea
              className="input"
              rows={3}
              placeholder={'https://example.com/photo1.jpg\nhttps://example.com/photo2.jpg'}
              value={typeForm.photos}
              onChange={(e) => setTypeForm({ ...typeForm, photos: e.target.value })}
            />
          </label>
          <label className="field col-span-full">
            Amenities (one per line)
            <textarea
              className="input"
              rows={3}
              placeholder={'Free Wi-Fi\nAir conditioning'}
              value={typeForm.amenities}
              onChange={(e) => setTypeForm({ ...typeForm, amenities: e.target.value })}
            />
          </label>
          <button type="submit" className="btn-primary col-span-full sm:col-span-1">Create room type</button>
        </form>
      )}

      <div className="grid gap-6">
        {roomTypes.map((rt) => (
          <section key={rt.id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg">{rt.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{rt.description}</p>
                <p className="mt-2 text-sm font-medium text-brand-700">
                  {rt.base_price} XAF/night · sleeps {rt.max_guests}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={rt.active ? 'badge-green' : 'badge-slate'}>
                  {rt.active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => toggleActive(rt)} className="btn-secondary">
                  {rt.active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>

            {(rt.photos || []).length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {rt.photos.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={src} src={src} alt="" className="h-16 w-24 shrink-0 rounded-md object-cover" />
                ))}
              </div>
            )}
            {(rt.amenities || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {rt.amenities.map((a) => (
                  <span key={a} className="badge-blue">{a}</span>
                ))}
              </div>
            )}

            {mediaOpenFor === rt.id ? (
              <div className="mt-4 grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4">
                <label className="field">
                  Photo URLs (one per line)
                  <textarea
                    className="input"
                    rows={3}
                    value={mediaForms[rt.id]?.photos || ''}
                    onChange={(e) =>
                      setMediaForms((prev) => ({ ...prev, [rt.id]: { ...prev[rt.id], photos: e.target.value } }))
                    }
                  />
                </label>
                <label className="field">
                  Amenities (one per line)
                  <textarea
                    className="input"
                    rows={3}
                    value={mediaForms[rt.id]?.amenities || ''}
                    onChange={(e) =>
                      setMediaForms((prev) => ({ ...prev, [rt.id]: { ...prev[rt.id], amenities: e.target.value } }))
                    }
                  />
                </label>
                <div className="flex gap-2">
                  <button onClick={() => handleSaveMedia(rt.id)} className="btn-primary">Save</button>
                  <button onClick={() => setMediaOpenFor(null)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => openMediaEditor(rt)} className="btn-link mt-3 text-sm">
                Edit photos & amenities
              </button>
            )}

            <h4 className="mt-6 mb-2 text-sm font-semibold text-slate-600">Room units</h4>
            <ul className="divide-y divide-slate-100 text-sm">
              {units.filter((u) => u.room_type_id === rt.id).map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2">
                  <span>
                    {u.label}{' '}
                    <span className={u.status === 'active' ? 'badge-green' : 'badge-slate'}>{u.status}</span>
                    {u.status === 'out_of_service' && u.out_of_service_reason && (
                      <span className="ml-2 text-xs text-slate-400">({u.out_of_service_reason})</span>
                    )}
                  </span>
                  <button onClick={() => toggleUnitService(u)} className="btn-link text-sm">
                    {u.status === 'active' ? 'Mark out of service' : 'Reactivate'}
                  </button>
                </li>
              ))}
              {units.filter((u) => u.room_type_id === rt.id).length === 0 && (
                <li className="py-2 text-slate-400">No units yet.</li>
              )}
            </ul>

            <div className="mt-4 flex gap-2">
              <input
                className="input"
                placeholder="e.g. Room 101"
                value={unitForms[rt.id] || ''}
                onChange={(e) => setUnitForms((prev) => ({ ...prev, [rt.id]: e.target.value }))}
              />
              <button onClick={() => handleAddUnit(rt.id)} className="btn-secondary whitespace-nowrap">
                Add unit
              </button>
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
