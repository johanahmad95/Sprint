import Link from "next/link"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Pencil } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EditCourtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courtId } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/vendor/login")
  }

  // Fetch court by id (courts table PK) — never use venue_id here
  const { data: court, error } = await supabase
    .from("courts")
    .select("id, name, venue_id, sport, hourly_rate, peak_rate, is_active")
    .eq("id", courtId)
    .single()

  if (error || !court) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Court not found</h1>
        <p className="text-sm text-gray-500">
          Court with ID <span className="font-mono">{courtId}</span> could not be loaded.
          The ID may be a venue ID instead of a court ID — Edit uses the court&apos;s ID from the courts table.
        </p>
        <Link
          href="/vendor/dashboard/courts"
          className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Court Manager
        </Link>
      </div>
    )
  }

  // Verify this court belongs to a venue owned by the logged-in vendor
  const { data: venue } = await supabase
    .from("venues")
    .select("id, name")
    .eq("id", court.venue_id)
    .eq("owner_id", user.id)
    .single()

  if (!venue) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Court not found</h1>
        <p className="text-sm text-gray-500">You do not have access to edit this court.</p>
        <Link
          href="/vendor/dashboard/courts"
          className="inline-flex items-center text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Court Manager
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/vendor/dashboard/courts"
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to Court Manager
        </Link>
      </div>

      <Card className="border-gray-100 bg-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-teal-600">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Edit Court
              </h1>
              <p className="text-sm text-gray-500">
                {court.name} at {venue.name}
              </p>
            </div>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <span className="font-medium text-gray-500">Court ID (courts table)</span>
              <p className="font-mono text-gray-900">{court.id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-500">Venue ID (venues table)</span>
              <p className="font-mono text-gray-900">{court.venue_id ?? "—"}</p>
            </div>
            <div className="flex gap-4">
              <div>
                <span className="font-medium text-gray-500">Sport</span>
                <p>{court.sport ?? "—"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Hourly Rate</span>
                <p>RM {court.hourly_rate ?? "—"}</p>
              </div>
              <div>
                <span className="font-medium text-gray-500">Active</span>
                <p>{court.is_active ? "Yes" : "No"}</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Full edit form coming soon. Use the Court Manager to toggle availability.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
