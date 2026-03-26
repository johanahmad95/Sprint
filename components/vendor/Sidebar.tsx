'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="fixed left-0 top-0 z-30 hidden h-screen w-56 flex-col border-r border-slate-100 bg-white lg:flex"
      style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <div className="flex h-16 items-center border-b border-slate-100 px-6">
        <Link href="/" className="text-lg font-extrabold text-gray-900">
          Sprint
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-slate-50 text-gray-900' : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900'
              )}
            >
              <Icon className="h-5 w-5 shrink-0 text-[#8C9EFF]" strokeWidth={2} aria-hidden />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
