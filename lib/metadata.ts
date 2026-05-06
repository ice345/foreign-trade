import type { Metadata } from "next";

const SITE_NAME = "GlobalPush";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://globalpush.com";
const DEFAULT_DESCRIPTION =
  "GlobalPush 提供全球优质推广资源导航、海外渠道聚合与优惠精选工具，助力中国团队出海增长。";

export function buildMetadata(overrides: Metadata = {}): Metadata {
  return {
    metadataBase: new URL(SITE_URL),
    title: overrides.title ?? `${SITE_NAME} · 全球资源增长引擎`,
    description: overrides.description ?? DEFAULT_DESCRIPTION,
    openGraph: {
      title: overrides.title ?? `${SITE_NAME} · 全球资源增长引擎`,
      description: overrides.description ?? DEFAULT_DESCRIPTION,
      siteName: SITE_NAME,
      type: "website",
      locale: "zh_CN",
      ...(overrides.openGraph ?? {}),
    },
    twitter: {
      card: "summary_large_image",
      title: overrides.title ?? `${SITE_NAME} · 全球资源增长引擎`,
      description: overrides.description ?? DEFAULT_DESCRIPTION,
      ...(overrides.twitter ?? {}),
    },
    robots: {
      index: true,
      follow: true,
    },
    ...overrides,
  };
}

export function buildResourceJsonLd(resource: {
  title: string;
  description: string;
  image?: string | null;
  price?: number | null;
  category: string;
  country: string;
  platform: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: resource.title,
    description: resource.description,
    category: resource.category,
    image: resource.image || undefined,
    offers: resource.price
      ? {
          "@type": "Offer",
          price: resource.price,
          priceCurrency: "CNY",
          availability: "https://schema.org/InStock",
        }
      : undefined,
    brand: {
      "@type": "Organization",
      name: `${resource.platform} · ${resource.country}`,
    },
  };
}
