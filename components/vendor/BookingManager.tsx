"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Search, Calendar, User, CheckCircle, XCircle, AlertCircle, List, LayoutGrid, ChevronDown, ChevronRight, CalendarDays, BarChart3 } from "lucide-react"
import { format } from "date-fns"
import { formatInTimeZone } from "date-fns-tz"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed"

export interface VendorBooking {
  booking_id: string
  venue_name: string
  court_name: string
  /** court_id from courts table — used to map bookings to grid columns */
  court_id?: string
  customer_name: string
  customer_email: string
  booking_date: string
  start_time: string
  end_time: string
  total_price: number
  status: BookingStatus
}

const MALAYSIA_TZ = "Asia/Kuala_Lumpur"
// Same as Master Schedule: 6:00–23:00, 30-min slots = 34 slots per day
const SLOTS_START_HOUR = 6
const SLOTS_END_HOUR = 23
const SLOTS_PER_HOUR = 2
const SLOTS_PER_DAY = (SLOTS_END_HOUR - SLOTS_START_HOUR) * SLOTS_PER_HOUR + 1

function todayDateString(): string {
  return formatInTimeZone(new Date(), MALAYSIA_TZ, "yyyy-MM-dd")
}

type CourtsVenues = { id: string; name: string; venue_id: string; opening_hour?: string; closing_hour?: string }[]
type VenuesList = { id: string; name: string }[]

interface BookingManagerProps {
  initialBookings: VendorBooking[]
  initialDateFromUrl?: string
  vendorId?: string
  initialCourts?: CourtsVenues
  initialVenues?: VenuesList
}

