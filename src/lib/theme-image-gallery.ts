import { load } from "@tauri-apps/plugin-store"
import { appDataDir, join } from "@tauri-apps/api/path"
import { readDir, exists } from "@tauri-apps/plugin-fs"
import { convertFileSrc } from "@tauri-apps/api/core"
import type { BroadcastTheme } from "@/types/broadcast"

const STORE_FILE = "themes.json"
const STORE_OPTS = {
  defaults: { recentImages: [] as string[] },
  autoSave: false,
}
const MAX_RECENT = 20

export interface GalleryImage {
  relativePath: string
  url: string
  filename: string
}

export async function addRecentImage(relativePath: string): Promise<void> {
  try {
    const store = await load(STORE_FILE, STORE_OPTS)
    const recent = (await store.get<string[]>("recentImages")) ?? []
    const updated = [relativePath, ...recent.filter((p) => p !== relativePath)].slice(0, MAX_RECENT)
    await store.set("recentImages", updated)
    await store.save()
  } catch {
    // non-critical
  }
}

export async function getRecentImages(): Promise<GalleryImage[]> {
  try {
    const store = await load(STORE_FILE, STORE_OPTS)
    const recent = (await store.get<string[]>("recentImages")) ?? []
    const appData = await appDataDir()
    const images: GalleryImage[] = []

    for (const relativePath of recent) {
      const fullPath = await join(appData, relativePath)
      if (await exists(fullPath)) {
        images.push({
          relativePath,
          url: convertFileSrc(fullPath),
          filename: relativePath.split(/[/\\]/).pop() ?? "image",
        })
      }
    }
    return images
  } catch {
    return []
  }
}

export async function getAllThemeImages(): Promise<GalleryImage[]> {
  try {
    const appData = await appDataDir()
    const assetsDir = await join(appData, "theme-assets")
    if (!(await exists(assetsDir))) return []

    const themeDirs = await readDir(assetsDir)
    const images: GalleryImage[] = []

    for (const dir of themeDirs) {
      if (!dir.isDirectory) continue
      const dirPath = await join(assetsDir, dir.name)
      const files = await readDir(dirPath)
      for (const file of files) {
        if (file.isDirectory) continue
        const ext = file.name.split(".").pop()?.toLowerCase() ?? ""
        if (!["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) continue
        const relativePath = `theme-assets/${dir.name}/${file.name}`
        const fullPath = await join(dirPath, file.name)
        images.push({
          relativePath,
          url: convertFileSrc(fullPath),
          filename: file.name,
        })
      }
    }
    return images
  } catch {
    return []
  }
}
