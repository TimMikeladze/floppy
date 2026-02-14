"use client"

import { useState, useEffect, useRef, ReactNode } from "react"
import {
  Github,
  Heart,
  BookOpen,
  Library,
  ArrowRight,
  Code,
  Shield,
  Zap,
  Users,
  Smartphone,
  WifiOff,
  Layers,
  Hand,
  Bookmark,
  Search,
  FolderOpen,
  Bell,
  Download,
  Monitor,
  Tablet,
  ChevronDown,
  Twitter,
  Star,
  MousePointer,
  Upload,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { SupportDialog } from "@/components/layout/support-dialog"

// Scroll animation component using Intersection Observer
function ScrollAnimatedSection({
  children,
  className = "",
  animation = "fade-in-up",
}: {
  children: ReactNode
  className?: string
  animation?: "fade-in" | "fade-in-up" | "fade-in-down"
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  const animationClasses = {
    "fade-in": isVisible ? "animate-fade-in" : "opacity-0",
    "fade-in-up": isVisible ? "animate-fade-in-up" : "opacity-0 translate-y-4",
    "fade-in-down": isVisible ? "animate-fade-in-down" : "opacity-0 -translate-y-4",
  }

  return (
    <div
      ref={ref}
      className={`${animationClasses[animation]} transition-all duration-700 ease-out ${className}`}
    >
      {children}
    </div>
  )
}

const features = [
  {
    icon: BookOpen,
    title: "Beautiful Reader",
    description: "Single or double-page layouts with gesture controls",
  },
  {
    icon: Layers,
    title: "Multiple Formats",
    description: "CBZ, CBR, PDF, and EPUB—all in one app",
  },
  {
    icon: Library,
    title: "Your Collection",
    description: "Filter, organize, pick up where you left off",
  },
]

const readerFeatures = [
  {
    icon: Hand,
    title: "Gesture Controls",
    description: "Swipe to turn pages, pinch to zoom, double-tap to fit. Natural controls that feel right.",
  },
  {
    icon: Layers,
    title: "Reading Modes",
    description: "Single page, double page spread, or continuous scroll. Switch layouts mid-read.",
  },
  {
    icon: Bookmark,
    title: "Bookmarks & Progress",
    description: "Mark pages, add notes, and always pick up exactly where you left off.",
  },
  {
    icon: Search,
    title: "Quick Navigation",
    description: "Jump to any page instantly. Thumbnail previews make finding your spot easy.",
  },
]

const libraryFeatures = [
  {
    icon: FolderOpen,
    title: "Smart Organization",
    description: "Issues automatically group by series. Filter by reading status, publisher, or create custom collections.",
  },
  {
    icon: Bookmark,
    title: "Reading Progress",
    description: "Track where you left off. Pick up any series right where you stopped reading.",
  },
  {
    icon: Download,
    title: "Multiple Sources",
    description: "Drag files from your device, paste URLs, or import from cloud storage. Your comics, your way.",
  },
]

const formats = [
  { name: "CBZ", description: "Comic Book ZIP archives" },
  { name: "CBR", description: "Comic Book RAR archives" },
  { name: "PDF", description: "Portable Document Format" },
  { name: "EPUB", description: "Digital publications" },
]

const values = [
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your data stays on your device. No accounts, no tracking, no analytics.",
  },
  {
    icon: Code,
    title: "Open Source",
    description:
      "Every line of code is public. Audit it, fork it, contribute to it.",
  },
  {
    icon: Zap,
    title: "Performance",
    description:
      "Fast load times, smooth scrolling, instant navigation.",
  },
  {
    icon: Users,
    title: "Community Driven",
    description:
      "Features shaped by readers. Bug reports and pull requests welcome.",
  },
]

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Drop in your comics",
    description: "Drag files from your device, paste a URL, or import from cloud storage. CBZ, CBR, PDF, EPUB—all supported.",
  },
  {
    number: "02",
    icon: Eye,
    title: "Read your way",
    description: "Single page, double spread, or continuous scroll. Swipe, pinch, tap—gesture controls that feel natural.",
  },
  {
    number: "03",
    icon: Library,
    title: "Build your collection",
    description: "Issues auto-organize by series. Follow your favorites, track your progress, never lose your place.",
  },
]