export function BookingManager({ initialBookings, initialDateFromUrl, vendorId, initialCourts = [], initialVenues = [] }: BookingManagerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dateFromUrl = searchParams.get("date") ?? initialDateFromUrl ?? ""
  const [bookings, setBookings] = useState<VendorBooking[]>(initialBookings)
  const [selectedDate, setSelectedDate] = useState<string>(() => dateFromUrl && /^\d{4}-\d{2}-\d{2}$/.test(dateFromUrl) ? dateFromUrl : todayDateString())
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"card" | "list">("list")
  const [isUpdating, setIsUpdating] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [sectionTab, setSectionTab] = useState<"confirmed" | "cancelled" | "capacity">("confirmed")

  useEffect(() => {
    const d = searchParams.get("date") ?? initialDateFromUrl
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setSelectedDate(d)
  }, [searchParams, initialDateFromUrl])

  // Toggle group open state
  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter by selected date and search; group confirmed bookings. Audit sort: latest first.
  const groupedBookings = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase()
    const statusOk = (s: string) => {
      const t = (s || "").toLowerCase()
      return t === "confirmed" || t === "booked" || t === "pending"
    }

    const byDate = bookings.filter((b) => b.booking_date === selectedDate)
    const activeBookings = byDate.filter((b) => statusOk(b.status))

    const filtered = activeBookings.filter((booking) => {
      if (!searchQuery) return true
      return (
        booking.customer_name?.toLowerCase().includes(lowerQuery) ||
        booking.court_name?.toLowerCase().includes(lowerQuery) ||
        booking.venue_name?.toLowerCase().includes(lowerQuery)
      )
    })

    // Audit sort: latest first (date desc, then start_time desc)
    filtered.sort((a, b) => {
      const dateA = new Date(a.booking_date).getTime()
      const dateB = new Date(b.booking_date).getTime()
      if (dateA !== dateB) return dateB - dateA
      return b.start_time.localeCompare(a.start_time)
    })

    // Group by Venue -> Court
    const groups: Record<string, Record<string, VendorBooking[]>> = {}
    
    filtered.forEach((booking) => {
      const venue = booking.venue_name || "Unassigned Venue"
      const court = booking.court_name || "Unassigned Court"
      
      if (!groups[venue]) groups[venue] = {}
      if (!groups[venue][court]) groups[venue][court] = []
      
      groups[venue][court].push(booking)
    })

    return groups
  }, [bookings, searchQuery, selectedDate])

  // Flat grouping for Card View (Venue only); filter by selected date, audit sort latest first
  const cardViewGroups = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase()
    const statusOk = (s: string) => {
      const t = (s || "").toLowerCase()
      return t === "confirmed" || t === "booked" || t === "pending"
    }

    const byDate = bookings.filter((b) => b.booking_date === selectedDate)
    const activeBookings = byDate.filter((b) => statusOk(b.status))
    const filtered = activeBookings.filter((booking) => {
      if (!searchQuery) return true
      return (
        booking.customer_name?.toLowerCase().includes(lowerQuery) ||
        booking.court_name?.toLowerCase().includes(lowerQuery) ||
        booking.venue_name?.toLowerCase().includes(lowerQuery)
      )
    })
    filtered.sort((a, b) => {
      const dateA = new Date(a.booking_date).getTime()
      const dateB = new Date(b.booking_date).getTime()
      if (dateA !== dateB) return dateB - dateA
      return b.start_time.localeCompare(a.start_time)
    })

    const groups: Record<string, VendorBooking[]> = {}
    filtered.forEach((booking) => {
      const venue = booking.venue_name || "Unassigned Venue"
      if (!groups[venue]) groups[venue] = []
      groups[venue].push(booking)
    })
    return groups
  }, [bookings, searchQuery, selectedDate])

  // Cancelled bookings: filter by selected date and status === 'cancelled'; audit sort latest first
  const cancelledBookings = useMemo(() => {
    const list = bookings.filter(
      (b) => (b.status || "").toLowerCase() === "cancelled" && b.booking_date === selectedDate
    )
    return list.sort((a, b) => {
      const aKey = `${a.booking_date} ${a.start_time ?? ""}`
      const bKey = `${b.booking_date} ${b.start_time ?? ""}`
      return aKey > bKey ? -1 : aKey < bKey ? 1 : 0
    })
  }, [bookings, selectedDate])

  const todayStr = todayDateString()

  // Live Capacity: courts grouped by venue, with available slots today (same date logic as Master Schedule)
  const capacityByCourt = useMemo(() => {
    const statusConfirmed = (s: string) => ["confirmed", "booked"].includes((s ?? "").toLowerCase())
    const confirmedToday = bookings.filter(
      (b) => statusConfirmed(b.status ?? "") && (b.booking_date ?? "").slice(0, 10) === todayStr
    )
    const countByCourtId: Record<string, number> = {}
    confirmedToday.forEach((b) => {
      const cid = b.court_id ?? ""
      if (cid) countByCourtId[cid] = (countByCourtId[cid] ?? 0) + 1
    })
    const venueById = new Map(initialVenues.map((v) => [v.id, v.name]))
    const courtsByVenue: Record<string, { id: string; name: string; venue_id: string; opening_hour?: string; closing_hour?: string }[]> = {}
    initialCourts.forEach((c) => {
      const vName = venueById.get(c.venue_id) ?? "Unassigned Venue"
      if (!courtsByVenue[vName]) courtsByVenue[vName] = []
      courtsByVenue[vName].push(c)
    })
    return { courtsByVenue, countByCourtId }
  }, [bookings, todayStr, initialCourts, initialVenues])

  // Realtime: refetch bookings when a new booking is made so Live Capacity and lists stay in sync
  useEffect(() => {
    if (!vendorId) return
    const supabase = createClient()
    const channel = supabase
      .channel("bookings-manager-refresh")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "bookings" }, () => refetchBookings())
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "bookings" }, () => refetchBookings())
      .subscribe()
    function refetchBookings() {
      supabase
        .from("vendor_bookings_view")
        .select("*")
        .eq("vendor_id", vendorId)
        .order("booking_date", { ascending: false })
        .order("start_time", { ascending: false })
        .then(({ data, error }) => {
          if (error) return
          const raw = (data ?? []) as VendorBooking[]
          setBookings(
            raw.map((row) => ({
              ...row,
              customer_name: (row.customer_name ?? "").trim() || "Customer",
              customer_email: row.customer_email ?? "",
            }))
          )
        })
    }
    return () => {
      supabase.removeChannel(channel)
    }
  }, [vendorId])

  // Group cancelled by Venue -> Court for table view
  const groupedCancelledByCourt = useMemo(() => {
    const groups: Record<string, Record<string, VendorBooking[]>> = {}
    cancelledBookings.forEach((booking) => {
      const venue = booking.venue_name || "Unassigned Venue"
      const court = booking.court_name || "Unassigned Court"
      if (!groups[venue]) groups[venue] = {}
      if (!groups[venue][court]) groups[venue][court] = []
      groups[venue][court].push(booking)
    })
    return groups
  }, [cancelledBookings])

  const handleStatusUpdate = async (bookingId: string, newStatus: BookingStatus) => {
    setIsUpdating(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId)

      if (error) throw error

      // Optimistic update
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingId ? { ...b, status: newStatus } : b
        )
      )

      toast.success(
        newStatus === "confirmed" 
          ? "Booking marked as paid" 
          : newStatus === "cancelled" 
            ? "Booking cancelled" 
            : "Status updated"
      )
    } catch (error) {
      console.error("Error updating booking:", error)
      toast.error("Failed to update booking status")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelClick = (bookingId: string) => {
    setBookingToCancel(bookingId)
    setIsCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    const selectedBookingId = bookingToCancel
    if (!selectedBookingId) return
    setIsCancelModalOpen(false)
    setBookingToCancel(null)
    setIsUpdating(true)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", selectedBookingId)
      if (error) throw error
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === selectedBookingId ? { ...b, status: "cancelled" as const } : b
        )
      )
      toast.success("Booking cancelled")
    } catch (err) {
      console.error("Error cancelling booking:", err)
      toast.error("Failed to update booking status")
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Confirmed</Badge>
      case "pending":
        return <Badge variant="outline" className="gap-1 border-amber-200 bg-amber-50 text-amber-700"><AlertCircle className="h-3 w-3" /> Pending</Badge>
      case "cancelled":
        return <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700"><XCircle className="h-3 w-3" /> Cancelled</Badge>
      case "completed":
        return <Badge variant="outline" className="gap-1 bg-gray-100 text-gray-700">Completed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const setDateAndUrl = (dateStr: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return
    setSelectedDate(dateStr)
    const next = new URLSearchParams(searchParams.toString())
    next.set("date", dateStr)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  return (
    <div className="space-y-6">
      {/* Date filter, Search Bar & View Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <label htmlFor="booking-date" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Date
              </label>
              <input
                id="booking-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setDateAndUrl(e.target.value)}
                className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 shadow-sm focus:border-[#FF6B35] focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
              />
            </div>
            <div className="relative w-full sm:w-[280px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by customer or court..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
          </div>
        <div className={cn("flex bg-gray-100 p-1 rounded-lg", sectionTab !== "confirmed" && "invisible h-0 overflow-hidden")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("card")}
            className={cn("h-8 px-3 text-xs font-medium rounded-md transition-all", viewMode === "card" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
            Card View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode("list")}
            className={cn("h-8 px-3 text-xs font-medium rounded-md transition-all", viewMode === "list" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <List className="h-3.5 w-3.5 mr-1.5" />
            List View
          </Button>
        </div>
        </div>
      </div>

      {/* Section tabs: Confirmed | Cancelled | Live Capacity */}
      <div className="flex border-b border-gray-200">
        <button
          type="button"
          onClick={() => setSectionTab("confirmed")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            sectionTab === "confirmed"
              ? "border-[#FF6B35] text-[#FF6B35]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Confirmed
        </button>
        <button
          type="button"
          onClick={() => setSectionTab("cancelled")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
            sectionTab === "cancelled"
              ? "border-[#FF6B35] text-[#FF6B35]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          Cancelled
        </button>
        <button
          type="button"
          onClick={() => setSectionTab("capacity")}
          className={cn(
            "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
            sectionTab === "capacity"
              ? "border-[#FF6B35] text-[#FF6B35]"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <BarChart3 className="h-4 w-4" />
          Live Capacity
        </button>
      </div>

      {/* Confirmed: Bookings List */}
      {sectionTab === "confirmed" && (
      <div className="space-y-8">
        {Object.keys(viewMode === "card" ? cardViewGroups : groupedBookings).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No bookings found matching your search.</p>
          </div>
        ) : viewMode === "card" ? (
          /* Card View */
          Object.entries(cardViewGroups).map(([venueName, venueBookings]) => (
            <div key={venueName} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#FF6B35]" />
                {venueName}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({venueBookings.length} booking{venueBookings.length !== 1 ? 's' : ''})
                </span>
              </h2>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {venueBookings.map((booking) => (
                  <Card key={booking.booking_id} className="overflow-hidden border-gray-100 transition-shadow hover:shadow-md">
                    <CardContent className="p-5 space-y-4">
                      {/* Header: Court & Price */}
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{booking.court_name}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {format(new Date(booking.booking_date), "MMM d, yyyy")}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
                            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg text-gray-900">
                            RM {booking.total_price}
                          </div>
                          <div className="mt-1 flex justify-end">
                            {getStatusBadge(booking.status)}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-gray-100" />

                      {/* Customer Details */}
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {booking.customer_name || "Customer"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {booking.customer_email}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        {booking.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              id={`paid-${booking.booking_id}`}
                              checked={false}
                              onCheckedChange={() => handleStatusUpdate(booking.booking_id, "confirmed")}
                              disabled={isUpdating}
                            />
                            <Label htmlFor={`paid-${booking.booking_id}`} className="text-xs text-gray-600 cursor-pointer">
                              Mark as Paid
                            </Label>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">
                            {booking.status === "confirmed" ? "Payment confirmed" : ""}
                          </div>
                        )}

                        {booking.status !== "cancelled" && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 px-2"
                            onClick={() => handleCancelClick(booking.booking_id)}
                            disabled={isUpdating}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        ) : (
          /* List View */
          Object.entries(groupedBookings).map(([venueName, venueCourts]) => (
            <div key={venueName} className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 sticky top-0 bg-gray-50/95 backdrop-blur py-2 z-10 border-b">
                <span className="h-2 w-2 rounded-full bg-[#FF6B35]" />
                {venueName}
              </h2>
              
              <div className="space-y-3 pl-4">
                {Object.entries(venueCourts).map(([courtName, courtBookings]) => {
                  const groupId = `${venueName}-${courtName}`
                  const isOpen = openGroups[groupId] ?? true
                  return (
                    <div key={groupId} className="border rounded-lg bg-white overflow-hidden shadow-sm">
                      <button
                        type="button"
                        onClick={() => toggleGroup(groupId)}
                        className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />}
                          <span className="truncate">{venueName} – {courtName}</span>
                          <Badge variant="outline" className="ml-2 text-[10px] h-5 px-1.5 font-normal shrink-0">
                            {courtBookings.length}
                          </Badge>
                        </div>
                      </button>
                      {isOpen && (
                        <>
                          {courtBookings.length === 0 ? (
                            <div className="p-8 text-center text-sm text-gray-500 italic">
                              No bookings found for this court.
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent border-b-gray-100">
                                    <TableHead className="w-[140px]">Time Slot</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead className="w-[140px]">Date</TableHead>
                                    <TableHead className="w-[120px]">Status</TableHead>
                                    <TableHead className="w-[100px] text-right">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {courtBookings.map((booking) => (
                                    <TableRow key={booking.booking_id} className="hover:bg-gray-50/50">
                                      <TableCell className="font-medium font-mono text-xs text-gray-600">
                                        {format(new Date(`2000-01-01T${booking.start_time}`), "h:mm a")}
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-medium text-gray-900">{booking.customer_name || "Customer"}</span>
                                          <span className="text-xs text-gray-500">{booking.customer_email}</span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-sm text-gray-600">
                                        {format(new Date(booking.booking_date), "MMM d, yyyy")}
                                      </TableCell>
                                      <TableCell>
                                        {getStatusBadge(booking.status)}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        {booking.status !== "cancelled" && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleCancelClick(booking.booking_id)}
                                            disabled={isUpdating}
                                          >
                                            Cancel
                                          </Button>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* Cancelled: grouped table (Venue > Court), audit sort latest first */}
      {sectionTab === "cancelled" && (
        <div className="space-y-4">
          {cancelledBookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No cancelled bookings for the selected date.</p>
            </div>
          ) : (
        <div className="space-y-4 pt-2">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Cancelled bookings
            <span className="text-sm font-normal text-gray-500">
              ({cancelledBookings.length})
            </span>
          </h2>
          {Object.entries(groupedCancelledByCourt).map(([venueName, courts]) => (
            <div key={`cancelled-venue-${venueName}`} className="space-y-2">
              <h3 className="text-sm font-medium text-gray-600">{venueName}</h3>
              {Object.entries(courts).map(([courtName, courtBookings]) => {
                const groupId = `cancelled-${venueName}-${courtName}`
                const isOpen = openGroups[groupId] !== false
                return (
                  <div key={groupId} className="rounded-lg border border-red-100 bg-red-50/20 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => toggleGroup(groupId)}
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-red-50/40 transition-colors"
                    >
                      <span className="font-medium text-gray-900 truncate">{venueName} – {courtName}</span>
                      <span className="text-xs text-gray-500 shrink-0">{courtBookings.length} cancelled</span>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                    </button>
                    {isOpen && (
                      <div className="border-t border-red-100">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-red-50/30 hover:bg-red-50/30">
                              <TableHead className="text-xs font-medium text-gray-600">Time Slot</TableHead>
                              <TableHead className="text-xs font-medium text-gray-600">Customer</TableHead>
                              <TableHead className="text-xs font-medium text-gray-600">Date</TableHead>
                              <TableHead className="text-xs font-medium text-gray-600">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {courtBookings.map((booking) => (
                              <TableRow key={booking.booking_id} className="text-sm text-gray-700">
                                <TableCell className="font-mono text-xs">
                                  {booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-gray-900">{booking.customer_name || "Customer"}</p>
                                    <p className="text-xs text-gray-500">{booking.customer_email}</p>
                                  </div>
                                </TableCell>
                                <TableCell>{format(new Date(booking.booking_date), "MMM d, yyyy")}</TableCell>
                                <TableCell>{getStatusBadge(booking.status)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
          )}
        </div>
      )}

      {/* Live Capacity: courts by venue, available slots today */}
      {sectionTab === "capacity" && (
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Available slots for <strong>{format(new Date(todayStr + "T12:00:00"), "EEEE, MMM d, yyyy")}</strong> (same operating hours as Master Schedule).
          </p>
          {Object.keys(capacityByCourt.courtsByVenue).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No courts found. Add courts to your venues to see capacity.</p>
            </div>
          ) : (
            Object.entries(capacityByCourt.courtsByVenue).map(([venueName, courts]) => (
              <div key={venueName} className="space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#FF6B35]" />
                  {venueName}
                </h2>
                <ul className="space-y-2 pl-4">
                  {courts.map((court) => {
                    const used = capacityByCourt.countByCourtId[court.id] ?? 0
                    // Calculate slots based on court's opening/closing hours.
                    // Default window: 07:00–23:00 (standard operations).
                    const openStr = court.opening_hour ?? "07:00:00"
                    const closeStr = court.closing_hour ?? "23:00:00"
                    const openH = parseInt(openStr.split(":")[0] || "7", 10)
                    const closeH = parseInt(closeStr.split(":")[0] || "23", 10)

                    // Support courts that close after midnight (e.g. 18:00–02:00).
                    // If closing_hour < opening_hour, treat closing as "next day".
                    let totalSlots: number
                    if (Number.isNaN(openH) || Number.isNaN(closeH)) {
                      totalSlots = (23 - 7) * 2 // fallback 07:00–23:00
                    } else if (closeH > openH) {
                      totalSlots = (closeH - openH) * 2
                    } else if (closeH < openH) {
                      const hoursUntilMidnight = 24 - openH
                      const hoursAfterMidnight = closeH
                      totalSlots = (hoursUntilMidnight + hoursAfterMidnight) * 2
                    } else {
                      // Same hour open/close → assume no slots
                      totalSlots = 0
                    }

                    const available = Math.max(0, totalSlots - used)
                    return (
                      <li key={court.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 border border-gray-100">
                        <span className="font-medium text-gray-900">{court.name}</span>
                        <span className="text-sm text-gray-600">
                          Available Slots Remaining Today: <strong className="text-[#FF6B35]">{available}</strong>
                          <span className="text-xs text-gray-400 ml-2">({openStr.slice(0,5)} - {closeStr.slice(0,5)})</span>
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}

      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent className="bg-white rounded-3xl shadow-xl border-none max-w-md p-8 sm:p-10 [&>button]:hidden">
          <DialogHeader className="text-center sm:text-center">
            <DialogTitle className="text-2xl font-semibold text-slate-800 mb-2">
              Cancel Booking?
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={confirmCancel}
              className="w-full py-3.5 rounded-2xl bg-[#F3C5B5] text-white font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Yes, Cancel
            </button>
            <button
              onClick={() => setIsCancelModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-slate-100 text-slate-700 font-semibold text-base hover:bg-slate-200 transition-colors"
            >
              Keep Booking
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
