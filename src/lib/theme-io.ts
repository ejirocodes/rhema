import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog"
import { readFile, writeFile, exists } from "@tauri-apps/plugin-fs"
import { appDataDir, join } from "@tauri-apps/api/path"
import type { BroadcastTheme } from "@/types/broadcast"
import { useBroadcastStore } from "@/stores"

const THEME_FILE_EXT = "rhema-theme"
const EXPORT_VERSION = 1

interface ThemeExportEnvelope {
  version: number
  theme: BroadcastTheme
  assets: Record<string, string> // relative path → base64 encoded data
}

export async function exportTheme(theme: BroadcastTheme): Promise<void> {
  const path = await saveDialog({
    defaultPath: `${theme.name}.${THEME_FILE_EXT}`,
    filters: [{ name: "Rhema Theme", extensions: [THEME_FILE_EXT] }],
  })
  if (!path) return

  const envelope: ThemeExportEnvelope = {
    version: EXPORT_VERSION,
    theme: structuredClone(theme),
    assets: {},
  }

  // Bundle image assets as base64
  if (theme.background.image?.url && theme.background.image.url.startsWith("theme-assets/")) {
    const appData = await appDataDir()
    const fullPath = await join(appData, theme.background.image.url)
    if (await exists(fullPath)) {
      const bytes = await readFile(fullPath)
      envelope.assets[theme.background.image.url] = uint8ToBase64(bytes)
    }
  }

  const json = JSON.stringify(envelope, null, 2)
  const encoder = new TextEncoder()
  await writeFile(path, encoder.encode(json))
}

export async function importTheme(): Promise<{ success: boolean; error?: string }> {
  const path = await openDialog({
    multiple: false,
    filters: [{ name: "Rhema Theme", extensions: [THEME_FILE_EXT, "json"] }],
  })
  if (!path) return { success: false }

  try {
    const bytes = await readFile(path)
    const json = new TextDecoder().decode(bytes)
    const envelope = JSON.parse(json) as ThemeExportEnvelope

    if (!envelope.version || !envelope.theme) {
      return { success: false, error: "Invalid theme file: missing version or theme data" }
    }
    if (typeof envelope.theme.id !== "string" || typeof envelope.theme.name !== "string") {
      return { success: false, error: "Invalid theme file: malformed theme structure" }
    }

    const theme: BroadcastTheme = {
      ...envelope.theme,
      id: crypto.randomUUID(),
      builtin: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    // Restore bundled assets
    if (envelope.assets && Object.keys(envelope.assets).length > 0) {
      const appData = await appDataDir()
      const { mkdir } = await import("@tauri-apps/plugin-fs")

      for (const [relativePath, base64Data] of Object.entries(envelope.assets)) {
        // Rewrite paths to use the new theme ID
        const filename = relativePath.split(/[/\\]/).pop() ?? "asset"
        const newRelativePath = `theme-assets/${theme.id}/${filename}`
        const fullPath = await join(appData, `theme-assets/${theme.id}`)
        if (!(await exists(fullPath))) {
          await mkdir(fullPath, { recursive: true })
        }
        const destPath = await join(fullPath, filename)
        const assetBytes = base64ToUint8(base64Data)
        await writeFile(destPath, assetBytes)

        // Update theme to reference new path
        if (theme.background.image?.url === relativePath) {
          theme.background.image.url = newRelativePath
        }
      }
    }

    useBroadcastStore.getState().saveTheme(theme)
    return { success: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return { success: false, error: `Failed to import theme: ${msg}` }
  }
}

function uint8ToBase64(bytes: Uint8Array): string {
  const CHUNK = 0x8000
  const parts: string[] = []
  for (let i = 0; i < bytes.length; i += CHUNK) {
    parts.push(String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]))
  }
  return btoa(parts.join(""))
}

function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}
