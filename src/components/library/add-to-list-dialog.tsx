"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { getAllLists, addComicToList, removeComicFromList } from "@/lib/storage"
import type { ComicList } from "@/lib/types"
import { FolderPlus, Check } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

interface AddToListDialogProps {
  comicId: string
  comicTitle: string
  trigger?: React.ReactNode
}

export function AddToListDialog({ comicId, comicTitle, trigger }: AddToListDialogProps) {
  const [lists, setLists] = useState<ComicList[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      loadLists()
    }
  }, [open])

  async function loadLists() {
    const allLists = await getAllLists()
    setLists(allLists)
  }

  async function handleToggleList(list: ComicList) {
    const isInList = list.comicIds.includes(comicId)

    if (isInList) {
      await removeComicFromList(list.id, comicId)
      toast.success("Removed from list", {
        description: `Removed from "${list.name}"`,
      })
    } else {
      await addComicToList(list.id, comicId)
      toast.success("Added to list", {
        description: `Added to "${list.name}"`,
      })
    }

    await loadLists()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2 bg-transparent">
            <FolderPlus className="h-4 w-4" />
            Add to List
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to List</DialogTitle>
          <DialogDescription className="text-balance">{comicTitle}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 pt-4">
          {lists.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No lists available. Create lists from the library to organize your comics.
              </p>
            </Card>
          ) : (
            lists.map((list) => {
              const isInList = list.comicIds.includes(comicId)
              return (
                <Button
                  key={list.id}
                  variant={isInList ? "secondary" : "outline"}
                  className="w-full justify-start gap-3"
                  onClick={() => handleToggleList(list)}
                >
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: list.color }} />
                  <span className="flex-1 text-left">{list.name}</span>
                  {isInList && <Check className="h-4 w-4" />}
                </Button>
              )
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
