'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const token = searchParams.get('token');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="card max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          ✓
        </div>
        <h1 className="text-xl">Booking confirmed</h1>
        <p className="mt-2 text-sm text-slate-500">
          Your reference: <span className="font-semibold text-slate-800">{ref}</span>
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Payment is still pending — you&apos;ll receive a payment link by email. You can view or
          cancel this booking any time using the link below.
        </p>
        <Link href={`/my-booking/${token}`} className="btn-primary mt-6 w-full">
          Manage my booking
        </Link>
      </div>
    </div>
  );
}

// Wrapped in Suspense because useSearchParams() requires it to avoid a full
// client-side-render bailout for this route.
export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={<p className="p-6">Loading…</p>}>
      <ConfirmationContent />
    </Suspense>
  );
}
