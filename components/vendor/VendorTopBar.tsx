'use client';

import { Menu } from 'lucide-react';

interface VendorTopBarProps {
  pageTitle?: string;
  onMenuClick?: () => void;
}

export function VendorTopBar({ pageTitle = 'Dashboard', onMenuClick }: VendorTopBarProps) {
  return (
    <header
      className="sticky top-0 z-20 border-b border-slate-100/80 bg-white/70 backdrop-blur-md"
      style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        {onMenuClick && (
          <button
            type="button"
            onClick={onMenuClick}
            className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
          </button>
        )}
        <h1 className="truncate text-lg font-extrabold text-gray-900">{pageTitle}</h1>
      </div>
    </header>
  );
}
