import type { MetadataRoute } from "next";

const siteUrl = "https://zesume.xyz";
const lastModified = new Date("2026-07-14");

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/app`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/pricing`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
