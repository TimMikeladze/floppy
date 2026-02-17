import type { MetadataRoute } from "next";
import { getAllReleaseSlugs } from "@/lib/releases-merge";

export default function sitemap(): MetadataRoute.Sitemap {
  const releaseSlugs = getAllReleaseSlugs();

  const releaseEntries: MetadataRoute.Sitemap = releaseSlugs.map((slug) => ({
    url: `https://floppy.sh/releases/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [
    {
      url: "https://floppy.sh",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://floppy.sh/about",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://floppy.sh/releases",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...releaseEntries,
  ];
}
