"use client";

import { formatDistanceToNow } from "date-fns";
import {
  BookOpen,
  Clock,
  FileText,
  FolderPlus,
  Play,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Comic } from "@/lib/types";
import { AddToListDialog } from "./add-to-list-dialog";
import { AttachFileDialog } from "./attach-file-dialog";

interface ComicDetailSheetProps {
  comic: Comic | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate?: () => void;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const progress = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-foreground rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Page {current} of {total}
      </p>
    </div>
  );
}

export function ComicDetailSheet({
  comic,
  open,
  onOpenChange,
  onDelete,
  onUpdate,
}: ComicDetailSheetProps) {
  const [attachDialogOpen, setAttachDialogOpen] = useState(false);

  if (!comic) return null;

  const hasProgress = comic.currentPage > 0 && comic.totalPages;

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this comic?")) {
      onDelete(comic.id);
      onOpenChange(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
          <ScrollArea className="flex-1">
            <div className="p-6">
              <DialogHeader className="text-left pb-4">
                <DialogTitle className="sr-only">{comic.title}</DialogTitle>
              </DialogHeader>

              {/* Hero section */}
              <div className="flex gap-5 mb-6">
                {/* Cover */}
                <div className="w-28 shrink-0">
                  <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-lg">
                    <img
                      src={comic.coverImage || "/placeholder.svg"}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-1">
                  <h2 className="text-xl font-semibold leading-tight mb-1.5">
                    {comic.title}
                  </h2>

                  {comic.series && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {comic.series}
                      {comic.issue && ` #${comic.issue}`}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mb-3">
                    {comic.hasFile ? (
                      <Badge variant="secondary" className="gap-1">
                        <FileText className="w-3 h-3" />
                        {comic.totalPages} pages
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 text-muted-foreground"
                      >
                        <BookOpen className="w-3 h-3" />
                        No file
                      </Badge>
                    )}
                  </div>

                  {comic.lastRead && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(comic.lastRead), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Progress */}
              {hasProgress && (
                <>
                  <ProgressBar
                    current={comic.currentPage}
                    total={comic.totalPages!}
                  />
                  <Separator className="my-6" />
                </>
              )}

              {/* Primary Action */}
              {comic.hasFile ? (
                <Link href={`/reader/${comic.id}`} className="block mb-4">
                  <Button size="lg" className="w-full gap-2 h-12">
                    <Play className="w-5 h-5" />
                    {hasProgress ? "Continue Reading" : "Start Reading"}
                  </Button>
                </Link>
              ) : (
                <Button
                  size="lg"
                  className="w-full gap-2 h-12 mb-4"
                  onClick={() => setAttachDialogOpen(true)}
                >
                  <Upload className="w-5 h-5" />
                  Attach File
                </Button>
              )}

              {/* Secondary Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <AddToListDialog
                  comicId={comic.id}
                  comicTitle={comic.title}
                  trigger={
                    <Button variant="outline" className="gap-2">
                      <FolderPlus className="w-4 h-4" />
                      Add to List
                    </Button>
                  }
                />
                <Button
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>

              {/* Additional Info */}
              {(comic.author || comic.publisher || comic.releaseDate) && (
                <>
                  <Separator className="mb-6" />
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Details</h3>
                    <dl className="space-y-2 text-sm">
                      {comic.author && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Author</dt>
                          <dd>{comic.author}</dd>
                        </div>
                      )}
                      {comic.publisher && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Publisher</dt>
                          <dd>{comic.publisher}</dd>
                        </div>
                      )}
                      {comic.releaseDate && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">
                            Release Date
                          </dt>
                          <dd>{comic.releaseDate}</dd>
                        </div>
                      )}
                      {comic.fileSize && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">File Size</dt>
                          <dd>
                            {(comic.fileSize / 1024 / 1024).toFixed(1)} MB
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AttachFileDialog
        comicId={comic.id}
        open={attachDialogOpen}
        onOpenChange={setAttachDialogOpen}
        onFileAttached={() => {
          onUpdate?.();
        }}
      />
    </>
  );
}
