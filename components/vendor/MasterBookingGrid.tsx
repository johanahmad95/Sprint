"use client"

import { useState, useEffect, useMemo, useCallback, useRef, Fragment } from "react"
import { usePathname } from "next/navigation"
import { addDays, startOfDay, isSameDay, addMinutes, differenceInMinutes } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, User, Loader2, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import type { VendorBooking } from "./BookingManager"

interface Court {
  id: string
  name: string
  venue_id: string
  venue_name: string
  opening_hour?: string
  closing_hour?: string
}

interface Venue {
  id: string
  name: string
}

interface MasterBookingGridProps {
  venues: Venue[]
  courts: Court[]
  initialBookings: VendorBooking[]
  vendorId: string
}

// Grid hours: 24h (00:00–23:30) in 30-min steps → 48 slots.
const SLOTS_PER_HOUR = 2
const TIME_SLOTS = (() => {
  const count = 24 * SLOTS_PER_HOUR // 24 hours * 2 slots/hour = 48
  return Array.from({ length: count }, (_, i) => {
    const totalMinutes = i * 30
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    const displayHours = hours >= 24 ? hours - 24 : hours
    const ampm = displayHours >= 12 && displayHours < 24 ? "PM" : "AM"
    const displayH = displayHours > 12 ? displayHours - 12 : displayHours === 0 ? 12 : displayHours
    const timeString = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
    const display = `${displayH}:${String(minutes).padStart(2, "0")} ${ampm}`
    return { timeString, display, totalMinutes }
  })
})()

const ALL_COURTS_VALUE = "__all__"
const MALAYSIA_TZ = "Asia/Kuala_Lumpur"

// Format booking time for display in Malaysia timezone (handles missing/invalid)
const formatTimeForMYT = (timeStr: string | null | undefined): string => {
  const s = (timeStr ?? "00:00").length >= 5 ? (timeStr ?? "00:00") : (timeStr ?? "00:00") + ":00"
  try {
    const date = new Date(`2000-01-01T${s}+08:00`)
    return date.toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit" })
  } catch {
    return String(timeStr ?? "—")
  }
}

// Force the date into a plain string WITHOUT using toISOString (which shifts time)
const getRawDateString = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// Schedule uses Malaysia calendar date only (no UTC offset) so e.g. 2026-02-23 never becomes 2026-02-24
const getScheduleDateString = (date: Date): string =>
  formatInTimeZone(date, MALAYSIA_TZ, "yyyy-MM-dd")

