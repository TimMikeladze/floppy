"use client";

import {
  AlertCircle,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Link2,
  Upload,
} from "lucide-react";
import type React from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertToStorageFormat, parseCsvDataSource } from "@/lib/csv-parser";
import { saveComic, saveRemotePages, saveSource } from "@/lib/storage";
import type { ComicSource } from "@/lib/types";

interface ImportDataSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: () => void;
}

type ImportStep = "upload" | "preview" | "importing" | "complete";
type UploadMode = "file" | "url";

export function ImportDataSourceDialog({
  open,
  onOpenChange,
  onImportComplete,
}: ImportDataSourceDialogProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [dragActive, setDragActive] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUrl, setCsvUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [parseResult, setParseResult] = useState<ReturnType<
    typeof parseCsvDataSource
  > | null>(null);
  const [importProgress, setImportProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setUploadMode("file");
    setDragActive(false);
    setSourceName("");
    setCsvFile(null);
    setCsvUrl("");
    setUrlLoading(false);
    setParseResult(null);
    setImportProgress(0);
  }, []);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetState();
      }
      onOpenChange(newOpen);
    },
    [onOpenChange, resetState],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }

    setCsvFile(file);
    setSourceName(file.name.replace(/\.csv$/i, ""));

    try {
      const text = await file.text();
      const result = parseCsvDataSource(text);
      setParseResult(result);
      setStep("preview");
    } catch (error) {
      toast.error("Failed to parse CSV file");
      console.error("CSV parse error:", error);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        processFile(file);
      }
    },
    [processFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFile(e.target.files[0]);
      }
    },
    [processFile],
  );

  const handleUrlFetch = useCallback(async () => {
    if (!csvUrl.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    setUrlLoading(true);
    try {
      const response = await fetch(csvUrl, {
        referrerPolicy: "no-referrer",
        credentials: "omit",
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }

      const text = await response.text();
      const result = parseCsvDataSource(text);

      // Extract filename from URL for source name
      const urlPath = new URL(csvUrl).pathname;
      const fileName = urlPath.split("/").pop() || "remote-source";
      setSourceName(fileName.replace(/\.csv$/i, ""));

      setParseResult(result);
      setStep("preview");
    } catch (error) {
      console.error("URL fetch error:", error);
      toast.error("Failed to fetch CSV", {
        description:
          error instanceof Error
            ? error.message
            : "Check the URL and try again",
      });
    } finally {
      setUrlLoading(false);
    }
  }, [csvUrl]);

  const handleImport = useCallback(async () => {
    if (!parseResult || parseResult.issues.length === 0) return;

    setStep("importing");
    const toastId = toast.loading("Importing data source...");

    try {
      // Create source record
      const sourceId = crypto.randomUUID();
      const source: ComicSource = {
        id: sourceId,
        name: sourceName || "Imported Source",
        importedAt: new Date(),
        comicCount: parseResult.issues.length,
        fileName: csvFile?.name,
      };

      await saveSource(source);

      // Convert and save comics
      const { comics, remotePages } = convertToStorageFormat(
        parseResult.issues,
        sourceId,
      );

      for (let i = 0; i < comics.length; i++) {
        await saveComic(comics[i]);
        await saveRemotePages(remotePages[i]);
        setImportProgress(Math.round(((i + 1) / comics.length) * 100));
      }

      toast.dismiss(toastId);
      toast.success(`Imported ${comics.length} comics`);
      setStep("complete");
      onImportComplete();
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to import data source");
      console.error("Import error:", error);
      setStep("preview");
    }
  }, [parseResult, sourceName, csvFile, onImportComplete]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Import Data Source
          </DialogTitle>
          <DialogDescription>
            Import comics from a CSV file with series, issues, and page URLs.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInput}
              className="hidden"
            />

            <Tabs
              value={uploadMode}
              onValueChange={(v) => setUploadMode(v as UploadMode)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload File
                </TabsTrigger>
                <TabsTrigger value="url" className="gap-2">
                  <Link2 className="w-4 h-4" />
                  From URL
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file" className="mt-4">
                {/* Drop zone */}
                <div
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet
                    className={`w-12 h-12 mx-auto mb-4 ${
                      dragActive ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <p className="text-sm font-medium">
                    {dragActive
                      ? "Drop CSV file here"
                      : "Drop CSV file or click to browse"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Required: series_title, issue_number, page_number, image_url
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="url" className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-url">CSV URL</Label>
                  <Input
                    id="csv-url"
                    type="url"
                    placeholder="https://example.com/comics.csv"
                    value={csvUrl}
                    onChange={(e) => setCsvUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleUrlFetch();
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL must be CORS-accessible (allow cross-origin requests)
                  </p>
                </div>
                <Button
                  onClick={handleUrlFetch}
                  disabled={urlLoading || !csvUrl.trim()}
                  className="w-full"
                >
                  {urlLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Fetching...
                    </>
                  ) : (
                    "Fetch CSV"
                  )}
                </Button>
              </TabsContent>
            </Tabs>

            {/* Format hint */}
            <div className="text-xs text-muted-foreground space-y-1 p-3 rounded-lg bg-muted/50">
              <p className="font-medium">CSV Format:</p>
              <code className="block text-[10px] font-mono">
                series_title,issue_number,page_number,image_url
              </code>
              <p className="mt-2">
                Optional: cover_url, publisher, release_date, author, tags
              </p>
            </div>
          </div>
        )}

        {step === "preview" && parseResult && (
          <div className="space-y-4">
            {/* Source name input */}
            <div className="space-y-2">
              <Label htmlFor="source-name">Source Name</Label>
              <Input
                id="source-name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder="My Comic Collection"
              />
            </div>

            {/* Preview stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">
                  {parseResult.issues.length}
                </p>
                <p className="text-xs text-muted-foreground">Issues</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold">
                  {parseResult.issues.reduce(
                    (sum, i) => sum + i.pages.length,
                    0,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Pages</p>
              </div>
            </div>

            {/* Series breakdown */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Series:</p>
              <ScrollArea className="h-32 rounded-lg border p-2">
                {Array.from(
                  new Set(parseResult.issues.map((i) => i.seriesTitle)),
                ).map((series) => {
                  const count = parseResult.issues.filter(
                    (i) => i.seriesTitle === series,
                  ).length;
                  return (
                    <div
                      key={series}
                      className="flex justify-between text-sm py-1"
                    >
                      <span className="truncate">{series}</span>
                      <span className="text-muted-foreground">
                        {count} issues
                      </span>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {parseResult.errors.length} warnings
                </p>
                <ScrollArea className="h-20 rounded-lg border border-destructive/50 p-2">
                  {parseResult.errors.map((error, i) => (
                    <p key={i} className="text-xs text-destructive">
                      {error}
                    </p>
                  ))}
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetState} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                className="flex-1"
                disabled={parseResult.issues.length === 0}
              >
                Import {parseResult.issues.length} Comics
              </Button>
            </div>
          </div>
        )}

        {step === "importing" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="font-medium">Importing comics...</p>
              <p className="text-sm text-muted-foreground">{importProgress}%</p>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${importProgress}%` }}
              />
            </div>
          </div>
        )}

        {step === "complete" && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <p className="font-medium">Import Complete!</p>
              <p className="text-sm text-muted-foreground">
                {parseResult?.issues.length} comics added to your library
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
