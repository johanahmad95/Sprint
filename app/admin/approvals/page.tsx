"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Check, X, Loader2, MapPin, Clock } from "lucide-react"
import { formatPrice } from "@/lib/types"

// Simple type for the admin dashboard
type PendingCourt = {
  id: string
  name: string
  sport_type: string
  venue: { name: string } | null // joined from venue_id
  description: string
  hourly_rate: number
  created_at: string
  image: string[] | null
  status: string
}

export default function AdminApprovalsPage() {
  const [courts, setCourts] = useState<PendingCourt[]>([])
  const [loading, setLoading] = useState(true)
  const [actionIds, setActionIds] = useState<Set<string>>(new Set())

  // Load pending courts
  useEffect(() => {
    const fetchPendingCourts = async () => {
      const supabase = createClient()
      
      // In a real app, you'd check if user is admin here too,
      // but RLS should ideally handle "admin only" reads.
      // For now we just fetch 'pending'.

      const { data, error } = await supabase
        .from("courts")
        .select(`
          id,
          name,
          sport_type,
          description,
          hourly_rate,
          created_at,
          image,
          status,
          venue!venue_id ( name )
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching pending courts:", error)
        toast.error("Failed to load pending approvals.")
      } else {
        // Cast the joined data
        const mapped = (data || []).map((row: any) => ({
          ...row,
          venue: Array.isArray(row.venue) ? row.venue[0] : row.venue,
        }))
        setCourts(mapped)
      }
      setLoading(false)
    }

    fetchPendingCourts()
  }, [])

  const handleStatusChange = async (courtId: string, newStatus: "approved" | "rejected") => {
    // Optimistic UI update could be done, but let's be safe
    setActionIds((prev) => new Set(prev).add(courtId))
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("courts")
        .update({ status: newStatus })
        .eq("id", courtId)

      if (error) throw error

      toast.success(`Court ${newStatus === "approved" ? "approved" : "rejected"}`)
      // Remove from list
      setCourts((prev) => prev.filter((c) => c.id !== courtId))
    } catch (err: any) {
      console.error("Error updating status:", err)
      toast.error(err.message || "Action failed")
    } finally {
      setActionIds((prev) => {
        const next = new Set(prev)
        next.delete(courtId)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Pending Court Approvals</h1>
          <div className="rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            {courts.length} Pending
          </div>
        </div>

        {courts.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-2 text-gray-500">No pending court submissions to review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {courts.map((court) => (
              <div
                key={court.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col md:flex-row">
                  {/* Image Preview */}
                  <div className="h-48 w-full bg-gray-100 md:h-auto md:w-64 relative shrink-0">
                    {court.image && court.image.length > 0 ? (
                      <img
                        src={court.image[0]}
                        alt={court.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 uppercase tracking-wide">
                          {court.sport_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          Submitted {new Date(court.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{court.name}</h3>
                      <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4" />
                        {court.venue?.name || "Unknown Venue"}
                      </div>
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                        {court.description || "No description provided."}
                      </p>
                      <div className="mt-4 flex items-center gap-4 text-sm font-medium">
                        <span className="text-gray-900">{formatPrice(court.hourly_rate)}/hr</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-3 md:justify-end">
                      <button
                        onClick={() => handleStatusChange(court.id, "rejected")}
                        disabled={actionIds.has(court.id)}
                        className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {actionIds.has(court.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        Reject
                      </button>
                      <button
                        onClick={() => handleStatusChange(court.id, "approved")}
                        disabled={actionIds.has(court.id)}
                        className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                         {actionIds.has(court.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
