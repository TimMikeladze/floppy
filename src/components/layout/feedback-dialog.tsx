"use client";

import { Github, Mail, Twitter } from "lucide-react";
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

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">feedback</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">
            have feedback, a bug report, or a feature request? here are some
            ways to get in touch:
          </p>

          {/* 1. Open a GitHub issue */}
          <a
            href="https://github.com/TimMikeladze/floppy/issues"
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

          {/* 2. Contact on social media */}
          <div className="p-3 rounded-lg border border-border/50">
            <div className="flex items-start gap-2.5 mb-3">
              <Mail className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">get in touch</div>
                <div className="text-xs text-muted-foreground">
                  reach out on social media or send an email
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <a
                href="https://twitter.com/linesofcode"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
              >
                <Twitter className="w-3.5 h-3.5" />
                Twitter
              </a>
              <a
                href="https://bsky.app/profile/linesofcode.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 568 501"
                  fill="currentColor"
                >
                  <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z" />
                </svg>
                Bluesky
              </a>
              <a
                href="mailto:tim.mikeladze@gmail.com"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
