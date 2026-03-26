import Link from "next/link"
import { redirect } from "next/navigation"
import { LayoutGrid } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { CourtManagerTable } from "@/components/vendor/CourtManagerTable"
import { Card, CardContent } from "@/components/ui/card"
import { DashboardRefreshButton } from "@/components/vendor/DashboardRefreshButton"

export const dynamic = "force-dynamic"
export const revalidate = 0

type VenueRow = { id: string; name: string }

type CourtDbRow = {
  id: string
  name: string
  venue_id: string | null
  venue_name?: string | null
  sport_type?: string | null
  sport?: string | null
  hourly_rate?: number | null
  amenities?: string[] | null
  status?: string | null
  is_active?: boolean | null
  created_at?: string | null
}

export default async function CourtManagementPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/vendor/login")
  }

  // 1) Fetch every venue belonging to this vendor.
  //    Use an OR filter so venues stored with either owner_id or vendor_id are found.
  const { data: venuesData } = await supabase
    .from("venues")
    .select("id, name")
    .or(`owner_id.eq.${user.id},vendor_id.eq.${user.id}`)

  const venues: VenueRow[] = (venuesData ?? []) as VenueRow[]
  const venueIds = venues.map((v) => v.id)
  const venueNameById = new Map(venues.map((v) => [v.id, v.name ?? "Unknown"]))

  // 2) Fetch courts in two passes and merge — no status filter so vendors see ALL their courts.
  //    Pass A: courts linked to this vendor by vendor_id
  //    Pass B: courts linked to owned venues by venue_id (handles legacy records)
  const [{ data: byVendor }, { data: byVenue }] = await Promise.all([
    supabase
      .from("courts")
      .select("*")
      .eq("vendor_id", user.id)
      .order("created_at", { ascending: false }),

    venueIds.length > 0
      ? supabase
          .from("courts")
          .select("*")
          .in("venue_id", venueIds)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as CourtDbRow[] }),
  ])

  // Deduplicate by court id (a court can appear in both result sets)
  const seenIds = new Set<string>()
  const courts: CourtDbRow[] = []
  for (const c of [...(byVendor ?? []), ...(byVenue ?? [])]) {
    const row = c as CourtDbRow
    if (!seenIds.has(row.id)) {
      seenIds.add(row.id)
      courts.push(row)
    }
  }
  courts.sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""))

  const emptyState = (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Court Management</h1>
      <Card className="border-gray-100 bg-white">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <LayoutGrid className="h-10 w-10" />
          </div>
          <p className="max-w-sm text-sm text-gray-600">
            Ready to grow? Add your first court to start receiving bookings.
          </p>
          <Link
            href="/vendor/dashboard/courts/new"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E55A2B]"
          >
            + Add New Court
          </Link>
        </CardContent>
      </Card>
    </div>
  )

  if (courts.length === 0 && venues.length === 0) {
    return emptyState
  }

  const courtRows = courts.map((c) => ({
    id: c.id,
    venueId: c.venue_id,
    name: c.name,
    venueName:
      (c.venue_id ? venueNameById.get(c.venue_id) : null) ??
      c.venue_name ??
      "Unknown Venue",
    sportType: (c as any).sport ?? c.sport_type ?? undefined,
    hourlyRate:
      c.hourly_rate !== null && c.hourly_rate !== undefined
        ? Number(c.hourly_rate)
        : undefined,
    status: c.status ?? "pending",
    amenities: Array.isArray(c.amenities) ? c.amenities : undefined,
    isActive: c.is_active ?? true,
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Court Management</h1>
        <div className="flex items-center gap-2">
          <DashboardRefreshButton />
          <Link
            href="/vendor/dashboard/courts/new"
            className="inline-flex items-center justify-center rounded-md bg-[#FF6B35] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#E55A2B]"
          >
            + Add New Court
          </Link>
        </div>
      </div>

      <Card className="border-gray-100 bg-white">
        <CardContent className="p-6">
          <CourtManagerTable courts={courtRows} venues={venues} />
        </CardContent>
      </Card>
    </div>
  )
}
