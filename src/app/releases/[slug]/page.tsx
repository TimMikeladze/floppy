import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { releasesFlag } from "@/flags";
import {
  getAllReleaseSlugs,
  getStaticConfig,
  getStaticReleaseBySlug,
} from "@/lib/releases-merge";
import { ReleaseDetailContent } from "./release-detail-content";

export function generateStaticParams() {
  const slugs = getAllReleaseSlugs();
  return slugs.map((slug) => ({ slug }));
}

interface ReleasePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ReleasePageProps): Promise<Metadata> {
  const { slug } = await params;
  const release = getStaticReleaseBySlug(slug);

  if (!release) {
    return { title: "Release Not Found" };
  }

  const config = getStaticConfig();
  const publisher = config.publishers.find(
    (p) => p.id === release.publisher || p.slug === release.publisher,
  );

  const title = `${release.title} — ${release.series} #${release.issueNumber}`;
  const description = release.description
    ? release.description.slice(0, 160)
    : `${release.title} by ${publisher?.name || release.publisher}. Read details about this comic book release.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/releases/${slug}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      ...(release.coverUrl && {
        images: [{ url: release.coverUrl, alt: release.title }],
      }),
    },
  };
}

export default async function ReleasePage({ params }: ReleasePageProps) {
  const releasesEnabled = await releasesFlag();

  if (!releasesEnabled) {
    redirect("/");
  }

  const { slug } = await params;
  const release = getStaticReleaseBySlug(slug);

  if (!release) {
    notFound();
  }

  const config = getStaticConfig();
  const publisher = config.publishers.find(
    (p) => p.id === release.publisher || p.slug === release.publisher,
  );

  return (
    <ReleaseDetailContent
      release={release}
      publisher={publisher}
      releasesEnabled={releasesEnabled}
    />
  );
}
