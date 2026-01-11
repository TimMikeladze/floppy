"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Github, Heart, BookOpen, Cloud, FolderOpen, Bookmark, StickyNote, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SupportDialog } from "@/components/layout/support-dialog"

const features = [
  {
    icon: BookOpen,
    title: "Read Comics",
    description: "Beautiful reader with smooth page navigation and zoom controls",
  },
  {
    icon: FolderOpen,
    title: "Local Files",
    description: "Open CBZ, CBR, and PDF files directly from your device",
  },
  {
    icon: Cloud,
    title: "Remote Sources",
    description: "Add comics from URLs and external data sources",
  },
  {
    icon: Bookmark,
    title: "Bookmarks",
    description: "Save your place and mark favorite pages",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description: "Add personal notes to any page",
  },
  {
    icon: Smartphone,
    title: "PWA Support",
    description: "Install as an app on any device",
  },
]

export default function AboutPage() {
  const [supportOpen, setSupportOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="safe-top safe-x bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        <div className="flex items-center h-14 px-4 sm:px-6 md:px-8 gap-3 mx-auto w-full max-w-screen-2xl safe-x">
          <Link href="/">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-semibold">About</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-md px-4 sm:px-6 md:px-8 py-8 space-y-8 pb-24">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Logo */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-primary/40" />
          </div>

          {/* Branding */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">floppy</h2>
            <p className="text-lg text-muted-foreground">
              Open-source comic book reader
            </p>
          </div>

          {/* Version */}
          <p className="text-sm text-muted-foreground">Version 0.1.0</p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="https://github.com/TimMikeladze/floppy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="gap-2">
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </a>
            <Button variant="outline" className="gap-2" onClick={() => setSupportOpen(true)}>
              <Heart className="w-4 h-4" />
              Support
            </Button>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center space-y-2 py-4">
          <p className="text-muted-foreground max-w-md mx-auto">
            A modern, privacy-focused comic reader that runs entirely in your browser.
            Your comics stay on your device.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="text-center space-y-3 pt-4">
          <h3 className="text-lg font-semibold">Built With</h3>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {["Next.js", "React", "TypeScript", "Tailwind CSS", "IndexedDB"].map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 text-xs rounded-full bg-secondary text-secondary-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            Made with care for comic enthusiasts everywhere
          </p>
        </div>
      </main>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
