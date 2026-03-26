"use client"

import { Activity, DollarSign, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface VendorStatsProps {
  totalRevenue: number
  activeBookingsToday: number
  occupancyRate: number
}

export function VendorStats({
  totalRevenue,
  activeBookingsToday,
  occupancyRate,
}: VendorStatsProps) {
  const formattedRevenue = `RM ${totalRevenue.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
  })}`

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-[#FF6B35]" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-gray-900">
            {formattedRevenue}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Sum of all paid bookings
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Active Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-[#FF6B35]" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-gray-900">
            {activeBookingsToday}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            For today across all courts
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Occupancy Rate</CardTitle>
            <Activity className="h-4 w-4 text-[#7ACD2E]" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-gray-900">
            {Math.round(occupancyRate)}%
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Filled slots vs. total slots today
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

