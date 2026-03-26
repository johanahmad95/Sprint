'use client';

import Link from 'next/link';

export default function VendorSettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Settings</h1>
      <p className="text-gray-600">
        WhatsApp notification preferences are on the{' '}
        <Link href="/dashboard" className="font-medium text-[#8C9EFF] hover:underline">
          Dashboard
        </Link>
        .
      </p>
    </div>
  );
}
