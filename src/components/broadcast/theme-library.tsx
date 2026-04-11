import { useState, useMemo, useRef, useEffect } from "react"
import { useBroadcastStore } from "@/stores"
import { useThemeDesignerStore } from "@/stores/theme-designer-store"
import { importTheme, exportTheme } from "@/lib/theme-io"
import { CanvasVerse } from "@/components/ui/canvas-verse"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  PlusIcon,
  HeartIcon,
  MoreHorizontalIcon,
  SearchIcon,
  DownloadIcon,
  UploadIcon,
  CopyIcon,
  TrashIcon,
  PencilIcon,
  PinIcon,
  CheckIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BroadcastTheme, VerseRenderData } from "@/types"

type FilterTab = "all" | "pinned" | "custom"

const THUMBNAIL_VERSE: VerseRenderData = {
  reference: "John 3:16 (KJV)",
  segments: [{ text: "Sample Verse" }],
}

function ThemeCard({
  theme,
  isActive,
  isEditing,
  onSelect,
}: {
  theme: BroadcastTheme
  isActive: boolean
  isEditing: boolean
  onSelect: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [renameDraft, setRenameDraft] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const renameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renaming) renameRef.current?.focus()
  }, [renaming])

  const handleDuplicate = () => {
    void useBroadcastStore.getState().duplicateTheme(theme.id)
  }

  const handleSetActive = () => {
    useBroadcastStore.getState().setActiveTheme(theme.id)
  }

  const handleDelete = () => {
    useBroadcastStore.getState().deleteTheme(theme.id)
    setDeleteOpen(false)
  }

  const handleStartRename = () => {
    setRenameDraft(theme.name)
    setRenaming(true)
  }

  const handleCommitRename = () => {
    const trimmed = renameDraft.trim()
    if (trimmed && trimmed !== theme.name) {
      useBroadcastStore.getState().renameTheme(theme.id, trimmed)
    }
    setRenaming(false)
  }

  const handleTogglePin = () => {
    useBroadcastStore.getState().togglePin(theme.id)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        className={cn(
          "group relative flex w-full flex-col gap-1.5 rounded-lg p-1.5 text-left transition-colors hover:bg-muted/50",
          isEditing && "ring-2 ring-primary",
        )}
      >
        <div className="relative aspect-video w-full overflow-hidden rounded-lg">
          <CanvasVerse theme={theme} verse={THUMBNAIL_VERSE} className="w-full" />

          {isActive && (
            <Badge className="absolute top-1.5 left-1.5 bg-emerald-600 text-[0.5rem] text-white hover:bg-emerald-600">
              Active
            </Badge>
          )}

          {theme.pinned && (
            <div className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-background/80">
              <HeartIcon className="size-3 text-primary" strokeWidth={2} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 px-0.5">
          <div className="min-w-0 flex-1">
            {renaming ? (
              <Input
                ref={renameRef}
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={handleCommitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCommitRename()
                  if (e.key === "Escape") setRenaming(false)
                }}
                onClick={(e) => e.stopPropagation()}
                className="h-5 px-1 text-xs"
              />
            ) : (
              <p className="truncate text-xs font-medium text-foreground">
                {theme.name}
              </p>
            )}
            {isActive && !renaming && (
              <p className="text-[0.5rem] text-muted-foreground">Default</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {theme.builtin && (
              <Badge variant="outline" className="text-[0.5rem]">
                Built-in
              </Badge>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontalIcon className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {!isActive && (
                <DropdownMenuItem onClick={handleSetActive}>
                  <CheckIcon className="size-3.5" />
                  Set as Current
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleDuplicate}>
                <CopyIcon className="size-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTogglePin}>
                <PinIcon className="size-3.5" />
                {theme.pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void exportTheme(theme)}>
                <DownloadIcon className="size-3.5" />
                Export
              </DropdownMenuItem>
              {!theme.builtin && (
                <>
                  <DropdownMenuItem onClick={handleStartRename}>
                    <PencilIcon className="size-3.5" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <TrashIcon className="size-3.5" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{theme.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this theme and its assets. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function ThemeLibrary() {
  const themes = useBroadcastStore((s) => s.themes)
  const activeThemeId = useBroadcastStore((s) => s.activeThemeId)
  const editingThemeId = useThemeDesignerStore((s) => s.editingThemeId)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<FilterTab>("all")

  const filteredThemes = useMemo(() => {
    let result = themes
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((t) => t.name.toLowerCase().includes(q))
    }
    if (filter === "pinned") result = result.filter((t) => t.pinned)
    if (filter === "custom") result = result.filter((t) => !t.builtin)
    return result
  }, [themes, search, filter])

  const builtinThemes = filteredThemes.filter((t) => t.builtin)
  const customThemes = filteredThemes.filter((t) => !t.builtin)

  const handleNewTheme = () => {
    const firstTheme = themes[0]
    if (firstTheme) {
      void useBroadcastStore.getState().duplicateTheme(firstTheme.id)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden border-r border-border bg-card">
      <div className="flex h-14 items-center justify-between border-b border-border px-3">
        <span className="text-lg font-semibold text-foreground">Themes</span>
        <Button onClick={handleNewTheme}>
          <PlusIcon className="size-4" />
          New
        </Button>
      </div>

      <div className="px-3 pt-3 pb-4">
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search themes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7"
          />
        </div>
      </div>

      <Tabs
        value={filter}
        onValueChange={(value) => setFilter(value as FilterTab)}
        className="shrink-0 px-3 pb-4"
      >
        <TabsList className="h-7 w-full">
          <TabsTrigger value="all" className="capitalize">all</TabsTrigger>
          <TabsTrigger value="pinned" className="capitalize">pinned</TabsTrigger>
          <TabsTrigger value="custom" className="capitalize">custom</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex gap-1.5 px-3 pb-3">
        <Button
          variant="outline"
          className="flex-1 border-border bg-transparent"
          onClick={() => void importTheme()}
        >
          <UploadIcon className="size-2.5" />
          Import
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-1 px-2 pb-4">
          {builtinThemes.length > 0 && (
            <>
              <p className="px-1.5 pt-2 pb-1 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
                Built-in
              </p>
              {builtinThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={theme.id === activeThemeId}
                  isEditing={theme.id === editingThemeId}
                  onSelect={() =>
                    useThemeDesignerStore.getState().startEditing(theme.id)
                  }
                />
              ))}
            </>
          )}

          {customThemes.length > 0 && (
            <>
              <p className="px-1.5 pt-3 pb-1 text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">
                Custom
              </p>
              {customThemes.map((theme) => (
                <ThemeCard
                  key={theme.id}
                  theme={theme}
                  isActive={theme.id === activeThemeId}
                  isEditing={theme.id === editingThemeId}
                  onSelect={() =>
                    useThemeDesignerStore.getState().startEditing(theme.id)
                  }
                />
              ))}
            </>
          )}

          {filteredThemes.length === 0 && (
            <p className="p-4 text-center text-xs text-muted-foreground">
              No themes found
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
