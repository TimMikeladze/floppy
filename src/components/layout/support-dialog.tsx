"use client";

import {
  Check,
  Coffee,
  Copy,
  Github,
  Info,
  Linkedin,
  Share2,
  Star,
  Twitter,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SupportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [shareExpanded, setShareExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState(
    "Check out floppy - the comic book app\nhttps://floppy.sh",
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">support</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">
            floppy is free and open source. here are some ways you can support
            it:
          </p>

          {/* 1. Star on GitHub */}
          <a
            href="https://github.com/TimMikeladze/floppy"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <Star className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">star on github</div>
                <div className="text-xs text-muted-foreground">
                  help others discover floppy
                </div>
              </div>
            </div>
          </a>

          {/* 2. Follow the developer */}
          <div className="p-3 rounded-lg border border-border/50">
            <div className="flex items-start gap-2.5 mb-3">
              <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">follow the developer</div>
                <div className="text-xs text-muted-foreground">
                  stay updated on new features
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
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
                href="https://linkedin.com/in/tim-mikeladze"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </a>
              <a
                href="https://github.com/TimMikeladze"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
              >
                <Github className="w-3.5 h-3.5" />
                GitHub
              </a>
            </div>
          </div>

          {/* 3. Sponsor */}
          <a
            href="https://github.com/sponsors/TimMikeladze"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <Coffee className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">sponsor</div>
                <div className="text-xs text-muted-foreground">
                  support ongoing development
                </div>
              </div>
            </div>
          </a>

          {/* 4. Share us - Expandable */}
          <div className="rounded-lg border border-border/50">
            <button
              type="button"
              onClick={() => setShareExpanded(!shareExpanded)}
              className="w-full p-3 flex items-start justify-between hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <Share2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-sm font-medium">share us</div>
                  <div className="text-xs text-muted-foreground">
                    spread the word on social media
                  </div>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${shareExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {shareExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/50">
                {/* Editable share text */}
                <div className="mt-3 p-2.5 rounded bg-accent/10 border border-border/30 flex items-start justify-between gap-2">
                  <textarea
                    value={shareText}
                    onChange={(e) => setShareText(e.target.value)}
                    className="text-xs text-muted-foreground font-mono flex-1 bg-transparent border-none outline-none resize-none min-h-[2.5rem]"
                    rows={2}
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label="Copy share text"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Social media buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <a
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    Twitter
                  </a>
                  <a
                    href={`https://bsky.app/intent/compose?text=${encodeURIComponent(shareText)}`}
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
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=https://floppy.sh&summary=${encodeURIComponent(shareText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* 5. About */}
          <Link
            href="/"
            onClick={() => onOpenChange(false)}
            className="block p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">about</div>
                <div className="text-xs text-muted-foreground">
                  learn more about the project
                </div>
              </div>
            </div>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
