"use client"

import * as React from "react"
import { Clock, CalendarDays, MapPin, ArrowDownUp, Building2, Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface BookingFeedItem {
  id: string
  customerName: string
  courtName: string
  venueName: string
  address?: string
  startTime: string
  bookingDate: string
  duration: number
  status: string
  /** Transaction time for sorting newest first */
  created_at?: string | null
}

type TabId = "all" | "booked" | "cancellations"
type SortMode = "default" | "duration"

const normalizeStatus = (status: string | null | undefined) =>
  (status ?? "").trim().toLowerCase()

interface BookingFeedProps {
  items: BookingFeedItem[]
}

export function BookingFeed({ items }: BookingFeedProps) {
  const [activeTab, setActiveTab] = React.useState<TabId>("all")
  const [sortBy, setSortBy] = React.useState<SortMode>("default")
  const [groupByVenue, setGroupByVenue] = React.useState(false)
  const [filterCourt, setFilterCourt] = React.useState<string>("")

  const allBookings = items
  const bookedBookings = React.useMemo(
    () =>
      items.filter((b) => {
        const s = normalizeStatus(b.status)
        return s === "confirmed" || s === "booked"
      }),
    [items],
  )
  const cancelledBookings = React.useMemo(
    () => items.filter((b) => normalizeStatus(b.status) === "cancelled"),
    [items],
  )

  const tabToItems: Record<TabId, BookingFeedItem[]> = {
    all: allBookings,
    booked: bookedBookings,
    cancellations: cancelledBookings,
  }
  let itemsToRender = tabToItems[activeTab]

  if (filterCourt) {
    itemsToRender = itemsToRender.filter((i) => i.courtName === filterCourt)
  }
  // Default: sort by transaction time (created_at) descending so newest bookings appear first.
  if (sortBy === "default") {
    itemsToRender = [...itemsToRender].sort((a, b) => {
      const aAt = a.created_at ? new Date(a.created_at).getTime() : 0
      const bAt = b.created_at ? new Date(b.created_at).getTime() : 0
      return bAt - aAt
    })
  } else {
    itemsToRender = [...itemsToRender].sort((a, b) => b.duration - a.duration)
  }

  const courtNames = React.useMemo(
    () => Array.from(new Set(items.map((i) => i.courtName).filter(Boolean))).sort(),
    [items],
  )

  const tabs: { id: TabId; label: string }[] = [
    { id: "all", label: "All" },
    { id: "booked", label: "Booked" },
    { id: "cancellations", label: "Cancellations" },
  ]

  const renderItem = (item: BookingFeedItem) => {
    const isCancelled = normalizeStatus(item.status) === "cancelled"
    const isConfirmed = ["confirmed", "booked"].includes(normalizeStatus(item.status))
    return (
      <li
        key={item.id}
        className={cn(
          "flex items-start gap-3 rounded-xl border px-3 py-2.5",
          isCancelled
            ? "border-red-200 bg-red-50/50"
            : isConfirmed
              ? "border-emerald-200 bg-emerald-50/30"
              : "border-slate-100 bg-slate-50"
        )}
      >
        <Avatar
          fallback={(item.customerName?.trim() || "?").charAt(0).toUpperCase()}
          className="mt-0.5 h-7 w-7 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">
            {isCancelled ? (
              <>
                <span className="font-medium text-gray-900">{item.customerName}</span> cancelled
                booking for <span className="font-medium text-gray-900">{item.courtName}</span> at{" "}
                <span className="font-bold text-gray-900">{item.venueName}</span>
              </>
            ) : (
              <>
                <span className="font-medium text-gray-900">{item.customerName}</span> booked{" "}
                <span className="font-medium text-gray-900">{item.courtName}</span> at{" "}
                <span className="font-bold text-gray-900">{item.venueName}</span> for{" "}
                <span className="font-bold text-gray-900">
                  {item.duration} {item.duration === 1 ? "hr" : "hrs"}
                </span>{" "}
                starting at <span className="text-gray-700">{item.startTime.substring(0, 5)}</span>
              </>
            )}
          </p>
          <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-500 flex-wrap">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {item.bookingDate}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {item.startTime.substring(0, 5)}
            </span>
            {item.address && (
              <span className="inline-flex items-center gap-1 flex-wrap">
                <MapPin className="h-3 w-3 shrink-0" />
                {item.address}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF6B35] hover:underline"
                >
                  Google
                </a>
                <span className="text-gray-300">|</span>
                <a
                  href={`https://waze.com/ul?q=${encodeURIComponent(item.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#33CCFF] hover:underline"
                >
                  Waze
                </a>
              </span>
            )}
            {isCancelled ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
                CANCELLED
              </span>
            ) : isConfirmed ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
                CONFIRMED
              </span>
            ) : null}
          </div>
        </div>
      </li>
    )
  }

  const content = groupByVenue
    ? (() => {
        const byVenue = itemsToRender.reduce<Record<string, BookingFeedItem[]>>((acc, item) => {
          const v = item.venueName || "Other"
          if (!acc[v]) acc[v] = []
          acc[v].push(item)
          return acc
        }, {})
        return (
          <ul className="space-y-4 text-sm">
            {Object.entries(byVenue).map(([venueName, venueItems]) => (
              <li key={venueName}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {venueName}
                </h3>
                <ul className="space-y-3 pl-1">
                  {venueItems.map((i) => renderItem(i))}
                </ul>
              </li>
            ))}
          </ul>
        )
      })()
    : (
      <ul className="space-y-3 text-sm">
        {itemsToRender.map((item) => renderItem(item))}
      </ul>
    )

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Booking Activity</CardTitle>
          <Clock className="h-4 w-4 text-gray-400" />
        </div>
        <div className="flex flex-wrap gap-1 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id ? "bg-[#FF6B35]/10 text-[#FF6B35]" : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setSortBy(sortBy === "duration" ? "default" : "duration")}
          >
            <ArrowDownUp className="h-3.5 w-3.5 mr-1.5" />
            Sort by Duration
          </Button>
          <Button
            variant={groupByVenue ? "secondary" : "outline"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setGroupByVenue(!groupByVenue)}
          >
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Group by Venue
          </Button>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={filterCourt}
              onChange={(e) => setFilterCourt(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All courts</option>
              {courtNames.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {itemsToRender.length === 0 ? (
          <p className="text-sm text-gray-500">
            {activeTab === "all"
              ? "No recent bookings yet. New bookings will appear here in real time."
              : activeTab === "booked"
                ? "No confirmed or booked reservations."
                : "No cancelled bookings."}
          </p>
        ) : (
          content
        )}
      </CardContent>
    </Card>
  )
}

