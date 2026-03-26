"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean
  onChange?: (checked: boolean) => void
  onCheckedChange?: (checked: boolean) => void
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked = false, onChange, onCheckedChange, className, disabled, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return
      props.onClick?.(e)
      const next = !checked
      onChange?.(next)
      onCheckedChange?.(next)
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        ref={ref}
        onClick={handleClick}
        className={cn(
          "inline-flex h-5 w-9 items-center rounded-full border transition-colors",
          checked
            ? "border-transparent bg-[#FF6B35]"
            : "border-gray-300 bg-gray-100",
          disabled && "opacity-60 cursor-not-allowed",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "ml-0.5 inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
            checked && "translate-x-3.5",
          )}
        />
      </button>
    )
  },
)
Switch.displayName = "Switch"

