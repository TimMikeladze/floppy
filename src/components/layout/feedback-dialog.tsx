"use client";

import { Github, Mail } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FEEDBACK_EMAIL = "tim.mikeladze@gmail.com";

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">
            have feedback, a bug report, or a feature request? here are two ways
            to get in touch:
          </p>

          {/* 1. Open a GitHub issue */}
          <a
            href="https://github.com/TimMikeladze/floppy/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <Github className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">open a github issue</div>
                <div className="text-xs text-muted-foreground">
                  report bugs or request features
                </div>
              </div>
            </div>
          </a>

          {/* 2. Send an email */}
          <a
            href={`mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("floppy feedback")}`}
            className="block p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">send an email</div>
                <div className="text-xs text-muted-foreground break-all">
                  {FEEDBACK_EMAIL}
                </div>
              </div>
            </div>
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
}
