import { create } from "zustand"
import { emitTo } from "@tauri-apps/api/event"
import type { BroadcastTheme, VerseRenderData } from "@/types"
import { BUILTIN_THEMES } from "@/lib/builtin-themes"
import {
  loadCustomThemes,
  saveCustomThemes,
  loadActiveThemeId,
  saveActiveThemeId,
} from "@/lib/theme-persistence"
import {
  deleteThemeAssets,
  duplicateThemeAssets,
  getThemeImagePaths,
} from "@/lib/theme-assets"

interface BroadcastState {
  themes: BroadcastTheme[]
  activeThemeId: string
  altActiveThemeId: string
  isLive: boolean
  liveVerse: VerseRenderData | null
  themesLoaded: boolean

  // Theme management
  loadThemes: () => Promise<void>
  saveTheme: (theme: BroadcastTheme) => void
  deleteTheme: (id: string) => void
  duplicateTheme: (id: string) => Promise<string | null>
  renameTheme: (id: string, name: string) => void
  togglePin: (id: string) => void
  setActiveTheme: (id: string) => void
  setAltActiveTheme: (id: string) => void
  setLive: (live: boolean) => void
  setLiveVerse: (verse: VerseRenderData | null) => void
  syncBroadcastOutput: () => void
  syncBroadcastOutputFor: (outputId: string) => void
}

export const useBroadcastStore = create<BroadcastState>((set, get) => ({
  themes: [...BUILTIN_THEMES],
  activeThemeId: BUILTIN_THEMES[0].id,
  altActiveThemeId: BUILTIN_THEMES[0].id,
  isLive: false,
  liveVerse: null,
  themesLoaded: false,

  loadThemes: async () => {
    const customThemes = await loadCustomThemes()
    const persistedActiveId = await loadActiveThemeId()
    const allThemes = [...BUILTIN_THEMES, ...customThemes]

    // Restore active theme if it still exists
    const activeId =
      persistedActiveId && allThemes.some((t) => t.id === persistedActiveId)
        ? persistedActiveId
        : BUILTIN_THEMES[0].id

    set({ themes: allThemes, activeThemeId: activeId, themesLoaded: true })
  },

  saveTheme: (theme) => {
    set((s) => {
      const themes = s.themes.some((t) => t.id === theme.id)
        ? s.themes.map((t) => (t.id === theme.id ? theme : t))
        : [...s.themes, theme]
      // Persist asynchronously — fire and forget
      void saveCustomThemes(themes)
      return { themes }
    })
  },

  deleteTheme: (id) => {
    const theme = get().themes.find((t) => t.id === id)
    if (!theme || theme.builtin) return

    // Clean up image assets
    void deleteThemeAssets(id)

    set((s) => {
      const themes = s.themes.filter((t) => t.id !== id)
      void saveCustomThemes(themes)
      // If deleted theme was active, fall back to first theme
      const activeThemeId =
        s.activeThemeId === id ? BUILTIN_THEMES[0].id : s.activeThemeId
      return { themes, activeThemeId }
    })
  },

  duplicateTheme: async (id) => {
    const source = get().themes.find((t) => t.id === id)
    if (!source) return null

    const newId = crypto.randomUUID()
    const newTheme: BroadcastTheme = structuredClone(source)
    newTheme.id = newId
    newTheme.name = `${source.name} Copy`
    newTheme.builtin = false
    newTheme.pinned = false
    newTheme.createdAt = Date.now()
    newTheme.updatedAt = Date.now()

    // Deep copy image assets
    const assetPaths = getThemeImagePaths(source)
    if (assetPaths.length > 0) {
      const pathMap = await duplicateThemeAssets(source.id, newId, assetPaths)
      // Update image paths in the new theme
      if (newTheme.background.image?.url) {
        const newPath = pathMap.get(newTheme.background.image.url)
        if (newPath) {
          newTheme.background.image.url = newPath
        }
      }
    }

    set((s) => {
      const themes = [...s.themes, newTheme]
      void saveCustomThemes(themes)
      return { themes }
    })
    return newId
  },

  renameTheme: (id, name) => {
    set((s) => {
      const themes = s.themes.map((t) =>
        t.id === id && !t.builtin ? { ...t, name, updatedAt: Date.now() } : t,
      )
      void saveCustomThemes(themes)
      return { themes }
    })
  },

  togglePin: (id) => {
    set((s) => {
      const themes = s.themes.map((t) =>
        t.id === id ? { ...t, pinned: !t.pinned, updatedAt: Date.now() } : t,
      )
      void saveCustomThemes(themes)
      return { themes }
    })
  },

  syncBroadcastOutputFor: (outputId: string) => {
    const s = get()
    const themeId = outputId === "alt" ? s.altActiveThemeId : s.activeThemeId
    const label = outputId === "alt" ? "broadcast-alt" : "broadcast"
    const theme = s.themes.find((t) => t.id === themeId) ?? s.themes[0]
    if (!theme) return

    void emitTo(label, "broadcast:verse-update", {
      theme,
      verse: s.liveVerse,
    }).catch(() => {})
  },

  syncBroadcastOutput: () => {
    get().syncBroadcastOutputFor("main")
    get().syncBroadcastOutputFor("alt")
  },

  setActiveTheme: (activeThemeId) => {
    set({ activeThemeId })
    void saveActiveThemeId(activeThemeId)
    get().syncBroadcastOutputFor("main")
  },

  setAltActiveTheme: (altActiveThemeId) => {
    set({ altActiveThemeId })
    get().syncBroadcastOutputFor("alt")
  },

  setLive: (isLive) => set({ isLive }),

  setLiveVerse: (liveVerse) => {
    set({ liveVerse })
    get().syncBroadcastOutput()
  },
}))
