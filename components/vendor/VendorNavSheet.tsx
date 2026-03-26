'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface VendorNavSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VendorNavSheet({ open, onOpenChange }: VendorNavSheetProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-64 border-r border-slate-100 bg-white p-0 shadow-sm sm:max-w-[16rem]"
        style={{
          fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
        }}
      >
        <SheetHeader className="border-b border-slate-100 px-6 py-4 text-left">
          <SheetTitle className="text-lg font-extrabold text-gray-900">
            Sprint
          </SheetTitle>
        </SheetHeader>
        <nav className="space-y-0.5 p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => onOpenChange(false)}
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
      </SheetContent>
    </Sheet>
  );
}
