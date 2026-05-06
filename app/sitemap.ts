import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://globalpush.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/explore`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const resources = await prisma.resource.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const resourcePages: MetadataRoute.Sitemap = resources.map((r) => ({
      url: `${SITE_URL}/resource/${r.id}`,
      lastModified: r.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticPages, ...resourcePages];
  } catch {
    return staticPages;
  }
}
