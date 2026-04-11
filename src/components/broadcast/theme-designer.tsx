import { useEffect } from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { useBroadcastStore } from "@/stores"
import { useThemeDesignerStore } from "@/stores/theme-designer-store"
import { useThemeShortcuts } from "@/hooks/use-theme-shortcuts"
import { Button } from "@/components/ui/button"
import { SaveIcon, TrashIcon, XIcon } from "lucide-react"
import { ThemeLibrary } from "@/components/broadcast/theme-library"
import { DesignCanvas } from "@/components/broadcast/design-canvas"
import { PropertiesPanel } from "@/components/broadcast/properties-panel"

export function ThemeDesigner() {
  useThemeShortcuts()
  const isDesignerOpen = useThemeDesignerStore((s) => s.isDesignerOpen)
  const draftTheme = useThemeDesignerStore((s) => s.draftTheme)
  const themes = useBroadcastStore((s) => s.themes)

  useEffect(() => {
    if (isDesignerOpen && !draftTheme && themes.length > 0) {
      useThemeDesignerStore.getState().startEditing(themes[0].id)
    }
  }, [isDesignerOpen, draftTheme, themes])

  const handleDiscard = () => {
    useThemeDesignerStore.getState().discardDraft()
  }

  const handleSave = () => {
    useThemeDesignerStore.getState().saveDraft()
  }

  const handleClose = () => {
    useThemeDesignerStore.getState().closeDesigner()
  }

  return (
    <DialogPrimitive.Root
      open={isDesignerOpen}
      onOpenChange={(open) => {
        if (!open) useThemeDesignerStore.getState().closeDesigner()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background text-foreground outline-none"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Theme Designer
          </DialogPrimitive.Title>

          <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4 bg-card">
            <span className="text-xl font-semibold text-foreground">
              Theme Designer
            </span>

            <div className="flex-1" />

            <Button variant="outline" onClick={handleDiscard}>
              <TrashIcon className="size-4" />
              Discard
            </Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/80"
              onClick={handleSave}
            >
              <SaveIcon className="size-4" />
              Save Theme
            </Button>
            <Button
              variant="ghost"
              onClick={handleClose}
            >
              <XIcon strokeWidth={2} />
              Close
            </Button>
          </div>

          <div
            className="min-h-0 flex-1"
            style={{
              display: "grid",
              gridTemplateColumns: "260px 1fr 320px",
            }}
          >
            <ThemeLibrary />
            <DesignCanvas />
            <PropertiesPanel />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
