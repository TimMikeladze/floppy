"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAllLists, saveList, deleteList, removeComicFromList } from "@/lib/storage"
import type { ComicList } from "@/lib/types"
import { Plus, Trash2, MoreVertical, Sparkles, Pencil } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { SmartListDialog } from "./smart-list-dialog"
import { Textarea } from "@/components/ui/textarea"

const PRESET_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

interface ListManagerProps {
  comicId?: string
  onListsChange?: () => void
}

export function ListManager({ comicId, onListsChange }: ListManagerProps) {
  const [lists, setLists] = useState<ComicList[]>([])
  const [newListName, setNewListName] = useState("")
  const [newListDescription, setNewListDescription] = useState("")
  const [newListIcon, setNewListIcon] = useState("")
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [smartListDialogOpen, setSmartListDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<ComicList | undefined>()

  useEffect(() => {
    loadLists()
  }, [])

  async function loadLists() {
    const allLists = await getAllLists()
    setLists(allLists)
  }

  async function handleCreateList() {
    if (!newListName.trim()) return

    const newList: ComicList = {
      id: crypto.randomUUID(),
      name: newListName.trim(),
      description: newListDescription.trim() || undefined,
      icon: newListIcon || undefined,
      color: selectedColor,
      createdAt: new Date(),
      comicIds: comicId ? [comicId] : [],
    }

    await saveList(newList)
    setNewListName("")
    setNewListDescription("")
    setNewListIcon("")
    setSelectedColor(PRESET_COLORS[0])
    setDialogOpen(false)
    await loadLists()
    onListsChange?.()

    toast.success("List created", {
      description: `"${newList.name}" has been created`,
    })
  }

  async function handleCreateSmartList(listData: Omit<ComicList, 'id' | 'createdAt' | 'comicIds'>) {
    const newList: ComicList = {
      id: editingList?.id || crypto.randomUUID(),
      ...listData,
      createdAt: editingList?.createdAt || new Date(),
      comicIds: [], // Smart lists don't store comic IDs - they're computed
    }

    await saveList(newList)
    setEditingList(undefined)
    await loadLists()
    onListsChange?.()

    toast.success(editingList ? "Smart list updated" : "Smart list created", {
      description: `"${newList.name}" will auto-update based on your rules`,
    })
  }

  function handleEditSmartList(list: ComicList) {
    setEditingList(list)
    setSmartListDialogOpen(true)
  }

  async function handleDeleteList(id: string, name: string) {
    if (!confirm(`Delete "${name}"?`)) return

    await deleteList(id)
    await loadLists()
    onListsChange?.()

    toast.success("List deleted", {
      description: `"${name}" has been removed`,
    })
  }

  async function handleRemoveFromList(listId: string, listName: string) {
    if (!comicId) return

    await removeComicFromList(listId, comicId)
    await loadLists()
    onListsChange?.()

    toast.success("Removed from list", {
      description: `Comic removed from "${listName}"`,
    })
  }

  const regularLists = lists.filter(l => !l.isSmartList)
  const smartLists = lists.filter(l => l.isSmartList)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Lists</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={() => {
              setEditingList(undefined)
              setSmartListDialogOpen(true)
            }}
          >
            <Sparkles className="h-4 w-4" />
            Smart List
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Plus className="h-4 w-4" />
                New List
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New List</DialogTitle>
              <DialogDescription>Organize your comics into custom lists</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">List Name</label>
                <Input
                  placeholder="e.g., Reading, Completed, Favorites"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  placeholder="What's this list for?"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`h-7 w-7 rounded-full transition-all ${
                          selectedColor === color ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icon</label>
                  <Input
                    placeholder="📚"
                    value={newListIcon}
                    onChange={(e) => setNewListIcon(e.target.value)}
                    className="w-16 text-center"
                    maxLength={2}
                  />
                </div>
              </div>
              <Button onClick={handleCreateList} className="w-full" disabled={!newListName.trim()}>
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {lists.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No lists yet. Create your first list to organize your comics.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Regular Lists */}
          {regularLists.length > 0 && (
            <div className="space-y-2">
              {regularLists.map((list) => (
                <Card key={list.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {list.icon ? (
                        <span className="text-lg">{list.icon}</span>
                      ) : (
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{list.name}</p>
                        {list.description ? (
                          <p className="text-xs text-muted-foreground truncate">{list.description}</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">{list.comicIds.length} comics</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {comicId && list.comicIds.includes(comicId) && (
                          <>
                            <DropdownMenuItem onClick={() => handleRemoveFromList(list.id, list.name)}>
                              Remove from list
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDeleteList(list.id, list.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete list
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Smart Lists */}
          {smartLists.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Smart Lists
              </h4>
              {smartLists.map((list) => (
                <Card key={list.id} className="p-3 border-dashed">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {list.icon ? (
                        <span className="text-lg">{list.icon}</span>
                      ) : (
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{list.name}</p>
                          <Sparkles className="h-3 w-3 text-primary" />
                        </div>
                        {list.description && (
                          <p className="text-xs text-muted-foreground truncate">{list.description}</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditSmartList(list)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Rules
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteList(list.id, list.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete list
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Smart List Dialog */}
      <SmartListDialog
        open={smartListDialogOpen}
        onOpenChange={(open) => {
          setSmartListDialogOpen(open)
          if (!open) setEditingList(undefined)
        }}
        onSave={handleCreateSmartList}
        existingList={editingList}
      />
    </div>
  )
}
