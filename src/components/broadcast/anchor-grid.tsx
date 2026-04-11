import { cn } from "@/lib/utils"
import type { BroadcastTheme } from "@/types/broadcast"

type Anchor = BroadcastTheme["layout"]["anchor"]

const GRID: Anchor[][] = [
  ["top-left", "top-center", "top-right"],
  ["center", "center", "center"],
  ["bottom-left", "bottom-center", "bottom-right"],
]

// Center row has no dedicated left/right anchors — map them all to "center"
const ANCHORS: { value: Anchor; row: number; col: number }[] = [
  { value: "top-left", row: 0, col: 0 },
  { value: "top-center", row: 0, col: 1 },
  { value: "top-right", row: 0, col: 2 },
  { value: "center", row: 1, col: 1 },
  { value: "bottom-left", row: 2, col: 0 },
  { value: "bottom-center", row: 2, col: 1 },
  { value: "bottom-right", row: 2, col: 2 },
]

function anchorToGrid(anchor: Anchor): [number, number] {
  const entry = ANCHORS.find((a) => a.value === anchor)
  return entry ? [entry.row, entry.col] : [1, 1]
}

export function AnchorGrid({
  value,
  onChange,
}: {
  value: Anchor
  onChange: (anchor: Anchor) => void
}) {
  const [activeRow, activeCol] = anchorToGrid(value)

  return (
    <div className="inline-grid grid-cols-3 gap-1 rounded-md border border-border p-1.5">
      {GRID.map((row, ri) =>
        row.map((anchor, ci) => {
          const isActive = ri === activeRow && ci === activeCol
          // Middle row left/right cells are decorative (no anchor value)
          const isDisabled = ri === 1 && ci !== 1

          return (
            <button
              key={`${ri}-${ci}`}
              type="button"
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) onChange(anchor)
              }}
              className={cn(
                "size-4 rounded-sm transition-colors",
                isDisabled && "bg-muted/30",
                !isDisabled && !isActive && "bg-muted hover:bg-muted-foreground/30",
                isActive && "bg-primary",
              )}
            />
          )
        }),
      )}
    </div>
  )
}
