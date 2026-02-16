"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveComic } from "@/lib/storage";
import type { Comic } from "@/lib/types";

interface AddComicDialogProps {
  onComicAdded: () => void;
}

interface AddComicDialogControlledProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComicAdded: () => void;
}

// Controlled version for external state management
export function AddComicDialogControlled({
  open,
  onOpenChange,
  onComicAdded,
}: AddComicDialogControlledProps) {
  const [title, setTitle] = useState("");
  const [series, setSeries] = useState("");
  const [issue, setIssue] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const comic: Comic = {
        id: crypto.randomUUID(),
        title: title.trim(),
        series: series.trim() || undefined,
        issue: issue.trim() || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        releaseDate: releaseDate.trim() || undefined,
        coverImage:
          coverUrl.trim() ||
          `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(title)}`,
        totalPages: null,
        currentPage: 0,
        hasFile: false,
        sourceType: "local",
        addedAt: new Date(),
      };

      await saveComic(comic);
      onComicAdded();

      // Reset form
      setTitle("");
      setSeries("");
      setIssue("");
      setAuthor("");
      setPublisher("");
      setReleaseDate("");
      setCoverUrl("");
      onOpenChange(false);
    } catch (error) {
      console.error("[v0] Error adding comic:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form on close
      setTitle("");
      setSeries("");
      setIssue("");
      setAuthor("");
      setPublisher("");
      setReleaseDate("");
      setCoverUrl("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Comic to Library</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title-controlled">Title *</Label>
            <Input
              id="title-controlled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter comic title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="series-controlled">Series</Label>
              <Input
                id="series-controlled"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="e.g., Batman"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue-controlled">Issue #</Label>
              <Input
                id="issue-controlled"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g., 1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author-controlled">Author</Label>
            <Input
              id="author-controlled"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher-controlled">Publisher</Label>
            <Input
              id="publisher-controlled"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="e.g., Marvel, DC Comics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseDate-controlled">Release Date</Label>
            <Input
              id="releaseDate-controlled"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="e.g., 2024 or January 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverUrl-controlled">Cover Image URL</Label>
            <Textarea
              id="coverUrl-controlled"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Enter cover image URL (optional)"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use a placeholder image
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Adding..." : "Add Comic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Uncontrolled version with its own trigger button
export function AddComicDialog({ onComicAdded }: AddComicDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [series, setSeries] = useState("");
  const [issue, setIssue] = useState("");
  const [author, setAuthor] = useState("");
  const [publisher, setPublisher] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const comic: Comic = {
        id: crypto.randomUUID(),
        title: title.trim(),
        series: series.trim() || undefined,
        issue: issue.trim() || undefined,
        author: author.trim() || undefined,
        publisher: publisher.trim() || undefined,
        releaseDate: releaseDate.trim() || undefined,
        coverImage:
          coverUrl.trim() ||
          `/placeholder.svg?height=400&width=300&query=${encodeURIComponent(title)}`,
        totalPages: null,
        currentPage: 0,
        hasFile: false,
        sourceType: "local",
        addedAt: new Date(),
      };

      await saveComic(comic);
      onComicAdded();

      // Reset form
      setTitle("");
      setSeries("");
      setIssue("");
      setAuthor("");
      setPublisher("");
      setReleaseDate("");
      setCoverUrl("");
      setOpen(false);
    } catch (error) {
      console.error("[v0] Error adding comic:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="gap-2 bg-transparent"
        >
          <Plus className="h-4 w-4" />
          Add Comic
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Comic to Library</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter comic title"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="series">Series</Label>
              <Input
                id="series"
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="e.g., Batman"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issue">Issue #</Label>
              <Input
                id="issue"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="e.g., 1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Enter author name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="publisher">Publisher</Label>
            <Input
              id="publisher"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              placeholder="e.g., Marvel, DC Comics"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="releaseDate">Release Date</Label>
            <Input
              id="releaseDate"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              placeholder="e.g., 2024 or January 2024"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverUrl">Cover Image URL</Label>
            <Textarea
              id="coverUrl"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="Enter cover image URL (optional)"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use a placeholder image
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Adding..." : "Add Comic"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
