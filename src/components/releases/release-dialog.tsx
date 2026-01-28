"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ReleaseForm } from "./release-form"
import type { Release, Publisher, Genre, Format } from "@/lib/releases-types"
import type { ReleaseFormData } from "@/lib/releases-schemas"

interface ReleaseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  release?: Release
  publishers: Publisher[]
  genres: Genre[]
  formats: Format[]
  series: { slug: string; name: string }[]
  onSubmit: (data: ReleaseFormData) => Promise<void>
}

export function ReleaseDialog({
  open,
  onOpenChange,
  release,
  publishers,
  genres,
  formats,
  series,
  onSubmit,
}: ReleaseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: ReleaseFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save release:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {release ? "Edit Release" : "Add New Release"}
          </DialogTitle>
        </DialogHeader>
        <ReleaseForm
          release={release}
          publishers={publishers}
          genres={genres}
          formats={formats}
          series={series}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  )
}
