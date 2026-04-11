import { create } from "zustand"
import { temporal } from "zundo"
import type { BroadcastTheme } from "@/types/broadcast"
import { useBroadcastStore } from "./broadcast-store"

type SelectedElement = "verse" | "reference" | null

interface ThemeDesignerState {
  isDesignerOpen: boolean
  editingThemeId: string | null
  draftTheme: BroadcastTheme | null
  selectedElement: SelectedElement

  openDesigner: () => void
  closeDesigner: () => void
  startEditing: (themeId: string) => void
  updateDraft: (updates: Partial<BroadcastTheme>) => void
  updateDraftNested: (path: string, value: unknown) => void
  saveDraft: () => void
  discardDraft: () => void
  setSelectedElement: (el: SelectedElement) => void
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const keys = path.split(".")
  const isIndex = (key: string) => /^\d+$/.test(key)
  const result: Record<string, unknown> = Array.isArray(obj)
    ? ([...obj] as unknown as Record<string, unknown>)
    : { ...obj }

  let current: Record<string, unknown> | unknown[] = result
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    const nextKey = keys[i + 1]
    const currentIndex = isIndex(key) ? Number(key) : key
    const existing = (current as Record<string, unknown> | unknown[])[
      currentIndex as keyof typeof current
    ]
    const nextContainer = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === "object"
        ? { ...(existing as Record<string, unknown>) }
        : isIndex(nextKey)
          ? []
          : {}

    ;(current as Record<string, unknown> | unknown[])[
      currentIndex as keyof typeof current
    ] = nextContainer as never
    current = nextContainer as Record<string, unknown> | unknown[]
  }

  const lastKey = keys[keys.length - 1]
  const lastIndex = isIndex(lastKey) ? Number(lastKey) : lastKey
  ;(current as Record<string, unknown> | unknown[])[
    lastIndex as keyof typeof current
  ] = value as never

  return result
}

export const useThemeDesignerStore = create<ThemeDesignerState>()(
  temporal(
    (set, get) => ({
      isDesignerOpen: false,
      editingThemeId: null,
      draftTheme: null,
      selectedElement: null,

      openDesigner: () => set({ isDesignerOpen: true }),

      closeDesigner: () => {
        set({
          isDesignerOpen: false,
          editingThemeId: null,
          draftTheme: null,
          selectedElement: null,
        })
        useThemeDesignerStore.temporal.getState().clear()
      },

      startEditing: (themeId: string) => {
        const theme = useBroadcastStore.getState().themes.find((t) => t.id === themeId)
        if (!theme) return
        const draft = structuredClone(theme)
        draft.updatedAt = Date.now()
        set({
          editingThemeId: themeId,
          draftTheme: draft,
          selectedElement: null,
        })
        useThemeDesignerStore.temporal.getState().clear()
      },

      updateDraft: (updates: Partial<BroadcastTheme>) =>
        set((s) => ({
          draftTheme: s.draftTheme
            ? { ...structuredClone(s.draftTheme), ...updates, updatedAt: Date.now() }
            : null,
        })),

      updateDraftNested: (path: string, value: unknown) =>
        set((s) => {
          if (!s.draftTheme) return {}
          const updated = setNestedValue(
            s.draftTheme as unknown as Record<string, unknown>,
            path,
            value,
          ) as unknown as BroadcastTheme
          updated.updatedAt = Date.now()
          return { draftTheme: updated }
        }),

      saveDraft: () => {
        const { draftTheme, editingThemeId } = get()
        if (!draftTheme) return

        const broadcastStore = useBroadcastStore.getState()

        if (draftTheme.builtin) {
          const customTheme: BroadcastTheme = {
            ...structuredClone(draftTheme),
            id: crypto.randomUUID(),
            name: `${draftTheme.name} (Custom)`,
            builtin: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          broadcastStore.saveTheme(customTheme)
          broadcastStore.setActiveTheme(customTheme.id)
          set({ editingThemeId: customTheme.id, draftTheme: customTheme })
        } else {
          const saved = structuredClone(draftTheme)
          broadcastStore.saveTheme(saved)
          if (broadcastStore.activeThemeId === editingThemeId) {
            broadcastStore.syncBroadcastOutput()
          }
        }
      },

      discardDraft: () => {
        const { editingThemeId } = get()
        if (editingThemeId) {
          get().startEditing(editingThemeId)
        }
      },

      setSelectedElement: (selectedElement: SelectedElement) => set({ selectedElement }),
    }),
    {
      // Only track draftTheme changes for undo/redo
      partialize: (state) => ({ draftTheme: state.draftTheme }),
      limit: 50,
      equality: (a, b) => a.draftTheme === b.draftTheme,
    },
  ),
)
