# Comic Book Release Tracker - Implementation Plan

## Overview

A YAML-driven comic book release tracker for the Floppy app that allows users to:
- Log and track comic book releases with full metadata and covers
- View future release schedules via calendar
- Perform full CRUD operations on releases
- Customize everything through config files
- Store all data in YAML files (static site compatible)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           BUILD TIME                                     │
│                                                                          │
│  /data/releases/*.yaml  ──┐                                              │
│  /data/series/*.yaml    ──┼──▶  generate-releases-data.ts               │
│  /data/config/*.yaml    ──┘         (npm run prebuild)                  │
│                                           │                              │
│                                           ▼                              │
│                                    /src/generated/                       │
│                                    ├── releases.json                     │
│                                    ├── series.json                       │
│                                    └── config.json                       │
└─────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           RUNTIME (Browser)                              │
│                                                                          │
│   Static JSON  +  User Overrides (IndexedDB)  +  Custom Releases        │
│        │                    │                          │                 │
│        └────────────────────┼──────────────────────────┘                 │
│                             ▼                                            │
│                    Merged Release[]                                      │
│                             │                                            │
│                             ▼                                            │
│                   React UI Components                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 1. YAML Schema Design

### 1.1 Individual Comic Release File

**Location:** `/data/releases/{year}/{month}/{slug}.yaml`

```yaml
# /data/releases/2026/01/batman-153.yaml
---
id: "batman-2026-153"
slug: "batman-153"
title: "Batman #153"
series: "batman"                    # References series slug
issueNumber: "153"
releaseDate: "2026-01-15"
coverUrl: "/covers/releases/2026/01/batman-153.jpg"
publisher: "dc-comics"              # References publisher slug
writers:
  - "Chip Zdarsky"
artists:
  - "Jorge Jiménez"
  - "Tomeu Morey"
description: |
  Batman faces the aftermath of the Failsafe arc as Gotham's
  criminal underworld reorganizes.
price: "$4.99"
format: "single-issue"              # single-issue | trade-paperback | hardcover | omnibus
genres:
  - "superhero"
  - "crime"
pageCount: 28
printRun: 1
variants:
  - name: "1:25 Variant"
    coverUrl: "/covers/releases/2026/01/batman-153-variant.jpg"
    artist: "Jim Lee"
status: "upcoming"                  # upcoming | released | delayed | cancelled
# Optional
isbn: "978-1-77950-XXX-X"
diamond: "DEC240123"
upc: "76194137660615311"
ageRating: "Teen+"
tags:
  - "bat-family"
  - "gotham"
---
```

### 1.2 Comic Series Database

**Location:** `/data/series/{publisher-slug}/{series-slug}.yaml`

```yaml
# /data/series/dc-comics/batman.yaml
---
id: "batman-main"
name: "Batman"
slug: "batman"
publisher: "dc-comics"
startYear: 1940
currentVolume: 3
volumeStartYear: 2016
status: "ongoing"                   # ongoing | completed | hiatus | cancelled
genres:
  - "superhero"
  - "crime"
  - "detective"
description: |
  The Dark Knight protects Gotham City from its criminal underworld.
coverUrl: "/covers/series/batman.jpg"
currentWriters:
  - "Chip Zdarsky"
currentArtists:
  - "Jorge Jiménez"
releaseSchedule: "monthly"          # weekly | biweekly | monthly | bimonthly | irregular
typicalReleaseDay: "wednesday"
relatedSeries:
  - "detective-comics"
  - "batman-and-robin"
tags:
  - "bat-family"
  - "gotham"
---
```

### 1.3 Configuration Files

**Location:** `/data/config/`

#### Publishers (`publishers.yaml`)
```yaml
publishers:
  - id: "dc-comics"
    name: "DC Comics"
    slug: "dc-comics"
    logoUrl: "/logos/dc.svg"
    color: "#0476F2"
    website: "https://www.dc.com"

  - id: "marvel"
    name: "Marvel Comics"
    slug: "marvel"
    logoUrl: "/logos/marvel.svg"
    color: "#EC1D24"
    website: "https://www.marvel.com"

  - id: "image"
    name: "Image Comics"
    slug: "image"
    logoUrl: "/logos/image.svg"
    color: "#000000"
    website: "https://imagecomics.com"
```

#### Genres (`genres.yaml`)
```yaml
genres:
  - id: "superhero"
    name: "Superhero"
    icon: "zap"
    color: "#3B82F6"

  - id: "horror"
    name: "Horror"
    icon: "skull"
    color: "#EF4444"

  - id: "sci-fi"
    name: "Science Fiction"
    icon: "rocket"
    color: "#8B5CF6"

  - id: "crime"
    name: "Crime"
    icon: "fingerprint"
    color: "#6B7280"
```

#### Formats (`formats.yaml`)
```yaml
formats:
  - id: "single-issue"
    name: "Single Issue"
    abbreviation: "Issue"

  - id: "trade-paperback"
    name: "Trade Paperback"
    abbreviation: "TPB"

  - id: "hardcover"
    name: "Hardcover"
    abbreviation: "HC"

  - id: "omnibus"
    name: "Omnibus"
    abbreviation: "Omni"
```

#### Release Settings (`releases-settings.yaml`)
```yaml
defaultNewReleaseDays: 14
defaultUpcomingDays: 28
defaultCalendarMonths: 3
defaultPullListReminder: 3
enableVariantCovers: true
enablePriceAlerts: false
releaseDay: "wednesday"
```

---

## 2. Folder Structure

```
/data/
├── config/
│   ├── publishers.yaml
│   ├── genres.yaml
│   ├── formats.yaml
│   └── releases-settings.yaml
├── series/
│   ├── dc-comics/
│   │   ├── batman.yaml
│   │   ├── superman.yaml
│   │   └── wonder-woman.yaml
│   ├── marvel/
│   │   ├── amazing-spider-man.yaml
│   │   └── x-men.yaml
│   └── image/
│       └── saga.yaml
└── releases/
    └── 2026/
        ├── 01/
        │   ├── batman-153.yaml
        │   └── amazing-spider-man-42.yaml
        ├── 02/
        └── 03/

/public/covers/
├── series/
│   ├── batman.jpg
│   └── ...
└── releases/
    └── 2026/
        └── 01/
            └── batman-153.jpg

/src/generated/          # Auto-generated at build time (gitignored)
├── releases.json
├── series.json
└── config.json
```

---

## 3. TypeScript Types

### `/src/lib/releases-types.ts`

```typescript
// Base Release from YAML
export interface ReleaseYaml {
  id?: string
  slug: string
  title: string
  series: string
  issueNumber: string
  releaseDate: string           // ISO date string in YAML
  coverUrl: string
  publisher: string
  writers: string[]
  artists: string[]
  description: string
  price: string
  format: ReleaseFormat
  genres: string[]
  pageCount?: number
  printRun?: number
  variants?: VariantCover[]
  status: ReleaseStatus
  isbn?: string
  diamond?: string
  upc?: string
  ageRating?: string
  tags?: string[]
}

// Runtime Release with parsed date
export interface Release extends Omit<ReleaseYaml, 'releaseDate'> {
  id: string
  releaseDate: Date
  isCustom?: boolean            // True if user-created
  isModified?: boolean          // True if user has overrides
}

export type ReleaseFormat = 'single-issue' | 'trade-paperback' | 'hardcover' | 'omnibus'
export type ReleaseStatus = 'upcoming' | 'released' | 'delayed' | 'cancelled'

export interface VariantCover {
  name: string
  coverUrl: string
  artist?: string
}

export interface Series {
  id: string
  name: string
  slug: string
  publisher: string
  startYear: number
  currentVolume?: number
  volumeStartYear?: number
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled'
  genres: string[]
  description: string
  coverUrl: string
  currentWriters: string[]
  currentArtists: string[]
  releaseSchedule: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'irregular'
  typicalReleaseDay?: string
  relatedSeries?: string[]
  tags?: string[]
}

export interface Publisher {
  id: string
  name: string
  slug: string
  logoUrl?: string
  color?: string
  website?: string
}

export interface Genre {
  id: string
  name: string
  icon?: string
  color?: string
}

export interface Format {
  id: string
  name: string
  abbreviation: string
}

export interface ReleasesConfig {
  defaultNewReleaseDays: number
  defaultUpcomingDays: number
  defaultCalendarMonths: number
  defaultPullListReminder: number
  enableVariantCovers: boolean
  enablePriceAlerts: boolean
  releaseDay: string
}
```

---

## 4. Build-Time Data Generation

### `/scripts/generate-releases-data.ts`

```typescript
import { parse } from 'yaml'
import { glob } from 'glob'
import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const OUTPUT_DIR = path.join(process.cwd(), 'src', 'generated')

async function loadYamlFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, 'utf-8')
  return parse(content) as T
}

async function loadAllReleases(): Promise<ReleaseYaml[]> {
  const files = await glob('releases/**/*.yaml', { cwd: DATA_DIR })
  const releases: ReleaseYaml[] = []

  for (const file of files) {
    const data = await loadYamlFile<ReleaseYaml>(path.join(DATA_DIR, file))
    // Auto-generate ID if not provided
    if (!data.id) {
      data.id = `${data.series}-${data.releaseDate}-${data.issueNumber}`
    }
    releases.push(data)
  }

  return releases.sort((a, b) =>
    new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  )
}

