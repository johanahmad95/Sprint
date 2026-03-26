"use client"

import { useState, useTransition, Fragment } from "react"
import Link from "next/link"
import { Pencil, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export interface CourtRow {
  /** Court ID from courts table (UUID) - use for Edit link, never venue_id */
  id: string
  /** Venue ID from venues table - for grouping only, never for Edit */
  venueId?: string | null
  name: string
  venueName: string
  sportType?: string
  hourlyRate?: number
  status?: string
  amenities?: string[]
  isActive: boolean
}

export interface VenueOption {
  id: string
  name: string
}

interface CourtManagerTableProps {
  courts: CourtRow[]
  /** All venues owned by this vendor – drives the filter dropdown */
  venues?: VenueOption[]
}

const SPORT_ICON_MAP: Record<
  string,
  {
    icon: string
    label: string
  }
> = {
  Padel: { icon: "🎾", label: "Padel" },
  Pickleball: { icon: "🎾", label: "Pickleball" },
  Tennis: { icon: "🎾", label: "Tennis" },
  Futsal: { icon: "⚽", label: "Futsal" },
  Badminton: { icon: "🏸", label: "Badminton" },
}

export function CourtManagerTable({ courts, venues = [] }: CourtManagerTableProps) {
  const [rows, setRows] = useState(courts)
  const [isPending, startTransition] = useTransition()
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  // "All Venues" = empty string sentinel; otherwise filter by venue name
  const [venueFilter, setVenueFilter] = useState<string>("")

  const handleToggle = (id: string, next: boolean) => {
    setRows((current) =>
      current.map((c) => (c.id === id ? { ...c, isActive: next } : c)),
    )

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase
        .from("courts")
        .update({ is_active: next })
        .eq("id", id)

      if (error) {
        toast.error("Unable to update court status.")
        setRows((current) =>
          current.map((c) => (c.id === id ? { ...c, isActive: !next } : c)),
        )
      } else {
        toast.success(
          next
            ? "Court marked as Active."
            : "Court marked as Inactive.",
        )
      }
    })
  }

  const toggleGroup = (groupKey: string) => {
    setExpanded((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }))
  }

  // Apply venue filter — compare against venueName (case-insensitive)
  const filteredRows = venueFilter
    ? rows.filter((c) => c.venueName?.toLowerCase() === venueFilter.toLowerCase())
    : rows

  // Group by venue_id (parent) so venue row reveals child courts with their correct court IDs
  const grouped = filteredRows.reduce((acc, court) => {
    const key = court.venueId ?? court.venueName ?? "unassigned"
    if (!acc[key]) acc[key] = []
    acc[key].push(court)
    return acc
  }, {} as Record<string, CourtRow[]>)

  const venueLabels = new Map<string, string>()
  filteredRows.forEach((c) => {
    const key = c.venueId ?? c.venueName ?? "unassigned"
    if (!venueLabels.has(key)) venueLabels.set(key, c.venueName || "Unassigned Venue")
  })

  // Build dropdown options from the venues prop (server-fetched); fall back to unique names in rows
  const venueDropdownOptions: VenueOption[] =
    venues.length > 0
      ? venues
      : Array.from(new Map(rows.map((c) => [c.venueName, { id: c.venueId ?? c.venueName ?? "", name: c.venueName }])).values())

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Court Manager</h2>
          <p className="text-xs text-gray-500">
            Toggle availability for each court without leaving this screen.
          </p>
        </div>

        {/* Dynamic venue filter — options come from the venues prop fetched server-side */}
        {venueDropdownOptions.length > 1 && (
          <div className="flex items-center gap-2">
            <label htmlFor="venue-filter" className="text-xs text-gray-500 whitespace-nowrap">
              Filter by venue:
            </label>
            <select
              id="venue-filter"
              value={venueFilter}
              onChange={(e) => setVenueFilter(e.target.value)}
              className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            >
              <option value="">All Venues ({rows.length})</option>
              {venueDropdownOptions.map((v) => {
                const count = rows.filter(
                  (c) => c.venueName?.toLowerCase() === v.name.toLowerCase(),
                ).length
                return (
                  <option key={v.id} value={v.name}>
                    {v.name} ({count})
                  </option>
                )
              })}
            </select>
          </div>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>Court Name</TableHead>
            <TableHead>Sport</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Features</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-sm text-gray-500">
                {venueFilter
                  ? `No courts found for "${venueFilter}".`
                  : "No courts found for this vendor yet."}
              </TableCell>
            </TableRow>
          ) : (
            Object.entries(grouped).map(([groupKey, courtsInVenue]) => (
              <Fragment key={groupKey}>
                {/* Venue Header Row - dropdown reveals child courts (each with court.id from courts table) */}
                <TableRow 
                  className="bg-gray-50/80 hover:bg-gray-100 cursor-pointer" 
                  onClick={() => toggleGroup(groupKey)}
                >
                  <TableCell>
                    {expanded[groupKey] ? (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    )}
                  </TableCell>
                  <TableCell colSpan={6} className="font-semibold text-gray-900">
                    {venueLabels.get(groupKey) ?? groupKey}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({courtsInVenue.length} courts)
                    </span>
                  </TableCell>
                </TableRow>
                
                {/* Court Rows - each uses court.id (from courts table) for Edit, never venue_id */}
                {expanded[groupKey] && courtsInVenue.map((court) => (
                  <TableRow key={court.id}>
                    <TableCell></TableCell>
                    <TableCell className="font-medium pl-2">{court.name}</TableCell>
                    <TableCell>
                      {court.sportType ? (
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true">
                            {SPORT_ICON_MAP[court.sportType]?.icon ?? "🎯"}
                          </span>
                          <span>{SPORT_ICON_MAP[court.sportType]?.label ?? court.sportType}</span>
                        </span>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {typeof court.hourlyRate === "number"
                        ? `RM ${court.hourlyRate.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {court.amenities && court.amenities.length > 0 ? (
                        <span className="text-xs text-gray-700">
                          {court.amenities.join(", ")}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = court.status ?? "pending"
                        if (status === "approved") {
                          return (
                            <Badge variant="success" title="This court is live and visible to the public.">
                              Live
                            </Badge>
                          )
                        }
                        if (status === "rejected") {
                          return (
                            <Badge variant="destructive" title="This court was rejected. Please contact support.">
                              Fix Required
                            </Badge>
                          )
                        }
                        // pending or any other status
                        return (
                          <Badge
                            variant="outline"
                            className="border-amber-400 bg-amber-50 text-amber-700"
                            title="Awaiting admin review. This court is not yet visible on the public homepage."
                          >
                            Pending Approval
                          </Badge>
                        )
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild aria-label="Edit court">
                          <Link href={`/vendor/dashboard/courts/edit/${court.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Switch
                          checked={court.isActive}
                          onChange={(next) => handleToggle(court.id, next)}
                          disabled={isPending}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </Fragment>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

