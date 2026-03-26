"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "outline"
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
          variant === "default" &&
            "border-transparent bg-gray-900/5 text-gray-900",
          variant === "success" &&
            "border-transparent bg-[#7ACD2E]/10 text-[#2F7A00]",
          variant === "outline" &&
            "border-gray-200 text-gray-700",
          className,
        )}
        {...props}
      />
    )
  },
)
Badge.displayName = "Badge"

