'use client';

import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export function DashboardRefreshButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
      aria-label="Refresh list"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </button>
  );
}
