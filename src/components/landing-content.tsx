"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Github,
  Heart,
  BookOpen,
  FolderOpen,
  Bookmark,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Library,
  Calendar,
  TrendingUp,
  Layers,
  Search,
  Bell,
  LayoutGrid,
  Star,
  Zap,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"
import { FreeComicsSources } from "@/components/free-comics-sources"

const coreFeatures = [
  {
    icon: BookOpen,
    title: "Immersive Reading",
    description: "Fluid page transitions, gesture controls, and adaptive layouts. Single or double-page spreads that feel natural.",
  },
  {
    icon: Calendar,
    title: "Release Tracking",
    description: "Never miss a new issue. Track release dates for your favorite series and discover what's dropping next.",
  },
  {
    icon: Library,
    title: "Smart Library",
    description: "Auto-organize by series, publisher, or reading status. Your collection, perfectly sorted.",
  },
]

const additionalFeatures = [
  {
    icon: Search,
    title: "Instant Search",
    description: "Find any comic in milliseconds by title, series, or issue number",
  },
  {
    icon: Layers,
    title: "Series Grouping",
    description: "Automatically groups issues by series for seamless navigation",
  },
  {
    icon: Bookmark,
    title: "Smart Bookmarks",
    description: "Save progress, mark favorites, and jump back instantly",
  },
  {
    icon: LayoutGrid,
    title: "Custom Collections",
    description: "Create reading lists and organize comics your way",
  },
  {
    icon: TrendingUp,
    title: "Reading Stats",
    description: "Track your reading habits and see your progress over time",
  },
  {
    icon: Bell,
    title: "Stay Updated",
    description: "Browse new releases and trending comics in the community",
  },
]

const formats = ["CBZ", "CBR", "PDF", "EPUB"]

const stats = [
  { value: "4+", label: "File Formats" },
  { value: "100%", label: "Free & Open Source" },
  { value: "0", label: "Accounts Required" },
]

interface LandingContentProps {
  showBackButton?: boolean
  onGetStarted?: () => void
}

export function LandingContent({ showBackButton = false, onGetStarted }: LandingContentProps) {
  const [supportOpen, setSupportOpen] = useState(false)

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted()
    } else {
      window.location.href = "/library"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="safe-top safe-x bg-background/80 backdrop-blur-xl" />
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 md:px-8 mx-auto w-full max-w-screen-xl safe-x">
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <>
                <Link href="/library">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <span className="text-sm font-medium">About</span>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-foreground rounded-sm flex items-center justify-center">
                  <div className="w-3 h-3 bg-background rounded-[2px]" />
                </div>
                <span className="font-semibold tracking-tight">floppy</span>
              </div>
            )}
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
            <Button
              onClick={handleGetStarted}
              size="sm"
              className="gap-1.5"
            >
              {showBackButton ? "Open Library" : "Start Reading"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
        {/* Hero Section */}
        <section className="py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 border border-border text-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-muted-foreground">The comic reader built for collectors</span>
            </div>

            {/* Main headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
              Read, Track, and Discover
              <span className="block text-muted-foreground">Your Comic Universe</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The ultimate comic book reader for serious collectors. Build your library, track new releases, and never miss an issue again.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="w-full sm:w-auto gap-2 text-base px-8"
              >
                {showBackButton ? "Open Library" : "Start Reading Free"}
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 text-base"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                </Button>
              </a>
            </div>

            {/* Quick stats */}
            <div className="flex items-center justify-center gap-8 pt-8 border-t border-border/40 mt-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Everything You Need
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A complete toolkit for comic enthusiasts who want more than just a reader.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {coreFeatures.map((feature) => (
              <div
                key={feature.title}
                className="relative p-6 lg:p-8 rounded-2xl bg-foreground/[0.02] border border-border/50 hover:border-border hover:bg-foreground/[0.04] transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-5 group-hover:bg-foreground/10 transition-colors">
                  <feature.icon className="w-6 h-6 text-foreground/70" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Format Support */}
        <section className="py-16 sm:py-24">
          <div className="rounded-2xl bg-foreground text-background p-8 sm:p-12 lg:p-16">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/10 text-sm mb-6">
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Universal Format Support</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Works With Your Entire Collection
              </h2>
              <p className="text-background/70 mb-8 max-w-xl mx-auto">
                Import comics in any popular format. No conversion needed.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {formats.map((format) => (
                  <div
                    key={format}
                    className="px-6 py-3 rounded-lg bg-background/10 border border-background/20 font-mono font-semibold text-lg"
                  >
                    {format}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Additional Features Grid */}
        <section className="py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              Packed With Features
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Every tool you need to manage and enjoy your comic collection.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {additionalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-4 p-5 rounded-xl hover:bg-foreground/[0.02] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-foreground/5 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-foreground/60" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Free Comics Section */}
        <section className="py-16 sm:py-24">
          <FreeComicsSources variant="full" />
        </section>

        {/* Why Floppy */}
        <section className="py-16 sm:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Built Different
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Floppy is designed from the ground up for comic enthusiasts who demand more.
                No compromises, no subscriptions, no cloud dependencies.
              </p>
              <ul className="space-y-4">
                {[
                  "Works completely offline after first load",
                  "Install as an app on any device",
                  "Your data stays on your device",
                  "Open source and community-driven",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Zap, label: "Lightning Fast", desc: "Instant load times" },
                { icon: Star, label: "Top Rated", desc: "Loved by collectors" },
                { icon: Library, label: "Unlimited", desc: "No size limits" },
                { icon: Heart, label: "Free Forever", desc: "No hidden costs" },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-xl bg-foreground/[0.02] border border-border/50 text-center">
                  <item.icon className="w-6 h-6 mx-auto mb-3 text-foreground/60" />
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className="text-xs text-muted-foreground">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 sm:py-24 pb-24 sm:pb-32">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Ready to Level Up Your Reading?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of comic enthusiasts who've made floppy their go-to reader.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="w-full sm:w-auto gap-2 text-base px-8"
              >
                Open Library
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2"
                onClick={() => setSupportOpen(true)}
              >
                <Heart className="w-4 h-4" />
                Support the Project
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-foreground rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-background rounded-[1px]" />
              </div>
              <span>floppy</span>
            </div>
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
              <button
                onClick={() => setSupportOpen(true)}
                className="hover:text-foreground transition-colors"
              >
                Support
              </button>
            </div>
          </div>
        </div>
      </footer>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
