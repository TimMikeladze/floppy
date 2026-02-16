"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import {
  CATEGORY_LABELS,
  FREE_COMICS_SOURCES,
  type FreeComicSource,
} from "@/lib/free-comics-sources";

interface FreeComicsSourcesProps {
  /**
   * Display variant:
   * - "full": Shows all sources with descriptions (for landing page)
   * - "compact": Shows a condensed list (for upload dialog)
   */
  variant?: "full" | "compact";
  /**
   * Optional className for the container
   */
  className?: string;
  /**
   * Maximum number of sources to show (for compact variant)
   */
  maxSources?: number;
}

export function FreeComicsSources({
  variant = "full",
  className = "",
  maxSources,
}: FreeComicsSourcesProps) {
  const sources = maxSources
    ? FREE_COMICS_SOURCES.slice(0, maxSources)
    : FREE_COMICS_SOURCES;

  if (variant === "compact") {
    return (
      <div className={className}>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            Need comics? Try these free sources:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {sources.map((source) => (
            <a
              key={source.name}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-border"
            >
              {source.name}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Full variant - group by category
  const sourcesByCategory = FREE_COMICS_SOURCES.reduce(
    (acc, source) => {
      if (!acc[source.category]) {
        acc[source.category] = [];
      }
      acc[source.category].push(source);
      return acc;
    },
    {} as Record<FreeComicSource["category"], FreeComicSource[]>,
  );

  return (
    <div className={className}>
      <div className="flex items-center gap-4 mb-8">
        <BookOpen className="w-5 h-5" />
        <h3 className="text-sm font-medium tracking-widest uppercase">
          Free Comic Sources
        </h3>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(Object.keys(sourcesByCategory) as FreeComicSource["category"][]).map(
          (category) => (
            <div key={category} className="space-y-3">
              <h4 className="text-xs font-medium tracking-wide uppercase text-muted-foreground">
                {CATEGORY_LABELS[category]}
              </h4>
              <div className="space-y-2">
                {sourcesByCategory[category].map((source) => (
                  <a
                    key={source.name}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-3 border border-foreground/10 hover:border-foreground/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm group-hover:text-primary transition-colors">
                            {source.name}
                          </span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {source.description}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ),
        )}
      </div>

      <p className="mt-6 text-xs text-muted-foreground text-center">
        Always verify the licensing terms before downloading comics.
      </p>
    </div>
  );
}
