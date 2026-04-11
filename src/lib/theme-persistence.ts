import { load, type StoreOptions } from "@tauri-apps/plugin-store"
import type { BroadcastTheme } from "@/types/broadcast"

const STORE_FILE = "themes.json"
const STORE_KEY = "customThemes"
const VERSION_KEY = "schemaVersion"
const CURRENT_VERSION = 1

const STORE_OPTS: StoreOptions = {
  defaults: {
    [VERSION_KEY]: CURRENT_VERSION,
    [STORE_KEY]: [] as BroadcastTheme[],
    activeThemeId: "",
  },
  autoSave: false,
}

export async function loadCustomThemes(): Promise<BroadcastTheme[]> {
  try {
    const store = await load(STORE_FILE, STORE_OPTS)
    const version = await store.get<number>(VERSION_KEY)
    if (version === undefined) return []
    const themes = await store.get<BroadcastTheme[]>(STORE_KEY)
    return themes ?? []
  } catch {
    console.warn("[theme-persistence] Failed to load custom themes")
    return []
  }
}

export async function saveCustomThemes(themes: BroadcastTheme[]): Promise<void> {
  const customThemes = themes.filter((t) => !t.builtin)
  try {
    const store = await load(STORE_FILE, STORE_OPTS)
    await store.set(VERSION_KEY, CURRENT_VERSION)
    await store.set(STORE_KEY, customThemes)
    await store.save()
  } catch {
    console.warn("[theme-persistence] Failed to save custom themes")
  }
}

export async function saveActiveThemeId(themeId: string): Promise<void> {
  try {
    const store = await load(STORE_FILE, STORE_OPTS)
    await store.set("activeThemeId", themeId)
    await store.save()
  } catch {
    console.warn("[theme-persistence] Failed to save active theme ID")
  }
}

export async function loadActiveThemeId(): Promise<string | null> {
  try {
    const store = await load(STORE_FILE, STORE_OPTS)
    const id = await store.get<string>("activeThemeId")
    return id ?? null
  } catch {
    return null
  }
}
