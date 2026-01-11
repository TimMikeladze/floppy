"use client"

import { useState } from "react"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, Coffee, Share2, Users, Copy, Check, Info, MessageSquare, Send, Loader2 } from "lucide-react"
import { Twitter, Linkedin, Github } from "lucide-react"
import { submitFeedback } from "@/app/actions/feedback"

interface SupportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportDialog({ open, onOpenChange }: SupportDialogProps) {
  const [shareExpanded, setShareExpanded] = useState(false)
  const [feedbackExpanded, setFeedbackExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareText, setShareText] = useState("Check out floppy - open source comic book reader\nhttps://floppy.sh")
  const [feedbackEmail, setFeedbackEmail] = useState("")
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [feedbackError, setFeedbackError] = useState("")
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleFeedbackSubmit = async () => {
    setFeedbackError("")

    // Client-side validation
    if (!feedbackEmail.trim()) {
      setFeedbackError("Email is required")
      return
    }

    if (!validateEmail(feedbackEmail)) {
      setFeedbackError("Please enter a valid email address")
      return
    }

    if (!feedbackMessage.trim()) {
      setFeedbackError("Message is required")
      return
    }

    setFeedbackLoading(true)

    try {
      const result = await submitFeedback({
        email: feedbackEmail.trim(),
        message: feedbackMessage.trim(),
      })

      if (result.success) {
        setFeedbackSubmitted(true)
        setTimeout(() => {
          setFeedbackSubmitted(false)
          setFeedbackEmail("")
          setFeedbackMessage("")
          setFeedbackExpanded(false)
        }, 2000)
      } else {
        setFeedbackError(result.error || "Failed to submit feedback")
      }
    } catch {
      setFeedbackError("Failed to submit feedback. Please try again.")
    } finally {
      setFeedbackLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-normal">support</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-3">
          <p className="text-xs text-muted-foreground">
            floppy is free and open source. here are some ways you can support it:
          </p>

          {/* Star on GitHub */}
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
                <div className="text-xs text-muted-foreground">help others discover floppy</div>
              </div>
            </div>
          </a>

          {/* Sponsor */}
          <a
            href="#"
            className="block p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <Coffee className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">sponsor</div>
                <div className="text-xs text-muted-foreground">support ongoing development</div>
              </div>
            </div>
          </a>

          {/* Share us - Expandable */}
          <div className="rounded-lg border border-border/50">
            <button
              onClick={() => setShareExpanded(!shareExpanded)}
              className="w-full p-3 flex items-start justify-between hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <Share2 className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-sm font-medium">share us</div>
                  <div className="text-xs text-muted-foreground">spread the word on social media</div>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${shareExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    aria-label="Copy share text"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
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
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 3c-2.444 0-4.5 2.056-4.5 4.5 0 1.445.682 2.73 1.745 3.55C7.945 12.07 6.5 13.89 6.5 16c0 2.444 2.056 4.5 4.5 4.5s4.5-2.056 4.5-4.5c0-2.11-1.445-3.93-2.745-5.05C13.818 10.23 14.5 8.945 14.5 7.5 14.5 5.056 12.444 3 12 3z" />
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

          {/* Follow the developer */}
          <div className="p-3 rounded-lg border border-border/50">
            <div className="flex items-start gap-2.5 mb-3">
              <Users className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">follow the developer</div>
                <div className="text-xs text-muted-foreground">stay updated on new features</div>
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
                href="https://bsky.app/profile/linesofcode"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 3c-2.444 0-4.5 2.056-4.5 4.5 0 1.445.682 2.73 1.745 3.55C7.945 12.07 6.5 13.89 6.5 16c0 2.444 2.056 4.5 4.5 4.5s4.5-2.056 4.5-4.5c0-2.11-1.445-3.93-2.745-5.05C13.818 10.23 14.5 8.945 14.5 7.5 14.5 5.056 12.444 3 12 3z" />
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

          {/* Feedback - Expandable */}
          <div className="rounded-lg border border-border/50">
            <button
              onClick={() => setFeedbackExpanded(!feedbackExpanded)}
              className="w-full p-3 flex items-start justify-between hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 mt-0.5 text-muted-foreground" />
                <div className="text-left">
                  <div className="text-sm font-medium">send feedback</div>
                  <div className="text-xs text-muted-foreground">share your thoughts or report issues</div>
                </div>
              </div>
              <svg
                className={`w-4 h-4 text-muted-foreground transition-transform ${feedbackExpanded ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {feedbackExpanded && (
              <div className="px-3 pb-3 space-y-3 border-t border-border/50">
                {feedbackSubmitted ? (
                  <div className="mt-3 p-3 rounded bg-green-500/10 border border-green-500/30 text-center">
                    <Check className="w-5 h-5 text-green-500 mx-auto mb-1" />
                    <div className="text-sm text-green-600 dark:text-green-400">Thanks for your feedback!</div>
                  </div>
                ) : (
                  <>
                    <div className="mt-3 space-y-2">
                      <input
                        type="email"
                        value={feedbackEmail}
                        onChange={(e) => {
                          setFeedbackEmail(e.target.value)
                          setFeedbackError("")
                        }}
                        placeholder="your email"
                        className="w-full px-3 py-2 text-sm bg-accent/10 border border-border/30 rounded outline-none focus:border-border transition-colors placeholder:text-muted-foreground/50"
                      />
                      <textarea
                        value={feedbackMessage}
                        onChange={(e) => {
                          setFeedbackMessage(e.target.value)
                          setFeedbackError("")
                        }}
                        placeholder="your message..."
                        className="w-full px-3 py-2 text-sm bg-accent/10 border border-border/30 rounded outline-none focus:border-border transition-colors resize-none min-h-[80px] placeholder:text-muted-foreground/50"
                        rows={3}
                      />
                    </div>
                    {feedbackError && (
                      <p className="text-xs text-destructive">{feedbackError}</p>
                    )}
                    <button
                      onClick={handleFeedbackSubmit}
                      disabled={feedbackLoading}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded border border-border/50 hover:bg-accent/5 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {feedbackLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send Feedback
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* About */}
          <Link
            href="/about"
            onClick={() => onOpenChange(false)}
            className="block p-3 rounded-lg border border-border/50 hover:border-border transition-colors"
          >
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">about</div>
                <div className="text-xs text-muted-foreground">learn more about floppy</div>
              </div>
            </div>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
