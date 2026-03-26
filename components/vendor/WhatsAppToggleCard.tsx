'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface WhatsAppToggleCardProps {
  userId: string;
}

export function WhatsAppToggleCard({ userId }: WhatsAppToggleCardProps) {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    (async () => {
      try {
        const { data } = await supabase
          .from('vendor_settings')
          .select('whatsapp_alerts_enabled')
          .eq('vendor_id', userId)
          .single();
        if (!cancelled) setEnabled(data?.whatsapp_alerts_enabled ?? false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const handleToggle = async () => {
    if (updating) return;
    setUpdating(true);
    const supabase = createClient();
    const next = !enabled;
    const { error } = await supabase
      .from('vendor_settings')
      .upsert(
        { vendor_id: userId, whatsapp_alerts_enabled: next },
        { onConflict: 'vendor_id' }
      );
    if (!error) setEnabled(next);
    setUpdating(false);
  };

  return (
    <div
      className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm"
      style={{ fontFamily: 'var(--font-plus-jakarta), "Plus Jakarta Sans", system-ui, sans-serif' }}
    >
      <h2 className="text-lg font-extrabold text-gray-900 mb-3">Settings</h2>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <MessageCircle className="h-5 w-5 text-[#8C9EFF]" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">WhatsApp alerts</p>
            <p className="text-xs text-gray-500">Get notified about new bookings</p>
          </div>
        </div>
        {loading ? (
          <div className="h-6 w-11 animate-pulse rounded-full bg-slate-200" />
        ) : (
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            disabled={updating}
            onClick={handleToggle}
            className={cn(
              'relative h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#8C9EFF] focus:ring-offset-2',
              enabled ? 'bg-[#8C9EFF]' : 'bg-slate-200'
            )}
          >
            <span
              className={cn(
                'absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                enabled ? 'left-[26px]' : 'left-1'
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
}
