"use client"

import { createContext, useCallback, useContext, type ReactNode } from "react"

export interface VendorNotificationRow {
  id: string
  message: string
  is_read: boolean
  created_at: string
  booking_date?: string
}

type AddNotification = (
  item: VendorNotificationRow,
  /** If provided, skips add when a notification for this booking already exists (avoids duplicates when layout + dashboard both receive the event). */
  bookingIdForDedupe?: string
) => void

type VendorNotificationContextValue = {
  addNotification: AddNotification
}

const VendorNotificationContext = createContext<VendorNotificationContextValue | null>(null)

const MAX_NOTIFICATIONS = 50

export function useVendorNotification() {
  const ctx = useContext(VendorNotificationContext)
  return ctx
}

type ProviderProps = {
  children: ReactNode
  setNotifications: React.Dispatch<React.SetStateAction<VendorNotificationRow[]>>
}

export function VendorNotificationProvider({ children, setNotifications }: ProviderProps) {
  const addNotification = useCallback<AddNotification>(
    (item, bookingIdForDedupe) => {
      setNotifications((prev) => {
        if (bookingIdForDedupe && prev.some((n) => n.id.startsWith(`local-${bookingIdForDedupe}-`))) return prev
        return [item, ...prev].slice(0, MAX_NOTIFICATIONS)
      })
    },
    [setNotifications]
  )

  return (
    <VendorNotificationContext.Provider value={{ addNotification }}>
      {children}
    </VendorNotificationContext.Provider>
  )
}
