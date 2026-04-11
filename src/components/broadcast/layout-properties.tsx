import { useThemeDesignerStore } from "@/stores/theme-designer-store"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AnchorGrid } from "@/components/broadcast/anchor-grid"

export function LayoutProperties() {
  const draftTheme = useThemeDesignerStore((s) => s.draftTheme)
  const update = useThemeDesignerStore((s) => s.updateDraftNested)

  if (!draftTheme) return null

  const layout = draftTheme.layout
  const resolution = draftTheme.resolution
  const referenceGap = layout.referenceGap ?? Math.max(16, Math.round(draftTheme.reference.fontSize * 0.5))

  const bgWidthPx = Math.round((layout.backgroundWidth / 100) * resolution.width)
  const bgHeightPx = Math.round((layout.backgroundHeight / 100) * resolution.height)
  const textWidthPx = Math.round((layout.textAreaWidth / 100) * resolution.width)
  const textHeightPx = Math.round((layout.textAreaHeight / 100) * resolution.height)

  const verseNumbers = draftTheme.verseNumbers
  const superscriptSizePct = Math.round(
    (verseNumbers.fontSize / draftTheme.verseText.fontSize) * 100
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Background Dimensions */}
      <div className="flex flex-col gap-0.5 pb-1">
        <h4 className="text-xs font-semibold">Background Dimensions</h4>
      </div>

      {/* Width */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Width</label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {layout.backgroundWidth}% ({bgWidthPx}px)
          </span>
        </div>
        <Slider
          min={10}
          max={100}
          step={1}
          value={[layout.backgroundWidth]}
          onValueChange={([v]) => update("layout.backgroundWidth", v)}
        />
      </div>

      {/* Height */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Height</label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {layout.backgroundHeight}% ({bgHeightPx}px)
          </span>
        </div>
        <Slider
          min={10}
          max={100}
          step={1}
          value={[layout.backgroundHeight]}
          onValueChange={([v]) => update("layout.backgroundHeight", v)}
        />
      </div>

      {/* Text Area Dimensions */}
      <div className="flex flex-col gap-0.5 border-t pt-3 pb-1">
        <h4 className="text-xs font-semibold">Text Area Dimensions</h4>
      </div>

      {/* Text Width */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Text Width</label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {layout.textAreaWidth}% ({textWidthPx}px)
          </span>
        </div>
        <Slider
          min={10}
          max={100}
          step={1}
          value={[layout.textAreaWidth]}
          onValueChange={([v]) => update("layout.textAreaWidth", v)}
        />
      </div>

      {/* Text Height */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Text Height</label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {layout.textAreaHeight}% ({textHeightPx}px)
          </span>
        </div>
        <Slider
          min={10}
          max={100}
          step={1}
          value={[layout.textAreaHeight]}
          onValueChange={([v]) => update("layout.textAreaHeight", v)}
        />
      </div>

      {/* Anchor & Offset */}
      <div className="flex flex-col gap-0.5 border-t pt-3 pb-1">
        <h4 className="text-xs font-semibold">Position</h4>
      </div>

      <div className="flex items-center gap-3">
        <AnchorGrid
          value={layout.anchor}
          onChange={(v) => update("layout.anchor", v)}
        />
        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Offset X</label>
            <Input
              type="number"
              value={layout.offsetX}
              onChange={(e) => update("layout.offsetX", Number(e.target.value))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Offset Y</label>
            <Input
              type="number"
              value={layout.offsetY}
              onChange={(e) => update("layout.offsetY", Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* Text Align */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Text Align</label>
        <Select
          value={layout.textAlign}
          onValueChange={(v) => update("layout.textAlign", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto-fit Text */}
      <div className="flex flex-col gap-1.5 border-t pt-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Auto-fit Text</label>
          <input
            type="checkbox"
            checked={draftTheme.verseText.autoFit ?? false}
            onChange={(e) => update("verseText.autoFit", e.target.checked)}
            className="h-4 w-4 rounded border-input accent-primary"
          />
        </div>
        {draftTheme.verseText.autoFit && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Min Font Size</label>
              <span className="text-xs tabular-nums text-muted-foreground">
                {draftTheme.verseText.minFontSize ?? 24}px
              </span>
            </div>
            <Slider
              min={12}
              max={Math.max(12, draftTheme.verseText.fontSize - 4)}
              step={1}
              value={[draftTheme.verseText.minFontSize ?? 24]}
              onValueChange={([v]) => update("verseText.minFontSize", v)}
            />
          </div>
        )}
      </div>

      {/* Padding */}
      <div className="flex flex-col gap-0.5 border-t pt-3 pb-1">
        <h4 className="text-xs font-semibold">Padding</h4>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Top</label>
          <Input
            type="number"
            min={0}
            value={layout.padding.top}
            onChange={(e) => update("layout.padding.top", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Right</label>
          <Input
            type="number"
            min={0}
            value={layout.padding.right}
            onChange={(e) => update("layout.padding.right", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Bottom</label>
          <Input
            type="number"
            min={0}
            value={layout.padding.bottom}
            onChange={(e) => update("layout.padding.bottom", Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Left</label>
          <Input
            type="number"
            min={0}
            value={layout.padding.left}
            onChange={(e) => update("layout.padding.left", Number(e.target.value))}
          />
        </div>
      </div>

      {/* Element Spacing */}
      <div className="flex flex-col gap-0.5 border-t pt-3 pb-1">
        <h4 className="text-xs font-semibold">Element Spacing</h4>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-muted-foreground">Verse / Reference</label>
          <span className="text-xs tabular-nums text-muted-foreground">{referenceGap}px</span>
        </div>
        <Slider
          min={0}
          max={200}
          step={1}
          value={[referenceGap]}
          onValueChange={([v]) => update("layout.referenceGap", v)}
        />
      </div>

      {/* Display Options */}
      <div className="flex flex-col gap-0.5 border-t pt-3 pb-1">
        <h4 className="text-xs font-semibold">Display Options</h4>
      </div>

      {/* Reference Position */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">Reference Position</label>
        <Select
          value={draftTheme.reference.position}
          onValueChange={(v) => update("reference.position", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="above">Above Verse</SelectItem>
            <SelectItem value="below">Below Verse</SelectItem>
            <SelectItem value="inline">Inline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Verse Number Superscript */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Verse Number Superscript</label>
        <input
          type="checkbox"
          checked={verseNumbers.superscript}
          onChange={(e) => update("verseNumbers.superscript", e.target.checked)}
          className="h-4 w-4 rounded border-input accent-primary"
        />
      </div>

      {/* Superscript Size */}
      {verseNumbers.superscript && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Superscript Size</label>
            <span className="text-xs tabular-nums text-muted-foreground">{superscriptSizePct}%</span>
          </div>
          <Slider
            min={20}
            max={100}
            step={1}
            value={[superscriptSizePct]}
            onValueChange={([v]) => {
              const newFontSize = Math.round((v / 100) * draftTheme.verseText.fontSize)
              update("verseNumbers.fontSize", newFontSize)
            }}
          />
        </div>
      )}
    </div>
  )
}
