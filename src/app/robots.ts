import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/releases"],
        disallow: ["/library", "/reader/", "/settings", "/collections"],
      },
    ],
    sitemap: "https://floppy.sh/sitemap.xml",
  };
}