async function loadAllSeries(): Promise<Series[]> {
  const files = await glob('series/**/*.yaml', { cwd: DATA_DIR })
  const series: Series[] = []

  for (const file of files) {
    series.push(await loadYamlFile<Series>(path.join(DATA_DIR, file)))
  }

  return series
}

async function loadConfig() {
  return {
    publishers: (await loadYamlFile<{publishers: Publisher[]}>(
      path.join(DATA_DIR, 'config', 'publishers.yaml')
    )).publishers,
    genres: (await loadYamlFile<{genres: Genre[]}>(
      path.join(DATA_DIR, 'config', 'genres.yaml')
    )).genres,
    formats: (await loadYamlFile<{formats: Format[]}>(
      path.join(DATA_DIR, 'config', 'formats.yaml')
    )).formats,
    settings: await loadYamlFile<ReleasesConfig>(
      path.join(DATA_DIR, 'config', 'releases-settings.yaml')
    ),
  }
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true })

  const releases = await loadAllReleases()
  const series = await loadAllSeries()
  const config = await loadConfig()

  await writeFile(
    path.join(OUTPUT_DIR, 'releases.json'),
    JSON.stringify(releases, null, 2)
  )
  await writeFile(
    path.join(OUTPUT_DIR, 'series.json'),
    JSON.stringify(series, null, 2)
  )
  await writeFile(
    path.join(OUTPUT_DIR, 'config.json'),
    JSON.stringify(config, null, 2)
  )

  console.log(`Generated:`)
  console.log(`  - ${releases.length} releases`)
  console.log(`  - ${series.length} series`)
  console.log(`  - Config with ${config.publishers.length} publishers, ${config.genres.length} genres`)
}

