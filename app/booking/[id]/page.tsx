 "use client"

export const dynamic = "force-dynamic"
export const revalidate = 0

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

type Court = {
  id: string
  name: string
  venue_name?: string | null
  sport?: string | null
  hourly_rate?: number | null
  amenities?: string[] | null
  status?: string | null
}

const AMENITY_ICON_MAP: Record<string, string> = {
  Parking: "🚗",
  Showers: "🚿",
  "Equipment Rental": "🎒",
  Coaching: "🎓",
  Cafe: "☕",
}

export default function BookingCourtPage({ params }: { params: { id: string } }) {
  const { id } = params
  const router = useRouter()
  const [court, setCourt] = useState<Court | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourt = async () => {
      try {
        const supabase = createClient()

        // Debug logging to verify ID and Supabase response
        console.log("Searching for ID:", params.id)

        const { data: court, error } = await supabase
          .from("courts")
          .select("*")
          .eq("id", params.id)
          .single()

        console.log("Database Result:", court)
        console.log("Database Error:", error)

        if (error) {
          console.error("Supabase Error:", error.message)
          console.log("Attempted to fetch ID:", params.id)
        }

        if (error || !court) {
          setCourt(null)
          setError(`Court with ID ${params.id} not found. Please refresh your dashboard.`)
        } else {
          console.log("Database Row:", court)
          setCourt(court as Court)
        }
      } catch (err) {
        console.error("Unexpected error fetching court:", err)
        setError(`Court with ID ${params.id} not found. Please refresh your dashboard.`)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchCourt()
    }
  }, [params.id])

  const handleBackToDashboard = () => {
    // Hard navigation to avoid cached/stale data
    window.location.href = "/vendor/dashboard/courts"
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-600">Loading court details...</p>
      </main>
    )
  }

  if (error || !court) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl bg-white p-6 shadow-sm border border-gray-200 text-center space-y-4">
          <h1 className="text-lg font-semibold text-gray-900">Court not found</h1>
          <p className="text-sm text-gray-600">
            Court with ID <span className="font-mono">{params.id}</span> not found. Please refresh
            your dashboard or try again.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
            <Button
              type="button"
              className="bg-[#FF6B35] hover:bg-[#E55A2B]"
              onClick={handleBackToDashboard}
            >
              Back to Court Manager
            </Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6 rounded-xl bg-white p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{court.name}</h1>
            {court.venue_name && (
              <p className="text-sm text-gray-500">at {court.venue_name}</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleBackToDashboard}
          >
            Back to Court Manager
          </Button>
        </div>

        <div className="space-y-3 text-sm text-gray-700">
          {court.sport && (
            <p>
              <span className="font-medium">Sport:</span> {court.sport}
            </p>
          )}
          {typeof court.hourly_rate === "number" && (
            <p>
              <span className="font-medium">Price:</span> RM {court.hourly_rate.toFixed(2)}/hr
            </p>
          )}
          {court.status && (
            <p>
              <span className="font-medium">Status:</span> {court.status}
            </p>
          )}
          {court.amenities && court.amenities.length > 0 && (
            <div>
              <p className="font-medium mb-1">Amenities</p>
              <div className="flex flex-wrap gap-2">
                {court.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                  >
                    <span aria-hidden="true">{AMENITY_ICON_MAP[amenity] ?? "•"}</span>
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-400">
          This page is using the court ID from the URL to fetch live data from Supabase.
        </p>
      </div>
    </main>
  )
}

