"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Github, Heart, BookOpen, Cloud, FolderOpen, Bookmark, StickyNote, Smartphone, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"

const features = [
  {
    icon: BookOpen,
    title: "Read Comics",
    description: "Beautiful reader with smooth page navigation and zoom controls",
    panel: "01",
  },
  {
    icon: FolderOpen,
    title: "Local Files",
    description: "Open CBZ, CBR, and PDF files directly from your device",
    panel: "02",
  },
  {
    icon: Cloud,
    title: "Remote Sources",
    description: "Add comics from URLs and external data sources",
    panel: "03",
  },
  {
    icon: Bookmark,
    title: "Bookmarks",
    description: "Save your place and mark favorite pages",
    panel: "04",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description: "Add personal notes to any page",
    panel: "05",
  },
  {
    icon: Smartphone,
    title: "PWA Support",
    description: "Install as an app on any device",
    panel: "06",
  },
]

const techStack = ["Next.js", "React", "TypeScript", "Tailwind", "IndexedDB"]

export default function AboutPage() {
  const [supportOpen, setSupportOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b-2 border-foreground/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="safe-top safe-x bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />
        <div className="flex items-center h-14 px-4 sm:px-6 md:px-8 gap-3 mx-auto w-full max-w-screen-2xl safe-x">
          <Link href="/library">
            <Button variant="ghost" size="icon" className="h-9 w-9 border border-border hover:border-foreground/30 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-sm font-medium tracking-widest uppercase">About</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-lg px-4 sm:px-6 md:px-8 py-12 pb-32 relative">

        {/* Hero Section - Asymmetric Layout */}
        <section className="relative mb-20">
          {/* Large background text */}
          <div className="absolute -top-8 -left-4 text-[12rem] sm:text-[16rem] font-bold leading-none text-foreground/[0.02] select-none pointer-events-none tracking-tighter">
            FL
          </div>

          <div className="relative grid md:grid-cols-[1fr,auto] gap-8 items-end">
            {/* Left: Branding */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Logo mark */}
              <div className="w-16 h-16 border-2 border-foreground flex items-center justify-center relative group">
                <div className="w-6 h-6 bg-foreground transition-transform group-hover:scale-110" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-background border border-foreground" />
              </div>

              <div className="space-y-2">
                <h2 className="text-5xl sm:text-6xl font-bold tracking-tighter">
                  floppy
                </h2>
                <p className="text-lg text-muted-foreground font-medium tracking-wide">
                  Open-source comic reader
                </p>
              </div>

              <p className="text-sm text-muted-foreground max-w-md leading-relaxed border-l-2 border-foreground/20 pl-4">
                A modern, privacy-focused comic reader that runs entirely in your browser.
                Your comics stay on your device — no cloud, no tracking.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="https://github.com/TimMikeladze/floppy"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="gap-2 border-2 hover:bg-foreground hover:text-background transition-all font-medium tracking-wide"
                  >
                    <Github className="w-4 h-4" />
                    GitHub
                  </Button>
                </a>
                <Button
                  variant="outline"
                  className="gap-2 border-2 hover:bg-foreground hover:text-background transition-all font-medium tracking-wide"
                  onClick={() => setSupportOpen(true)}
                >
                  <Heart className="w-4 h-4" />
                  Support
                </Button>
              </div>
            </div>

            {/* Right: Version badge */}
            <div className="animate-in fade-in slide-in-from-right-4 duration-700 delay-150">
              <div className="border-2 border-foreground p-4 bg-background relative">
                <div className="absolute -top-2 left-3 bg-background px-2 text-[10px] tracking-widest uppercase text-muted-foreground">
                  Version
                </div>
                <span className="text-2xl font-bold tracking-tight font-mono">0.1.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features - Comic Panel Grid */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-8">
            <Zap className="w-5 h-5" />
            <h3 className="text-sm font-medium tracking-widest uppercase">Features</h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-foreground/10">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-background p-6 relative group animate-in fade-in slide-in-from-bottom-4 duration-500"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                {/* Panel number */}
                <span className="absolute top-3 right-3 text-[10px] font-mono text-muted-foreground/50 tracking-wider">
                  {feature.panel}
                </span>

                {/* Content */}
                <div className="space-y-3">
                  <div className="w-10 h-10 border border-foreground/20 flex items-center justify-center group-hover:border-foreground/40 group-hover:bg-foreground/5 transition-all">
                    <feature.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <h4 className="font-semibold tracking-tight">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>

                {/* Corner accent on hover */}
                <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack - Inline list */}
        <section className="mb-20 animate-in fade-in duration-700 delay-500">
          <div className="border-2 border-dashed border-foreground/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground shrink-0">
                Built with
              </span>
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech, index) => (
                  <span
                    key={tech}
                    className="px-3 py-1.5 text-xs font-mono border border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 transition-all cursor-default"
                    style={{ animationDelay: `${600 + index * 50}ms` }}
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center animate-in fade-in duration-700 delay-700">
          <div className="inline-flex items-center gap-3 text-xs text-muted-foreground">
            <span className="w-8 h-px bg-border" />
            <span className="tracking-wide">Made for comic enthusiasts</span>
            <span className="w-8 h-px bg-border" />
          </div>
        </footer>
      </main>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