main().catch(console.error)
```

### Update `package.json`

```json
{
  "scripts": {
    "generate:releases": "tsx scripts/generate-releases-data.ts",
    "prebuild": "npm run generate:releases",
    "predev": "npm run generate:releases"
  }
}
```

---

## 5. Runtime Data Layer

### IndexedDB Extension (`/src/lib/storage.ts`)

Add new stores for user data:

```typescript
// New store names
const RELEASES_OVERRIDES_STORE = "releasesOverrides"
const CUSTOM_RELEASES_STORE = "customReleases"
const RELEASES_DELETIONS_STORE = "releasesDeletions"

// Types
interface ReleaseOverride {
  releaseId: string
  overrides: Partial<Release>
  modifiedAt: Date
}

interface CustomRelease extends Release {
  isCustom: true
  createdAt: Date
  modifiedAt: Date
}

// CRUD functions
export async function saveReleaseOverride(releaseId: string, overrides: Partial<Release>)
export async function getReleaseOverrides(): Promise<ReleaseOverride[]>
export async function deleteReleaseOverride(releaseId: string)

export async function saveCustomRelease(release: Omit<CustomRelease, 'id' | 'createdAt' | 'modifiedAt'>)
export async function getCustomReleases(): Promise<CustomRelease[]>
export async function updateCustomRelease(id: string, updates: Partial<Release>)
export async function deleteCustomRelease(id: string)

export async function markReleaseDeleted(releaseId: string)
export async function getDeletedReleaseIds(): Promise<string[]>
export async function unmarkReleaseDeleted(releaseId: string)
```

### Data Merge Layer (`/src/lib/releases-merge.ts`)

```typescript
import releasesJson from '@/generated/releases.json'
import { getReleaseOverrides, getCustomReleases, getDeletedReleaseIds } from './storage'

