"use client"

import { useState, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Upload, Copy, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface ReleasesImportExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: () => Promise<string>
  onImport: (yamlText: string) => Promise<void>
}

export function ReleasesImportExportDialog({
  open,
  onOpenChange,
  onExport,
  onImport,
}: ReleasesImportExportDialogProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export")
  const [exportedYaml, setExportedYaml] = useState("")
  const [importYaml, setImportYaml] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const yaml = await onExport()
      setExportedYaml(yaml)
    } catch {
      toast.error("Failed to export data")
    } finally {
      setIsExporting(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedYaml)
      setCopied(true)
      toast.success("Copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleDownload = () => {
    const blob = new Blob([exportedYaml], { type: "text/yaml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `releases-export-${new Date().toISOString().split("T")[0]}.yaml`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("File downloaded")
  }

  const handleImport = async () => {
    if (!importYaml.trim()) {
      setImportError("Please paste YAML content or select a file")
      return
    }

    setIsImporting(true)
    setImportError(null)

    try {
      await onImport(importYaml)
      toast.success("Data imported successfully")
      setImportYaml("")
      onOpenChange(false)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to import data")
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      setImportYaml(text)
      setImportError(null)
    } catch {
      setImportError("Failed to read file")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export Releases</DialogTitle>
          <DialogDescription>
            Export your custom releases and modifications as YAML, or import from a file.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "export" | "import")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            {!exportedYaml ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Export your custom releases and modifications to a YAML file.
                </p>
                <Button onClick={handleExport} disabled={isExporting}>
                  {isExporting ? "Exporting..." : "Generate Export"}
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <Label>Exported YAML</Label>
                  <Textarea
                    value={exportedYaml}
                    readOnly
                    rows={12}
                    className="font-mono text-xs mt-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCopy} className="flex-1">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="import" className="space-y-4 mt-4">
            <div>
              <Label>YAML Content</Label>
              <Textarea
                value={importYaml}
                onChange={(e) => {
                  setImportYaml(e.target.value)
                  setImportError(null)
                }}
                placeholder="Paste your YAML content here, or select a file below..."
                rows={12}
                className="font-mono text-xs mt-2"
              />
            </div>

            {importError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {importError}
              </div>
            )}

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".yaml,.yml"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
              <Button onClick={handleImport} disabled={isImporting} className="flex-1">
                {isImporting ? "Importing..." : "Import Data"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
