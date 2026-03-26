"use client"

import { type ReactNode, useState, useEffect, useMemo, useRef, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Activity, Calendar, LayoutGrid, Settings, LogOut, CalendarDays, Bell, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { toast } from "sonner"
import { VendorNotificationProvider } from "@/contexts/VendorNotificationContext"

// Notifications: global state lives in this layout so the bell badge persists across Courts, Schedule, Bookings, etc.
const NOTIFICATIONS_TABLE = "notifications" as const
const MAX_NOTIFICATIONS = 50

interface NotificationRow {
  id: string
  message: string
  is_read: boolean
  created_at: string
  /** When set, clicking this notification navigates to Bookings tab filtered by this date (YYYY-MM-DD). */
  booking_date?: string
}

type CourtRow = {
  id: string
  name?: string | null
  venue_id: string | null
  venue_name?: string | null
}

type VenueRow = {
  id: string
  name: string
}

const navItems = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: Activity },
  { href: "/vendor/dashboard/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/vendor/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/vendor/dashboard/courts", label: "Courts", icon: LayoutGrid },
  { href: "/vendor/dashboard/settings", label: "Settings", icon: Settings },
] as const

export default function VendorDashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [vendorMenuOpen, setVendorMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [courts, setCourts] = useState<CourtRow[]>([])
  const [venues, setVenues] = useState<VenueRow[]>([])
  const supabase = useMemo(() => createClient(), [])
  const courtIdsRef = useRef<string[]>([])
  const courtsRef = useRef<CourtRow[]>([])
  courtIdsRef.current = courts.map((c) => c.id).filter(Boolean)
  courtsRef.current = courts

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  )

  const addNotification = useCallback((item: NotificationRow, bookingIdForDedupe?: string) => {
    setNotifications((prev) => {
      if (bookingIdForDedupe && prev.some((n) => n.id.startsWith(`local-${bookingIdForDedupe}-`))) return prev
      return [item, ...prev].slice(0, MAX_NOTIFICATIONS)
    })
  }, [])

  // Load user, profile, and notifications
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
      setUserEmail(user?.email ?? null)
      if (!user?.id) {
        setProfile(null)
        setNotifications([])
        return
      }
      const [{ data: profileData }, { data: notifData }] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("id", user.id).single(),
        supabase
          .from(NOTIFICATIONS_TABLE)
          .select("*")
          .eq("vendor_id", user.id)
          .order("created_at", { ascending: false })
          .limit(MAX_NOTIFICATIONS),
      ])
      setProfile((profileData as { full_name?: string } | null) ?? null)
      const serverNotifs = (notifData as NotificationRow[]) ?? []
      setNotifications((prev) => {
        const localOnly = prev.filter((n) => n.id.startsWith("local-"))
        const merged = [...serverNotifs, ...localOnly]
        merged.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return merged.slice(0, MAX_NOTIFICATIONS)
      })

      // Load courts (with name for notifications) and venue name via explicit FK
      const { data: courtsData } = await supabase
        .from("courts")
        .select("id, name, venue_id, venues!venue_id ( name )")
        .eq("vendor_id", user.id)

      const rawCourts = (courtsData as (CourtRow & { venues?: { name: string | null } | null })[] | null) ?? []
      const courtRows: CourtRow[] = rawCourts.map((c) => ({
        id: c.id,
        name: c.name ?? null,
        venue_id: c.venue_id,
        venue_name: c.venues?.name ?? null,
      }))
      setCourts(courtRows)

      const venueIds = Array.from(
        new Set(
          courtRows
            .map((c) => c.venue_id)
            .filter((v): v is string => Boolean(v)),
        ),
      )

      if (venueIds.length > 0) {
        const { data: venuesData } = await supabase
          .from("venues")
          .select("id, name")
          .in("id", venueIds)

        setVenues(((venuesData as VenueRow[] | null) ?? []).filter(Boolean))
      } else {
        setVenues([])
      }
    }
    load()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => load())
    return () => subscription.unsubscribe()
  }, [supabase])

  // Realtime: subscribe to INSERTs for this vendor so badge updates when a new booking creates a notification
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel("vendor-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: NOTIFICATIONS_TABLE,
          filter: `vendor_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as NotificationRow
          setNotifications((prev) => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS))
          toast.success("New Booking Received!", { description: newNotif.message })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  // Realtime: bookings INSERT → update bell list AND show toast in the same callback (sync).
  // Subscription stays active (no courtCount in deps) so we don't miss events; courtIdsRef is read at callback time.
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel("public:bookings")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
        },
        async (payload) => {
          const row = payload.new as {
            id: string
            court_id?: string | null
            user_id?: string | null
            booking_date?: string
            start_time?: string
          }
          const courtId = row?.court_id
          if (!courtId || !courtIdsRef.current.includes(courtId)) return

          const court = courtsRef.current.find((c) => c.id === courtId)
          const venueName = court?.venue_name?.trim() ?? "Venue"
          const courtName = court?.name?.trim() ?? "Court"
          const startTime = row.start_time ? String(row.start_time).substring(0, 5) : ""

          let customerName = "Customer"
          if (row.user_id) {
            const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", row.user_id).single()
            customerName = (profile?.full_name ?? "").trim() || "Customer"
          }

          const message = startTime
            ? `New booking: ${venueName} - ${courtName} for ${customerName} at ${startTime}`
            : `New booking: ${venueName} - ${courtName} for ${customerName}`

          const newNotification: NotificationRow = {
            id: `local-${row.id}-${Date.now()}`,
            message,
            is_read: false,
            created_at: new Date().toISOString(),
            booking_date: row.booking_date ?? undefined,
          }

          addNotification(newNotification, row.id)
          toast.success("New Booking Received!", { description: message })
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn(
            "[Vendor] Bookings Realtime is off. For live booking alerts, enable it in Supabase: Database → Replication → toggle ON for 'bookings'."
          )
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase, addNotification])

  // Realtime: bookings UPDATE for cancellations (enriched with venue name when courts/venues loaded)
  useEffect(() => {
    if (!userId || courts.length === 0) return

    const getVenueNameForCourt = (courtId: string): string => {
      const court = courts.find((c) => c.id === courtId)
      if (!court) return "your venue"
      const venue = venues.find((v) => v.id === court.venue_id) ?? null
      return venue?.name?.trim() || court.venue_name?.trim() || "your venue"
    }

    const channel = supabase
      .channel("bookings-cancellations")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "bookings",
        },
        (payload) => {
          const newRow = payload.new as {
            id: string
            status?: string | null
            court_id?: string | null
          }
          const courtId = newRow.court_id
          if (!courtId || !courts.some((c) => c.id === courtId)) return
          const newStatus = (newRow.status || "").toLowerCase()
          if (newStatus !== "cancelled") return

          const venueName = getVenueNameForCourt(courtId)
          const newNotif: NotificationRow = {
            id: `local-${newRow.id}-cancel-${Date.now()}`,
            message: `Booking at ${venueName} was cancelled`,
            is_read: false,
            created_at: new Date().toISOString(),
          }
          setNotifications((prev) =>
            [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, courts, venues, supabase])

  const router = useRouter()

  const handleNotificationClick = (n: NotificationRow) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
    )
    if (n.booking_date) {
      setBellOpen(false)
      router.push(`/vendor/dashboard/bookings?date=${n.booking_date}`)
    }
    if (!n.id.startsWith("local-")) {
      supabase
        .from(NOTIFICATIONS_TABLE)
        .update({ is_read: true })
        .eq("id", n.id)
        .then(({ error }) => {
          if (error) console.error("Failed to mark notification as read", error)
        })
    }
  }

  const handleDeleteAll = async () => {
    if (!userId) return
    // Clear UI immediately
    setNotifications([])

    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .delete()
      .eq("vendor_id", userId)

    if (error) {
      console.error("Failed to delete all notifications", error)
    }
  }
  // Mark all as read (used by "Clear all" / "Mark all read"); does not run when opening the bell
  const clearBadge = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    if (!userId) return
    const { error } = await supabase
      .from(NOTIFICATIONS_TABLE)
      .update({ is_read: true })
      .eq("vendor_id", userId)
      .eq("is_read", false)
    if (error) console.error("Failed to mark notifications as read", error)
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      // Clear local state immediately to prevent UI flicker
      try {
        localStorage.clear()
        sessionStorage.clear()
      } catch {}

      const supabase = createClient()
      
      // Attempt sign out with a timeout
      // If Supabase client is in a bad state, signOut() might hang
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 2000))
      
      await Promise.race([signOutPromise, timeoutPromise])
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Force hard redirect to clear memory and ensure we leave the page
      window.location.href = "/"
    }
  }

  const [bellOpen, setBellOpen] = useState(false)

  const vendorInitials =
    profile?.full_name?.trim().split(/\s+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase() ||
    userEmail?.slice(0, 2).toUpperCase() ||
    "?"

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest("[data-vendor-header-menu]")) setVendorMenuOpen(false)
    }
    if (vendorMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [vendorMenuOpen])

  const displayNotifications = useMemo(() => {
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    const hasNewActivity = sorted.some(
      (n) => n.id.startsWith("local-") || new Date(n.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )
    if (hasNewActivity) return sorted.filter((n) => !/welcome\s+to\s+sprinto/i.test(n.message))
    return sorted
  }, [notifications])

  return (
    <VendorNotificationProvider setNotifications={setNotifications}>
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900">
      {/* Top bar: Vendor dropdown + notification bell (visible on every vendor page) */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-end border-b border-gray-100 bg-white/95 px-4 md:px-6">
        {userId != null && (
          <div className="flex items-center gap-4" data-vendor-header-menu>
            {/* Vendor dropdown (avatar) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setVendorMenuOpen(!vendorMenuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-gray-700 transition-colors hover:bg-slate-300"
                style={{ borderWidth: "1px", borderColor: "rgba(0,0,0,0.06)" }}
                aria-label="Vendor menu"
              >
                {vendorInitials}
              </button>
              {vendorMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-slate-100 bg-white py-1 shadow-lg"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
                >
                  <div className="border-b border-slate-100 px-4 py-2">
                    <p className="truncate text-sm font-semibold text-gray-900">{profile?.full_name || "Vendor"}</p>
                    {userEmail && <p className="truncate text-xs text-gray-500">{userEmail}</p>}
                  </div>
                  <Link
                    href="/vendor/dashboard"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-slate-50"
                    onClick={() => setVendorMenuOpen(false)}
                  >
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setVendorMenuOpen(false); handleLogout(); }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-slate-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Notification bell (badge clears when bell is clicked) */}
            <Popover open={bellOpen} onOpenChange={setBellOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-9 w-9 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
                  aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="z-50 w-80 p-0 bg-white border border-slate-100 shadow-xl">
                <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Notifications</p>
                    <p className="text-xs text-gray-500">
                      {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                    </p>
                  </div>
                  {displayNotifications.length > 0 && (
                    <>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={clearBadge}
                          className="text-[11px] font-medium text-gray-600 hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleDeleteAll}
                        className="text-[11px] font-medium text-red-500 hover:underline"
                      >
                        Clear all
                      </button>
                    </>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto py-2">
                  {displayNotifications.length === 0 ? (
                    <p className="px-4 py-2 text-xs text-gray-500">
                      No notifications yet. New bookings will appear here.
                    </p>
                  ) : (
                    <ul className="space-y-1 text-sm">
                      {displayNotifications.map((n) => (
                        <li key={n.id}>
                          <button
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                                "flex w-full flex-col items-start gap-0.5 px-4 py-2 text-left rounded-sm transition-colors cursor-pointer",
                                n.is_read
                                  ? "bg-gray-50 text-gray-500 border-l-2 border-transparent hover:bg-gray-100"
                                  : "bg-slate-100 text-gray-900 border-l-2 border-[#FF6B35] hover:bg-slate-200"
                            )}
                          >
                            <span className="text-xs text-gray-500">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                            <span className="text-[13px] leading-snug">{n.message}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </header>

      <div className="mx-auto flex max-w-7xl pb-16 md:pb-0">
        {/* Sidebar - desktop */}
        <aside className="hidden w-64 flex-col border-r border-gray-100 bg-white/90 px-4 py-6 md:flex">
          <div className="mb-8 flex items-center gap-2">
            <img
              src="/sprinto-logo.png?v=3"
              alt="Sprinto"
              className="h-9 w-9 object-contain object-center"
            />
            <div className="leading-tight">
              <div className="text-sm font-semibold">Sprinto</div>
              <div className="text-xs text-gray-500">Vendor Console</div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 text-sm">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-3 py-2 transition-colors",
                    active
                      ? "bg-[#FF6B35]/10 text-[#FF6B35] font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="mt-4 flex items-center gap-2 rounded-full px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-60 disabled:pointer-events-none"
          >
            <LogOut className="h-4 w-4" />
            <span>{isLoggingOut ? "Redirecting..." : "Logout"}</span>
          </button>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto max-w-5xl space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between border-t border-gray-200 bg-white/95 px-4 py-2 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-medium",
                active
                  ? "text-[#FF6B35]"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-medium text-gray-500 hover:text-red-600 disabled:opacity-60 disabled:pointer-events-none"
        >
          <LogOut className="h-4 w-4" />
          <span>{isLoggingOut ? "Redirecting..." : "Logout"}</span>
        </button>
      </nav>
    </div>
    </VendorNotificationProvider>
  )
}