export async function getMergedReleases(): Promise<Release[]> {
  // 1. Convert static JSON to Release objects
  const staticReleases: Release[] = releasesJson.map(r => ({
    ...r,
    releaseDate: new Date(r.releaseDate),
    isCustom: false,
    isModified: false,
  }))

  // 2. Load user data from IndexedDB
  const [overrides, deletions, customReleases] = await Promise.all([
    getReleaseOverrides(),
    getDeletedReleaseIds(),
    getCustomReleases(),
  ])

  // 3. Filter out deleted releases and apply overrides
  const mergedStatic = staticReleases
    .filter(r => !deletions.includes(r.id))
    .map(r => {
      const override = overrides.find(o => o.releaseId === r.id)
      if (override) {
        return { ...r, ...override.overrides, isModified: true }
      }
      return r
    })

  // 4. Add custom releases
  const allReleases = [...mergedStatic, ...customReleases]

  // 5. Sort by release date
  return allReleases.sort((a, b) =>
    a.releaseDate.getTime() - b.releaseDate.getTime()
  )
}
```

### CRUD Hook (`/src/hooks/use-releases-crud.ts`)

```typescript
import { useState, useEffect, useCallback } from 'react'
import { getMergedReleases } from '@/lib/releases-merge'
import * as storage from '@/lib/storage'
import { stringify } from 'yaml'

export function useReleasesCrud() {
  const [releases, setReleases] = useState<Release[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const data = await getMergedReleases()
    setReleases(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const createRelease = async (release: Omit<Release, 'id'>) => {
    await storage.saveCustomRelease(release)
    await refresh()
  }

  const updateRelease = async (id: string, updates: Partial<Release>) => {
    const existing = releases.find(r => r.id === id)
    if (existing?.isCustom) {
      await storage.updateCustomRelease(id, updates)
    } else {
      await storage.saveReleaseOverride(id, updates)
    }
    await refresh()
  }

  const deleteRelease = async (id: string) => {
    const existing = releases.find(r => r.id === id)
    if (existing?.isCustom) {
      await storage.deleteCustomRelease(id)
    } else {
      await storage.markReleaseDeleted(id)
    }
    await refresh()
  }

  const resetRelease = async (id: string) => {
    await storage.deleteReleaseOverride(id)
    await storage.unmarkReleaseDeleted(id)
    await refresh()
  }

  const exportAsYaml = async () => {
    const customReleases = await storage.getCustomReleases()
    const overrides = await storage.getReleaseOverrides()

    const yamlContent = customReleases.map(r => {
      const { isCustom, createdAt, modifiedAt, ...releaseData } = r
      return `---\n${stringify(releaseData)}`
    }).join('\n')

    return yamlContent
  }

  const importFromYaml = async (yamlText: string) => {
    // Parse YAML and create custom releases
    // ...implementation
    await refresh()
  }

  return {
    releases,
    loading,
    refresh,
    createRelease,
    updateRelease,
    deleteRelease,
    resetRelease,
    exportAsYaml,
    importFromYaml,
  }
}
```

---

## 6. UI Components

### Component List

| Component | Path | Description |
|-----------|------|-------------|
| `ReleaseForm` | `components/releases/release-form.tsx` | react-hook-form + zod validation |
| `ReleaseDialog` | `components/releases/release-dialog.tsx` | Create/Edit modal |
| `ReleaseDetailSheet` | `components/releases/release-detail-sheet.tsx` | Slide-out detail panel |
| `SeriesCard` | `components/releases/series-card.tsx` | Series display card |
| `SeriesDialog` | `components/releases/series-dialog.tsx` | Create/Edit series |
| `PublisherBadge` | `components/releases/publisher-badge.tsx` | Publisher with color |
| `VariantCoverGallery` | `components/releases/variant-cover-gallery.tsx` | Cover variants carousel |
| `ReleasesImportDialog` | `components/releases/releases-import-dialog.tsx` | YAML import |
| `ReleasesExportDialog` | `components/releases/releases-export-dialog.tsx` | YAML export |
| `CalendarWeekView` | `components/releases/calendar-week-view.tsx` | Week-focused view |

### Zod Schemas (`/src/lib/releases-schemas.ts`)

```typescript
import { z } from "zod"

export const releaseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  series: z.string().min(1, "Series is required"),
  issueNumber: z.string().min(1, "Issue number is required"),
  releaseDate: z.date(),
  coverUrl: z.string().url().optional().or(z.literal('')),
  publisher: z.string().min(1, "Publisher is required"),
  writers: z.array(z.string()).min(1, "At least one writer required"),
  artists: z.array(z.string()).min(1, "At least one artist required"),
  description: z.string().optional(),
  price: z.string().regex(/^\$?\d+\.?\d*$/, "Invalid price"),
  format: z.enum(["single-issue", "trade-paperback", "hardcover", "omnibus"]),
  genres: z.array(z.string()),
  pageCount: z.number().positive().optional(),
  status: z.enum(["upcoming", "released", "delayed", "cancelled"]),
})

