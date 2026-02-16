"use client";

import {
  AlertCircle,
  FileImage,
  Image,
  Link2,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateCoverImage } from "@/lib/comic-parser";
import { getFileFromHandle, saveComic } from "@/lib/storage";
import type { Comic } from "@/lib/types";

interface CoverManagerProps {
  comic: Comic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCoverChange?: (comic: Comic) => void;
}

export function CoverManager({
  comic,
  open,
  onOpenChange,
  onCoverChange,
}: CoverManagerProps) {
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [extractPage, setExtractPage] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCover = !!comic.coverImage;
  const hasFile = comic.hasFile && comic.fileHandle;
  const _isRemote = comic.sourceType === "remote";

  // Handle file upload for cover image
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      setLoading(true);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          setPreviewUrl(base64);

          const updatedComic: Comic = {
            ...comic,
            coverImage: base64,
          };
          await saveComic(updatedComic);
          onCoverChange?.(updatedComic);
          toast.success("Cover updated");
          onOpenChange(false);
        };
        reader.onerror = () => {
          toast.error("Failed to read image file");
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error("Failed to upload cover:", error);
        toast.error("Failed to upload cover");
      } finally {
        setLoading(false);
      }
    },
    [comic, onCoverChange, onOpenChange],
  );

  // Handle URL-based cover
  const handleUrlCover = useCallback(async () => {
    if (!coverUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      // Fetch the image to convert to base64 (so it works offline)
      const response = await fetch(coverUrl);
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        toast.error("URL does not point to an image");
        return;
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;

        const updatedComic: Comic = {
          ...comic,
          coverImage: base64,
        };
        await saveComic(updatedComic);
        onCoverChange?.(updatedComic);
        toast.success("Cover updated from URL");
        setCoverUrl("");
        onOpenChange(false);
      };
      reader.onerror = () => {
        toast.error("Failed to process image");
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to fetch cover from URL:", error);
      toast.error("Failed to fetch image from URL");
    } finally {
      setLoading(false);
    }
  }, [coverUrl, comic, onCoverChange, onOpenChange]);

  // Extract cover from comic file
  const handleExtractFromFile = useCallback(async () => {
    if (!comic.fileHandle) {
      toast.error("No file attached to this comic");
      return;
    }

    setLoading(true);
    try {
      const file = await getFileFromHandle(comic.fileHandle);
      if (!file) {
        toast.error("Unable to access file. Please re-attach it.");
        return;
      }

      const { parseComicFile } = await import("@/lib/comic-parser");
      const result = await parseComicFile(file);

      const pageIndex = Math.min(extractPage - 1, result.pages.length - 1);
      if (pageIndex < 0) {
        toast.error("Invalid page number");
        return;
      }

      const coverImage = await generateCoverImage(result.pages[pageIndex]);

      const updatedComic: Comic = {
        ...comic,
        coverImage,
        totalPages: result.pages.length,
      };
      await saveComic(updatedComic);
      onCoverChange?.(updatedComic);
      toast.success(`Cover extracted from page ${pageIndex + 1}`);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to extract cover:", error);
      toast.error("Failed to extract cover from file");
    } finally {
      setLoading(false);
    }
  }, [comic, extractPage, onCoverChange, onOpenChange]);

  // Remove cover
  const handleRemoveCover = useCallback(async () => {
    setLoading(true);
    try {
      const updatedComic: Comic = {
        ...comic,
        coverImage: "",
      };
      await saveComic(updatedComic);
      onCoverChange?.(updatedComic);
      toast.success("Cover removed");
    } catch (error) {
      console.error("Failed to remove cover:", error);
      toast.error("Failed to remove cover");
    } finally {
      setLoading(false);
    }
  }, [comic, onCoverChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Manage Cover
          </DialogTitle>
          <DialogDescription>
            Change or update the cover image for "{comic.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current cover preview */}
          <div className="flex items-start gap-4">
            <div className="w-24 h-36 rounded-lg overflow-hidden bg-secondary border flex-shrink-0">
              {previewUrl || comic.coverImage ? (
                <img
                  src={previewUrl || comic.coverImage}
                  alt="Current cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mb-2" />
                  <span className="text-xs">No cover</span>
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <div className="text-sm font-medium">{comic.title}</div>
              {comic.series && (
                <div className="text-xs text-muted-foreground">
                  {comic.series}
                  {comic.issue && ` #${comic.issue}`}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {hasCover && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveCover}
                    disabled={loading}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Cover source tabs */}
          <Tabs
            defaultValue={hasFile ? "extract" : "upload"}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="gap-1.5">
                <Upload className="h-3.5 w-3.5" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-1.5">
                <Link2 className="h-3.5 w-3.5" />
                URL
              </TabsTrigger>
              <TabsTrigger
                value="extract"
                disabled={!hasFile}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Extract
              </TabsTrigger>
            </TabsList>

            {/* Upload from file */}
            <TabsContent value="upload" className="space-y-4 pt-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
              >
                <FileImage className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload image</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, or WebP
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </TabsContent>

            {/* Load from URL */}
            <TabsContent value="url" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="cover-url">Image URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="cover-url"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="https://example.com/cover.jpg"
                    onKeyDown={(e) => e.key === "Enter" && handleUrlCover()}
                  />
                  <Button
                    onClick={handleUrlCover}
                    disabled={loading || !coverUrl.trim()}
                  >
                    {loading ? "Loading..." : "Load"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The image will be downloaded and stored locally
                </p>
              </div>
            </TabsContent>

            {/* Extract from comic file */}
            <TabsContent value="extract" className="space-y-4 pt-4">
              {hasFile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="extract-page">Page to use as cover</Label>
                    <div className="flex gap-2">
                      <Input
                        id="extract-page"
                        type="number"
                        min={1}
                        max={comic.totalPages || 999}
                        value={extractPage}
                        onChange={(e) =>
                          setExtractPage(parseInt(e.target.value, 10) || 1)
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground self-center">
                        {comic.totalPages ? `of ${comic.totalPages} pages` : ""}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={handleExtractFromFile}
                    disabled={loading}
                    className="w-full gap-2"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    />
                    {loading ? "Extracting..." : "Extract Cover"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    By default, page 1 is used. Choose a different page if
                    needed.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">No file attached to this comic</p>
                  <p className="text-xs mt-1">
                    Attach a file first to extract covers from it
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Small indicator component for comics missing covers
 */
export function MissingCoverIndicator({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-2 left-2 bg-yellow-500/90 text-yellow-950 rounded-full p-1 hover:bg-yellow-400 transition-colors"
      title="Missing cover - click to add"
    >
      <AlertCircle className="h-3.5 w-3.5" />
    </button>
  );
}
