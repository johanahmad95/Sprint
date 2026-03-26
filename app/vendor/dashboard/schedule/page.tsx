import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { MasterBookingGrid } from "@/components/vendor/MasterBookingGrid"
import { formatInTimeZone } from "date-fns-tz"
import type { VendorBooking } from "@/components/vendor/BookingManager"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function SchedulePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/vendor/login")
  }

  // 1. Fetch venues: current user's venues first; if none, include venues with no owner (admin fallback)
  const { data: ownedVenues, error: venuesError } = await supabase
    .from("venues")
    .select("id, name")
    .eq("owner_id", user.id)

  let venues: { id: string; name: string }[] = (ownedVenues ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }))

  if (venues.length === 0) {
    const { data: unownedVenues } = await supabase
      .from("venues")
      .select("id, name")
      .is("owner_id", null)
    venues = (unownedVenues ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }))
  }
  if (venues.length === 0) {
    const { data: adminProfile } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1).single()
    const adminId = (adminProfile as { id?: string } | null)?.id
    if (adminId) {
      const { data: adminVenues } = await supabase.from("venues").select("id, name").eq("owner_id", adminId)
      venues = (adminVenues ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }))
    }
  }

  if (venuesError) {
    console.error("Error fetching venues:", venuesError)
    return (
      <div className="p-6 text-center text-red-600 bg-red-50 rounded-lg border border-red-200">
        <h3 className="font-semibold">Error loading schedule</h3>
        <p className="text-sm mt-1">{venuesError.message}</p>
      </div>
    )
  }

  // 2. Fetch all courts linked to those venue_ids (builds columns A, B, C per venue)
  const venueIds = venues.map((v) => v.id)
  let courts: { id: string; name: string; venue_id: string; venue_name: string; opening_hour?: string; closing_hour?: string }[] = []

  if (venueIds.length > 0) {
    const { data: courtsData, error: courtsError } = await supabase
      .from("courts")
      .select("id, name, venue_id, opening_hour, closing_hour")
      .in("venue_id", venueIds)

    if (!courtsError && courtsData) {
      const venueNameById = new Map(venues.map((v) => [v.id, v.name]))
      courts = (courtsData as { id: string; name: string; venue_id: string; opening_hour: string; closing_hour: string }[]).map((c) => ({
        id: c.id,
        name: c.name,
        venue_id: c.venue_id,
        venue_name: venueNameById.get(c.venue_id) ?? "",
        opening_hour: c.opening_hour,
        closing_hour: c.closing_hour
      }))
    }
  }

  if (venues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg border border-dashed border-gray-300">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">No venues linked</h3>
        <p className="mt-1 text-sm text-gray-500 max-w-sm">
          No venues are linked to your account. Please add a court first to set up your schedule.
        </p>
      </div>
    )
  }

  // 2. Fetch initial bookings (flat view); use Malaysia (GMT+8) for "today"
  const MALAYSIA_TZ = "Asia/Kuala_Lumpur"
  const selectedDate = formatInTimeZone(new Date(), MALAYSIA_TZ, "yyyy-MM-dd")
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("vendor_bookings_view")
    .select("*")
    .eq("vendor_id", user.id)
    .eq("booking_date", selectedDate)

  if (bookingsError) {
    console.error("Error fetching bookings:", bookingsError)
    console.log("Schema Error:", bookingsError.details, bookingsError.hint)
  }

  const initialBookings = (bookingsData || []) as VendorBooking[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Master Schedule</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage court availability across your venues.
        </p>
      </div>

      <MasterBookingGrid 
        venues={venues} 
        courts={courts} 
        initialBookings={initialBookings}
        vendorId={user.id}
      />
    </div>
  )
}
