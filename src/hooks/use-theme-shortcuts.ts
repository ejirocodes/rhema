import { useEffect } from "react"
import { useThemeDesignerStore } from "@/stores/theme-designer-store"

export function useThemeShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const store = useThemeDesignerStore.getState()
      if (!store.isDesignerOpen || !store.draftTheme) return

      const isMod = e.metaKey || e.ctrlKey

      // Cmd+Z — undo
      if (isMod && !e.shiftKey && e.key === "z") {
        e.preventDefault()
        useThemeDesignerStore.temporal.getState().undo()
        return
      }

      // Cmd+Shift+Z — redo
      if (isMod && e.shiftKey && e.key === "z") {
        e.preventDefault()
        useThemeDesignerStore.temporal.getState().redo()
        return
      }

      // Cmd+S — save
      if (isMod && e.key === "s") {
        e.preventDefault()
        store.saveDraft()
        return
      }

      // Escape — deselect element
      if (e.key === "Escape") {
        if (store.selectedElement) {
          e.preventDefault()
          store.setSelectedElement(null)
        }
        return
      }

      // Delete/Backspace — deselect (not delete theme, that's context menu)
      if (e.key === "Delete" || e.key === "Backspace") {
        if (store.selectedElement && !isInputFocused()) {
          e.preventDefault()
          store.setSelectedElement(null)
        }
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])
}

function isInputFocused(): boolean {
  const el = document.activeElement
  if (!el) return false
  const tag = el.tagName.toLowerCase()
  return tag === "input" || tag === "textarea" || (el as HTMLElement).isContentEditable
}
