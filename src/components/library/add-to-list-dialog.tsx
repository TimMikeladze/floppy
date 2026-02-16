"use client";

import { Check, FolderPlus } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  addComicToList,
  getAllLists,
  removeComicFromList,
} from "@/lib/storage";
import type { ComicList } from "@/lib/types";

interface AddToListDialogProps {
  comicId: string;
  comicTitle?: string;
  trigger?: React.ReactNode;
  // Controlled mode props
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Bulk mode props
  bulkComicIds?: string[];
  onSuccess?: () => void;
}

export function AddToListDialog({
  comicId,
  comicTitle,
  trigger,
  open: controlledOpen,
  onOpenChange,
  bulkComicIds,
  onSuccess,
}: AddToListDialogProps) {
  const [lists, setLists] = useState<ComicList[]>([]);
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen;

  const isBulkMode = bulkComicIds && bulkComicIds.length > 1;
  const comicIds = bulkComicIds || [comicId];

  // biome-ignore lint/correctness/useExhaustiveDependencies: loadLists is stable
  useEffect(() => {
    if (open) {
      loadLists();
    }
  }, [open]);

  async function loadLists() {
    const allLists = await getAllLists();
    setLists(allLists);
  }

  async function handleToggleList(list: ComicList) {
    if (isBulkMode) {
      // Bulk mode: add all comics to list
      for (const id of comicIds) {
        if (!list.comicIds.includes(id)) {
          await addComicToList(list.id, id);
        }
      }
      toast.success("Added to list", {
        description: `Added ${comicIds.length} comics to "${list.name}"`,
      });
      onSuccess?.();
      setOpen(false);
    } else {
      // Single mode: toggle
      const isInList = list.comicIds.includes(comicId);
      if (isInList) {
        await removeComicFromList(list.id, comicId);
        toast.success("Removed from list", {
          description: `Removed from "${list.name}"`,
        });
      } else {
        await addComicToList(list.id, comicId);
        toast.success("Added to list", {
          description: `Added to "${list.name}"`,
        });
      }
      onSuccess?.();
      await loadLists();
    }
  }

  const dialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add to List</DialogTitle>
        <DialogDescription className="text-balance">
          {isBulkMode
            ? `Add ${comicIds.length} comics to a list`
            : comicTitle || "Select a list"}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2 pt-4">
        {lists.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No lists available. Create lists from the library to organize your
              comics.
            </p>
          </Card>
        ) : (
          lists.map((list) => {
            const isInList = !isBulkMode && list.comicIds.includes(comicId);
            return (
              <Button
                key={list.id}
                variant={isInList ? "secondary" : "outline"}
                className="w-full justify-start gap-3"
                onClick={() => handleToggleList(list)}
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: list.color }}
                />
                <span className="flex-1 text-left">{list.name}</span>
                {isInList && <Check className="h-4 w-4" />}
              </Button>
            );
          })
        )}
      </div>
    </DialogContent>
  );

  // Controlled mode: no trigger needed
  if (isControlled) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {dialogContent}
      </Dialog>
    );
  }

  // Uncontrolled mode: with trigger
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
      {dialogContent}
    </Dialog>
  );
}