const faqs = [
  {
    q: "Is floppy really free?",
    a: "Yes. Free forever. No ads, no premium tier, no hidden costs. Open source means anyone can verify the code.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. Everything is stored on your device. No login required, no personal data collected.",
  },
  {
    q: "Can I read my comics offline?",
    a: "Yes. Add comics to your library and read anytime, anywhere—even without internet.",
  },
  {
    q: "Does it work on iPad and Android?",
    a: "Yes. Floppy works on any device with a web browser—iPhone, iPad, Android, desktop, laptop. Just open the app.",
  },
  {
    q: "What about manga? Right-to-left support?",
    a: "Full support for right-to-left reading, vertical scrolling, and continuous scroll modes. Perfect for manga and webtoons.",
  },
  {
    q: "How is this different from a PDF reader?",
    a: "Floppy is purpose-built for comics—gesture controls, automatic progress tracking, smart library organization. Not a document viewer with comic support.",
  },
]

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="border border-border overflow-hidden opacity-0 animate-fade-in"
      style={{ animationDelay: `${index * 75}ms`, animationFillMode: "forwards" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-secondary/30 transition-colors"
      >
        <span className="font-medium text-sm sm:text-base pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? "max-h-40" : "max-h-0"}`}>
        <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed">
          {a}
        </p>
      </div>
    </div>
  )
}

interface LandingContentProps {
  onGetStarted?: () => void
}

