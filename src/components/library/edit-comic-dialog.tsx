"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveComic } from "@/lib/storage";
import type { Comic } from "@/lib/types";

interface EditComicDialogProps {
  comic: Comic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}

export function EditComicDialog({
  comic,
  open,
  onOpenChange,
  onSave,
}: EditComicDialogProps) {
  const [title, setTitle] = useState(comic.title);
  const [series, setSeries] = useState(comic.series || "");
  const [issue, setIssue] = useState(comic.issue || "");
  const [author, setAuthor] = useState(comic.author || "");
  const [publisher, setPublisher] = useState(comic.publisher || "");
  const [saving, setSaving] = useState(false);

  // Reset form when comic changes or dialog opens
  useEffect(() => {
    if (open) {
      setTitle(comic.title);
      setSeries(comic.series || "");
      setIssue(comic.issue || "");
      setAuthor(comic.author || "");
      setPublisher(comic.publisher || "");
    }
  }, [open, comic]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const updatedComic: Comic = {
        ...comic,
        title: title.trim(),
        series: series.trim() || undefined,
        issue: issue.trim() || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
      };
      await saveComic(updatedComic);
      toast.success("Comic updated");
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error("Failed to save comic:", error);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Comic</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Comic title"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="series">Series</Label>
              <Input
                id="series"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="Series name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="issue">Issue</Label>
              <Input
                id="issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="#1"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="Publisher name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
