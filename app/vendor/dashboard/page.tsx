import Link from "next/link"
import { redirect } from "next/navigation"
import { formatInTimeZone } from "date-fns-tz"
import { createClient } from "@/lib/supabase/server"
import { VendorDashboard } from "@/components/vendor/VendorDashboard"

const MALAYSIA_TZ = "Asia/Kuala_Lumpur"

export const revalidate = 0;

type VenueRow = {
  id: string
  name: string
  address?: string | null
}

type CourtDbRow = {
  id: string
  name: string
  venue_id: string
  is_active?: boolean | null
  venue_name?: string | null
}

type BookingDbRow = {
  id: string
  court_id: string
  booking_date: string
  start_time: string
  end_time: string
  total_price: number
  status: string
  user_id: string | null
  duration: number
  created_at?: string | null
  profiles?: { full_name: string | null } | null
  venue_name?: string | null
  venues?: { name: string } | null
}

export default async function VendorDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/vendor/login")
  }

  // Fetch courts
  const { data: courtsData } = await supabase
    .from("courts")
    .select("id, name, venue_id, is_active, venue_name")
    .eq("vendor_id", user.id)

  const courts = (courtsData ?? []) as (CourtDbRow & { venue_name?: string | null })[]
  
  // If no courts found, show empty state
  if (courts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">
          Vendor Dashboard
        </h1>
        <p className="text-sm text-gray-600">
          Your account is marked as a vendor, but no courts are currently
          assigned. Once a court is linked to your profile, you will see
          live stats and controls here.
        </p>
        <Link
          href="/vendor/dashboard/courts/new"
          className="inline-flex items-center justify-center rounded-md bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E55A2B]"
        >
          Create First Court
        </Link>
      </div>
    )
  }

  const courtIds = courts.map((c) => c.id)

  // Fetch venues (include address for nav fallback)
  const venueIds = Array.from(new Set(courts.map((c) => c.venue_id).filter(Boolean))) as string[]
  const { data: venuesData } = await supabase
    .from("venues")
    .select("id, name, address")
    .in("id", venueIds)

  const venues = (venuesData ?? []) as VenueRow[]

  // Live Booking Activity: show all UPCOMING bookings (today and future), not filtered to today only.
  // Order by date ascending so soonest first; include past for Cancellations tab.
  let bookings: BookingDbRow[] = []
  if (courtIds.length > 0) {
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
    const from = formatInTimeZone(sixtyDaysAgo, MALAYSIA_TZ, "yyyy-MM-dd")

    const { data: bookingsData } = await supabase
      .from("bookings")
      .select(`
        *,
        venues!venue_id ( name, address ),
        profiles!user_id ( full_name )
      `)
      .in("court_id", courtIds)
      .gte("booking_date", from)
      .order("created_at", { ascending: false })

    type RawRow = Omit<BookingDbRow, "profiles" | "venue_name" | "venues"> & {
      venue_id?: string | null
      profiles?: { full_name: string | null } | null
      venues?: { name: string | null } | null
    }
    const rawBookings = (bookingsData ?? []) as RawRow[]

    const courtById = new Map(courts.map((c) => [c.id, c]))
    const venueById = new Map(venues.map((v) => [v.id, v.name]))

    const mapRow = (b: RawRow): BookingDbRow => {
      const venueFromJoin = (b.venues?.name ?? null) as string | null
      const court = courtById.get(b.court_id)
      const venueFromLookup = court ? (venueById.get(court.venue_id) ?? court.venue_name ?? null) : null
      const venueDisplay = (venueFromJoin ?? venueFromLookup)?.trim() || null
      return {
        id: b.id,
        court_id: b.court_id,
        booking_date: b.booking_date,
        start_time: b.start_time,
        end_time: b.end_time,
        total_price: b.total_price,
        status: b.status,
        user_id: b.user_id,
        duration: b.duration,
        created_at: b.created_at ?? null,
        profiles: b.profiles ?? null,
        venue_name: venueDisplay,
        venues: venueDisplay ? { name: venueDisplay } : null,
      }
    }

    bookings = rawBookings.map(mapRow) as BookingDbRow[]

    if (bookings.length === 0) {
      const { data: fallbackData } = await supabase
        .from("bookings")
        .select("id, court_id, booking_date, start_time, end_time, total_price, status, user_id, duration, venue_id, created_at")
        .in("court_id", courtIds)
        .gte("booking_date", from)
        .order("created_at", { ascending: false })
      const fallback = (fallbackData ?? []) as RawRow[]
      const userIds = [...new Set(fallback.map((b) => b.user_id).filter(Boolean))] as string[]
      let profileByUserId: Map<string, { full_name: string | null }> = new Map()
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase.from("profiles").select("id, full_name").in("id", userIds)
        if (profilesData) profileByUserId = new Map(profilesData.map((p) => [p.id, { full_name: p.full_name ?? null }]))
      }
      bookings = fallback.map((b) => {
        const court = courtById.get(b.court_id)
        const venueId = b.venue_id ?? court?.venue_id ?? null
        const venueName = venueId ? (venueById.get(venueId) ?? null) : null
        return mapRow({
          ...b,
          profiles: b.user_id ? (profileByUserId.get(b.user_id) ?? null) : null,
          venues: venueName ? { name: venueName } : null,
        } as RawRow)
      }) as BookingDbRow[]
    }
  }

  return (
    <VendorDashboard 
      userId={user.id}
      initialCourts={courts}
      initialVenues={venues}
      initialBookings={bookings}
    />
  )
}

