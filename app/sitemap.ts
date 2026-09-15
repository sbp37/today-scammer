import type { MetadataRoute } from "next";
import { caseArticles } from "./lib/cases";

const site = "https://todaycase.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${site}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/guide`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/cases`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...caseArticles.map((item) => ({
      url: `${site}/cases/${item.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${site}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${site}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: `${site}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];
}
