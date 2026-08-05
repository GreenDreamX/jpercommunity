import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://jper.my.id"

  const routes = [
    "",
    "/login",
    "/register",
    "/alumni",
    "/direktori",
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }))
}
