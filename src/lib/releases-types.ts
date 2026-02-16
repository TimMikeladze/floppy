// Base Release from YAML
export interface ReleaseYaml {
  id?: string;
  slug: string;
  title: string;
  series: string;
  issueNumber: string;
  releaseDate: string; // ISO date string in YAML
  coverUrl: string;
  publisher: string;
  writers: string[];
  artists: string[];
  description: string;
  price: string;
  format: ReleaseFormat;
  genres: string[];
  pageCount?: number;
  printRun?: number;
  variants?: VariantCover[];
  status: ReleaseStatus;
  isbn?: string;
  diamond?: string;
  upc?: string;
  ageRating?: string;
  tags?: string[];
}

// Runtime Release with parsed date
export interface Release extends Omit<ReleaseYaml, "releaseDate"> {
  id: string;
  releaseDate: Date;
  isCustom?: boolean; // True if user-created
  isModified?: boolean; // True if user has overrides
}

export type ReleaseFormat =
  | "single-issue"
  | "trade-paperback"
  | "hardcover"
  | "omnibus";
export type ReleaseStatus = "upcoming" | "released" | "delayed" | "cancelled";

export interface VariantCover {
  name: string;
  coverUrl: string;
  artist?: string;
}

export interface Series {
  id: string;
  name: string;
  slug: string;
  publisher: string;
  startYear: number;
  currentVolume?: number;
  volumeStartYear?: number;
  status: "ongoing" | "completed" | "hiatus" | "cancelled";
  genres: string[];
  description: string;
  coverUrl: string;
  currentWriters: string[];
  currentArtists: string[];
  releaseSchedule:
    | "weekly"
    | "biweekly"
    | "monthly"
    | "bimonthly"
    | "irregular";
  typicalReleaseDay?: string;
  relatedSeries?: string[];
  tags?: string[];
}

export interface Publisher {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  color?: string;
  website?: string;
}

export interface Genre {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface Format {
  id: string;
  name: string;
  abbreviation: string;
}

export interface ReleasesConfig {
  defaultNewReleaseDays: number;
  defaultUpcomingDays: number;
  defaultCalendarMonths: number;
  defaultPullListReminder: number;
  enableVariantCovers: boolean;
  enablePriceAlerts: boolean;
  releaseDay: string;
}

export interface ReleasesData {
  releases: ReleaseYaml[];
  series: Series[];
  config: {
    publishers: Publisher[];
    genres: Genre[];
    formats: Format[];
    settings: ReleasesConfig;
  };
}

// IndexedDB types for user data
export interface ReleaseOverride {
  releaseId: string;
  overrides: Partial<Release>;
  modifiedAt: Date;
}

export interface CustomRelease extends Release {
  isCustom: true;
  createdAt: Date;
  modifiedAt: Date;
}
