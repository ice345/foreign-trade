import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://globalpush.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/cart/", "/orders/", "/wallet/", "/profile/", "/notifications/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
