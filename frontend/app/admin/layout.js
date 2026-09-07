'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/bookings', label: 'Bookings' },
  { href: '/admin/calendar', label: 'Calendar' },
  { href: '/admin/room-types', label: 'Room types' },
];

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return children;
  }

  function handleLogout() {
    localStorage.removeItem('mc_hotel_admin_token');
    router.push('/admin/login');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="flex items-center gap-6 bg-brand-800 px-6 py-4 text-white">
        <span className="font-serif text-lg text-white">MC Hotel Admin</span>
        <div className="flex gap-4 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href
                  ? 'font-semibold text-gold-300'
                  : 'text-brand-100 hover:text-white'
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button onClick={handleLogout} className="ml-auto text-sm text-brand-100 hover:text-white">
          Log out
        </button>
      </nav>
      {children}
    </div>
  );
}
