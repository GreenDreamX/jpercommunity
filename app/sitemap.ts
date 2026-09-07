import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://jper.my.id"

  const routes = [
    "",
    "/login",
    "/register",
    "/alumni",
    "/direktori",
    "/faq",
    "/privacy",
    "/terms",
    "/thank-you",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly" as const,
    priority: route === "" ? 1.0 : route === "/login" || route === "/register" ? 0.9 : 0.7,
  }))
}