export function LandingContent({ onGetStarted }: LandingContentProps) {
  const [supportOpen, setSupportOpen] = useState(false)

  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted()
    } else {
      window.location.href = "/library"
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="safe-top safe-x bg-background/80 backdrop-blur-xl" />
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 md:px-8 mx-auto w-full max-w-screen-xl safe-x">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-foreground rounded-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-background rounded-[2px]" />
            </div>
            <span className="font-semibold tracking-tight">floppy</span>
          </div>
          <Button onClick={handleGetStarted} size="sm" className="gap-1.5">
            Open App
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-4 sm:px-6 md:px-8 mx-auto w-full max-w-screen-xl relative overflow-hidden">
          {/* Subtle radial gradient glow */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-[0.03] rounded-full" style={{ background: "radial-gradient(circle, currentColor 0%, transparent 70%)" }} />
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 py-16 sm:py-24 lg:py-32">
            {/* Copy */}
            <ScrollAnimatedSection className="flex flex-col justify-center" animation="fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-full text-xs text-muted-foreground mb-6 w-fit opacity-0 animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>Free &amp; open source — no account required</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                Your comics.
                <br />
                Everywhere.
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-lg">
                The free, open-source comic book app that works offline, respects your privacy, and runs on every device. No sign-up. No tracking. Just reading.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
                <Button onClick={handleGetStarted} size="lg" className="gap-2">
                  Start Reading Free
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground font-mono">
                  CBZ · CBR · PDF · EPUB
                </span>
              </div>
            </ScrollAnimatedSection>

            {/* Comic Book Visual */}
            <ScrollAnimatedSection className="hidden lg:flex items-center justify-center" animation="fade-in">
              <div className="relative w-[340px] h-[440px] animate-float-slow">
                {/* Back comic cover - offset */}
                <div className="absolute top-4 left-8 w-[220px] h-[340px] border-2 border-border/40 bg-secondary/20 rounded-sm transform rotate-6">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-3 left-3 right-3 h-[60%] border border-border/30 bg-secondary/30">
                      {/* Action lines radiating from center */}
                      <div className="absolute inset-0 overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={`back-line-${i}`}
                            className="absolute top-1/2 left-1/2 w-[200%] h-px bg-border/20"
                            style={{ transform: `translate(-50%, -50%) rotate(${i * 22.5}deg)` }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 h-8">
                      <div className="w-3/4 h-2.5 bg-border/20 rounded-sm mb-1.5" />
                      <div className="w-1/2 h-2 bg-border/15 rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* Middle comic cover */}
                <div className="absolute top-2 left-4 w-[220px] h-[340px] border-2 border-border/60 bg-secondary/40 rounded-sm transform rotate-2">
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-3 left-3 right-3 h-[60%] border border-border/40 bg-secondary/50">
                      {/* Halftone dot pattern */}
                      <div className="absolute inset-0 overflow-hidden opacity-30">
                        {[...Array(6)].map((_, row) =>
                          [...Array(5)].map((_, col) => (
                            <div
                              key={`dot-${row}-${col}`}
                              className="absolute w-2 h-2 rounded-full bg-border/40"
                              style={{
                                top: `${15 + row * 16}%`,
                                left: `${10 + col * 20}%`,
                                transform: `scale(${0.5 + Math.random() * 0.8})`,
                              }}
                            />
                          ))
                        )}
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 h-8">
                      <div className="w-2/3 h-2.5 bg-border/30 rounded-sm mb-1.5" />
                      <div className="w-2/5 h-2 bg-border/20 rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* Front comic cover - main focus */}
                <div className="absolute top-0 left-0 w-[220px] h-[340px] border-2 border-border bg-background rounded-sm transform -rotate-2 shadow-2xl">
                  {/* Cover art area */}
                  <div className="absolute top-0 left-0 right-0 h-[70%] border-b border-border overflow-hidden">
                    {/* Diagonal speed lines */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={`speed-${i}`}
                          className="absolute w-px bg-border/30"
                          style={{
                            height: "200%",
                            top: "-50%",
                            left: `${5 + i * 8}%`,
                            transform: "rotate(-25deg)",
                          }}
                        />
                      ))}
                    </div>
                    {/* Central figure silhouette */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[55%] h-[75%]">
                      <div className="w-full h-full bg-secondary/60 rounded-t-full" />
                    </div>
                    {/* Speech bubble */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 border border-border bg-background rounded-full">
                      <div className="w-8 h-1.5 bg-border/40 rounded-sm" />
                    </div>
                    {/* Issue number badge */}
                    <div className="absolute top-3 left-3 w-7 h-7 border border-border bg-background flex items-center justify-center">
                      <span className="text-[9px] font-mono font-bold text-muted-foreground">#1</span>
                    </div>
                  </div>
                  {/* Title block */}
                  <div className="absolute bottom-0 left-0 right-0 h-[30%] p-3 flex flex-col justify-center">
                    <div className="w-3/4 h-3.5 bg-foreground/80 rounded-sm mb-2" />
                    <div className="w-1/2 h-2 bg-muted-foreground/30 rounded-sm mb-3" />
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full bg-muted-foreground/20" />
                      <div className="w-16 h-1.5 bg-muted-foreground/20 rounded-sm" />
                    </div>
                  </div>
                  {/* Spine edge highlight */}
                  <div className="absolute top-0 left-0 bottom-0 w-px bg-foreground/10" />
                </div>

                {/* Comic page panels peeking out from behind */}
                <div className="absolute right-0 top-8 w-[160px] h-[280px] border border-border/50 bg-background/80 rounded-sm transform rotate-1 -z-10">
                  {/* Panel layout - comic page */}
                  <div className="absolute inset-2 grid grid-cols-2 grid-rows-3 gap-1">
                    <div className="col-span-2 border border-border/30 bg-secondary/20 overflow-hidden">
                      <div className="w-full h-full relative">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={`panel-line-${i}`}
                            className="absolute w-px h-full bg-border/20"
                            style={{ left: `${20 + i * 15}%`, transform: "rotate(-15deg)" }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="border border-border/30 bg-secondary/30" />
                    <div className="border border-border/30 bg-secondary/15" />
                    <div className="border border-border/30 bg-secondary/25" />
                    <div className="border border-border/30 bg-secondary/35" />
                  </div>
                </div>
              </div>
            </ScrollAnimatedSection>
          </div>
        </section>

        {/* Quick Features */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <div className="grid sm:grid-cols-3 gap-12 lg:gap-16">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  <feature.icon className="w-5 h-5 mb-3 text-muted-foreground" />
                  <h3 className="font-medium mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Stats Banner */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30 relative overflow-hidden">
          {/* Halftone dot pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-10 sm:py-12 relative" animation="fade-in">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
              {[
                { value: "100%", label: "Free forever", sublabel: "No hidden costs" },
                { value: "4", label: "Formats supported", sublabel: "CBZ · CBR · PDF · EPUB" },
                { value: "0", label: "Data collected", sublabel: "Privacy by design" },
                { value: "∞", label: "Works offline", sublabel: "No internet needed" },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="text-center opacity-0 animate-fade-in"
                  style={{ animationDelay: `${i * 100}ms`, animationFillMode: "forwards" }}
                >
                  <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight mb-1">{stat.value}</div>
                  <div className="text-sm font-medium mb-0.5">{stat.label}</div>
                  <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* How It Works */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 relative overflow-hidden">
          {/* Horizontal comic panel lines */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 60px, currentColor 60px, currentColor 61px)",
            }}
          />
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24 relative" animation="fade-in-up">
            <div className="max-w-2xl mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Three steps. That&apos;s it.
              </h2>
              <div className="w-12 h-0.5 bg-foreground/20 mb-4 animate-draw-line" />
              <p className="text-muted-foreground">
                No account creation. No setup wizard. Just you and your comics.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6 lg:gap-8">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 150}ms`, animationFillMode: "forwards" }}
                >
                  {/* Comic panel card */}
                  <div className="border-2 border-border bg-background p-6 relative overflow-hidden h-full hover-lift">
                    {/* Panel number - comic style */}
                    <div className="absolute top-0 right-0 w-12 h-12 flex items-center justify-center">
                      <div className="absolute inset-0 bg-foreground" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
                      <span className="relative text-background text-xs font-mono font-bold translate-x-1 -translate-y-1">{step.number}</span>
                    </div>
                    {/* Speed lines behind icon */}
                    <div className="relative w-12 h-12 mb-4">
                      <div className="absolute inset-0">
                        {[...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-[180%] h-px bg-border/40"
                            style={{ transform: `translate(-50%, -50%) rotate(${i * 30}deg)` }}
                          />
                        ))}
                      </div>
                      <div className="relative w-12 h-12 border border-border bg-background flex items-center justify-center">
                        <step.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                  {/* Connector arrow between panels */}
                  {index < steps.length - 1 && (
                    <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Reader Deep Dive */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30 relative overflow-hidden">
          {/* Crosshatch pattern */}
          <div
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px), repeating-linear-gradient(-45deg, transparent, transparent 10px, currentColor 10px, currentColor 11px)",
            }}
          />
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24 relative" animation="fade-in-up">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              <div className="lg:col-span-3">
                <div className="max-w-2xl mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                    A reader built for comics
                  </h2>
                  <p className="text-muted-foreground">
                    Not a PDF viewer with comic support. A purpose-built reading experience designed around how you actually read comics.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-8 lg:gap-10">
                  {readerFeatures.map((feature, index) => (
                    <div
                      key={feature.title}
                      className="flex gap-4 opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 border border-border bg-background flex items-center justify-center">
                        <feature.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Reader visual - comic page being read */}
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center">
                <div className="relative w-[240px] h-[360px]">
                  {/* Page being read */}
                  <div className="absolute inset-0 border-2 border-border bg-background rounded-sm overflow-hidden shadow-xl">
                    {/* Comic panels layout */}
                    <div className="absolute inset-2 grid grid-cols-2 grid-rows-4 gap-1.5">
                      {/* Wide top panel */}
                      <div className="col-span-2 border border-border/40 bg-secondary/20 relative overflow-hidden">
                        {[...Array(8)].map((_, i) => (
                          <div
                            key={`rl-${i}`}
                            className="absolute w-px h-[200%] bg-border/15"
                            style={{ left: `${10 + i * 11}%`, top: "-50%", transform: "rotate(-20deg)" }}
                          />
                        ))}
                        <div className="absolute bottom-0 left-[15%] w-[30%] h-[80%] bg-secondary/40 rounded-t-full" />
                        <div className="absolute bottom-0 right-[15%] w-[25%] h-[65%] bg-secondary/30 rounded-t-full" />
                        {/* Speech bubble */}
                        <div className="absolute top-2 right-3 px-2 py-1 border border-border/40 bg-background/80 rounded-full">
                          <div className="w-6 h-1 bg-border/40 rounded-sm" />
                        </div>
                      </div>
                      {/* Two small panels */}
                      <div className="border border-border/40 bg-secondary/30 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[60%] h-[70%] bg-secondary/50 rounded-full" />
                        </div>
                      </div>
                      <div className="border border-border/40 bg-secondary/15 relative overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                          <div
                            key={`rl2-${i}`}
                            className="absolute top-1/2 left-1/2 w-[200%] h-px bg-border/20"
                            style={{ transform: `translate(-50%, -50%) rotate(${i * 45}deg)` }}
                          />
                        ))}
                      </div>
                      {/* Tall panel + small */}
                      <div className="row-span-2 border border-border/40 bg-secondary/25 relative overflow-hidden">
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[85%] bg-secondary/40 rounded-t-lg" />
                        {/* Action text */}
                        <div className="absolute top-2 left-2 font-mono text-[8px] font-bold text-border/40 tracking-wider">POW</div>
                      </div>
                      <div className="border border-border/40 bg-secondary/35 relative overflow-hidden">
                        <div className="absolute top-1 left-1 right-1 bottom-1 flex items-end justify-center">
                          <div className="w-[50%] h-[55%] bg-secondary/50 rounded-t-full" />
                        </div>
                      </div>
                      <div className="border border-border/40 bg-secondary/20 relative overflow-hidden">
                        {/* Speech bubble */}
                        <div className="absolute top-1.5 left-1.5 right-1.5">
                          <div className="px-1.5 py-1 border border-border/30 bg-background/60 rounded-md">
                            <div className="w-full h-0.5 bg-border/30 rounded-sm mb-0.5" />
                            <div className="w-3/4 h-0.5 bg-border/20 rounded-sm" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Page progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border/20">
                      <div className="h-full w-[65%] bg-foreground/40" />
                    </div>
                  </div>
                  {/* Gesture hint overlay */}
                  <div className="absolute -bottom-6 -right-6 flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-background rounded-full shadow-lg animate-float">
                    <MousePointer className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono">swipe to turn</span>
                  </div>
                  {/* Stacked page behind */}
                  <div className="absolute -right-2 top-2 bottom-2 w-2 border-r border-t border-b border-border/30 bg-secondary/10 rounded-r-sm" />
                  <div className="absolute -right-4 top-4 bottom-4 w-2 border-r border-t border-b border-border/20 bg-secondary/5 rounded-r-sm" />
                </div>
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Library Deep Dive */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24" animation="fade-in-up">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              {/* Library shelf visual */}
              <div className="hidden lg:flex lg:col-span-2 items-center justify-center order-last lg:order-first">
                <div className="relative w-[260px] h-[300px]">
                  {/* Library shelf */}
                  <div className="absolute inset-0 border-2 border-border bg-background rounded-sm overflow-hidden shadow-xl">
                    {/* Toolbar */}
                    <div className="absolute top-0 left-0 right-0 h-8 border-b border-border/40 bg-secondary/20 flex items-center px-2 gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
                      <div className="w-1.5 h-1.5 rounded-full bg-border/40" />
                      <div className="flex-1" />
                      <div className="w-16 h-3 border border-border/30 rounded-sm bg-background/50 flex items-center px-1">
                        <Search className="w-2 h-2 text-border/40" />
                      </div>
                    </div>
                    {/* Series sections */}
                    <div className="absolute top-8 left-0 right-0 bottom-0 p-2 overflow-hidden">
                      {/* Section header */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-10 h-1.5 bg-foreground/50 rounded-sm" />
                        <div className="flex-1 h-px bg-border/20" />
                        <div className="w-4 h-1.5 bg-border/30 rounded-sm" />
                      </div>
                      {/* Comic grid */}
                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {[...Array(4)].map((_, i) => (
                          <div key={`shelf-1-${i}`} className="aspect-[2/3] border border-border/40 bg-secondary/20 relative overflow-hidden">
                            <div
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-secondary/50"
                              style={{ width: `${45 + (i % 3) * 12}%`, height: `${50 + (i % 2) * 15}%`, borderRadius: "30% 30% 0 0" }}
                            />
                            <div className="absolute bottom-0.5 left-0.5 right-0.5 h-2 bg-background/50">
                              <div className="w-2/3 h-0.5 bg-border/40 rounded-sm mt-0.5 ml-0.5" />
                            </div>
                            {i === 0 && (
                              <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-foreground/60 flex items-center justify-center">
                                <div className="w-1 h-1 rounded-full bg-background" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Second section */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <div className="w-14 h-1.5 bg-foreground/40 rounded-sm" />
                        <div className="flex-1 h-px bg-border/20" />
                        <div className="w-4 h-1.5 bg-border/30 rounded-sm" />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[...Array(4)].map((_, i) => (
                          <div key={`shelf-2-${i}`} className="aspect-[2/3] border border-border/30 bg-secondary/15 relative overflow-hidden">
                            <div
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-secondary/35"
                              style={{ width: `${40 + (i % 2) * 15}%`, height: `${45 + (i % 3) * 10}%`, borderRadius: "25% 25% 0 0" }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Floating filter tag */}
                  <div className="absolute -top-3 -right-3 flex items-center gap-1.5 px-2.5 py-1.5 border border-border bg-background rounded-full shadow-lg animate-float">
                    <FolderOpen className="w-3 h-3 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground font-mono">by series</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-3">
                <div className="max-w-2xl mb-12">
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                    Your collection, organized
                  </h2>
                  <p className="text-muted-foreground">
                    Whether you have 10 comics or 10,000, keep everything in one place. Filter, sort, and find what you want to read next.
                  </p>
                </div>
                <div className="grid sm:grid-cols-3 gap-8 lg:gap-10">
                  {libraryFeatures.map((feature, index) => (
                    <div
                      key={feature.title}
                      className="opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                    >
                      <div className="w-10 h-10 border border-border bg-secondary/50 flex items-center justify-center mb-4">
                        <feature.icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Built for Every Reader */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30 relative overflow-hidden">
          {/* Graph paper grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24 relative" animation="fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
                Built for every reader
              </h2>
              <div className="w-12 h-0.5 bg-foreground/20 mx-auto mb-4 animate-draw-line" />
              <p className="text-muted-foreground">
                Whether you&apos;re reading your first comic or managing a massive digital collection.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  label: "Casual Reader",
                  description: "Stumble across a new series? Drop it in, read on your commute, pick up where you left off. Zero friction.",
                  visual: (
                    <div className="relative h-32 mb-4 overflow-hidden">
                      {/* Single comic being read on phone shape */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-28 border-2 border-border bg-background rounded-lg overflow-hidden">
                        <div className="absolute inset-1.5 top-2.5 border border-border/30 bg-secondary/20">
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[70%] bg-secondary/40 rounded-t-full" />
                        </div>
                      </div>
                      {/* Floating notification */}
                      <div className="absolute right-[15%] top-2 px-2 py-1 border border-border bg-background rounded-md shadow-sm">
                        <div className="flex items-center gap-1.5">
                          <Bell className="w-2.5 h-2.5 text-muted-foreground" />
                          <div className="w-10 h-1 bg-border/40 rounded-sm" />
                        </div>
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Collector",
                  description: "Thousands of issues? Auto-organized by series. Filter by publisher, status, or build custom collections.",
                  visual: (
                    <div className="relative h-32 mb-4 overflow-hidden">
                      {/* Library grid */}
                      <div className="absolute inset-x-4 bottom-0 top-2 grid grid-cols-5 grid-rows-2 gap-1">
                        {[...Array(10)].map((_, i) => (
                          <div
                            key={i}
                            className="border border-border/40 bg-background relative overflow-hidden"
                            style={{ opacity: 0.4 + (i % 3) * 0.2 }}
                          >
                            <div
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-secondary/50"
                              style={{
                                width: `${40 + (i % 4) * 12}%`,
                                height: `${35 + (i % 3) * 15}%`,
                                borderRadius: "30% 30% 0 0",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {/* Search overlay */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-0 px-3 py-1.5 border border-border bg-background rounded-md shadow-sm flex items-center gap-2">
                        <Search className="w-2.5 h-2.5 text-muted-foreground" />
                        <div className="w-12 h-1 bg-border/40 rounded-sm" />
                      </div>
                    </div>
                  ),
                },
                {
                  label: "Manga Fan",
                  description: "Right-to-left reading, vertical scroll, continuous mode. All the features manga readers demand. Free, forever.",
                  visual: (
                    <div className="relative h-32 mb-4 overflow-hidden">
                      {/* Manga page - vertical scroll style */}
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-24 h-full border-2 border-border bg-background overflow-hidden">
                        {/* Vertical panels */}
                        <div className="absolute inset-1 flex flex-col gap-0.5">
                          <div className="h-[35%] border border-border/30 bg-secondary/20 relative overflow-hidden">
                            <div className="absolute bottom-0 right-[20%] w-[40%] h-[90%] bg-secondary/40 rounded-t-full" />
                            <div className="absolute top-1 left-1 font-mono text-[5px] font-bold text-border/30">ドーン</div>
                          </div>
                          <div className="h-[25%] border border-border/30 bg-secondary/30 relative overflow-hidden">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute top-1/2 left-1/2 w-[200%] h-px bg-border/20"
                                style={{ transform: `translate(-50%, -50%) rotate(${i * 36}deg)` }}
                              />
                            ))}
                          </div>
                          <div className="flex-1 border border-border/30 bg-secondary/15 relative overflow-hidden">
                            <div className="absolute top-1 left-1 right-1">
                              <div className="px-1 py-0.5 border border-border/20 bg-background/60 rounded-sm mb-0.5">
                                <div className="w-full h-[2px] bg-border/30 rounded-sm" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* R-to-L indicator */}
                      <div className="absolute right-[10%] bottom-2 flex items-center gap-1 px-2 py-1 border border-border bg-background rounded-sm">
                        <ArrowRight className="w-2.5 h-2.5 text-muted-foreground rotate-180" />
                        <span className="text-[8px] font-mono text-muted-foreground">RTL</span>
                      </div>
                    </div>
                  ),
                },
              ].map((useCase, i) => (
                <div
                  key={useCase.label}
                  className="border border-border bg-background overflow-hidden opacity-0 animate-fade-in hover-lift"
                  style={{ animationDelay: `${i * 120}ms`, animationFillMode: "forwards" }}
                >
                  <div className="bg-secondary/20 border-b border-border/40">
                    {useCase.visual}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold mb-2">{useCase.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Formats */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <h2 className="text-lg font-medium mb-2">Every format. One reader.</h2>
            <p className="text-sm text-muted-foreground mb-8">Comics, manga, graphic novels—if you can download it, you can read it.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {formats.map((format, index) => (
                <div
                  key={format.name}
                  className="p-4 border border-border relative overflow-hidden opacity-0 animate-fade-in hover-lift group hover:border-foreground/20 transition-colors"
                  style={{ animationDelay: `${index * 75}ms`, animationFillMode: "forwards" }}
                >
                  {/* Corner fold effect */}
                  <div className="absolute top-0 right-0 w-4 h-4">
                    <div className="absolute top-0 right-0 w-full h-full bg-secondary/40" style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }} />
                  </div>
                  <div className="font-mono text-xl font-bold mb-1">{format.name}</div>
                  <div className="text-xs text-muted-foreground">{format.description}</div>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Works Everywhere */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30 relative overflow-hidden">
          {/* Diagonal stripe */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: "repeating-linear-gradient(135deg, transparent, transparent 24px, currentColor 24px, currentColor 25px)",
            }}
          />
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24 relative" animation="fade-in-up">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Works everywhere
                </h2>
                <p className="text-muted-foreground mb-6">
                  A progressive web app that runs in any browser. Install it on your phone, tablet, or desktop. Read offline. No app store required.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Desktop</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tablet className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Tablet</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Mobile</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <WifiOff className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Offline</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:flex items-end justify-center gap-6">
                {/* Phone */}
                <div className="w-[72px] h-[128px] border-2 border-border bg-background rounded-lg opacity-0 animate-fade-in relative overflow-hidden" style={{ animationDelay: "0ms", animationFillMode: "forwards" }}>
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-6 h-1 bg-border/30 rounded-full" />
                  <div className="absolute inset-1.5 top-3 border border-border/30 overflow-hidden">
                    <div className="w-full h-full bg-secondary/20 relative">
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[65%] bg-secondary/40 rounded-t-full" />
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="absolute w-px h-full bg-border/15" style={{ left: `${25 + i * 25}%`, transform: "rotate(-20deg)" }} />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Tablet */}
                <div className="w-[160px] h-[200px] border-2 border-border bg-background rounded-lg opacity-0 animate-fade-in relative overflow-hidden" style={{ animationDelay: "100ms", animationFillMode: "forwards" }}>
                  <div className="absolute inset-2 border border-border/30 overflow-hidden">
                    {/* Double page spread */}
                    <div className="absolute inset-0 grid grid-cols-2 gap-px">
                      <div className="bg-secondary/15 relative overflow-hidden">
                        <div className="absolute inset-1 grid grid-rows-3 gap-0.5">
                          <div className="border border-border/20 bg-secondary/20" />
                          <div className="row-span-2 border border-border/20 bg-secondary/30 relative">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-[60%] bg-secondary/40 rounded-t-full" />
                          </div>
                        </div>
                      </div>
                      <div className="bg-secondary/10 relative overflow-hidden">
                        <div className="absolute inset-1 grid grid-rows-2 gap-0.5">
                          <div className="border border-border/20 bg-secondary/25 relative">
                            <div className="absolute top-1 right-1 px-1 py-0.5 border border-border/20 bg-background/50 rounded-full">
                              <div className="w-4 h-0.5 bg-border/30 rounded-sm" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-0.5">
                            <div className="border border-border/20 bg-secondary/20" />
                            <div className="border border-border/20 bg-secondary/30" />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Spine line */}
                    <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border/40" />
                  </div>
                </div>
                {/* Desktop */}
                <div className="opacity-0 animate-fade-in flex flex-col items-center" style={{ animationDelay: "200ms", animationFillMode: "forwards" }}>
                  <div className="w-[200px] h-[130px] border-2 border-border bg-background rounded-t-lg relative overflow-hidden">
                    <div className="absolute inset-2 border border-border/30 overflow-hidden">
                      {/* Library grid view */}
                      <div className="absolute inset-1 grid grid-cols-4 grid-rows-2 gap-0.5">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="border border-border/20 bg-secondary/20 relative overflow-hidden">
                            <div
                              className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-secondary/40"
                              style={{
                                width: `${40 + (i % 3) * 15}%`,
                                height: `${40 + (i % 2) * 20}%`,
                                borderRadius: "30% 30% 0 0",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Monitor stand */}
                  <div className="w-16 h-1.5 bg-border/60 rounded-b" />
                  <div className="w-24 h-1 bg-border/40 rounded-b" />
                </div>
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Values */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/20 relative overflow-hidden">
          {/* Screentone pattern - manga-inspired */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 0.75px, transparent 0.75px)",
              backgroundSize: "8px 8px",
            }}
          />
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24 relative" animation="fade-in-up">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Why floppy stays different</h2>
              <div className="w-12 h-0.5 bg-foreground/20 mx-auto mb-4 animate-draw-line" />
              <p className="text-muted-foreground">
                Open source from day one. Community-built, community-driven. A comic book app that puts you first.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="p-5 border border-border relative overflow-hidden opacity-0 animate-fade-in hover-lift group hover:border-foreground/20 transition-colors"
                  style={{ animationDelay: `${index * 100}ms`, animationFillMode: "forwards" }}
                >
                  {/* Subtle corner accent */}
                  <div className="absolute top-0 left-0 w-8 h-8 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full border-b border-r border-border/20 transform -rotate-45 translate-y-[-50%]" />
                  </div>
                  <div className="w-10 h-10 border border-border bg-secondary/30 flex items-center justify-center mb-4">
                    <value.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Tech */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8">
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-20" animation="fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <span className="text-sm text-muted-foreground">Built with</span>
              <div className="flex flex-wrap gap-2">
                {["Next.js", "React", "TypeScript", "IndexedDB", "PWA"].map(
                  (tech, index) => (
                    <span
                      key={tech}
                      className="px-3 py-1 text-sm font-mono border border-border rounded opacity-0 animate-fade-in"
                      style={{ animationDelay: `${index * 75}ms`, animationFillMode: "forwards" }}
                    >
                      {tech}
                    </span>
                  )
                )}
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* FAQ */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/20 relative overflow-hidden">
          {/* Dot grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 0.5px, transparent 0.5px)",
              backgroundSize: "24px 24px",
            }}
          />
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-16 sm:py-24 relative" animation="fade-in-up">
            <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
              <div className="lg:col-span-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                  Common questions
                </h2>
                <p className="text-muted-foreground mb-6">
                  Everything you need to know about floppy. Can&apos;t find your answer?
                </p>
                <a
                  href="https://github.com/TimMikeladze/floppy/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm" className="gap-2">
                    <Github className="w-3.5 h-3.5" />
                    Ask on GitHub
                  </Button>
                </a>
              </div>
              <div className="lg:col-span-3 space-y-2">
                {faqs.map((faq, index) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} index={index} />
                ))}
              </div>
            </div>
          </ScrollAnimatedSection>
        </section>

        {/* Final CTA */}
        <section className="border-t border-border/40 px-4 sm:px-6 md:px-8 bg-secondary/30 relative overflow-hidden">
          {/* Starburst halftone background */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "20px 20px",
            }}
          />
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Radiating lines from center */}
            {[...Array(18)].map((_, i) => (
              <div
                key={`cta-line-${i}`}
                className="absolute top-1/2 left-1/2 h-px bg-border/10"
                style={{
                  width: `${120 + (i % 3) * 40}%`,
                  transform: `translate(-50%, -50%) rotate(${i * 10}deg)`,
                }}
              />
            ))}
            {/* Corner comic panels - decorative */}
            <div className="absolute -top-8 -left-8 w-32 h-32 border-2 border-border/10 rotate-12 bg-secondary/10 animate-float-slow" />
            <div className="absolute -bottom-6 -right-6 w-40 h-40 border-2 border-border/10 -rotate-6 bg-secondary/10 animate-float-slow" style={{ animationDelay: "1s" }} />
            <div className="absolute top-8 -right-4 w-20 h-20 border border-border/5 rotate-[20deg] animate-float" style={{ animationDelay: "0.5s" }} />
          </div>
          <ScrollAnimatedSection className="mx-auto w-full max-w-screen-xl py-20 sm:py-28 text-center relative" animation="fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-border rounded-full text-xs text-muted-foreground mb-6 animate-float" style={{ animationDuration: "4s" }}>
              <Star className="w-3 h-3 animate-pulse-subtle" />
              <span>No sign-up required</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              Start reading now
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Open the app, drop in your first comic, and experience what a reader should feel like.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGetStarted} size="lg" className="gap-2">
                Open Library
                <ArrowRight className="w-4 h-4" />
              </Button>
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" className="gap-2">
                  <Github className="w-4 h-4" />
                  View Source
                </Button>
              </a>
            </div>
          </ScrollAnimatedSection>
        </section>

      </main>

      {/* Footer */}
      <footer className="relative border-t border-border/20">
        {/* Glowing top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />

        <div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 md:px-8 py-8 sm:py-10">
          {/* Main footer row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center flex-shrink-0">
                <div className="w-3 h-3 bg-background rounded-[1px]" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">floppy</div>
                <div className="text-xs text-muted-foreground/60">The open-source comic book app</div>
              </div>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <a
                href="https://github.com/TimMikeladze/floppy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <Github className="w-3.5 h-3.5 opacity-60" />
                GitHub
              </a>
              <a
                href="https://github.com/TimMikeladze/floppy/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Releases
              </a>
              <a
                href="https://twitter.com/linesofcode"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <Twitter className="w-3.5 h-3.5 opacity-60" />
                Twitter
              </a>
              <a
                href="https://bsky.app/profile/linesofcode.bsky.social"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 568 501" fill="currentColor">
                  <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z"/>
                </svg>
                Bluesky
              </a>
              <button
                onClick={() => setSupportOpen(true)}
                className="hover:text-foreground transition-colors inline-flex items-center gap-1.5 group"
              >
                <Heart className="w-3.5 h-3.5 text-pink-400/70 fill-pink-400/20 group-hover:text-pink-500 group-hover:fill-pink-500/40 transition-all" />
                Support
              </button>
            </nav>
          </div>

          {/* Divider */}
          <div className="my-6 h-px bg-border/10" />

          {/* Credits */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/50">
            <div className="flex items-center gap-1.5">
              <span>Built by</span>
              <a
                href="https://linesofcode.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground/70 hover:text-foreground transition-colors underline underline-offset-4 decoration-border/30"
              >
                linesofcode.dev
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span>MIT License</span>
              <span className="opacity-40">&middot;</span>
              <span>{new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>

      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </div>
  )
}
