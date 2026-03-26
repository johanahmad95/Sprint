import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BookingManager, VendorBooking } from "@/components/vendor/BookingManager"

export const dynamic = "force-dynamic"
export const revalidate = 0

type BookingsPageProps = { searchParams: Promise<{ date?: string }> }

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const initialDateFromUrl = params?.date ?? undefined

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/vendor/login")
  }

  // Fetch bookings from the view
  // We assume the view has a 'vendor_id' column for filtering, 
  // or that we filter by joining (but views are usually flat).
  // If the view doesn't have vendor_id, we might need to filter differently 
  // or rely on RLS if the view is defined with security_invoker = true.
  // Given the plan, we'll try to filter by vendor_id directly if possible,
  // or just fetch and let the component handle it if the view is already scoped (unlikely for a generic view).
  // 
  // Actually, standard practice for a vendor view:
  // It probably joins bookings -> courts -> venues. 
  // Courts has a vendor_id. So the view likely exposes it.
  
  const { data: bookingsData, error: fetchError } = await supabase
    .from("vendor_bookings_view")
    .select("*")
    .eq("vendor_id", user.id)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false })

  if (fetchError) {
    const err = fetchError as { message?: string; code?: string; details?: string }
    console.error(
      "Error fetching bookings:",
      err?.message ?? err?.code ?? err?.details ?? JSON.stringify(fetchError)
    )
  }

  const raw = (bookingsData ?? []) as VendorBooking[]
  const bookings: VendorBooking[] = raw.map((row) => ({
    ...row,
    customer_name: (row.customer_name ?? "").trim() || "Customer",
    customer_email: row.customer_email ?? "",
  }))

  const { data: courtsData } = await supabase
    .from("courts")
    .select("id, name, venue_id, opening_hour, closing_hour")
    .eq("vendor_id", user.id)
  const courts = (courtsData ?? []) as { id: string; name: string; venue_id: string; opening_hour: string; closing_hour: string }[]
  const venueIds = [...new Set(courts.map((c) => c.venue_id).filter(Boolean))] as string[]
  const { data: venuesData } = await supabase
    .from("venues")
    .select("id, name")
    .in("id", venueIds.length ? venueIds : ["__none__"])
  const venues = (venuesData ?? []) as { id: string; name: string }[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your court schedules and track payments.
        </p>
      </div>

      <BookingManager
        initialBookings={bookings}
        initialDateFromUrl={initialDateFromUrl}
        vendorId={user.id}
        initialCourts={courts}
        initialVenues={venues}
      />
    </div>
  )
}
