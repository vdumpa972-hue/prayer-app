import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/plans", "/privacy", "/support", "/terms"],
      disallow: [
        "/api/",
        "/app/",
        "/auth/",
        "/follower/",
        "/master/",
        "/owner/",
        "/profile/",
        "/subscription/",
        "/super-admin/",
        "/trial/",
      ],
    },
    sitemap: "https://prayer-master.vercel.app/sitemap.xml",
    host: "https://prayer-master.vercel.app",
  };
}