export const seriesSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  publisher: z.string().min(1, "Publisher is required"),
  status: z.enum(["ongoing", "completed", "hiatus", "cancelled"]),
  genres: z.array(z.string()),
  description: z.string().optional(),
  coverUrl: z.string().url().optional(),
  releaseSchedule: z.enum(["weekly", "biweekly", "monthly", "bimonthly", "irregular"]),
})

export type ReleaseFormData = z.infer<typeof releaseSchema>
export type SeriesFormData = z.infer<typeof seriesSchema>
```

---

## 7. Implementation Phases

### Phase 1: Infrastructure (2-3 days)
- [ ] Add dependencies (`yaml`, `tsx`, `glob`)
- [ ] Create `/data/` folder structure
- [ ] Create TypeScript types
- [ ] Create build script
- [ ] Update package.json scripts
- [ ] Add `/src/generated/` to .gitignore

### Phase 2: Sample Data (1 day)
- [ ] Create config YAML files
- [ ] Create 2-3 sample series
- [ ] Create 10-15 sample releases
- [ ] Test build script

### Phase 3: IndexedDB Layer (2 days)
- [ ] Extend storage.ts with new stores
- [ ] Create releases-merge.ts
- [ ] Create use-releases-crud.ts hook
- [ ] Test CRUD operations

### Phase 4: UI Components (3-4 days)
- [ ] Create Zod schemas
- [ ] Create ReleaseForm component
- [ ] Create ReleaseDialog
- [ ] Create ReleaseDetailSheet
- [ ] Update releases-content.tsx
- [ ] Add context menus for edit/delete

### Phase 5: Import/Export (1-2 days)
- [ ] Create ReleasesImportDialog
- [ ] Create ReleasesExportDialog
- [ ] Test YAML round-trip

### Phase 6: Polish (1-2 days)
- [ ] Loading states
- [ ] Error handling
- [ ] Offline support
- [ ] Performance optimization

---

## 8. Dependencies

```json
{
  "dependencies": {
    "yaml": "^2.3.4"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "glob": "^10.3.0"
  }
}
```

---

## 9. Files to Create/Modify

### New Files
```
/data/config/publishers.yaml
/data/config/genres.yaml
/data/config/formats.yaml
/data/config/releases-settings.yaml
/data/series/dc-comics/batman.yaml (sample)
/data/releases/2026/01/batman-153.yaml (sample)
/scripts/generate-releases-data.ts
/src/lib/releases-types.ts
/src/lib/releases-merge.ts
/src/lib/releases-schemas.ts
/src/hooks/use-releases-crud.ts
/src/components/releases/release-form.tsx
/src/components/releases/release-dialog.tsx
/src/components/releases/release-detail-sheet.tsx
/src/components/releases/releases-import-dialog.tsx
/src/components/releases/releases-export-dialog.tsx
```

### Modified Files
```
/package.json - Add dependencies and scripts
/.gitignore - Add /src/generated/
/src/lib/storage.ts - Add new IndexedDB stores
/src/lib/mock-releases.ts - Replace with generated data
/src/app/releases/releases-content.tsx - Use new data layer
```

---

## 10. Key Design Decisions

1. **Build-time YAML parsing** - YAML is processed at build time, not runtime, for optimal performance

2. **IndexedDB for user data** - Since static sites can't write files, user edits are stored in IndexedDB

3. **Merge strategy** - Static data + user overrides + custom releases = final dataset

4. **Export/Import** - Users can export their custom data as YAML to contribute back

5. **Backward compatible** - Existing Release type is preserved, new fields are optional

6. **Config-driven** - Publishers, genres, formats all defined in YAML for easy customization
