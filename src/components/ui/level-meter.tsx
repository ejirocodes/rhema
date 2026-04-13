import * as React from "react"

import { cn } from "@/lib/utils"

function LevelMeter({
  className,
  level,
  bars = 4,
  ...props
}: React.ComponentProps<"div"> & {
  level: number
  bars?: number
}) {
  const scaled = Math.min(level / 0.25, 1)
  const curved = Math.pow(scaled, 0.4)

  return (
    <div
      data-slot="level-meter"
      className={cn("flex items-end gap-0.5", className)}
      {...props}
    >
      {Array.from({ length: bars }, (_, i) => {
        const threshold = (i + 1) / bars
        const active = curved >= threshold
        const ratio = i / (bars - 1)

        return (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-75",
              active
                ? ratio < 0.4
                  ? "bg-emerald-500"
                  : ratio < 0.7
                    ? "bg-amber-400"
                    : "bg-red-500"
                : "bg-muted/30"
            )}
            style={{ height: `${((i + 1) / bars) * 16 + 4}px` }}
          />
        )
      })}
    </div>
  )
}

export { LevelMeter }