// Normalize DB time to "HH:MM:00" for comparison with grid slots (grid uses "06:00:00", "22:00:00", etc.)
const normalizeTimeString = (t: string | null | undefined): string => {
  if (t == null || typeof t !== "string") return "00:00:00"
  const parts = t.trim().split(/[:.]/).map((s) => parseInt(s, 10))
  const h = Number.isFinite(parts[0]) ? Math.max(0, Math.min(23, parts[0])) : 0
  const m = Number.isFinite(parts[1]) ? Math.max(0, Math.min(59, parts[1])) : 0
  const s = Number.isFinite(parts[2]) ? Math.max(0, Math.min(59, parts[2])) : 0
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// Convert any time (grid "22:00:00", DB "22:00:00", or "10:00 PM") to 24h minutes since midnight for comparison
function timeToMinutes24(t: string | null | undefined): number {
  const norm = normalizeTimeString(t)
  const upper = (t ?? "").toUpperCase()
  let hours = parseInt(norm.slice(0, 2), 10)
  const minutes = parseInt(norm.slice(3, 5), 10) || 0
  if (upper.includes("PM") && hours < 12) hours += 12
  if (upper.includes("AM") && hours === 12) hours = 0
  return Math.max(0, Math.min(24 * 60 - 1, hours * 60 + minutes))
}

// Column id vs booking court_id must match exactly (case-insensitive, trim) for indoor court A etc.
function sameCourtId(a: string | null | undefined, b: string | null | undefined): boolean {
  const x = String(a ?? "").trim().toLowerCase()
  const y = String(b ?? "").trim().toLowerCase()
  return x.length > 0 && x === y
}

// Normalize booking_date to YYYY-MM-DD (handles Date objects, ISO strings, "2026-02-23")
const normalizeBookingDate = (d: unknown): string => {
  if (typeof d === "string") return d.slice(0, 10)
  if (d instanceof Date) return getRawDateString(d)
  if (d && typeof d === "object" && "toISOString" in d) return (d as Date).toISOString().slice(0, 10)
  return ""
}

export function MasterBookingGrid({ venues, courts: courtsProp, initialBookings, vendorId }: MasterBookingGridProps) {
  const pathname = usePathname()
  const [selectedDate, setSelectedDate] = useState<Date>(
    () => new Date(new Date().toLocaleDateString("en-US", { timeZone: "Asia/Kuala_Lumpur" }))
  )
  const [selectedVenueId, setSelectedVenueId] = useState<string>(venues[0]?.id ?? "")
  const [selectedCourtIds, setSelectedCourtIds] = useState<string[]>([])
  const [bookings, setBookings] = useState<VendorBooking[]>(initialBookings)
  const [courts, setCourts] = useState<Court[]>(courtsProp)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefetching, setIsRefetching] = useState(false)

  // When user clicks Schedule tab: reset to today and re-fetch so data is never stale
  useEffect(() => {
    if (pathname !== "/vendor/dashboard/schedule") return
    const todayStr = formatInTimeZone(new Date(), MALAYSIA_TZ, "yyyy-MM-dd")
    const todayDate = new Date(`${todayStr}T12:00:00+08:00`)
    setSelectedDate(todayDate)

    const fetchToday = async () => {
      setIsRefetching(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from("vendor_bookings_view")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("booking_date", todayStr)
      if (!error && data) setBookings(data as VendorBooking[])
      setIsRefetching(false)
    }
    fetchToday()
  }, [pathname, vendorId])

  const selectedVenue = useMemo(() => venues.find((v) => v.id === selectedVenueId), [venues, selectedVenueId])

  // Sync courts from server when venues/courts props change (venue-first data path)
  useEffect(() => {
    setCourts(courtsProp)
  }, [courtsProp])

  // Reset selected venue if it no longer exists; default to first venue
  useEffect(() => {
    if (venues.length === 0) return
    const exists = venues.some((v) => v.id === selectedVenueId)
    if (!exists) {
      setSelectedVenueId(venues[0].id)
    }
  }, [venues, selectedVenueId])

  // Modal State
  const [selectedBooking, setSelectedBooking] = useState<VendorBooking | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isManualBookingDialogOpen, setIsManualBookingDialogOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ courtId: string, time: string, courtName: string } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Stable client reference to avoid effect re-runs and infinite loops
  const supabase = useMemo(() => createClient(), [])
  const fetchBookingsRef = useRef<() => Promise<void>>(() => Promise.resolve())

  // Memoized so dependency "size" never changes; used for columns only (fetch effect uses primitive courtIdsStr)
  const venueCourts = useMemo(() => {
    if (!selectedVenueId) return []
    return courts.filter((c) => c?.venue_id === selectedVenueId)
  }, [courts, selectedVenueId])

  // Stable primitive for effect deps: court ids for selected venue (string so array size never in deps)
  const courtIdsStr = useMemo(() => {
    return courts
      .filter((c) => c?.venue_id === selectedVenueId)
      .map((c) => c.id)
      .filter(Boolean)
      .sort()
      .join(",")
  }, [courts, selectedVenueId])

  // Schedule date as string so effect depends on primitive, not Date object
  const scheduleDateStr = useMemo(
    () => getScheduleDateString(selectedDate),
    [selectedDate.getTime()]
  )

  // Displayed columns: courts linked to this venue_id; dynamic columns (indoor A, indoor B, etc.)
  const displayCourts = useMemo(() => {
    const validCourts = venueCourts.filter((c) => c?.id != null && c?.name != null)
    if (selectedCourtIds.length === 0 || selectedCourtIds.includes(ALL_COURTS_VALUE)) return validCourts
    return validCourts.filter((c) => selectedCourtIds.includes(c.id))
  }, [venueCourts, selectedCourtIds])

  // Only show "Select Courts" when venue has more than one court
  const showCourtsDropdown = venueCourts.length > 1


  // Fetch bookings by court_id; read courts from ref so callback deps are stable (no array).
  const fetchBookings = useCallback(async () => {
    if (!vendorId || !selectedVenueId) return
    const courtIds = courtIdsStr ? courtIdsStr.split(",").filter(Boolean) : []
    if (courtIds.length === 0) return
    setFetchError(null)
    setIsLoading(true)
    const targetDate = scheduleDateStr
    const timeoutId = setTimeout(() => setIsLoading(false), 8000)
    try {
      // Use vendor_bookings_view to mirror other dashboards and avoid complex joins
      const { data, error } = await supabase
        .from("vendor_bookings_view")
        .select("*")
        .eq("vendor_id", vendorId)
        .eq("booking_date", targetDate)
        .in("court_id", courtIds)

      if (error) {
        console.error("Error fetching bookings from vendor_bookings_view:", error)
        throw error
      }

      const raw = Array.isArray(data) ? (data as VendorBooking[]) : []
      const mapped: VendorBooking[] = raw.map((row) => ({
        ...row,
        booking_date: normalizeBookingDate(row.booking_date),
        start_time: normalizeTimeString(row.start_time),
        end_time: normalizeTimeString(row.end_time),
        customer_name: (row.customer_name ?? "").trim() || "Customer",
        customer_email: row.customer_email ?? "",
      }))

      setBookings(mapped)
    } catch (err: unknown) {
      console.error("Fetch failed:", err)
      setFetchError("Unable to load schedule. Please try again.")
      // Persistent state: keep previous bookings on screen instead of clearing to Available
    } finally {
      clearTimeout(timeoutId)
      setIsLoading(false)
    }
  }, [selectedVenueId, vendorId, courtIdsStr, scheduleDateStr, venues, supabase])

  fetchBookingsRef.current = fetchBookings

  // Fetch only when selectedDate or venueId (and courts for venue) change. Primitives only — no bookings/array deps to avoid "changed size between renders".
  useEffect(() => {
    if (!selectedVenueId || isRefetching || !courtIdsStr) return
    const loadData = async () => {
      setIsRefetching(true)
      try {
        await fetchBookingsRef.current()
      } finally {
        setIsRefetching(false)
      }
    }
    loadData()
  }, [scheduleDateStr, selectedVenueId, courtIdsStr])

  // When venue_id changes: only reset court selection; do not clear bookings (persistent state — avoid wipe on tab switch / re-render)
  useEffect(() => {
    if (!selectedVenueId) return
    setSelectedCourtIds([])
  }, [selectedVenueId])

  // When venue changes: fetch courts for that venue_id from courts table (no owner_id dependency)
  useEffect(() => {
    if (!selectedVenueId) return
    const venueName = venues.find((v) => v.id === selectedVenueId)?.name ?? ""
    const fetchCourtsForVenue = async () => {
      const { data, error } = await supabase
        .from("courts")
        .select("id, name, venue_id, opening_hour, closing_hour")
        .eq("venue_id", selectedVenueId)
      if (error) {
        const err = error as { message?: string; code?: string; details?: string }
        console.error(
          "Error fetching courts for venue:",
          err?.message ?? err?.code ?? err?.details ?? JSON.stringify(error)
        )
        setCourts((prev) => (prev.filter((c) => c.venue_id !== selectedVenueId).length ? prev : []))
        return
      }
      const mapped: Court[] = (data ?? []).map((c: { id: string; name: string; venue_id: string; opening_hour: string; closing_hour: string }) => ({
        id: c.id,
        name: c.name,
        venue_id: c.venue_id,
        venue_name: venueName,
        opening_hour: c.opening_hour,
        closing_hour: c.closing_hour
      }))
      setCourts((prev) => {
        const other = prev.filter((c) => c.venue_id !== selectedVenueId)
        return [...other, ...mapped]
      })
    }
    fetchCourtsForVenue()
  }, [selectedVenueId, venues, supabase])

  // Realtime: no polling — listen for INSERT, UPDATE, DELETE on bookings so grid updates instantly (e.g. 10:00 PM slot turns pink)
  useEffect(() => {
    const channel = supabase
      .channel("bookings-db-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings" },
        () => { fetchBookingsRef.current() }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bookings" },
        () => { fetchBookingsRef.current() }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "bookings" },
        () => { fetchBookingsRef.current() }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // Helper to find booking for a slot; compare dates as YYYY-MM-DD so grid and booking stay in sync
  const getBookingForSlot = (courtId: string, timeString: string) => {
    const gridDate = getScheduleDateString(selectedDate)
    const norm = normalizeTimeString(timeString)
    return bookings.find((b) => {
      if (normalizeBookingDate(b?.booking_date) !== gridDate) return false
      if (String(b?.court_id) !== String(courtId) || (b?.status ?? "") === "cancelled") return false
      return normalizeTimeString(b?.start_time) === norm
    })
  }

  // isSlotOccupied: same YYYY-MM-DD for grid and booking, then match court + time range
  const isSlotOccupied = (courtId: string, timeString: string) => {
    const gridDate = getScheduleDateString(selectedDate)
    const slotStartMinutes = timeToMinutes24(timeString)
    return bookings.find((b) => {
      if (normalizeBookingDate(b?.booking_date) !== gridDate) return false
      if ((b?.status ?? "") === "cancelled") return false
      if (!sameCourtId(b?.court_id, courtId)) return false
      const startMinutes = timeToMinutes24(b?.start_time ?? "00:00:00")
      const endMinutes = timeToMinutes24(b?.end_time ?? "23:59:59")
      return slotStartMinutes >= startMinutes && slotStartMinutes < endMinutes
    })
  }

  const handleSlotClick = (courtId: string, timeString: string, courtName: string) => {
    const booking = isSlotOccupied(courtId, timeString)
    
    if (booking) {
      setSelectedBooking(booking)
      setIsCancelDialogOpen(true)
    } else {
      setSelectedSlot({ courtId, time: timeString, courtName })
      setIsManualBookingDialogOpen(true)
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    setIsProcessing(true)
    
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", selectedBooking.booking_id)
      
      if (error) throw error
      
      toast.success("Booking cancelled successfully")
      setIsCancelDialogOpen(false)
      setSelectedBooking(null)
      fetchBookings() // Refresh grid
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast.error("Failed to cancel booking")
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate rowspan for a booking (handles missing/invalid time fields; stable for any date)
  const getRowSpan = (booking: VendorBooking) => {
    const st = booking?.start_time ?? "00:00:00"
    const et = booking?.end_time ?? "01:00:00"
    const [sH, sM] = st.split(":").map(Number)
    const [eH, eM] = et.split(":").map(Number)
    const startH = Number.isFinite(sH) ? sH : 0
    const startM = Number.isFinite(sM) ? sM : 0
    const endH = Number.isFinite(eH) ? eH : 1
    const endM = Number.isFinite(eM) ? eM : 0
    const startTotal = startH * 60 + startM
    const endTotal = endH * 60 + endM
    const durationMinutes = Math.max(0, endTotal - startTotal)
    return Math.max(1, Math.ceil(durationMinutes / 30))
  }

  return (
    <div className="space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          {/* Venue Selector — uses venue_id for filtering */}
          <div className="w-full sm:w-[200px]">
            <select
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedVenueId}
              onChange={(e) => setSelectedVenueId(e.target.value)}
            >
              <option value="">Please select a venue</option>
              {venues.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>

          {/* Select Courts: multi-select, only when venue has multiple courts */}
          {showCourtsDropdown && (
            <div className="w-full sm:w-[220px]">
              <label className="sr-only">Select Courts</label>
              <select
                multiple
                size={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={selectedCourtIds.length === 0 ? [ALL_COURTS_VALUE] : selectedCourtIds}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
                  if (selected.includes(ALL_COURTS_VALUE)) {
                    setSelectedCourtIds([])
                    return
                  }
                  setSelectedCourtIds(selected.length ? selected : [])
                }}
              >
                <option value={ALL_COURTS_VALUE}>All Courts</option>
                {venueCourts.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="mt-1 text-[10px] text-gray-500">Hold Ctrl/Cmd to select multiple</p>
            </div>
          )}

          {/* Date Picker (Simple Native Input) */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDate(prev => addDays(prev, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="relative">
              <input
                type="date"
                className="pl-9 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-[160px]"
                value={formatInTimeZone(selectedDate, MALAYSIA_TZ, "yyyy-MM-dd")}
                onChange={(e) => {
                  const value = e.target.value
                  if (!value) return
                  // Treat picked date as Malaysia calendar day so it doesn't shift (noon +08:00)
                  setSelectedDate(new Date(`${value}T12:00:00+08:00`))
                }}
              />
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
            </div>
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setSelectedDate(prev => addDays(prev, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(new Date(`${formatInTimeZone(new Date(), MALAYSIA_TZ, "yyyy-MM-dd")}T12:00:00+08:00`))}
              className="text-xs"
            >
              Today
            </Button>
          </div>
        </div>

          {/* Legend / Status */}
          <div className="flex items-center gap-4 text-sm">
            {isLoading && (
              <span className="flex items-center text-primary">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading schedule...
              </span>
            )}
            {!isLoading && fetchError && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-7 text-xs"
                onClick={fetchBookings}
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            )}
            <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm"></div>
            <span className="text-gray-600">Booked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-gray-50 border border-gray-100 rounded-sm"></div>
            <span className="text-gray-600">Available</span>
          </div>
        </div>
      </div>

      {/* Grid: vertically scrollable so 06:00–23:00 slots don't break layout */}
      <div className="bg-white rounded-lg border shadow-sm overflow-x-auto overflow-y-auto max-h-[70vh]">
        <div className="min-w-[800px] flex flex-col h-full">
          {displayCourts.length === 0 ? (
            <div className="p-12 text-center text-gray-500 border-b">
              {!selectedVenueId || venues.length === 0
                ? "Please select a venue to see the schedule."
                : venueCourts.length === 0
                  ? "This venue has no courts. It may have been removed."
                  : "No courts selected."}
            </div>
          ) : (
            <>
          {/* Header Row: sticky so it stays visible when scrolling */}
          <div className="grid border-b bg-gray-50/50 shrink-0 z-10" style={{ gridTemplateColumns: `80px repeat(${displayCourts.length}, 1fr)` }}>
            <div className="p-3 text-xs font-semibold text-gray-500 text-center border-r bg-white/50 backdrop-blur">
              Time
            </div>
            {displayCourts.map((court) => (
              <div key={court.id} className="p-3 text-sm font-medium text-gray-900 text-center border-r last:border-r-0">
                {court?.name && String(court.name).trim() ? court.name : `Court ${court?.id?.slice(0, 8) ?? "—"}`}
              </div>
            ))}
          </div>

           {/* Grid Body: scrollable (overflow-y: auto) so late slots (e.g. 22:00) are visible */}
           <div 
             className="overflow-y-auto overflow-x-hidden flex-1 min-h-0"
             style={{ maxHeight: "calc(70vh - 52px)", overflowY: "auto" }}
           >
             <div
               className="grid relative"
               style={{
                 gridTemplateColumns: `80px repeat(${displayCourts.length}, 1fr)`,
                 gridTemplateRows: `repeat(${TIME_SLOTS.length}, 60px)`,
                 minHeight: `${TIME_SLOTS.length * 60}px`,
               }}
             >
             {TIME_SLOTS.map((slot, rowIndex) => (
               <Fragment key={rowIndex}>
                 <div
                   className="border-r border-b bg-gray-50/30 text-xs text-gray-500 flex items-center justify-center font-mono sticky left-0 z-[1] bg-gray-50/90"
                   style={{ gridColumn: 1, gridRow: rowIndex + 1 }}
                 >
                   {slot.display}
                 </div>
                {displayCourts.map((court, colIndex) => {
                  const occupied = isSlotOccupied(court.id, slot.timeString)

                  // Check operating hours per court (supports overnight close and 24-hour mode).
                  const openStr = court.opening_hour ?? "07:00:00"
                  const closeStr = court.closing_hour ?? "23:00:00"
                  const openH = parseInt(openStr.split(":")[0] || "7", 10)
                  const closeH = parseInt(closeStr.split(":")[0] || "23", 10)
                  const slotH = parseInt(slot.timeString.split(":")[0], 10)

                  let isOpen: boolean
                  if (Number.isNaN(openH) || Number.isNaN(closeH) || Number.isNaN(slotH)) {
                    isOpen = true // fallback: treat as open so bookings still render
                  } else if (openH === 0 && closeH >= 23) {
                    // 24-hour court: show all slots for this day
                    isOpen = true
                  } else if (closeH > openH) {
                    // Same-day window (e.g. 07–23)
                    isOpen = slotH >= openH && slotH < closeH
                  } else if (closeH < openH) {
                    // Overnight window (e.g. 18–02). For the current calendar day we only
                    // show slots from opening_hour up to midnight; early-morning hours
                    // will appear on the next day's grid.
                    isOpen = slotH >= openH
                  } else {
                    isOpen = false
                  }

                  if (!isOpen) {
                    return (
                      <div
                        key={`cell-${court.id}-${getScheduleDateString(selectedDate)}-${slot.timeString}`}
                        className="border-r border-b bg-gray-100/50 relative"
                        style={{ gridColumn: colIndex + 2, gridRow: rowIndex + 1 }}
                      />
                    )
                  }

                   return (
                     <div
                       key={`cell-${court.id}-${getScheduleDateString(selectedDate)}-${slot.timeString}`}
                       className={cn(
                         "border-r border-b cursor-pointer transition-colors relative",
                         occupied
                           ? "bg-[#FEE2E2] border-red-200/50"
                           : "bg-white hover:bg-gray-50"
                       )}
                       style={{ gridColumn: colIndex + 2, gridRow: rowIndex + 1 }}
                       onClick={() => handleSlotClick(court.id, slot.timeString, court.name)}
                     >
                       <span className={cn(
                         "absolute inset-0 flex items-center justify-center text-[10px] font-medium",
                         occupied ? "text-red-700" : "text-gray-400"
                       )}>
                         {occupied ? "Booked" : "Available"}
                       </span>
                     </div>
                   )
                 })}
               </Fragment>
             ))}

             {/* Booking overlays: court_id matches column id; booking_date matches selectedDate (Malaysia, no UTC shift) */}
             {bookings
                .filter((b) => {
                  if (b?.court_id == null || (b?.status ?? "") === "cancelled") return false
                  if (!displayCourts.some((c) => sameCourtId(c.id, b.court_id))) return false
                  const calendarDateStr = getScheduleDateString(selectedDate)
                  const dbDateStr = normalizeBookingDate(b?.booking_date)
                  return dbDateStr === calendarDateStr
                })
                .map((booking) => {
                  const courtIndex = displayCourts.findIndex((c) => sameCourtId(c.id, booking.court_id))
                  if (courtIndex === -1 || booking.court_id == null) return null
                  const st = normalizeTimeString(booking?.start_time)
                  const parts = st.split(":").map(Number)
                  // Grid row from start time (00:00 = row 1; 30‑min slots)
                  const startH = Number.isFinite(parts[0]) ? parts[0] : 0
                  const startM = Number.isFinite(parts[1]) ? parts[1] : 0
                  const startTotalMinutes = startH * 60 + startM
                  const gridStartMinutes = TIME_SLOTS[0]?.totalMinutes ?? 0
                  let startRow = Math.floor((startTotalMinutes - gridStartMinutes) / 30) + 1
                  startRow = Math.max(1, Math.min(TIME_SLOTS.length, startRow))
                  
                  let rowSpan = getRowSpan(booking)
                  rowSpan = Math.max(1, Math.min(TIME_SLOTS.length - startRow + 1, rowSpan))
                  
                  return (
                    <div
                      key={booking.booking_id}
                      className="m-1 rounded-md bg-[#FEE2E2] border border-red-200 p-2 shadow-sm transition-all z-10 flex flex-col overflow-hidden"
                      style={{
                        gridColumn: courtIndex + 2,
                        gridRow: `${startRow} / span ${rowSpan}`
                      }}
                      // Click disabled as per requirements ("make it unclickable")
                      // onClick={(e) => {
                      //   e.stopPropagation()
                      //   setSelectedBooking(booking)
                      //   setIsCancelDialogOpen(true)
                      // }}
                    >
                      <div className="font-semibold text-xs text-red-900 truncate">
                        {booking.customer_name}
                      </div>
                      <div className="text-[10px] text-red-700 truncate">
                        {formatTimeForMYT(booking.start_time)} - {formatTimeForMYT(booking.end_time)}
                      </div>
                      {rowSpan > 1 && (
                         <div className="mt-1 text-[10px] text-red-600 truncate flex items-center gap-1">
                           <User className="h-3 w-3" /> {booking.player_count || 1}
                         </div>
                      )}
                    </div>
                  )
             })}
             </div>
           </div>
            </>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Manage this booking.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="text-gray-500 text-xs uppercase font-semibold">Customer</label>
                  <p className="font-medium text-gray-900">{selectedBooking.customer_name || "Customer"}</p>
                  <p className="text-gray-500">{selectedBooking.customer_email}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase font-semibold">Time</label>
                  <p className="font-medium text-gray-900">{selectedBooking.booking_date}</p>
                  <p className="text-gray-500">{formatTimeForMYT(selectedBooking.start_time)} - {formatTimeForMYT(selectedBooking.end_time)}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase font-semibold">Price</label>
                  <p className="font-medium text-gray-900">RM {selectedBooking.total_price}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-xs uppercase font-semibold">Status</label>
                  <Badge variant="outline" className="mt-1">{selectedBooking.status}</Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)}>
              Close
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelBooking}
              disabled={isProcessing}
            >
              {isProcessing ? "Cancelling..." : "Cancel Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Booking Dialog (Placeholder) */}
      <Dialog open={isManualBookingDialogOpen} onOpenChange={setIsManualBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
            <DialogDescription>
              Create a manual booking for a walk-in customer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedSlot && (
            <div className="py-4 space-y-2">
              <p className="text-sm text-gray-600">
                Adding booking for <span className="font-semibold">{selectedSlot.courtName}</span> at <span className="font-semibold">{formatTimeForMYT(selectedSlot.time)}</span>.
              </p>
              <div className="p-4 bg-gray-50 rounded border text-center text-sm text-gray-500">
                Manual booking form coming soon...
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsManualBookingDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
