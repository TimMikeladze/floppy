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
