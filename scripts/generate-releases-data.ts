import { parse } from "yaml"
import { glob } from "glob"
import { readFile, writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

import type {
  ReleaseYaml,
  Series,
  Publisher,
  Genre,
  Format,
  ReleasesConfig,
} from "../src/lib/releases-types"

const DATA_DIR = path.join(process.cwd(), "data")
const OUTPUT_DIR = path.join(process.cwd(), "src", "generated")

async function loadYamlFile<T>(filePath: string): Promise<T> {
  const content = await readFile(filePath, "utf-8")
  return parse(content) as T
}

async function loadAllReleases(): Promise<ReleaseYaml[]> {
  const pattern = "releases/**/*.yaml"
  const files = await glob(pattern, { cwd: DATA_DIR })
  const releases: ReleaseYaml[] = []

  for (const file of files) {
    try {
      const data = await loadYamlFile<ReleaseYaml>(path.join(DATA_DIR, file))
      // Auto-generate ID if not provided
      if (!data.id) {
        data.id = `${data.series}-${data.releaseDate}-${data.issueNumber}`
      }
      releases.push(data)
    } catch (error) {
      console.error(`Error loading ${file}:`, error)
    }
  }

  return releases.sort(
    (a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime()
  )
}

async function loadAllSeries(): Promise<Series[]> {
  const pattern = "series/**/*.yaml"
  const files = await glob(pattern, { cwd: DATA_DIR })
  const series: Series[] = []

  for (const file of files) {
    try {
      series.push(await loadYamlFile<Series>(path.join(DATA_DIR, file)))
    } catch (error) {
      console.error(`Error loading ${file}:`, error)
    }
  }

  return series
}

async function loadConfig() {
  const configDir = path.join(DATA_DIR, "config")

  // Default values if files don't exist
  let publishers: Publisher[] = []
  let genres: Genre[] = []
  let formats: Format[] = []
  let settings: ReleasesConfig = {
    defaultNewReleaseDays: 14,
    defaultUpcomingDays: 28,
    defaultCalendarMonths: 3,
    defaultPullListReminder: 3,
    enableVariantCovers: true,
    enablePriceAlerts: false,
    releaseDay: "wednesday",
  }

  try {
    if (existsSync(path.join(configDir, "publishers.yaml"))) {
      const data = await loadYamlFile<{ publishers: Publisher[] }>(
        path.join(configDir, "publishers.yaml")
      )
      publishers = data.publishers
    }
  } catch (error) {
    console.warn("Could not load publishers.yaml:", error)
  }

  try {
    if (existsSync(path.join(configDir, "genres.yaml"))) {
      const data = await loadYamlFile<{ genres: Genre[] }>(
        path.join(configDir, "genres.yaml")
      )
      genres = data.genres
    }
  } catch (error) {
    console.warn("Could not load genres.yaml:", error)
  }

  try {
    if (existsSync(path.join(configDir, "formats.yaml"))) {
      const data = await loadYamlFile<{ formats: Format[] }>(
        path.join(configDir, "formats.yaml")
      )
      formats = data.formats
    }
  } catch (error) {
    console.warn("Could not load formats.yaml:", error)
  }

  try {
    if (existsSync(path.join(configDir, "releases-settings.yaml"))) {
      settings = await loadYamlFile<ReleasesConfig>(
        path.join(configDir, "releases-settings.yaml")
      )
    }
  } catch (error) {
    console.warn("Could not load releases-settings.yaml:", error)
  }

  return { publishers, genres, formats, settings }
}

async function main() {
  console.log("Generating releases data...")

  await mkdir(OUTPUT_DIR, { recursive: true })

  const releases = await loadAllReleases()
  const series = await loadAllSeries()
  const config = await loadConfig()

  const data = {
    releases,
    series,
    config,
  }

  await writeFile(
    path.join(OUTPUT_DIR, "releases-data.json"),
    JSON.stringify(data, null, 2)
  )

  // Also create a TypeScript file that exports the data with proper typing
  const tsContent = `// Auto-generated file - do not edit manually
// Generated at: ${new Date().toISOString()}

import type { ReleasesData } from "@/lib/releases-types"

import data from "./releases-data.json"

export const releasesData: ReleasesData = data as ReleasesData
`

  await writeFile(path.join(OUTPUT_DIR, "index.ts"), tsContent)

  console.log(`Generated:`)
  console.log(`  - ${releases.length} releases`)
  console.log(`  - ${series.length} series`)
  console.log(
    `  - Config with ${config.publishers.length} publishers, ${config.genres.length} genres`
  )
}

main().catch(console.error)
