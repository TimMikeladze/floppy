"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Github,
  Heart,
  ArrowRight,
  ArrowLeft,
  Code,
  Shield,
  Zap,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"

const values = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "Your data stays on your device. No accounts, no tracking, no analytics. We never see what you read.",
  },
  {
    icon: Code,
    title: "Open Source",
    description: "Every line of code is public. Audit it, fork it, contribute to it. Built in the open, for the community.",
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Fast load times, smooth scrolling, instant navigation. Optimized for the best reading experience.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description: "Features shaped by readers. Bug reports, suggestions, and pull requests always welcome.",
  },
]

export function AboutContent() {
  const [supportOpen, setSupportOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="safe-top safe-x bg-background/80 backdrop-blur-xl" />
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 md:px-8 mx-auto w-full max-w-screen-xl safe-x">
          <div className="flex items-center gap-3">
            <Link href="/library">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <span className="text-sm font-medium">About</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/TimMikeladze/floppy"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="ghost" size="sm" className="gap-2 text-sm">
                <Github className="w-4 h-4" />
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </a>
            <Link href="/library">
              <Button size="sm" className="gap-1.5">
                Library
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
        {/* Hero */}
        <section className="py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
                <div className="w-3.5 h-3.5 bg-background rounded-[2px]" />
              </div>
              <span className="text-xl font-semibold tracking-tight">floppy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
              A comic reader built for readers, not metrics.
            </h1>
            <p className="text-lg text-muted-foreground">
              Floppy started with a simple idea: reading comics on the web should be as good as reading them in print. No ads, no subscriptions, no dark patterns—just you and your comics.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 border-t border-border/40">
          <div className="max-w-2xl">
            <h2 className="text-lg font-medium mb-4">Why we built this</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Most comic apps treat you like a product. They want your email, your reading habits, your payment info. They show you ads, push notifications, and upsells.
              </p>
              <p>
                We wanted something different. An app that respects your time and your privacy. One that works offline, keeps your data local, and never asks you to create an account.
              </p>
              <p>
                Floppy is free, open source, and built by comic readers for comic readers. It always will be.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 border-t border-border/40">
          <h2 className="text-lg font-medium mb-8">What we care about</h2>
          <div className="grid sm:grid-cols-2 gap-8 lg:gap-12">
            {values.map((value) => (
              <div key={value.title}>
                <value.icon className="w-5 h-5 mb-3 text-muted-foreground" />
                <h3 className="font-medium mb-1">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pull List */}
        <section className="py-16 border-t border-border/40">
          <div className="max-w-2xl">
            <h2 className="text-lg font-medium mb-4">Your pull list, simplified</h2>
            <p className="text-muted-foreground mb-6">
              Never miss an issue again. Follow your favorite series and we'll show you when new issues drop. Browse weekly releases to discover new titles. Build your reading queue without the hassle.
            </p>
            <Link href="/releases">
              <Button variant="outline" className="gap-2">
                Browse Releases
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Tech */}
        <section className="py-16 border-t border-border/40">
          <div className="max-w-2xl">
            <h2 className="text-lg font-medium mb-4">Built with modern tech</h2>
            <p className="text-muted-foreground mb-6">
              Floppy is a progressive web app built with Next.js and React. Your library is stored in IndexedDB—right in your browser. Install it on any device, read offline, and sync nothing to the cloud.
            </p>
            <div className="flex flex-wrap gap-2">
              {["Next.js", "React", "TypeScript", "IndexedDB", "PWA"].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 text-sm font-mono border border-border rounded"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-24 border-t border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-xl font-medium mb-2">Join the community</h2>
              <p className="text-sm text-muted-foreground">Star us on GitHub, report bugs, or contribute code.</p>
            </div>
            <div className="flex gap-3">
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button className="gap-2">
                  <Github className="w-4 h-4" />
                  View on GitHub
                </Button>
              </a>
              <Button variant="outline" onClick={() => setSupportOpen(true)} className="gap-2">
                <Heart className="w-4 h-4" />
                Support
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <span>floppy</span>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
              <Link href="/releases" className="hover:text-foreground transition-colors">
                Releases
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
