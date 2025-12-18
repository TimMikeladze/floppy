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
import { Plus, Trash2, MoreVertical } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const PRESET_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

interface ListManagerProps {
  comicId?: string
  onListsChange?: () => void
}

export function ListManager({ comicId, onListsChange }: ListManagerProps) {
  const [lists, setLists] = useState<ComicList[]>([])
  const [newListName, setNewListName] = useState("")
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0])
  const [dialogOpen, setDialogOpen] = useState(false)

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
      color: selectedColor,
      createdAt: new Date(),
      comicIds: comicId ? [comicId] : [],
    }

    await saveList(newList)
    setNewListName("")
    setSelectedColor(PRESET_COLORS[0])
    setDialogOpen(false)
    await loadLists()
    onListsChange?.()

    toast.success("List created", {
      description: `"${newList.name}" has been created`,
    })
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

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Lists</h3>
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
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`h-8 w-8 rounded-full transition-all ${
                        selectedColor === color ? "ring-2 ring-offset-2 ring-offset-background ring-foreground" : ""
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateList} className="w-full" disabled={!newListName.trim()}>
                Create List
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {lists.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="text-sm text-muted-foreground">No lists yet. Create your first list to organize your comics.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <Card key={list.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
                  <div>
                    <p className="text-sm font-medium">{list.name}</p>
                    <p className="text-xs text-muted-foreground">{list.comicIds.length} comics</p>
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
                      <DropdownMenuItem onClick={() => handleRemoveFromList(list.id, list.name)}>
                        Remove from list
                      </DropdownMenuItem>
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
    </div>
  )
}
