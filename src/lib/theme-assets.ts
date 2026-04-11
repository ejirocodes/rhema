import { appDataDir, join } from "@tauri-apps/api/path"
import { copyFile, mkdir, exists, remove } from "@tauri-apps/plugin-fs"
import { convertFileSrc } from "@tauri-apps/api/core"

const THEME_ASSETS_DIR = "theme-assets"

async function getThemeAssetDir(themeId: string): Promise<string> {
  const appData = await appDataDir()
  const base = await join(appData, THEME_ASSETS_DIR)
  return await join(base, themeId)
}

async function ensureThemeAssetDir(themeId: string): Promise<string> {
  const dir = await getThemeAssetDir(themeId)
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true })
  }
  return dir
}

export async function saveThemeImage(
  themeId: string,
  sourcePath: string,
): Promise<string> {
  const dir = await ensureThemeAssetDir(themeId)
  const filename = sourcePath.split(/[/\\]/).pop() ?? "background.png"
  const destPath = await join(dir, filename)
  await copyFile(sourcePath, destPath)
  return `${THEME_ASSETS_DIR}/${themeId}/${filename}`
}

export async function resolveThemeImageUrl(
  relativePath: string,
): Promise<string> {
  if (!relativePath) return ""
  if (
    relativePath.startsWith("http://") ||
    relativePath.startsWith("https://") ||
    relativePath.startsWith("data:")
  ) {
    return relativePath
  }
  const appData = await appDataDir()
  const fullPath = await join(appData, relativePath)
  return convertFileSrc(fullPath)
}

export async function duplicateThemeAssets(
  _sourceThemeId: string,
  destThemeId: string,
  assetPaths: string[],
): Promise<Map<string, string>> {
  const pathMap = new Map<string, string>()
  if (assetPaths.length === 0) return pathMap

  const appData = await appDataDir()
  const destDir = await ensureThemeAssetDir(destThemeId)

  for (const relativePath of assetPaths) {
    if (!relativePath || !relativePath.startsWith(THEME_ASSETS_DIR)) continue
    const sourceFull = await join(appData, relativePath)
    if (!(await exists(sourceFull))) continue

    const filename = relativePath.split(/[/\\]/).pop() ?? "asset"
    const destFull = await join(destDir, filename)
    await copyFile(sourceFull, destFull)
    pathMap.set(relativePath, `${THEME_ASSETS_DIR}/${destThemeId}/${filename}`)
  }
  return pathMap
}

export async function deleteThemeAssets(themeId: string): Promise<void> {
  const dir = await getThemeAssetDir(themeId)
  if (await exists(dir)) {
    await remove(dir, { recursive: true })
  }
}

export function getThemeImagePaths(theme: {
  background: { image: { url: string } | null }
}): string[] {
  const paths: string[] = []
  if (theme.background.image?.url) {
    paths.push(theme.background.image.url)
  }
  return paths
}
