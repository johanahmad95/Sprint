"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface NotificationRow {
  id: string
  message: string
  is_read: boolean
  created_at: string
}

interface NotificationFeedProps {
  notifications: NotificationRow[]
}

export function NotificationFeed({ notifications }: NotificationFeedProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-gray-900">
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500">
            No notifications yet. New bookings for your courts will appear here.
          </p>
        ) : (
          <ul className="space-y-3 text-sm max-h-80 overflow-y-auto pr-1">
            {notifications.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2.5"
              >
                <p className="text-gray-800">{n.message}</p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {new Date(n.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

